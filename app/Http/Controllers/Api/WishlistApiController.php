<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Wishlist;
use App\Services\SessionTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WishlistApiController extends Controller
{
    public function index(Request $request)
    {
        [$userId, $sessionId] = $this->resolveOwner($request, false);

        $wishlistItems = $this->getOwnerWishlistQuery($userId, $sessionId)
            ->with([
                'product' => function($q) {
                    $q->with(['media' => function($media) {
                        $media->where('is_primary', true)->orWhere('type', 'image')->orderBy('sort_order');
                    }])
                    ->where('is_approve', 1);
                }
            ])
            ->whereHas('product', function($q) {
                $q->where('is_approve', 1);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        $formatted = $wishlistItems->map(function($item) {
            $product = $item->product;
            if (!$product) return null;

            $primaryImage = $product->media->first();
            $imageUrl = $primaryImage->url ?? $primaryImage->file_path ?? '';

            return [
                'id' => $item->id,
                'product_id' => $product->id,
                'product_name' => $product->product_name,
                'slug' => $product->slug,
                'price' => $product->price,
                'sale_price' => $product->sale_price,
                'image' => $imageUrl,
                'in_stock' => $product->total_quantity > 0,
                'added_at' => $item->created_at->format('Y-m-d H:i:s'),
            ];
        })->filter();

        $count = $this->getWishlistCount($userId, $sessionId);

        return $this->sendJsonResponse(true, 'Wishlist fetched successfully', [
            'items' => $formatted->values(),
            'count' => $count,
            'session_id' => $sessionId,
        ], 200);
    }

    public function add(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $product = Product::findOrFail($request->product_id);
        
        if (!$product->is_approve) {
            return $this->sendJsonResponse(false, 'Product is not available', [], 400);
        }

        [$userId, $sessionId] = $this->resolveOwner($request, true);

        $productId = $request->product_id;

        // Check if already in wishlist
        $existing = $this->getOwnerWishlistQuery($userId, $sessionId)
            ->where('product_id', $productId)
            ->first();

        if ($existing) {
            return $this->sendJsonResponse(false, 'Product already in wishlist', [], 400);
        }

        // Add to wishlist
        DB::transaction(function () use ($productId, $userId, $sessionId) {
            if ($userId) {
                // For authenticated users, ONLY use user_id - session_id is completely ignored
                Wishlist::create([
                    'user_id' => $userId,
                    'session_id' => null, // Always null for authenticated users
                    'product_id' => $productId,
                ]);
            } else {
                // For guests, use session_id only (user_id is null)
                if (!$sessionId) {
                    throw new \Exception('Session ID is required for guest users');
                }
                
                Wishlist::create([
                    'user_id' => null, // Always null for guests
                    'session_id' => $sessionId,
                    'product_id' => $productId,
                ]);
            }
        });

        $count = $this->getWishlistCount($userId, $sessionId);

        return $this->sendJsonResponse(true, 'Product added to wishlist', [
            'count' => $count,
            'session_id' => $sessionId,
        ], 200);
    }

    public function remove(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        [$userId, $sessionId] = $this->resolveOwner($request, false);
        
        // For authenticated users, only remove entries with user_id and null session_id
        if ($userId) {
            Wishlist::where('user_id', $userId)
                ->whereNull('session_id')
                ->where('product_id', $request->product_id)
                ->delete();
        } else {
            // For guests, only remove entries with session_id and null user_id
            Wishlist::where('session_id', $sessionId)
                ->whereNull('user_id')
                ->where('product_id', $request->product_id)
                ->delete();
        }

        $count = $this->getWishlistCount($userId, $sessionId);

        return $this->sendJsonResponse(true, 'Product removed from wishlist', [
            'count' => $count,
            'session_id' => $sessionId,
        ], 200);
    }

    public function clear(Request $request)
    {
        [$userId, $sessionId] = $this->resolveOwner($request, false);
        
        // For authenticated users, only clear entries with user_id and null session_id
        if ($userId) {
            Wishlist::where('user_id', $userId)
                ->whereNull('session_id')
                ->delete();
        } else {
            // For guests, only clear entries with session_id and null user_id
            Wishlist::where('session_id', $sessionId)
                ->whereNull('user_id')
                ->delete();
        }

        return $this->sendJsonResponse(true, 'Wishlist cleared successfully', [
            'items' => [],
            'count' => 0,
            'session_id' => $sessionId,
        ], 200);
    }

    public function check(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        [$userId, $sessionId] = $this->resolveOwner($request, false);

        $exists = $this->getOwnerWishlistQuery($userId, $sessionId)
            ->where('product_id', $request->product_id)
            ->exists();

        return $this->sendJsonResponse(true, 'Wishlist status checked', [
            'in_wishlist' => $exists,
        ], 200);
    }

    /**
     * Helper: resolve owner (user_id or session_id)
     * For authenticated users, always return null for session_id
     * For guests, get or create session_id
     */
    private function resolveOwner(Request $request, bool $createSessionIfMissing = true): array
    {
        // Get user ID from authenticated user (set by auth.optional middleware if token provided)
        $userId = auth()->id();
        
        // For authenticated users, always return null for session_id
        if ($userId) {
            return [$userId, null];
        }
        
        // For guests, get session_id from various sources
        $sessionId = $request->input('session_id') 
            ?? $request->query('session_id')
            ?? $request->header('X-Session-ID')
            ?? SessionTrackingService::getSessionIdFromRequest($request);
        
        // Normalize: convert empty string to null
        if ($sessionId === '' || $sessionId === 'null') {
            $sessionId = null;
        }

        // If no session exists and we need one, create it
        if (!$sessionId && $createSessionIfMissing) {
            $session = SessionTrackingService::getOrCreateSession($request);
            $sessionId = $session->session_id;
        }

        return [null, $sessionId];
    }

    /**
     * Helper: base wishlist query for owner
     * For authenticated users, only return entries with user_id and null session_id
     * For guests, only return entries with session_id and null user_id
     */
    private function getOwnerWishlistQuery($userId, $sessionId)
    {
        if ($userId) {
            // For authenticated users, only get entries with user_id and null session_id
            return Wishlist::where('user_id', $userId)
                ->whereNull('session_id');
        }

        // For guests, only get entries with session_id and null user_id
        return Wishlist::where('session_id', $sessionId)
            ->whereNull('user_id');
    }

    /**
     * Helper: get wishlist count based on user_id for authenticated users, session_id for guests
     */
    private function getWishlistCount($userId, $sessionId): int
    {
        if ($userId) {
            // For authenticated users, count entries with user_id and null session_id only
            return Wishlist::where('user_id', $userId)
                ->whereNull('session_id')
                ->count();
        }

        // For guests, count entries with session_id and null user_id
        return Wishlist::where('session_id', $sessionId)
            ->whereNull('user_id')
            ->count();
    }
}
