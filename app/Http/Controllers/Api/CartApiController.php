<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariation;
use Illuminate\Http\Request;

class CartApiController extends Controller
{
    public function index(Request $request)
    {
        $cart = $request->user()->cartItems ?? [];
        $items = [];
        $total = 0;

        foreach ($cart as $item) {
            $product = Product::with(['media' => function($q) {
                $q->where('is_primary', true)->orWhere('type', 'image')->orderBy('sort_order');
            }])->find($item['product_id']);
            
            if ($product) {
                $variation = null;
                if (isset($item['variation_id'])) {
                    $variation = ProductVariation::find($item['variation_id']);
                }
                
                $price = $product->final_price ?? $product->price;
                $quantity = $item['quantity'] ?? 1;
                $subtotal = $price * $quantity;
                
                $items[] = [
                    'id' => $item['product_id'],
                    'product' => $product,
                    'variation' => $variation,
                    'quantity' => $quantity,
                    'subtotal' => $subtotal,
                ];
                $total += $subtotal;
            }
        }

        return $this->sendJsonResponse(true, 'Cart fetched successfully', [
            'items' => $items,
            'total' => $total,
        ], 200);
    }

    public function add(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'variation_id' => 'nullable|exists:product_variations,id',
            'size' => 'nullable|string',
            'color' => 'nullable|string',
        ]);

        $product = Product::findOrFail($request->product_id);
        
        // Check stock availability
        if ($request->variation_id) {
            $variation = ProductVariation::findOrFail($request->variation_id);
            if (!$variation->in_stock || $variation->stock_quantity < $request->quantity) {
                return $this->sendJsonResponse(false, 'Insufficient stock for selected variation', [], 400);
            }
        } elseif ($product->total_quantity !== null && $product->total_quantity < $request->quantity) {
            return $this->sendJsonResponse(false, 'Insufficient stock', [], 400);
        }

        // In a real app, you'd use a Cart model/database table
        // For now, this is a simplified version
        $cart = $request->user()->cartItems ?? [];
        $productId = $request->product_id;
        $quantity = $request->quantity;
        $variationId = $request->variation_id;

        // Check if same product with same variation already exists
        $found = false;
        foreach ($cart as $key => $item) {
            if ($item['product_id'] == $productId && 
                ($item['variation_id'] ?? null) == $variationId) {
                $cart[$key]['quantity'] += $quantity;
                $found = true;
                break;
            }
        }

        if (!$found) {
            $cartItem = [
                'product_id' => $productId,
                'quantity' => $quantity,
            ];
            
            if ($variationId) {
                $cartItem['variation_id'] = $variationId;
            }
            if ($request->size) {
                $cartItem['size'] = $request->size;
            }
            if ($request->color) {
                $cartItem['color'] = $request->color;
            }
            
            $cart[] = $cartItem;
        }

        // Save to user's cart (you'd implement this with a Cart model)
        // $request->user()->update(['cart_items' => $cart]);

        return $this->sendJsonResponse(true, 'Product added to cart', $cart, 200);
    }

    public function update(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $cart = $request->user()->cartItems ?? [];

        foreach ($cart as $key => $item) {
            if ($item['product_id'] == $request->product_id) {
                $cart[$key]['quantity'] = $request->quantity;
                break;
            }
        }

        return $this->sendJsonResponse(true, 'Cart updated successfully', $cart, 200);
    }

    public function remove(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $cart = $request->user()->cartItems ?? [];

        $cart = array_filter($cart, function ($item) use ($request) {
            return $item['product_id'] != $request->product_id;
        });

        return $this->sendJsonResponse(true, 'Product removed from cart', array_values($cart), 200);
    }

    public function clear(Request $request)
    {
        return $this->sendJsonResponse(true, 'Cart cleared successfully', [], 200);
    }
}

