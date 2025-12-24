<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\Cart;
use App\Services\SessionTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CartApiController extends Controller
{
    public function index(Request $request)
    {
        [$userId, $sessionId] = $this->resolveOwner($request, true);

        $cartItems = $this->getOwnerCartQuery($userId, $sessionId)
            ->with([
                'product' => function($q) {
                    $q->with(['media' => function($media) {
                        $media->where('is_primary', true)->orWhere('type', 'image')->orderBy('sort_order');
                    }]);
                },
                'variation'
            ])
            ->get();

        $formatted = $this->formatCart($cartItems);

        return $this->sendJsonResponse(true, 'Cart fetched successfully', [
            'items' => $formatted['items'],
            'total' => $formatted['total'],
            'session_id' => $sessionId,
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
        [$userId, $sessionId] = $this->resolveOwner($request, true);

        $identifiers = $userId ? ['user_id' => $userId] : ['session_id' => $sessionId];

        $productId = $request->product_id;
        $variationId = $request->variation_id;
        $quantity = $request->quantity;

        // Upsert cart item with unique constraint
        DB::transaction(function () use ($identifiers, $productId, $variationId, $quantity, $request) {
            $cartItem = Cart::where($identifiers)
                ->where('product_id', $productId)
                ->where('variation_id', $variationId)
                ->first();

            if ($cartItem) {
                $cartItem->quantity += $quantity;
                $cartItem->save();
            } else {
                Cart::create(array_merge($identifiers, [
                    'product_id' => $productId,
                    'variation_id' => $variationId,
                    'size' => $request->size,
                    'color' => $request->color,
                    'quantity' => $quantity,
                ]));
            }
        });

        // Return updated cart
        $cartItems = $this->getOwnerCartQuery($userId, $sessionId)
            ->with(['product.media' => function($q) {
                $q->where('is_primary', true)->orWhere('type', 'image')->orderBy('sort_order');
            }, 'variation'])
            ->get();

        $formatted = $this->formatCart($cartItems);

        return $this->sendJsonResponse(true, 'Product added to cart', [
            'items' => $formatted['items'],
            'total' => $formatted['total'],
            'session_id' => $sessionId,
        ], 200);
    }

    public function update(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'variation_id' => 'nullable|exists:product_variations,id',
        ]);

        [$userId, $sessionId] = $this->resolveOwner($request, false);
        $identifiers = $userId ? ['user_id' => $userId] : ['session_id' => $sessionId];

        Cart::where($identifiers)
            ->where('product_id', $request->product_id)
            ->where('variation_id', $request->variation_id)
            ->update(['quantity' => $request->quantity]);

        $cartItems = $this->getOwnerCartQuery($userId, $sessionId)
            ->with(['product.media' => function($q) {
                $q->where('is_primary', true)->orWhere('type', 'image')->orderBy('sort_order');
            }, 'variation'])
            ->get();

        $formatted = $this->formatCart($cartItems);

        return $this->sendJsonResponse(true, 'Cart updated successfully', [
            'items' => $formatted['items'],
            'total' => $formatted['total'],
            'session_id' => $sessionId,
        ], 200);
    }

    public function remove(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'variation_id' => 'nullable|exists:product_variations,id',
        ]);

        [$userId, $sessionId] = $this->resolveOwner($request, false);
        $identifiers = $userId ? ['user_id' => $userId] : ['session_id' => $sessionId];

        Cart::where($identifiers)
            ->where('product_id', $request->product_id)
            ->where('variation_id', $request->variation_id)
            ->delete();

        $cartItems = $this->getOwnerCartQuery($userId, $sessionId)
            ->with(['product.media' => function($q) {
                $q->where('is_primary', true)->orWhere('type', 'image')->orderBy('sort_order');
            }, 'variation'])
            ->get();

        $formatted = $this->formatCart($cartItems);

        return $this->sendJsonResponse(true, 'Product removed from cart', [
            'items' => $formatted['items'],
            'total' => $formatted['total'],
            'session_id' => $sessionId,
        ], 200);
    }

    public function clear(Request $request)
    {
        [$userId, $sessionId] = $this->resolveOwner($request, false);
        $identifiers = $userId ? ['user_id' => $userId] : ['session_id' => $sessionId];

        Cart::where($identifiers)->delete();

        return $this->sendJsonResponse(true, 'Cart cleared successfully', [
            'items' => [],
            'total' => 0,
            'session_id' => $sessionId,
        ], 200);
    }

    /**
     * Helper: format cart response
     */
    private function formatCart($cartItems)
    {
        $items = [];
        $total = 0;

        foreach ($cartItems as $item) {
            if (!$item->product) {
                continue;
            }

            $price = $item->product->final_price ?? $item->product->price;
            $quantity = $item->quantity ?? 1;
            $subtotal = $price * $quantity;

            $items[] = [
                'id' => $item->id,
                'product' => $item->product,
                'variation' => $item->variation,
                'quantity' => $quantity,
                'subtotal' => $subtotal,
            ];
            $total += $subtotal;
        }

        return ['items' => $items, 'total' => $total];
    }

    /**
     * Helper: resolve owner (user or guest session)
     * Session ID is automatically set by TrackSession middleware
     */
    private function resolveOwner(Request $request, bool $createSessionIfMissing = true): array
    {
        $userId = $request->user()?->id;
        
        // Session ID is set by TrackSession middleware, or from request input, or from Laravel session
        $sessionId = $request->input('session_id') 
            ?? SessionTrackingService::getSessionIdFromRequest($request);

        // If no session exists and we need one, create it
        if (!$userId && !$sessionId && $createSessionIfMissing) {
            $session = SessionTrackingService::getOrCreateSession($request);
            $sessionId = $session->session_id;
        }

        return [$userId, $sessionId];
    }

    /**
     * Helper: base cart query for owner
     */
    private function getOwnerCartQuery($userId, $sessionId)
    {
        if ($userId) {
            return Cart::where('user_id', $userId);
        }

        return Cart::where('session_id', $sessionId);
    }
}

