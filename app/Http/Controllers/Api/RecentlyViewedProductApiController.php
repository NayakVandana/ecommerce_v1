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
     * For authenticated users, completely ignore session_id and use user_id only
     */
    public function index(Request $request)
    {
        // Get user ID from authenticated user (set by auth.optional middleware if token provided)
        // Using auth()->id() is secure and works with Laravel's authentication system
        $userId = auth()->id();
        
        // For authenticated users, ignore session_id completely
        if ($userId) {
            $sessionId = null;
        } else {
            // For guests, get session_id from various sources
            $sessionId = $request->input('session_id') 
                ?? $request->query('session_id')
                ?? $request->header('X-Session-ID')
                ?? SessionTrackingService::getSessionIdFromRequest($request);
            
            // Normalize: convert empty string to null
            if ($sessionId === '' || $sessionId === 'null') {
                $sessionId = null;
            }

            // If no session exists for guest, create one
            if (!$sessionId) {
                $session = SessionTrackingService::getOrCreateSession($request);
                $sessionId = $session->session_id;
            }
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
            // For authenticated users, only get entries with user_id and null session_id
            $query->where('user_id', $userId)
                  ->whereNull('session_id');
        } elseif ($sessionId) {
            // For guests, only get entries with session_id and null user_id
            $query->where('session_id', $sessionId)
                  ->whereNull('user_id');
        } else {
            return $this->sendJsonResponse(true, 'No recently viewed products', [
                'session_id' => $sessionId,
            ], 200);
        }

        $perPage = $request->input('per_page', 12);
        $page = $request->input('page', $request->query('page', 1));
        
        // Set page in query string for paginate() to work correctly
        $request->query->set('page', $page);
        
        $recentlyViewed = $query->orderBy('viewed_at', 'desc')->paginate($perPage);
        
        // Transform paginated data: extract products from RecentlyViewedProduct items
        $products = $recentlyViewed->getCollection()->map(function($item) {
            return $item->product;
        })->filter(function($product) {
            return $product !== null;
        })->values();

        // Calculate count based on user_id for authenticated users, session_id for guests
        $count = $this->getRecentlyViewedCount($userId, $sessionId);

        // Return paginated response (Laravel pagination structure)
        // Note: total count is based on RecentlyViewedProduct records, not filtered products
        return $this->sendJsonResponse(true, 'Recently viewed products fetched successfully', [
            'data' => $products->all(),
            'current_page' => $recentlyViewed->currentPage(),
            'last_page' => $recentlyViewed->lastPage(),
            'per_page' => $recentlyViewed->perPage(),
            'total' => $recentlyViewed->total(),
            'from' => $recentlyViewed->firstItem(),
            'to' => $recentlyViewed->lastItem(),
            'count' => $count,
            'session_id' => $sessionId,
        ], 200);
    }

    /**
     * Clear recently viewed products
     * For authenticated users, completely ignore session_id and use user_id only
     */
    public function clear(Request $request)
    {
        // Get user ID from authenticated user (set by auth.optional middleware if token provided)
        $userId = auth()->id();
        
        // For authenticated users, ignore session_id completely
        if ($userId) {
            $sessionId = null;
        } else {
            // For guests, get session_id from various sources
            $sessionId = $request->input('session_id') 
                ?? $request->query('session_id')
                ?? $request->header('X-Session-ID')
                ?? SessionTrackingService::getSessionIdFromRequest($request);
            
            // Normalize: convert empty string to null
            if ($sessionId === '' || $sessionId === 'null') {
                $sessionId = null;
            }

            // If no session exists for guest, create one
            if (!$sessionId) {
                $session = SessionTrackingService::getOrCreateSession($request);
                $sessionId = $session->session_id;
            }
        }

        if ($userId) {
            // For authenticated users, only clear entries with user_id and null session_id
            RecentlyViewedProduct::where('user_id', $userId)
                ->whereNull('session_id')
                ->delete();
        } elseif ($sessionId) {
            // For guests, only clear entries with session_id and null user_id
            RecentlyViewedProduct::where('session_id', $sessionId)
                ->whereNull('user_id')
                ->delete();
        } else {
            return $this->sendJsonResponse(false, 'Unable to clear recently viewed products', [], 400);
        }

        return $this->sendJsonResponse(true, 'Recently viewed products cleared successfully', [
            'count' => 0,
            'session_id' => $sessionId,
        ], 200);
    }

    /**
     * Remove a specific product from recently viewed
     * For authenticated users, completely ignore session_id and use user_id only
     */
    public function remove(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        // Get user ID from authenticated user (set by auth.optional middleware if token provided)
        $userId = auth()->id();
        
        // For authenticated users, ignore session_id completely
        if ($userId) {
            $sessionId = null;
        } else {
            // For guests, get session_id from various sources
            $sessionId = $request->input('session_id') 
                ?? $request->query('session_id')
                ?? $request->header('X-Session-ID')
                ?? SessionTrackingService::getSessionIdFromRequest($request);
            
            // Normalize: convert empty string to null
            if ($sessionId === '' || $sessionId === 'null') {
                $sessionId = null;
            }

            // If no session exists for guest, create one
            if (!$sessionId) {
                $session = SessionTrackingService::getOrCreateSession($request);
                $sessionId = $session->session_id;
            }
        }

        $query = RecentlyViewedProduct::where('product_id', $request->product_id);

        if ($userId) {
            // For authenticated users, only remove entries with user_id and null session_id
            $query->where('user_id', $userId)
                  ->whereNull('session_id');
        } elseif ($sessionId) {
            $query->where('session_id', $sessionId);
        } else {
            return $this->sendJsonResponse(false, 'Unable to remove product', [], 400);
        }

        $query->delete();

        // Calculate count after removal
        $count = $this->getRecentlyViewedCount($userId, $sessionId);

        return $this->sendJsonResponse(true, 'Product removed from recently viewed', [
            'count' => $count,
            'session_id' => $sessionId,
        ], 200);
    }

    /**
     * Helper: get recently viewed products count based on user_id for authenticated users, session_id for guests
     * For authenticated users, count is based on user_id only (session_id is ignored)
     */
    private function getRecentlyViewedCount($userId, $sessionId): int
    {
        if ($userId) {
            // For authenticated users, count entries with user_id and null session_id only
            // This ensures count is based on user_id, not session_id
            return RecentlyViewedProduct::where('user_id', $userId)
                ->whereNull('session_id')
                ->count();
        }

        // For guests, count entries with session_id and null user_id
        return RecentlyViewedProduct::where('session_id', $sessionId)
            ->whereNull('user_id')
            ->count();
    }


}

