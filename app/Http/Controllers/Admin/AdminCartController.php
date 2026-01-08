<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use Illuminate\Http\Request;

class AdminCartController extends Controller
{
    public function index(Request $request)
    {
        $query = Cart::with([
            'user',
            'product' => function($q) {
                $q->with(['media' => function($media) {
                    $media->where('is_primary', true)->orWhere('type', 'image')->orderBy('sort_order');
                }]);
            },
            'variation'
        ]);

        // Filter by user type
        if ($request->filled('user_type')) {
            if ($request->user_type === 'authenticated') {
                $query->whereNotNull('user_id')->whereNull('session_id');
            } elseif ($request->user_type === 'guest') {
                $query->whereNotNull('session_id')->whereNull('user_id');
            }
        }

        // Search by product name (only if search is provided)
        if ($request->filled('search')) {
            $query->whereHas('product', function($q) use ($request) {
                $q->where('product_name', 'like', '%' . $request->search . '%');
            });
        }

        $perPage = $request->input('per_page', 15);
        $page = $request->input('page', $request->query('page', 1));
        
        // Set page in query string for paginate() to work correctly
        $request->query->set('page', $page);
        
        $carts = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return $this->sendJsonResponse(true, 'Carts fetched successfully', $carts, 200);
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:carts,id',
        ]);

        $cart = Cart::with([
            'user',
            'product' => function($q) {
                $q->with(['media' => function($media) {
                    $media->where('is_primary', true)->orWhere('type', 'image')->orderBy('sort_order');
                }]);
            },
            'variation'
        ])->findOrFail($request->id);

        $product = $cart->product;
        $price = $product->final_price ?? $product->price ?? 0;
        $quantity = $cart->quantity ?? 1;
        $subtotal = $price * $quantity;

        $formatted = [
            'id' => $cart->id,
            'user' => $cart->user,
            'user_id' => $cart->user_id,
            'session_id' => $cart->session_id,
            'product' => $product,
            'variation' => $cart->variation,
            'quantity' => $quantity,
            'subtotal' => $subtotal,
            'created_at' => $cart->created_at,
            'updated_at' => $cart->updated_at,
        ];

        return $this->sendJsonResponse(true, 'Cart item fetched successfully', $formatted, 200);
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:carts,id',
        ]);

        $cart = Cart::findOrFail($request->id);
        $cart->delete();

        return $this->sendJsonResponse(true, 'Cart item deleted successfully', [], 200);
    }
}

