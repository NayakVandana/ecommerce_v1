<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\DeliveryVerificationMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DeliveryBoyApiController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        if (!$user || $user->role !== 'delivery_boy') {
            return $this->sendJsonResponse(false, 'Unauthorized. Delivery boy access required.', [], 403);
        }

        $query = Order::with(['user', 'items.product.media', 'items.variation', 'deliveryVerificationMedia'])
            ->where('delivery_boy_id', $user->id);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->latest()->paginate(15);

        return $this->sendJsonResponse(true, 'Orders fetched successfully', $orders, 200);
    }

    public function show(Request $request)
    {
        $user = $request->user();
        
        if (!$user || $user->role !== 'delivery_boy') {
            return $this->sendJsonResponse(false, 'Unauthorized. Delivery boy access required.', [], 403);
        }

        $request->validate([
            'id' => 'required|exists:orders,id',
        ]);

        $order = Order::with(['user', 'items.product.media', 'items.variation', 'couponCode', 'deliveryVerificationMedia'])
            ->where('delivery_boy_id', $user->id)
            ->findOrFail($request->id);

        return $this->sendJsonResponse(true, 'Order fetched successfully', $order, 200);
    }

    public function verifyOTP(Request $request)
    {
        $user = $request->user();
        
        if (!$user || $user->role !== 'delivery_boy') {
            return $this->sendJsonResponse(false, 'Unauthorized. Delivery boy access required.', [], 403);
        }

        $request->validate([
            'id' => 'required|exists:orders,id',
            'otp' => 'required|string|size:6',
        ]);

        $order = Order::where('delivery_boy_id', $user->id)
            ->findOrFail($request->id);

        if ($order->otp_verified) {
            return $this->sendJsonResponse(false, 'Order already delivered', [], 400);
        }

        if ($order->verifyOTP($request->otp)) {
            return $this->sendJsonResponse(true, 'OTP verified successfully. Order marked as delivered.', $order->fresh(), 200);
        }

        return $this->sendJsonResponse(false, 'Invalid OTP code', [], 400);
    }

    public function generateOTP(Request $request)
    {
        $user = $request->user();
        
        if (!$user || $user->role !== 'delivery_boy') {
            return $this->sendJsonResponse(false, 'Unauthorized. Delivery boy access required.', [], 403);
        }

        $request->validate([
            'id' => 'required|exists:orders,id',
        ]);

        $order = Order::where('delivery_boy_id', $user->id)
            ->findOrFail($request->id);

        if ($order->otp_verified) {
            return $this->sendJsonResponse(false, 'Order already delivered', [], 400);
        }

        // Generate OTP
        $otp = $order->generateOTP();

        return $this->sendJsonResponse(true, 'OTP generated successfully', $order->fresh(), 200);
    }

    public function getStats(Request $request)
    {
        $user = $request->user();
        
        if (!$user || $user->role !== 'delivery_boy') {
            return $this->sendJsonResponse(false, 'Unauthorized. Delivery boy access required.', [], 403);
        }

        $stats = [
            'total_orders' => Order::where('delivery_boy_id', $user->id)->count(),
            'pending_delivery' => Order::where('delivery_boy_id', $user->id)
                ->where('status', 'out_for_delivery')
                ->where('otp_verified', false)
                ->count(),
            'delivered' => Order::where('delivery_boy_id', $user->id)
                ->where('status', 'delivered')
                ->count(),
            'today_deliveries' => Order::where('delivery_boy_id', $user->id)
                ->where('status', 'delivered')
                ->whereDate('delivered_at', today())
                ->count(),
        ];

        return $this->sendJsonResponse(true, 'Stats fetched successfully', $stats, 200);
    }

    public function uploadOpenBoxMedia(Request $request)
    {
        $user = $request->user();
        
        if (!$user || $user->role !== 'delivery_boy') {
            return $this->sendJsonResponse(false, 'Unauthorized. Delivery boy access required.', [], 403);
        }

        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'order_item_id' => 'nullable|exists:order_items,id',
            'files' => 'required|array|min:1',
            'files.*' => 'required|file|mimes:jpeg,jpg,png,gif,webp,mp4,mov,avi|max:10240', // 10MB max
            'description' => 'nullable|string|max:500',
        ]);

        $order = Order::where('delivery_boy_id', $user->id)
            ->findOrFail($request->order_id);

        if ($order->otp_verified) {
            return $this->sendJsonResponse(false, 'Order already delivered', [], 400);
        }

        $uploadedMedia = [];

        try {
            foreach ($request->file('files') as $file) {
                $mimeType = $file->getMimeType();
                $type = (strpos($mimeType, 'video/') === 0) ? 'video' : 'image';
                $path = $file->store("delivery-verification/{$order->id}", 'public');
                $url = asset('storage/' . $path);

                $media = DeliveryVerificationMedia::create([
                    'order_id' => $order->id,
                    'order_item_id' => $request->order_item_id,
                    'type' => $type,
                    'file_path' => $path,
                    'url' => $url,
                    'description' => $request->description,
                ]);

                $uploadedMedia[] = $media;
            }

            return $this->sendJsonResponse(true, 'Media uploaded successfully', [
                'media' => $uploadedMedia,
                'order' => $order->fresh(['deliveryVerificationMedia']),
            ], 200);
        } catch (\Exception $e) {
            return $this->sendJsonResponse(false, 'Failed to upload media: ' . $e->getMessage(), [], 500);
        }
    }

    public function getOpenBoxMedia(Request $request)
    {
        $user = $request->user();
        
        if (!$user || $user->role !== 'delivery_boy') {
            return $this->sendJsonResponse(false, 'Unauthorized. Delivery boy access required.', [], 403);
        }

        $request->validate([
            'order_id' => 'required|exists:orders,id',
        ]);

        $order = Order::where('delivery_boy_id', $user->id)
            ->findOrFail($request->order_id);

        $media = DeliveryVerificationMedia::where('order_id', $order->id)
            ->with('orderItem')
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->sendJsonResponse(true, 'Media fetched successfully', $media, 200);
    }

    public function deleteOpenBoxMedia(Request $request)
    {
        $user = $request->user();
        
        if (!$user || $user->role !== 'delivery_boy') {
            return $this->sendJsonResponse(false, 'Unauthorized. Delivery boy access required.', [], 403);
        }

        $request->validate([
            'id' => 'required|exists:delivery_verification_media,id',
        ]);

        $media = DeliveryVerificationMedia::findOrFail($request->id);
        $order = $media->order;

        // Verify the order belongs to this delivery boy
        if ($order->delivery_boy_id !== $user->id) {
            return $this->sendJsonResponse(false, 'Unauthorized. You can only delete media for your own orders.', [], 403);
        }

        // Delete file from storage
        if ($media->file_path && Storage::disk('public')->exists($media->file_path)) {
            Storage::disk('public')->delete($media->file_path);
        }

        $media->delete();

        return $this->sendJsonResponse(true, 'Media deleted successfully', [], 200);
    }

    public function markAsDelivered(Request $request)
    {
        $user = $request->user();
        
        if (!$user || $user->role !== 'delivery_boy') {
            return $this->sendJsonResponse(false, 'Unauthorized. Delivery boy access required.', [], 403);
        }

        $request->validate([
            'id' => 'required|exists:orders,id',
        ]);

        $order = Order::where('delivery_boy_id', $user->id)
            ->findOrFail($request->id);

        if ($order->otp_verified || $order->status === 'delivered') {
            return $this->sendJsonResponse(false, 'Order already delivered', [], 400);
        }

        // Mark order as delivered
        $order->update([
            'otp_verified' => true,
            'status' => 'delivered',
            'delivered_at' => now(),
        ]);

        return $this->sendJsonResponse(true, 'Order marked as delivered successfully', $order->fresh(), 200);
    }
}

