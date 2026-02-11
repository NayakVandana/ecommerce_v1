<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Cart;
use App\Models\ProductVariation;
use App\Models\CouponCode;
use App\Models\CouponCodeUsage;
use App\Services\SessionTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OrderApiController extends Controller
{
    public function index(Request $request)
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->latest()
            ->paginate(10);

        return $this->sendJsonResponse(true, 'Orders fetched successfully', $orders, 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'required|string',
            'address' => 'required|string',
            'district' => 'nullable|string|in:Valsad',
            'city' => 'required|string|in:Vapi',
            'postal_code' => 'required|string',
            'country' => 'required|string|in:India',
            'notes' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.product_id' => 'required_with:items|exists:products,id',
            'items.*.quantity' => 'required_with:items|integer|min:1',
            'use_cart' => 'nullable|boolean',
            'coupon_code' => 'nullable|string',
        ]);

        $userId = $request->user()->id;
        $cartItems = [];
        $items = [];

        // If use_cart is true or items not provided, get items from cart
        if ($request->use_cart || !$request->has('items')) {
            $cartItems = Cart::where('user_id', $userId)
                ->whereNull('session_id')
                ->with(['product', 'variation'])
                ->get();

            if ($cartItems->isEmpty()) {
                return $this->sendJsonResponse(false, 'Cart is empty', [], 400);
            }

            // Convert cart items to order items format
            foreach ($cartItems as $cartItem) {
                if (!$cartItem->product) {
                    continue;
                }

                // Check stock availability
                if ($cartItem->variation_id) {
                    $variation = ProductVariation::find($cartItem->variation_id);
                    if (!$variation || !$variation->in_stock || $variation->stock_quantity < $cartItem->quantity) {
                        return $this->sendJsonResponse(false, "Insufficient stock for {$cartItem->product->product_name}", [], 400);
                    }
                } elseif ($cartItem->product->total_quantity !== null && $cartItem->product->total_quantity < $cartItem->quantity) {
                    return $this->sendJsonResponse(false, "Insufficient stock for {$cartItem->product->product_name}", [], 400);
                }

                $items[] = [
                    'cart_id' => $cartItem->id,
                    'product_id' => $cartItem->product_id,
                    'variation_id' => $cartItem->variation_id,
                    'quantity' => $cartItem->quantity,
                    'size' => $cartItem->size,
                    'color' => $cartItem->color,
                ];
            }
        } else {
            // Use provided items
            $items = $request->items;
        }

        if (empty($items)) {
            return $this->sendJsonResponse(false, 'No items to order', [], 400);
        }

        // Calculate totals
        $subtotal = 0;
        $orderItemsData = [];

        foreach ($items as $item) {
            $product = Product::find($item['product_id']);
            if (!$product) {
                continue;
            }

            $price = $product->final_price ?? $product->price;
            $quantity = $item['quantity'];
            $itemSubtotal = $price * $quantity;
            $subtotal += $itemSubtotal;

            $orderItemsData[] = [
                'product' => $product,
                'variation_id' => $item['variation_id'] ?? null,
                'quantity' => $quantity,
                'price' => $price,
                'subtotal' => $itemSubtotal,
                'size' => $item['size'] ?? null,
                'color' => $item['color'] ?? null,
                'cart_id' => $item['cart_id'] ?? null,
            ];
        }

        $tax = 0; // Can be calculated based on GST if needed
        $shipping = 0; // Can be calculated based on address/weight if needed
        
        // Handle coupon application
        $couponCodeId = null;
        $discount = 0;
        $coupon = null;
        
        if ($request->has('coupon_code') && $request->coupon_code) {
            $coupon = $this->validateAndApplyCoupon($request->coupon_code, $subtotal, $userId);
            if ($coupon) {
                $couponCodeId = $coupon->id;
                $discount = $this->calculateDiscount($coupon, $subtotal);
            }
        }
        
        $total = $subtotal + $tax + $shipping - $discount;
        if ($total < 0) {
            $total = 0;
        }

        // Generate order number
        $orderNumber = $this->generateOrderNumber();

        // Create order and items in transaction
        try {
            DB::beginTransaction();

            // Calculate default delivery date: 2 days after tomorrow (3 days from today)
            $defaultDeliveryDate = now()->addDays(3)->format('Y-m-d');

            $order = Order::create([
                'user_id' => $userId,
                'order_number' => $orderNumber,
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
                'district' => $request->district ?? 'Valsad',
                'city' => $request->city ?? 'Vapi',
                'postal_code' => $request->postal_code,
                'country' => $request->country ?? 'India',
                'subtotal' => $subtotal,
                'tax' => $tax,
                'shipping' => $shipping,
                'discount' => $discount,
                'coupon_code_id' => $couponCodeId,
                'total' => $total,
                'status' => 'pending',
                'notes' => $request->notes,
                'delivery_date' => $request->delivery_date ?? $defaultDeliveryDate,
            ]);
            
            // Record coupon usage if coupon was applied
            if ($coupon && $discount > 0) {
                CouponCodeUsage::create([
                    'coupon_code_id' => $coupon->id,
                    'user_id' => $userId,
                    'order_id' => $order->id,
                    'discount_amount' => $discount,
                    'order_total' => $total,
                    'user_email' => $request->email,
                    'user_name' => $request->name,
                ]);
                
                // Update coupon usage count
                $coupon->increment('usage_count');
            }

            // Create order items
            foreach ($orderItemsData as $itemData) {
                $product = $itemData['product'];
                $variation = $itemData['variation_id'] ? ProductVariation::find($itemData['variation_id']) : null;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'variation_id' => $itemData['variation_id'],
                    'product_name' => $product->product_name,
                    'product_sku' => $product->sku,
                    'size' => $itemData['size'] ?? ($variation ? $variation->size : null),
                    'color' => $itemData['color'] ?? ($variation ? $variation->color : null),
                    'quantity' => $itemData['quantity'],
                    'price' => $itemData['price'],
                    'subtotal' => $itemData['subtotal'],
                    'is_returnable' => $product->is_returnable ?? false, // Store returnable status at time of order
                ]);

                // Update stock
                if ($itemData['variation_id']) {
                    $variation = ProductVariation::find($itemData['variation_id']);
                    if ($variation && $variation->stock_quantity !== null) {
                        $variation->stock_quantity -= $itemData['quantity'];
                        if ($variation->stock_quantity <= 0) {
                            $variation->in_stock = false;
                        }
                        $variation->save();
                    }
                } elseif ($product->total_quantity !== null) {
                    $product->total_quantity -= $itemData['quantity'];
                    if ($product->total_quantity <= 0) {
                        // Optionally mark product as out of stock
                    }
                    $product->save();
                }
            }

            // Clear cart if order was created from cart
            if ($request->use_cart || !$request->has('items')) {
                Cart::where('user_id', $userId)
                    ->whereNull('session_id')
                    ->delete();
            }

            DB::commit();

            return $this->sendJsonResponse(true, 'Order placed successfully', $order->load(['items.product', 'items.variation', 'couponCode']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError($e);
        }
    }

    /**
     * Generate unique order number
     */
    private function generateOrderNumber(): string
    {
        do {
            $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
        } while (Order::where('order_number', $orderNumber)->exists());

        return $orderNumber;
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
        ]);

        $order = Order::with(['items.product', 'couponCode', 'deliveryBoy'])
            ->where('user_id', $request->user()->id)
            ->findOrFail($request->id);

        return $this->sendJsonResponse(true, 'Order fetched successfully', $order, 200);
    }

    public function cancel(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
            'cancellation_reason' => 'nullable|string|in:customer_request,out_of_stock,payment_failed,delivery_issue,changed_mind,found_better_price,wrong_item,delivery_address_incorrect,delayed_delivery,other',
            'cancellation_notes' => 'nullable|string|max:500',
        ]);

        $order = Order::where('user_id', $request->user()->id)
            ->findOrFail($request->id);

        if ($order->status === 'cancelled') {
            return $this->sendJsonResponse(false, 'Order is already cancelled', [], 400);
        }

        $order->update([
            'status' => 'cancelled',
            'cancellation_reason' => $request->cancellation_reason,
            'cancellation_notes' => $request->cancellation_notes,
        ]);

        return $this->sendJsonResponse(true, 'Order cancelled successfully', $order, 200);
    }

    public function requestReturn(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
            'return_reason' => 'required|string|in:defective_item,wrong_item,not_as_described,changed_mind,damaged_during_delivery,other',
            'return_notes' => 'nullable|string|max:500',
        ]);

        $order = Order::with('items')->where('user_id', $request->user()->id)
            ->findOrFail($request->id);

        // Allow return for shipped, delivered, or completed orders
        if (!in_array($order->status, ['shipped', 'delivered', 'completed'])) {
            return $this->sendJsonResponse(false, 'Return can only be requested for shipped, delivered, or completed orders', [], 400);
        }

        // Check if return already requested
        if ($order->return_status === 'pending' || $order->return_status === 'approved') {
            return $this->sendJsonResponse(false, 'Return request already exists for this order', [], 400);
        }

        // Check if all products in order are returnable
        $nonReturnableItems = $order->items->filter(function ($item) {
            return !($item->is_returnable ?? false);
        });

        if ($nonReturnableItems->count() > 0) {
            $nonReturnableNames = $nonReturnableItems->pluck('product_name')->implode(', ');
            return $this->sendJsonResponse(false, "Some products in this order are not returnable: {$nonReturnableNames}", [], 400);
        }

        $order->update([
            'return_reason' => $request->return_reason,
            'return_notes' => $request->return_notes,
            'return_status' => 'pending',
            'return_requested_at' => now(),
        ]);

        return $this->sendJsonResponse(true, 'Return request submitted successfully', $order->fresh(), 200);
    }

    private function validateAndApplyCoupon(?string $code, float $subtotal, ?int $userId): ?CouponCode
    {
        if (!$code) {
            return null;
        }

        $code = strtoupper(trim($code));
        $coupon = CouponCode::where('code', $code)->first();

        if (!$coupon || !$coupon->is_active) {
            return null;
        }

        // Check date validity
        $now = Carbon::now();
        if ($coupon->start_date && $now < Carbon::parse($coupon->start_date)) {
            return null;
        }

        if ($coupon->end_date && $now > Carbon::parse($coupon->end_date)) {
            return null;
        }

        // Check usage limit
        if ($coupon->usage_limit && $coupon->usage_count >= $coupon->usage_limit) {
            return null;
        }

        // Check minimum purchase amount
        if ($coupon->min_purchase_amount && $subtotal < $coupon->min_purchase_amount) {
            return null;
        }

        // Check per-user usage limit
        if ($userId && $coupon->usage_limit_per_user) {
            $userUsageCount = CouponCodeUsage::where('coupon_code_id', $coupon->id)
                ->where('user_id', $userId)
                ->count();

            if ($userUsageCount >= $coupon->usage_limit_per_user) {
                return null;
            }
        }

        return $coupon;
    }

    private function calculateDiscount(CouponCode $coupon, float $subtotal): float
    {
        if ($coupon->type === 'percentage') {
            $discount = ($subtotal * $coupon->value) / 100;
            
            // Apply max discount limit if set
            if ($coupon->max_discount_amount && $discount > $coupon->max_discount_amount) {
                $discount = $coupon->max_discount_amount;
            }
        } else {
            // Fixed amount
            $discount = $coupon->value;
            
            // Don't allow discount to exceed subtotal
            if ($discount > $subtotal) {
                $discount = $subtotal;
            }
        }

        return round($discount, 2);
    }
}

