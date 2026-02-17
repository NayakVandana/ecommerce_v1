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
        $orders = Order::with(['items.product.media', 'items.variation'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(10);

        return $this->sendJsonResponse(true, 'Orders fetched successfully', $orders, 200);
    }

    public function store(Request $request)
    {
        // Define district-city and district-delivery_area mappings
        $districtCityMap = [
            'Valsad' => ['Vapi', 'Pardi', 'Valsad City', 'Dharampur'],
            'Daman' => ['Moti Daman', 'Nani Daman', 'Daman Fort Area'],
        ];

        $deliveryAreaMap = [
            'Valsad' => ['gunjan', 'charvada', 'vapi_char_rasta', 'vapi_station', 'vapi_gidc', 'pardi', 'valsad_city', 'dharampur'],
            'Daman' => ['moti_daman', 'nani_daman', 'daman_fort'],
        ];

        $expectedStates = [
            'Valsad' => 'Gujarat',
            'Daman' => 'Daman and Diu (UT)',
        ];

        // Build dynamic validation rules based on district
        $district = $request->input('district');
        
        // Determine valid cities based on district
        $validCities = [];
        if ($district && isset($districtCityMap[$district])) {
            $validCities = $districtCityMap[$district];
        } else {
            // If no district or invalid district, allow all cities for basic validation
            $validCities = array_merge(...array_values($districtCityMap));
        }

        // Determine valid delivery areas based on district
        $validDeliveryAreas = [];
        if ($district && isset($deliveryAreaMap[$district])) {
            $validDeliveryAreas = $deliveryAreaMap[$district];
        } else {
            // If no district or invalid district, allow all areas for basic validation
            $validDeliveryAreas = array_merge(...array_values($deliveryAreaMap));
        }

        // Determine expected state based on district
        $expectedState = $expectedStates[$district] ?? null;

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|regex:/^[6-9]\d{9}$/',
            'receiver_name' => 'nullable|string|max:255',
            'receiver_number' => 'required|string|regex:/^[6-9]\d{9}$/',
            'address' => 'required|string|max:500',
            'house_no' => 'nullable|string|max:50',
            'floor_no' => 'nullable|string|max:50',
            'building_name' => 'nullable|string|max:255',
            'landmark' => 'nullable|string|max:255',
            'district' => 'required|string|in:Valsad,Daman',
            'city' => [
                'required',
                'string',
                function ($attribute, $value, $fail) use ($district, $districtCityMap) {
                    if ($district && isset($districtCityMap[$district])) {
                        if (!in_array($value, $districtCityMap[$district])) {
                            $fail("The selected city is not valid for {$district} district. Valid cities are: " . implode(', ', $districtCityMap[$district]));
                        }
                    }
                },
            ],
            'postal_code' => 'required|string|regex:/^\d{6}$/',
            'state' => [
                'required',
                'string',
                'max:100',
                function ($attribute, $value, $fail) use ($district, $expectedStates) {
                    if ($district && isset($expectedStates[$district])) {
                        if ($value !== $expectedStates[$district]) {
                            $fail("The state for {$district} district should be {$expectedStates[$district]}.");
                        }
                    }
                },
            ],
            'country' => 'required|string|in:India',
            'address_type' => 'required|string|in:home,office,other',
            'delivery_area' => [
                'required',
                'string',
                function ($attribute, $value, $fail) use ($district, $deliveryAreaMap) {
                    if ($district && isset($deliveryAreaMap[$district])) {
                        if (!in_array($value, $deliveryAreaMap[$district])) {
                            $fail("The selected delivery area is not valid for {$district} district. Valid areas are: " . implode(', ', $deliveryAreaMap[$district]));
                        }
                    }
                },
            ],
            'notes' => 'nullable|string|max:1000',
            'items' => 'nullable|array',
            'items.*.product_id' => 'required_with:items|exists:products,id',
            'items.*.quantity' => 'required_with:items|integer|min:1',
            'use_cart' => 'nullable|boolean',
            'coupon_code' => 'nullable|string',
        ], [
            'name.required' => 'Name is required.',
            'email.required' => 'Email is required.',
            'email.email' => 'Please enter a valid email address.',
            'receiver_number.required' => 'Receiver number is required.',
            'receiver_number.regex' => 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.',
            'address.required' => 'Address is required.',
            'district.required' => 'Please select a district.',
            'district.in' => 'Please select a valid district (Valsad or Daman).',
            'city.required' => 'Please select a city.',
            'postal_code.required' => 'Postal code is required.',
            'postal_code.regex' => 'Please enter a valid 6-digit PIN code.',
            'state.required' => 'State is required.',
            'country.required' => 'Country is required.',
            'country.in' => 'Currently, we only accept orders from India.',
            'address_type.required' => 'Please select an address type.',
            'address_type.in' => 'Please select a valid address type (home, office, or other).',
            'delivery_area.required' => 'Please select a delivery area.',
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

        // Prepare order items data
        $orderItemsData = [];

        foreach ($items as $item) {
            $product = Product::find($item['product_id']);
            if (!$product) {
                continue;
            }

            $price = $product->final_price ?? $product->price;
            $quantity = $item['quantity'];
            $itemSubtotal = $price * $quantity;

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

        if (empty($orderItemsData)) {
            return $this->sendJsonResponse(false, 'No valid items to order', [], 400);
        }

        // Calculate default delivery date: 2 days after tomorrow (3 days from today)
        $defaultDeliveryDate = now()->addDays(3)->format('Y-m-d');

        // Create individual orders for each item
        $createdOrders = [];
        $tax = 0; // Can be calculated based on GST if needed
        $shipping = 0; // Can be calculated based on address/weight if needed

        try {
            DB::beginTransaction();

            // Handle coupon application (apply to first order only, or distribute proportionally)
            $couponCodeId = null;
            $discount = 0;
            $coupon = null;
            $totalSubtotal = array_sum(array_column($orderItemsData, 'subtotal'));
            
            if ($request->has('coupon_code') && $request->coupon_code) {
                $coupon = $this->validateAndApplyCoupon($request->coupon_code, $totalSubtotal, $userId);
                if ($coupon) {
                    $couponCodeId = $coupon->id;
                    $discount = $this->calculateDiscount($coupon, $totalSubtotal);
                }
            }

            // Create a separate order for EACH item
            foreach ($orderItemsData as $index => $itemData) {
                $product = $itemData['product'];
                $variation = $itemData['variation_id'] ? ProductVariation::find($itemData['variation_id']) : null;

                // Calculate totals for this individual item
                $itemSubtotal = $itemData['subtotal'];
                $itemTax = 0; // Tax per item (can be calculated proportionally if needed)
                $itemShipping = 0; // Shipping per item (can be calculated if needed)
                
                // Distribute discount proportionally if coupon applied
                $itemDiscount = 0;
                if ($coupon && $discount > 0 && $totalSubtotal > 0) {
                    $itemDiscount = ($itemSubtotal / $totalSubtotal) * $discount;
                }
                
                $itemTotal = $itemSubtotal + $itemTax + $itemShipping - $itemDiscount;
                if ($itemTotal < 0) {
                    $itemTotal = 0;
                }

                // Generate unique order number for each item
                if ($index > 0) {
                    usleep(mt_rand(2000, 5000)); // Small delay to ensure different microtime
                }
                $orderNumber = $this->generateOrderNumber();

                // Create individual order for this item
                $order = Order::create([
                    'user_id' => $userId,
                    'order_number' => $orderNumber,
                    'name' => $request->name,
                    'email' => $request->email,
                    'phone' => $request->receiver_number, // Use receiver_number as phone
                    'receiver_name' => $request->receiver_name,
                    'receiver_number' => $request->receiver_number,
                    'address' => $request->address,
                    'house_no' => $request->house_no,
                    'floor_no' => $request->floor_no,
                    'building_name' => $request->building_name,
                    'landmark' => $request->landmark,
                    'district' => $request->district ?? 'Valsad',
                    'city' => $request->city ?? 'Vapi',
                    'postal_code' => $request->postal_code,
                    'state' => $request->state ?? 'Gujarat',
                    'country' => $request->country ?? 'India',
                    'address_type' => $request->address_type ?? 'home',
                    'delivery_area' => $request->delivery_area,
                    'subtotal' => $itemSubtotal,
                    'tax' => $itemTax,
                    'shipping' => $itemShipping,
                    'discount' => $itemDiscount,
                    'coupon_code_id' => $index === 0 ? $couponCodeId : null, // Apply coupon to first order only
                    'total' => $itemTotal,
                    'status' => 'pending',
                    'notes' => $request->notes,
                    'delivery_date' => $request->delivery_date ?? $defaultDeliveryDate,
                ]);

                // Create order item
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
                    'is_replaceable' => $product->is_replaceable ?? false, // Store replaceable status at time of order
                ]);

                // Update stock
                if ($itemData['variation_id'] && $variation) {
                    if ($variation->stock_quantity !== null) {
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

                // Record coupon usage for first order only
                if ($index === 0 && $coupon && $discount > 0) {
                    CouponCodeUsage::create([
                        'coupon_code_id' => $coupon->id,
                        'user_id' => $userId,
                        'order_id' => $order->id,
                        'discount_amount' => $discount,
                        'order_total' => $totalSubtotal + $itemTax + $itemShipping - $discount,
                        'user_email' => $request->email,
                        'user_name' => $request->name,
                    ]);
                    
                    // Update coupon usage count
                    $coupon->increment('usage_count');
                }

                $createdOrders[] = $order->load(['items.product', 'items.variation', 'couponCode']);
            }

            // Clear cart if order was created from cart
            if ($request->use_cart || !$request->has('items')) {
                Cart::where('user_id', $userId)
                    ->whereNull('session_id')
                    ->delete();
            }

            DB::commit();

            $message = count($createdOrders) > 1 
                ? count($createdOrders) . ' orders placed successfully' 
                : 'Order placed successfully';

            return $this->sendJsonResponse(true, $message, $createdOrders, 201);
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
        // Use database transaction with lock to ensure atomic uniqueness check
        return DB::transaction(function () {
            $maxAttempts = 20;
            $attempt = 0;
            
            do {
                // Use microtime with microseconds, process ID, and random for maximum uniqueness
                $microtime = microtime(true);
                $timestamp = date('YmdHis', (int)$microtime);
                $microseconds = substr(str_replace('.', '', sprintf('%.6f', $microtime)), -6, 6);
                $processId = str_pad((getmypid() % 10000), 4, '0', STR_PAD_LEFT);
                $random = strtoupper(substr(md5(uniqid(rand(), true) . $microtime . $processId . mt_rand() . time()), 0, 6));
                $orderNumber = 'ORD-' . $timestamp . '-' . $processId . '-' . $random;
                
                // Check with lock to prevent concurrent access
                $exists = Order::where('order_number', $orderNumber)->lockForUpdate()->exists();
                
                $attempt++;
                
                if ($exists && $attempt < $maxAttempts) {
                    // Add random delay and try again
                    usleep(mt_rand(500, 2000));
                    continue;
                }
                
                if ($attempt >= $maxAttempts) {
                    // Fallback: use timestamp with microseconds, process ID and multiple random numbers
                    $orderNumber = 'ORD-' . date('YmdHis') . '-' . $processId . '-' . str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT) . '-' . mt_rand(1000, 9999);
                    // Final check with lock
                    $exists = Order::where('order_number', $orderNumber)->lockForUpdate()->exists();
                    if ($exists) {
                        // Last resort: append current microtime
                        $orderNumber .= '-' . substr(str_replace('.', '', (string)microtime(true)), -8);
                    }
                    break;
                }
            } while ($exists);

            return $orderNumber;
        });
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
        ]);

        $order = Order::with(['items.product', 'couponCode', 'deliveryBoy', 'replacementOrder'])
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
            'item_ids' => 'nullable|array',
            'item_ids.*' => 'exists:order_items,id',
        ]);

        $order = Order::with('items')->where('user_id', $request->user()->id)
            ->findOrFail($request->id);

        // Allow return for shipped, delivered, or completed orders
        if (!in_array($order->status, ['shipped', 'delivered', 'completed'])) {
            return $this->sendJsonResponse(false, 'Return can only be requested for shipped, delivered, or completed orders', [], 400);
        }

        // If item_ids provided, handle item-level return
        if ($request->has('item_ids') && !empty($request->item_ids)) {
            $itemIds = $request->item_ids;
            $items = $order->items->whereIn('id', $itemIds);

            if ($items->count() !== count($itemIds)) {
                return $this->sendJsonResponse(false, 'Some items not found in this order', [], 400);
            }

            // Check if items are returnable
            $nonReturnableItems = $items->filter(function ($item) {
                return !($item->is_returnable ?? false) || $item->return_status === 'pending' || $item->return_status === 'approved';
            });

            if ($nonReturnableItems->count() > 0) {
                $nonReturnableNames = $nonReturnableItems->pluck('product_name')->implode(', ');
                return $this->sendJsonResponse(false, "Some items are not returnable or already have return requests: {$nonReturnableNames}", [], 400);
            }

            // Update individual items
            foreach ($items as $item) {
                $item->update([
                    'return_reason' => $request->return_reason,
                    'return_notes' => $request->return_notes,
                    'return_status' => 'pending',
                    'return_requested_at' => now(),
                ]);
            }

            // Update order return status if all items are being returned
            $allItemsReturned = $order->items->every(function ($item) {
                return $item->return_status === 'pending' || $item->return_status === 'approved';
            });

            if ($allItemsReturned) {
                $order->update([
                    'return_reason' => $request->return_reason,
                    'return_notes' => $request->return_notes,
                    'return_status' => 'pending',
                    'return_requested_at' => now(),
                ]);
            }

            return $this->sendJsonResponse(true, 'Return request submitted successfully for selected items', $order->fresh(['items']), 200);
        }

        // Original order-level return logic
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

        // Also update all items
        foreach ($order->items as $item) {
            $item->update([
                'return_reason' => $request->return_reason,
                'return_notes' => $request->return_notes,
                'return_status' => 'pending',
                'return_requested_at' => now(),
            ]);
        }

        return $this->sendJsonResponse(true, 'Return request submitted successfully', $order->fresh(['items']), 200);
    }

    public function requestReplacement(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
            'replacement_reason' => 'required|string|in:defective_item,wrong_item,not_as_described,damaged_during_delivery,other',
            'replacement_notes' => 'nullable|string|max:500',
            'item_ids' => 'nullable|array',
            'item_ids.*' => 'exists:order_items,id',
        ]);

        $order = Order::with('items')->where('user_id', $request->user()->id)
            ->findOrFail($request->id);

        // Allow replacement for shipped, delivered, or completed orders
        if (!in_array($order->status, ['shipped', 'delivered', 'completed'])) {
            return $this->sendJsonResponse(false, 'Replacement can only be requested for shipped, delivered, or completed orders', [], 400);
        }

        // If item_ids provided, handle item-level replacement
        if ($request->has('item_ids') && !empty($request->item_ids)) {
            $itemIds = $request->item_ids;
            $items = $order->items->whereIn('id', $itemIds);

            if ($items->count() !== count($itemIds)) {
                return $this->sendJsonResponse(false, 'Some items not found in this order', [], 400);
            }

            // Check if items are replaceable
            $nonReplaceableItems = $items->filter(function ($item) {
                return !($item->is_replaceable ?? false) || $item->replacement_status === 'pending' || $item->replacement_status === 'approved';
            });

            if ($nonReplaceableItems->count() > 0) {
                $nonReplaceableNames = $nonReplaceableItems->pluck('product_name')->implode(', ');
                return $this->sendJsonResponse(false, "Some items are not replaceable or already have replacement requests: {$nonReplaceableNames}", [], 400);
            }

            // Update individual items
            foreach ($items as $item) {
                $item->update([
                    'replacement_reason' => $request->replacement_reason,
                    'replacement_notes' => $request->replacement_notes,
                    'replacement_status' => 'pending',
                    'replacement_requested_at' => now(),
                ]);
            }

            // Update order replacement status if all items are being replaced
            $allItemsReplaced = $order->items->every(function ($item) {
                return $item->replacement_status === 'pending' || $item->replacement_status === 'approved';
            });

            if ($allItemsReplaced) {
                $order->update([
                    'replacement_reason' => $request->replacement_reason,
                    'replacement_notes' => $request->replacement_notes,
                    'replacement_status' => 'pending',
                    'replacement_requested_at' => now(),
                ]);
            }

            return $this->sendJsonResponse(true, 'Replacement request submitted successfully for selected items', $order->fresh(['items']), 200);
        }

        // Original order-level replacement logic
        // Check if replacement already requested
        if ($order->replacement_status === 'pending' || $order->replacement_status === 'approved') {
            return $this->sendJsonResponse(false, 'Replacement request already exists for this order', [], 400);
        }

        // Check if all products in order are replaceable
        $nonReplaceableItems = $order->items->filter(function ($item) {
            return !($item->is_replaceable ?? false);
        });

        if ($nonReplaceableItems->count() > 0) {
            $nonReplaceableNames = $nonReplaceableItems->pluck('product_name')->implode(', ');
            return $this->sendJsonResponse(false, "Some products in this order are not replaceable: {$nonReplaceableNames}", [], 400);
        }

        $order->update([
            'replacement_reason' => $request->replacement_reason,
            'replacement_notes' => $request->replacement_notes,
            'replacement_status' => 'pending',
            'replacement_requested_at' => now(),
        ]);

        // Also update all items
        foreach ($order->items as $item) {
            $item->update([
                'replacement_reason' => $request->replacement_reason,
                'replacement_notes' => $request->replacement_notes,
                'replacement_status' => 'pending',
                'replacement_requested_at' => now(),
            ]);
        }

        return $this->sendJsonResponse(true, 'Replacement request submitted successfully', $order->fresh(['items']), 200);
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

