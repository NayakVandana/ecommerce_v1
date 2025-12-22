<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;

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
            'city' => 'required|string',
            'postal_code' => 'required|string',
            'country' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $total = 0;
        foreach ($request->items as $item) {
            $product = Product::find($item['product_id']);
            if ($product) {
                $price = $product->final_price ?? $product->price;
                $total += $price * $item['quantity'];
            }
        }

        $order = Order::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'city' => $request->city,
            'postal_code' => $request->postal_code,
            'country' => $request->country,
            'total' => $total,
            'status' => 'pending',
        ]);

        foreach ($request->items as $item) {
            $product = Product::find($item['product_id']);
            if ($product) {
                $price = $product->final_price ?? $product->price;
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price' => $price,
                ]);
            }
        }

        return $this->sendJsonResponse(true, 'Order placed successfully', $order->load('items.product'), 201);
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
        ]);

        $order = Order::with('items.product')
            ->where('user_id', $request->user()->id)
            ->findOrFail($request->id);

        return $this->sendJsonResponse(true, 'Order fetched successfully', $order, 200);
    }

    public function cancel(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
        ]);

        $order = Order::where('user_id', $request->user()->id)
            ->findOrFail($request->id);

        if ($order->status === 'cancelled') {
            return $this->sendJsonResponse(false, 'Order is already cancelled', [], 400);
        }

        $order->update(['status' => 'cancelled']);

        return $this->sendJsonResponse(true, 'Order cancelled successfully', $order, 200);
    }
}

