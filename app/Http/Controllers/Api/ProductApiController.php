<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\RecentlyViewedProduct;
use App\Services\SessionTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductApiController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::where('is_approve', 1)
            ->with(['media' => function($q) {
                $q->where('is_primary', true)->orWhere('type', 'image')->orderBy('sort_order');
            }])
            ->with('categoryRelation');

        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        if ($request->has('search') && $request->search) {
            $query->where(function($q) use ($request) {
                $q->where('product_name', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%')
                  ->orWhere('brand', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('brand') && $request->brand) {
            $query->where('brand', $request->brand);
        }

        $products = $query->orderBy('created_at', 'desc')->paginate(12);

        return $this->sendJsonResponse(true, 'Products fetched successfully', $products, 200);
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:products,id',
        ]);

        $product = Product::with([
            'categoryRelation',
            'media' => function($q) {
                $q->orderBy('sort_order')->orderBy('is_primary', 'desc');
            },
            'variations' => function($q) {
                $q->where('in_stock', true)->orderBy('size')->orderBy('color');
            },
            'discounts' => function($q) {
                $q->where('is_active', true)
                  ->where('start_date', '<=', now())
                  ->where('end_date', '>=', now());
            },
            'user'
        ])->findOrFail($request->id);

        // Track recently viewed product
        $this->trackRecentlyViewed($request, $product->id);

        return $this->sendJsonResponse(true, 'Product fetched successfully', $product, 200);
    }

    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string',
        ]);

        $products = Product::where('is_approve', 1)
            ->with(['media' => function($q) {
                $q->where('is_primary', true)->orWhere('type', 'image')->orderBy('sort_order');
            }])
            ->where(function($q) use ($request) {
                $q->where('product_name', 'like', '%' . $request->query . '%')
                  ->orWhere('description', 'like', '%' . $request->query . '%')
                  ->orWhere('brand', 'like', '%' . $request->query . '%')
                  ->orWhere('hashtags', 'like', '%' . $request->query . '%');
            })
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        return $this->sendJsonResponse(true, 'Products searched successfully', $products, 200);
    }

    /**
     * Track recently viewed product
     * Automatically creates guest session if needed
     */
    private function trackRecentlyViewed(Request $request, $productId)
    {
        $userId = $request->user()?->id;
        $sessionId = $request->input('session_id') ?? SessionTrackingService::getSessionIdFromRequest($request);

        // If no session exists for guest, create one
        if (!$userId && !$sessionId) {
            $session = SessionTrackingService::getOrCreateSession($request);
            $sessionId = $session->session_id;
        }

        // Ensure we have either user_id or session_id
        if (!$userId && !$sessionId) {
            return;
        }

        // Use database transaction to handle unique constraint
        try {
            DB::transaction(function () use ($userId, $sessionId, $productId) {
                if ($userId) {
                    // For logged-in users, use user_id
                    RecentlyViewedProduct::updateOrCreate(
                        [
                            'user_id' => $userId,
                            'product_id' => $productId,
                        ],
                        [
                            'viewed_at' => now(),
                        ]
                    );
                } elseif ($sessionId) {
                    // For guests, use session_id
                    RecentlyViewedProduct::updateOrCreate(
                        [
                            'session_id' => $sessionId,
                            'product_id' => $productId,
                        ],
                        [
                            'viewed_at' => now(),
                        ]
                    );
                }
            });
        } catch (\Exception $e) {
            // Silently fail if there's a constraint violation
            // This can happen in race conditions
        }
    }

}

