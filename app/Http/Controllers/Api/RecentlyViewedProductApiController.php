<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecentlyViewedProduct;
use App\Models\Product;
use Illuminate\Http\Request;
use App\Services\SessionTrackingService;

class RecentlyViewedProductApiController extends Controller
{
    /**
     * Get recently viewed products for the current user or session
     */
    public function index(Request $request)
    {
        $userId = $request->user()?->id;
        $sessionId = $request->input('session_id') ?? SessionTrackingService::getSessionIdFromRequest($request);

        // If no session exists for guest, create one (though they won't have any products yet)
        if (!$userId && !$sessionId) {
            $session = SessionTrackingService::getOrCreateSession($request);
            $sessionId = $session->session_id;
        }

        $query = RecentlyViewedProduct::with(['product' => function($q) {
            $q->with(['media' => function($mediaQuery) {
                $mediaQuery->where('is_primary', true)->orWhere('type', 'image')
                    ->orderBy('sort_order');
            }])
            ->where('is_approve', 1);
        }])
        ->whereHas('product', function($q) {
            $q->where('is_approve', 1);
        });

        if ($userId) {
            $query->where('user_id', $userId);
        } elseif ($sessionId) {
            $query->where('session_id', $sessionId);
        } else {
            return $this->sendJsonResponse(true, 'No recently viewed products', [
                'session_id' => $sessionId,
            ], 200);
        }

        $recentlyViewed = $query->orderBy('viewed_at', 'desc')
            ->limit($request->input('limit', 20))
            ->get();

        return $this->sendJsonResponse(true, 'Recently viewed products fetched successfully', [
            'products' => $recentlyViewed,
            'session_id' => $sessionId,
        ], 200);
    }

    /**
     * Clear recently viewed products
     */
    public function clear(Request $request)
    {
        $userId = $request->user()?->id;
        $sessionId = $request->input('session_id') ?? SessionTrackingService::getSessionIdFromRequest($request);

        // If no session exists for guest, create one
        if (!$userId && !$sessionId) {
            $session = SessionTrackingService::getOrCreateSession($request);
            $sessionId = $session->session_id;
        }

        if ($userId) {
            RecentlyViewedProduct::where('user_id', $userId)->delete();
        } elseif ($sessionId) {
            RecentlyViewedProduct::where('session_id', $sessionId)->delete();
        } else {
            return $this->sendJsonResponse(false, 'Unable to clear recently viewed products', [], 400);
        }

        return $this->sendJsonResponse(true, 'Recently viewed products cleared successfully', [
            'session_id' => $sessionId,
        ], 200);
    }

    /**
     * Remove a specific product from recently viewed
     */
    public function remove(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $userId = $request->user()?->id;
        $sessionId = $request->input('session_id') ?? SessionTrackingService::getSessionIdFromRequest($request);

        // If no session exists for guest, create one
        if (!$userId && !$sessionId) {
            $session = SessionTrackingService::getOrCreateSession($request);
            $sessionId = $session->session_id;
        }

        $query = RecentlyViewedProduct::where('product_id', $request->product_id);

        if ($userId) {
            $query->where('user_id', $userId);
        } elseif ($sessionId) {
            $query->where('session_id', $sessionId);
        } else {
            return $this->sendJsonResponse(false, 'Unable to remove product', [], 400);
        }

        $query->delete();

        return $this->sendJsonResponse(true, 'Product removed from recently viewed', [
            'session_id' => $sessionId,
        ], 200);
    }

}

