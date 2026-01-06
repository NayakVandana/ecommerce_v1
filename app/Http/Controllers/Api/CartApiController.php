<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\Cart;
use App\Models\UserToken;
use App\Services\SessionTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        
        // Calculate count based on user_id for authenticated users, session_id for guests
        $count = $this->getCartCount($userId, $sessionId);

        return $this->sendJsonResponse(true, 'Cart fetched successfully', [
            'items' => $formatted['items'],
            'total' => $formatted['total'],
            'count' => $count,
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

        $productId = $request->product_id;
        $variationId = $request->variation_id;
        $quantity = $request->quantity;

        // Upsert cart item with unique constraint
        // IMPORTANT: For authenticated users, sessionId is always null (ignored completely)
        DB::transaction(function () use ($productId, $variationId, $quantity, $request, $userId, $sessionId) {
            if ($userId) {
                // For authenticated users, ONLY use user_id - session_id is completely ignored
                // This ensures entries are created with user_id and session_id = null
                $cartItem = Cart::where('user_id', $userId)
                    ->whereNull('session_id')
                    ->where('product_id', $productId)
                    ->where('variation_id', $variationId)
                    ->first();

                if ($cartItem) {
                    // Update existing item
                    $cartItem->quantity += $quantity;
                    $cartItem->save();
                } else {
                    // Create new entry with user_id and session_id = null
                    // Explicitly set session_id to null to prevent any accidental use
                    Cart::create([
                        'user_id' => $userId,
                        'session_id' => null, // Always null for authenticated users - never use session_id
                        'product_id' => $productId,
                        'variation_id' => $variationId,
                        'size' => $request->size,
                        'color' => $request->color,
                        'quantity' => $quantity,
                    ]);
                }
            } else {
                // For guests, use session_id only (user_id is null)
                // Check if sessionId is available
                if (!$sessionId) {
                    throw new \Exception('Session ID is required for guest users');
                }
                
                $cartItem = Cart::where('session_id', $sessionId)
                    ->whereNull('user_id')
                    ->where('product_id', $productId)
                    ->where('variation_id', $variationId)
                    ->first();

                if ($cartItem) {
                    // Update existing item
                    $cartItem->quantity += $quantity;
                    $cartItem->save();
                } else {
                    // Create new entry with session_id only (user_id is null)
                    Cart::create([
                        'user_id' => null, // Always null for guests
                        'session_id' => $sessionId,
                        'product_id' => $productId,
                        'variation_id' => $variationId,
                        'size' => $request->size,
                        'color' => $request->color,
                        'quantity' => $quantity,
                    ]);
                }
            }
        });

        // Return updated cart
        $cartItems = $this->getOwnerCartQuery($userId, $sessionId)
            ->with(['product.media' => function($q) {
                $q->where('is_primary', true)->orWhere('type', 'image')->orderBy('sort_order');
            }, 'variation'])
            ->get();

        $formatted = $this->formatCart($cartItems);
        
        // Calculate count based on user_id for authenticated users, session_id for guests
        $count = $this->getCartCount($userId, $sessionId);

        return $this->sendJsonResponse(true, 'Product added to cart', [
            'items' => $formatted['items'],
            'total' => $formatted['total'],
            'count' => $count,
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
        
        // For authenticated users, only update entries with user_id and null session_id
        if ($userId) {
            Cart::where('user_id', $userId)
                ->whereNull('session_id')
                ->where('product_id', $request->product_id)
                ->where('variation_id', $request->variation_id)
                ->update(['quantity' => $request->quantity]);
        } else {
            // For guests, only update entries with session_id and null user_id
            Cart::where('session_id', $sessionId)
                ->whereNull('user_id')
                ->where('product_id', $request->product_id)
                ->where('variation_id', $request->variation_id)
                ->update(['quantity' => $request->quantity]);
        }

        $cartItems = $this->getOwnerCartQuery($userId, $sessionId)
            ->with(['product.media' => function($q) {
                $q->where('is_primary', true)->orWhere('type', 'image')->orderBy('sort_order');
            }, 'variation'])
            ->get();

        $formatted = $this->formatCart($cartItems);
        
        // Calculate count based on user_id for authenticated users, session_id for guests
        $count = $this->getCartCount($userId, $sessionId);

        return $this->sendJsonResponse(true, 'Cart updated successfully', [
            'items' => $formatted['items'],
            'total' => $formatted['total'],
            'count' => $count,
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
        
        // For authenticated users, only remove entries with user_id and null session_id
        if ($userId) {
            Cart::where('user_id', $userId)
                ->whereNull('session_id')
                ->where('product_id', $request->product_id)
                ->where('variation_id', $request->variation_id)
                ->delete();
        } else {
            // For guests, only remove entries with session_id and null user_id
            Cart::where('session_id', $sessionId)
                ->whereNull('user_id')
                ->where('product_id', $request->product_id)
                ->where('variation_id', $request->variation_id)
                ->delete();
        }

        $cartItems = $this->getOwnerCartQuery($userId, $sessionId)
            ->with(['product.media' => function($q) {
                $q->where('is_primary', true)->orWhere('type', 'image')->orderBy('sort_order');
            }, 'variation'])
            ->get();

        $formatted = $this->formatCart($cartItems);
        
        // Calculate count based on user_id for authenticated users, session_id for guests
        $count = $this->getCartCount($userId, $sessionId);

        return $this->sendJsonResponse(true, 'Product removed from cart', [
            'items' => $formatted['items'],
            'total' => $formatted['total'],
            'count' => $count,
            'session_id' => $sessionId,
        ], 200);
    }

    public function clear(Request $request)
    {
        [$userId, $sessionId] = $this->resolveOwner($request, false);
        
        // For authenticated users, only clear entries with user_id and null session_id
        if ($userId) {
            Cart::where('user_id', $userId)
                ->whereNull('session_id')
                ->delete();
        } else {
            // For guests, only clear entries with session_id and null user_id
            Cart::where('session_id', $sessionId)
                ->whereNull('user_id')
                ->delete();
        }

        return $this->sendJsonResponse(true, 'Cart cleared successfully', [
            'items' => [],
            'total' => 0,
            'count' => 0,
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
     * For authenticated users, session_id is ignored (set to null)
     * 
     * Since cart routes are public, we need to check for authentication token manually
     */
    private function resolveOwner(Request $request, bool $createSessionIfMissing = true): array
    {
        // First check if user is authenticated via middleware (for protected routes)
        $userId = $request->user()?->id;
        
        // If not authenticated via middleware, check for token manually (for public routes)
        if (!$userId) {
            $userId = $this->getUserIdFromToken($request);
        }
        
        // For authenticated users, always return null for session_id
        // This ensures all operations use user_id only
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
     * Helper: base cart query for owner
     * For authenticated users, only return entries with user_id and null session_id
     * For guests, only return entries with session_id and null user_id
     */
    private function getOwnerCartQuery($userId, $sessionId)
    {
        if ($userId) {
            // For authenticated users, only get entries with user_id and null session_id
            // This ensures we don't return orphaned entries
            return Cart::where('user_id', $userId)
                ->whereNull('session_id');
        }

        // For guests, only get entries with session_id and null user_id
        // This ensures guests don't see user entries
        return Cart::where('session_id', $sessionId)
            ->whereNull('user_id');
    }

    /**
     * Helper: get cart count based on user_id for authenticated users, session_id for guests
     * For authenticated users, count is based on user_id only (session_id is ignored)
     * For guests, count is based on session_id only (user_id is null)
     */
    private function getCartCount($userId, $sessionId): int
    {
        if ($userId) {
            // For authenticated users, count entries with user_id and null session_id only
            // This ensures count is based on user_id, not session_id
            return Cart::where('user_id', $userId)
                ->whereNull('session_id')
                ->sum('quantity') ?? 0;
        }

        // For guests, count entries with session_id and null user_id
        // This ensures count is based on session_id only, not user entries
        return Cart::where('session_id', $sessionId)
            ->whereNull('user_id')
            ->sum('quantity') ?? 0;
    }

    /**
     * Helper: Get user ID from token for public routes
     * Since cart routes are public, we need to manually check for authentication
     */
    private function getUserIdFromToken(Request $request): ?int
    {
        $token = $request->bearerToken() ?? $request->header('Authorization');
        
        // Remove "Bearer " prefix if present
        if ($token && str_starts_with($token, 'Bearer ')) {
            $token = substr($token, 7);
        }
        
        if (!$token) {
            return null;
        }
        
        $userToken = UserToken::where(function ($q) use ($token) {
            $q->where('web_access_token', $token)
              ->orWhere('app_access_token', $token);
        })->first();
        
        if ($userToken && $userToken->user) {
            // Set user in request for this request (so $request->user() works)
            Auth::login($userToken->user);
            return $userToken->user->id;
        }
        
        return null;
    }
}

