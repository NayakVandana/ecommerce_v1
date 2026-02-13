<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class AdminOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['user', 'items.product', 'couponCode', 'deliveryBoy']);

        // Handle section-based filtering
        if ($request->has('section')) {
            $section = $request->section;
            switch ($section) {
                case 'pending':
                    $query->where('status', 'pending');
                    break;
                case 'ready-for-shipping':
                    // Orders that are processing (ready to be shipped)
                    $query->where('status', 'processing');
                    break;
                case 'shipped':
                    $query->where('status', 'shipped');
                    break;
                case 'out-for-delivery':
                    $query->where('status', 'out_for_delivery');
                    break;
                case 'delivered':
                    $query->where('status', 'delivered');
                    break;
                case 'failed-delivery':
                    $query->where('status', 'cancelled');
                    break;
                case 'picked-up':
                    // Map to completed for now
                    $query->where('status', 'completed');
                    break;
                case 'completed':
                    $query->where('status', 'completed');
                    break;
                case 'cancelled':
                    $query->where('status', 'cancelled');
                    break;
                case 'return-refund':
                    $query->where(function($q) {
                        $q->where('return_status', 'pending')
                          ->orWhere('return_status', 'approved')
                          ->orWhere('return_status', 'refunded')
                          ->orWhere('status', 'return_refund');
                    });
                    break;
                case 'replacement':
                    $query->where(function($q) {
                        $q->where('replacement_status', 'pending')
                          ->orWhere('replacement_status', 'approved')
                          ->orWhere('replacement_status', 'processed');
                    });
                    break;
                case 'processed':
                    // Orders that are shipped or completed
                    $query->whereIn('status', ['shipped', 'completed']);
                    break;
                case 'all':
                    // No status filter - show all orders
                    break;
                default:
                    // If no section or invalid section, show all
                    break;
            }
        } elseif ($request->has('status')) {
            // Legacy support for direct status filtering
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('id', 'like', '%' . $request->search . '%')
                  ->orWhere('order_number', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('name', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%')
                  ->orWhereHas('user', function($userQuery) use ($request) {
                      $userQuery->where('name', 'like', '%' . $request->search . '%')
                                ->orWhere('email', 'like', '%' . $request->search . '%')
                                ->orWhere('phone', 'like', '%' . $request->search . '%');
                  });
            });
        }

        // Date range filter
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [
                \Carbon\Carbon::parse($request->start_date)->startOfDay(),
                \Carbon\Carbon::parse($request->end_date)->endOfDay()
            ]);
        }

        $orders = $query->latest()->paginate(15);

        return $this->sendJsonResponse(true, 'Orders fetched successfully', $orders, 200);
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
        ]);

        $order = Order::with(['user', 'items.product', 'items.product.media', 'couponCode', 'deliveryBoy', 'deliveryVerificationMedia.orderItem', 'replacementOrder'])->findOrFail($request->id);

        return $this->sendJsonResponse(true, 'Order fetched successfully', $order, 200);
    }

    public function updateStatus(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
            'status' => 'required|in:pending,processing,shipped,completed,cancelled,ready_for_shipping,out_for_delivery,delivered,failed_delivery,picked_up,return_refund,returned',
        ]);

        $order = Order::findOrFail($request->id);
        
        // Map UI statuses to database statuses
        $statusMapping = [
            'ready_for_shipping' => 'processing',
            'out_for_delivery' => 'out_for_delivery',
            'delivered' => 'delivered',
            'failed_delivery' => 'cancelled',
            'picked_up' => 'completed',
            'return_refund' => 'return_refund',
        ];
        
        $status = $statusMapping[$request->status] ?? $request->status;
        
        // Set timestamp based on status
        $updateData = ['status' => $status];
        
        switch ($status) {
            case 'processing':
                if (!$order->processing_at) {
                    $updateData['processing_at'] = now();
                }
                break;
            case 'shipped':
                if (!$order->shipped_at) {
                    $updateData['shipped_at'] = now();
                }
                break;
            case 'out_for_delivery':
                // Set shipped_at if not already set (order must be shipped before out for delivery)
                if (!$order->shipped_at) {
                    $updateData['shipped_at'] = now();
                }
                // Set out_for_delivery_at timestamp if not already set
                if (!$order->out_for_delivery_at) {
                    $updateData['out_for_delivery_at'] = now();
                }
                break;
            case 'cancelled':
                if (!$order->cancelled_at) {
                    $updateData['cancelled_at'] = now();
                }
                break;
            case 'delivered':
            case 'completed':
                if (!$order->delivered_at) {
                    $updateData['delivered_at'] = now();
                }
                break;
        }
        
        // OTP will be generated by delivery boy from their dashboard
        $order->update($updateData);

        return $this->sendJsonResponse(true, 'Order status updated successfully', $order->fresh(), 200);
    }

    public function cancel(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
            'cancellation_reason' => 'nullable|string|in:customer_request,out_of_stock,payment_failed,delivery_issue,changed_mind,found_better_price,wrong_item,delivery_address_incorrect,delayed_delivery,other',
            'cancellation_notes' => 'nullable|string|max:500',
        ]);

        $order = Order::findOrFail($request->id);

        if ($order->status === 'cancelled') {
            return $this->sendJsonResponse(false, 'Order is already cancelled', [], 400);
        }

        if ($order->status === 'completed') {
            return $this->sendJsonResponse(false, 'Cannot cancel completed order', [], 400);
        }

        $order->update([
            'status' => 'cancelled',
            'cancellation_reason' => $request->cancellation_reason,
            'cancellation_notes' => $request->cancellation_notes,
            'cancelled_at' => now(),
        ]);

        return $this->sendJsonResponse(true, 'Order cancelled successfully', $order->fresh(), 200);
    }

    public function approveReturn(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
            'item_id' => 'nullable|exists:order_items,id',
        ]);

        $order = Order::with('items')->findOrFail($request->id);

        // Handle item-level return
        if ($request->has('item_id')) {
            $item = $order->items->find($request->item_id);
            
            if (!$item) {
                return $this->sendJsonResponse(false, 'Item not found in this order', [], 400);
            }

            if ($item->return_status !== 'pending') {
                return $this->sendJsonResponse(false, 'Item return request is not pending', [], 400);
            }

            // Calculate refund amount for this item
            $refundAmount = $item->subtotal;

            // Update item return status
            $item->update([
                'return_status' => 'approved',
                'return_refund_amount' => $refundAmount,
                'return_processed_at' => now(),
            ]);

            // Check if all items with return requests are now approved
            $pendingReturnItems = $order->items->filter(function ($orderItem) {
                return $orderItem->return_status === 'pending';
            });

            // If no pending items, update order status
            if ($pendingReturnItems->count() === 0) {
                $totalRefundAmount = $order->items->where('return_status', 'approved')->sum('return_refund_amount');
                
                $order->update([
                    'return_status' => 'approved',
                    'refund_amount' => $totalRefundAmount,
                    'return_processed_at' => now(),
                ]);
            }

            return $this->sendJsonResponse(true, 'Item return approved successfully', $order->fresh(['items']), 200);
        }

        // Handle order-level return (backward compatibility)
        if ($order->return_status !== 'pending') {
            return $this->sendJsonResponse(false, 'Return request is not pending', [], 400);
        }

        // Calculate refund amount (full order total or sum of returned items)
        $refundAmount = $order->total;

        $order->update([
            'return_status' => 'approved',
            'refund_amount' => $refundAmount,
            'return_processed_at' => now(),
            'status' => 'return_refund',
        ]);

        // Update all items
        foreach ($order->items as $item) {
            if ($item->return_status === 'pending') {
                $item->update([
                    'return_status' => 'approved',
                    'return_refund_amount' => $item->subtotal,
                    'return_processed_at' => now(),
                ]);
            }
        }

        return $this->sendJsonResponse(true, 'Return approved and refund processed successfully', $order->fresh(['items']), 200);
    }

    public function rejectReturn(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
            'item_id' => 'nullable|exists:order_items,id',
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $order = Order::with('items')->findOrFail($request->id);

        // Handle item-level rejection
        if ($request->has('item_id')) {
            $item = $order->items->find($request->item_id);
            
            if (!$item) {
                return $this->sendJsonResponse(false, 'Item not found in this order', [], 400);
            }

            if ($item->return_status !== 'pending') {
                return $this->sendJsonResponse(false, 'Item return request is not pending', [], 400);
            }

            $item->update([
                'return_status' => 'rejected',
                'return_notes' => $request->rejection_reason ? ($item->return_notes . ' | Rejection: ' . $request->rejection_reason) : $item->return_notes,
                'return_processed_at' => now(),
            ]);

            return $this->sendJsonResponse(true, 'Item return request rejected', $order->fresh(['items']), 200);
        }

        // Handle order-level rejection (backward compatibility)
        if ($order->return_status !== 'pending') {
            return $this->sendJsonResponse(false, 'Return request is not pending', [], 400);
        }

        $order->update([
            'return_status' => 'rejected',
            'return_notes' => $request->rejection_reason ? ($order->return_notes . ' | Rejection: ' . $request->rejection_reason) : $order->return_notes,
            'return_processed_at' => now(),
        ]);

        // Update all pending items
        foreach ($order->items as $item) {
            if ($item->return_status === 'pending') {
                $item->update([
                    'return_status' => 'rejected',
                    'return_notes' => $request->rejection_reason ? ($item->return_notes . ' | Rejection: ' . $request->rejection_reason) : $item->return_notes,
                    'return_processed_at' => now(),
                ]);
            }
        }

        return $this->sendJsonResponse(true, 'Return request rejected', $order->fresh(['items']), 200);
    }

    public function processRefund(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
        ]);

        $order = Order::findOrFail($request->id);

        if ($order->return_status !== 'approved') {
            return $this->sendJsonResponse(false, 'Return must be approved before processing refund', [], 400);
        }

        if ($order->return_status === 'refunded') {
            return $this->sendJsonResponse(false, 'Refund already processed', [], 400);
        }

        $order->update([
            'return_status' => 'refunded',
            'return_processed_at' => now(),
        ]);

        return $this->sendJsonResponse(true, 'Refund processed successfully', $order->fresh(), 200);
    }

    /**
     * Approve replacement request for order or specific item
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function approveReplacement(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
            'item_id' => 'nullable|exists:order_items,id',
        ]);

        /** @var \App\Models\Order $order */
        $order = Order::with('items')->findOrFail($request->id);

        // Handle item-level replacement
        if ($request->has('item_id')) {
            $item = $order->items->find($request->item_id);
            
            if (!$item) {
                return $this->sendJsonResponse(false, 'Item not found in this order', [], 400);
            }

            if ($item->replacement_status !== 'pending') {
                return $this->sendJsonResponse(false, 'Item replacement request is not pending', [], 400);
            }

            if (!($item->is_replaceable ?? false)) {
                return $this->sendJsonResponse(false, "This item is not replaceable: {$item->product_name}", [], 400);
            }

            // Get product and variation for stock management
            $product = \App\Models\Product::find($item->product_id);
            $variation = $item->variation_id ? \App\Models\ProductVariation::find($item->variation_id) : null;

            // Create replacement order following the same pattern as original order creation
            $replacementOrder = \App\Models\Order::create([
                'user_id' => $order->user_id,
                'order_number' => $this->generateOrderNumber(),
                'name' => $order->name,
                'email' => $order->email,
                'phone' => $order->receiver_number ?? $order->phone,
                'receiver_name' => $order->receiver_name,
                'receiver_number' => $order->receiver_number,
                'address' => $order->address,
                'house_no' => $order->house_no,
                'floor_no' => $order->floor_no,
                'building_name' => $order->building_name,
                'landmark' => $order->landmark,
                'district' => $order->district ?? 'Valsad',
                'city' => $order->city ?? 'Vapi',
                'postal_code' => $order->postal_code,
                'state' => $order->state ?? 'Gujarat',
                'country' => $order->country ?? 'India',
                'address_type' => $order->address_type ?? 'home',
                'subtotal' => $item->subtotal,
                'tax' => 0, // Replacement orders are typically free
                'shipping' => 0,
                'discount' => 0,
                'coupon_code_id' => null,
                'total' => $item->subtotal,
                'status' => 'pending',
                'notes' => 'Replacement order for: ' . $item->product_name,
                'delivery_date' => $order->delivery_date,
            ]);

            // Create order item following the same pattern
            $replacementOrderItem = \App\Models\OrderItem::create([
                'order_id' => $replacementOrder->id,
                'product_id' => $product->id,
                'variation_id' => $item->variation_id,
                'product_name' => $product->product_name ?? $item->product_name,
                'product_sku' => $product->sku ?? $item->product_sku,
                'size' => $item->size ?? ($variation ? $variation->size : null),
                'color' => $item->color ?? ($variation ? $variation->color : null),
                'quantity' => $item->quantity,
                'price' => $item->price,
                'subtotal' => $item->subtotal,
                'is_returnable' => $product->is_returnable ?? false,
                'is_replaceable' => $product->is_replaceable ?? false,
            ]);

            // Update stock (replacement orders should reduce stock)
            if ($item->variation_id && $variation) {
                if ($variation->stock_quantity !== null) {
                    $variation->stock_quantity -= $item->quantity;
                    if ($variation->stock_quantity <= 0) {
                        $variation->in_stock = false;
                    }
                    $variation->save();
                }
            } elseif ($product && $product->total_quantity !== null) {
                $product->total_quantity -= $item->quantity;
                if ($product->total_quantity <= 0) {
                    // Optionally mark product as out of stock
                }
                $product->save();
            }

            // Update original item with replacement order item reference
            $item->update([
                'replacement_status' => 'approved',
                'replacement_processed_at' => now(),
                'replacement_order_item_id' => $replacementOrderItem->id,
            ]);

            // Check if all items with replacement requests are now approved
            $pendingReplacementItems = $order->items->filter(function ($orderItem) {
                return $orderItem->replacement_status === 'pending';
            });

            // If no pending items, update order status
            if ($pendingReplacementItems->count() === 0) {
                $order->update([
                    'replacement_status' => 'approved',
                    'replacement_processed_at' => now(),
                ]);
            }

            return $this->sendJsonResponse(true, 'Item replacement approved and new order created successfully', $order->fresh(['items']), 200);
        }

        // Handle order-level replacement - Create individual orders for each item
        if ($order->replacement_status !== 'pending') {
            return $this->sendJsonResponse(false, 'Replacement request is not pending', [], 400);
        }

        // Get items that are pending replacement
        $pendingReplacementItems = $order->items->filter(function ($item) {
            return $item->replacement_status === 'pending';
        });

        if ($pendingReplacementItems->count() === 0) {
            return $this->sendJsonResponse(false, 'No items with pending replacement requests', [], 400);
        }

        // Check if all pending items are replaceable
        $nonReplaceableItems = $pendingReplacementItems->filter(function ($item) {
            return !($item->is_replaceable ?? false);
        });

        if ($nonReplaceableItems->count() > 0) {
            $nonReplaceableNames = $nonReplaceableItems->pluck('product_name')->implode(', ');
            return $this->sendJsonResponse(false, "Some products in this order are not replaceable: {$nonReplaceableNames}", [], 400);
        }

        // Create a separate replacement order for EACH item
        $createdOrders = [];
        /** @var \App\Models\Order $order */
        foreach ($pendingReplacementItems as $index => $item) {
            // Wrap each order creation in a transaction to prevent duplicates
            // Note: $order is captured from outer scope via 'use' clause
            \DB::transaction(function () use ($order, $item, $index, &$createdOrders) {
                // Get product and variation for stock management
                $product = \App\Models\Product::find($item->product_id);
                $variation = $item->variation_id ? \App\Models\ProductVariation::find($item->variation_id) : null;

                // Add delay between iterations to ensure different microtime values
                if ($index > 0) {
                    usleep(mt_rand(2000, 5000)); // 2-5 millisecond delay
                }
                
                // Generate unique order number - method handles uniqueness with database lock
                $orderNumber = $this->generateOrderNumber();

                // Create replacement order following the same pattern as original order creation
                $replacementOrder = \App\Models\Order::create([
                    'user_id' => $order->user_id,
                    'order_number' => $orderNumber,
                    'name' => $order->name,
                    'email' => $order->email,
                    'phone' => $order->receiver_number ?? $order->phone,
                    'receiver_name' => $order->receiver_name,
                    'receiver_number' => $order->receiver_number,
                    'address' => $order->address,
                    'house_no' => $order->house_no,
                    'floor_no' => $order->floor_no,
                    'building_name' => $order->building_name,
                    'landmark' => $order->landmark,
                    'district' => $order->district ?? 'Valsad',
                    'city' => $order->city ?? 'Vapi',
                    'postal_code' => $order->postal_code,
                    'state' => $order->state ?? 'Gujarat',
                    'country' => $order->country ?? 'India',
                    'address_type' => $order->address_type ?? 'home',
                    'subtotal' => $item->subtotal,
                    'tax' => 0, // Replacement orders are typically free
                    'shipping' => 0,
                    'discount' => 0,
                    'coupon_code_id' => null,
                    'total' => $item->subtotal,
                    'status' => 'pending',
                    'notes' => 'Replacement order for: ' . $item->product_name,
                    'delivery_date' => $order->delivery_date,
                ]);

                // Create order item following the same pattern
                $replacementOrderItem = \App\Models\OrderItem::create([
                    'order_id' => $replacementOrder->id,
                    'product_id' => $product->id,
                    'variation_id' => $item->variation_id,
                    'product_name' => $product->product_name ?? $item->product_name,
                    'product_sku' => $product->sku ?? $item->product_sku,
                    'size' => $item->size ?? ($variation ? $variation->size : null),
                    'color' => $item->color ?? ($variation ? $variation->color : null),
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                    'subtotal' => $item->subtotal,
                    'is_returnable' => $product->is_returnable ?? false,
                    'is_replaceable' => $product->is_replaceable ?? false,
                ]);

                // Update stock (replacement orders should reduce stock)
                if ($item->variation_id && $variation) {
                    if ($variation->stock_quantity !== null) {
                        $variation->stock_quantity -= $item->quantity;
                        if ($variation->stock_quantity <= 0) {
                            $variation->in_stock = false;
                        }
                        $variation->save();
                    }
                } elseif ($product && $product->total_quantity !== null) {
                    $product->total_quantity -= $item->quantity;
                    if ($product->total_quantity <= 0) {
                        // Optionally mark product as out of stock
                    }
                    $product->save();
                }

                // Update original item with replacement order item reference
                $item->update([
                    'replacement_status' => 'approved',
                    'replacement_processed_at' => now(),
                    'replacement_order_item_id' => $replacementOrderItem->id,
                ]);

                $createdOrders[] = $replacementOrder->id;
            });
        }

        // Update original order
        $order->update([
            'replacement_status' => 'approved',
            'replacement_processed_at' => now(),
            // Store the first replacement order ID for backward compatibility
            'replacement_order_id' => $createdOrders[0] ?? null,
        ]);

        $orderCount = count($createdOrders);
        $message = $orderCount > 1 
            ? "Replacement approved. {$orderCount} separate orders created successfully" 
            : 'Replacement approved and new order created successfully';

        return $this->sendJsonResponse(true, $message, $order->fresh(['items']), 200);
    }

    public function rejectReplacement(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
            'item_id' => 'nullable|exists:order_items,id',
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $order = Order::with('items')->findOrFail($request->id);

        // Handle item-level rejection
        if ($request->has('item_id')) {
            $item = $order->items->find($request->item_id);
            
            if (!$item) {
                return $this->sendJsonResponse(false, 'Item not found in this order', [], 400);
            }

            if ($item->replacement_status !== 'pending') {
                return $this->sendJsonResponse(false, 'Item replacement request is not pending', [], 400);
            }

            $item->update([
                'replacement_status' => 'rejected',
                'replacement_notes' => $request->rejection_reason ? ($item->replacement_notes . ' | Rejection: ' . $request->rejection_reason) : $item->replacement_notes,
                'replacement_processed_at' => now(),
            ]);

            return $this->sendJsonResponse(true, 'Item replacement request rejected', $order->fresh(['items']), 200);
        }

        // Handle order-level rejection (backward compatibility)
        if ($order->replacement_status !== 'pending') {
            return $this->sendJsonResponse(false, 'Replacement request is not pending', [], 400);
        }

        $order->update([
            'replacement_status' => 'rejected',
            'replacement_notes' => $request->rejection_reason ? ($order->replacement_notes . ' | Rejection: ' . $request->rejection_reason) : $order->replacement_notes,
            'replacement_processed_at' => now(),
        ]);

        // Update all pending items
        foreach ($order->items as $item) {
            if ($item->replacement_status === 'pending') {
                $item->update([
                    'replacement_status' => 'rejected',
                    'replacement_notes' => $request->rejection_reason ? ($item->replacement_notes . ' | Rejection: ' . $request->rejection_reason) : $item->replacement_notes,
                    'replacement_processed_at' => now(),
                ]);
            }
        }

        return $this->sendJsonResponse(true, 'Replacement request rejected', $order->fresh(['items']), 200);
    }

    public function processReplacement(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
            'item_id' => 'nullable|exists:order_items,id',
        ]);

        $order = Order::with('items')->findOrFail($request->id);

        // Handle item-level processing
        if ($request->has('item_id')) {
            $item = $order->items->find($request->item_id);
            
            if (!$item) {
                return $this->sendJsonResponse(false, 'Item not found in this order', [], 400);
            }

            if ($item->replacement_status !== 'approved') {
                return $this->sendJsonResponse(false, 'Item replacement must be approved before processing', [], 400);
            }

            if ($item->replacement_status === 'processed') {
                return $this->sendJsonResponse(false, 'Item replacement already processed', [], 400);
            }

            $item->update([
                'replacement_status' => 'processed',
                'replacement_processed_at' => now(),
            ]);

            // Check if all approved items are now processed
            $approvedItems = $order->items->filter(function ($orderItem) {
                return $orderItem->replacement_status === 'approved';
            });

            if ($approvedItems->count() === 0) {
                $order->update([
                    'replacement_status' => 'processed',
                    'replacement_processed_at' => now(),
                ]);
            }

            return $this->sendJsonResponse(true, 'Item replacement processed successfully', $order->fresh(['items']), 200);
        }

        // Handle order-level processing (backward compatibility)
        if ($order->replacement_status !== 'approved') {
            return $this->sendJsonResponse(false, 'Replacement must be approved before processing', [], 400);
        }

        if ($order->replacement_status === 'processed') {
            return $this->sendJsonResponse(false, 'Replacement already processed', [], 400);
        }

        $order->update([
            'replacement_status' => 'processed',
            'replacement_processed_at' => now(),
        ]);

        // Update all approved items
        foreach ($order->items as $item) {
            if ($item->replacement_status === 'approved') {
                $item->update([
                    'replacement_status' => 'processed',
                    'replacement_processed_at' => now(),
                ]);
            }
        }

        return $this->sendJsonResponse(true, 'Replacement processed successfully', $order->fresh(['replacementOrder', 'items']), 200);
    }

    private function generateOrderNumber(): string
    {
        $maxAttempts = 20;
        $attempt = 0;
        
        do {
            // Use microtime with microseconds and process ID for better uniqueness
            $microtime = microtime(true);
            $timestamp = date('YmdHis', (int)$microtime);
            $microseconds = substr(str_replace('.', '', sprintf('%.6f', $microtime)), -6, 6); // Get microseconds part
            $processId = str_pad((getmypid() % 10000), 4, '0', STR_PAD_LEFT); // Process ID for additional uniqueness
            $random = strtoupper(substr(md5(uniqid(rand(), true) . $microtime . $processId . mt_rand() . time()), 0, 6));
            $orderNumber = 'ORD-' . $timestamp . '-' . $processId . '-' . $random;
            
            // Use database lock to prevent concurrent duplicate generation
            $exists = \DB::transaction(function () use ($orderNumber) {
                return Order::where('order_number', $orderNumber)->lockForUpdate()->exists();
            });
            
            $attempt++;
            
            if ($exists && $attempt < $maxAttempts) {
                // Add small delay and try again
                usleep(mt_rand(100, 1000)); // Random delay between 0.1ms and 1ms
                continue;
            }
            
            if ($attempt >= $maxAttempts) {
                // Fallback: use timestamp with microseconds, process ID and multiple random numbers
                $orderNumber = 'ORD-' . date('YmdHis') . '-' . str_pad($processId, 3, '0', STR_PAD_LEFT) . '-' . str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT) . '-' . mt_rand(1000, 9999);
                // Final check before returning fallback
                $exists = Order::where('order_number', $orderNumber)->exists();
                if ($exists) {
                    // Last resort: append current timestamp in microseconds
                    $orderNumber .= '-' . substr(microtime(true), -6);
                }
                break;
            }
        } while ($exists);

        return $orderNumber;
    }

    public function updateDeliveryDate(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
            'delivery_date' => 'required|date|after_or_equal:today',
        ]);

        $order = Order::findOrFail($request->id);

        $order->update([
            'delivery_date' => $request->delivery_date,
        ]);

        return $this->sendJsonResponse(true, 'Delivery date updated successfully', $order->fresh(), 200);
    }

    public function getCounts(Request $request)
    {
        $counts = [
            'all' => Order::count(),
            'pending' => Order::where('status', 'pending')->count(),
            'ready-for-shipping' => Order::where('status', 'processing')->count(),
            'shipped' => Order::where('status', 'shipped')->count(),
            'out-for-delivery' => Order::where('status', 'out_for_delivery')->count(),
            'delivered' => Order::where('status', 'delivered')->count(),
            'failed-delivery' => Order::where('status', 'cancelled')->count(),
            'picked-up' => Order::where('status', 'completed')->count(),
            'completed' => Order::where('status', 'completed')->count(),
            'cancelled' => Order::where('status', 'cancelled')->count(),
            'return-refund' => Order::where(function($query) {
                $query->where('return_status', 'pending')
                    ->orWhere('return_status', 'approved')
                    ->orWhere('return_status', 'refunded')
                    ->orWhere('status', 'return_refund');
            })->count(),
            'replacement' => Order::where(function($query) {
                $query->where('replacement_status', 'pending')
                    ->orWhere('replacement_status', 'approved')
                    ->orWhere('replacement_status', 'processed');
            })->count(),
            'processed' => Order::whereIn('status', ['shipped', 'completed'])->count(),
        ];

        return $this->sendJsonResponse(true, 'Order counts fetched successfully', $counts, 200);
    }

    public function assignDeliveryBoy(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
            'delivery_boy_id' => 'required|exists:users,id',
        ]);

        $order = Order::findOrFail($request->id);
        $deliveryBoy = \App\Models\User::findOrFail($request->delivery_boy_id);

        // Check if user is a delivery boy
        if ($deliveryBoy->role !== 'delivery_boy') {
            return $this->sendJsonResponse(false, 'Selected user is not a delivery boy', [], 400);
        }

        // Assign delivery boy (OTP will be generated by delivery boy from their dashboard)
        $updateData = [
            'delivery_boy_id' => $request->delivery_boy_id,
            'status' => 'out_for_delivery',
        ];
        
        // Set shipped_at timestamp if not already set (order must be shipped before out for delivery)
        if (!$order->shipped_at) {
            $updateData['shipped_at'] = now();
        }
        
        // Set out_for_delivery_at timestamp if not already set
        if (!$order->out_for_delivery_at) {
            $updateData['out_for_delivery_at'] = now();
        }
        
        $order->update($updateData);

        return $this->sendJsonResponse(true, 'Delivery boy assigned successfully. Delivery boy can generate OTP from their dashboard.', $order->fresh(['deliveryBoy']), 200);
    }

    public function getDeliveryBoys(Request $request)
    {
        $deliveryBoys = \App\Models\User::where('role', 'delivery_boy')
            ->select('id', 'name', 'email', 'phone')
            ->get();

        return $this->sendJsonResponse(true, 'Delivery boys fetched successfully', $deliveryBoys, 200);
    }

    public function invoice($id)
    {
        $order = Order::with(['user', 'items.product', 'items.product.media', 'couponCode', 'deliveryBoy'])
            ->findOrFail($id);

        return view('admin.orders.invoice', compact('order'));
    }

    public function downloadInvoice($id)
    {
        $order = Order::with(['user', 'items.product', 'items.product.media', 'couponCode', 'deliveryBoy'])
            ->findOrFail($id);

        $pdf = Pdf::loadView('admin.orders.invoice', compact('order'));
        
        $filename = 'Invoice-' . ($order->order_number ?? $order->id) . '.pdf';
        
        return $pdf->download($filename);
    }
}

