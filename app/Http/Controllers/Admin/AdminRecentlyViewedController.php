<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RecentlyViewedProduct;
use Illuminate\Http\Request;

class AdminRecentlyViewedController extends Controller
{
    public function index(Request $request)
    {
        $query = RecentlyViewedProduct::with([
            'user',
            'product' => function($q) {
                $q->with(['media' => function($media) {
                    $media->where('is_primary', true)->orWhere('type', 'image')->orderBy('sort_order');
                }]);
            }
        ]);

        // Filter by user type
        if ($request->filled('user_type')) {
            if ($request->user_type === 'authenticated') {
                $query->whereNotNull('user_id')->whereNull('session_id');
            } elseif ($request->user_type === 'guest') {
                $query->whereNotNull('session_id')->whereNull('user_id');
            }
        }

        // Search by product name
        if ($request->filled('search')) {
            $query->whereHas('product', function($q) use ($request) {
                $q->where('product_name', 'like', '%' . $request->search . '%');
            });
        }

        // Date range filter (filter by viewed_at)
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('viewed_at', [
                \Carbon\Carbon::parse($request->start_date)->startOfDay(),
                \Carbon\Carbon::parse($request->end_date)->endOfDay()
            ]);
        }

        $perPage = $request->input('per_page', 15);
        $page = $request->input('page', $request->query('page', 1));
        
        // Set page in query string for paginate() to work correctly
        $request->query->set('page', $page);
        
        $recentlyViewed = $query->orderBy('viewed_at', 'desc')->paginate($perPage);

        return $this->sendJsonResponse(true, 'Recently viewed products fetched successfully', $recentlyViewed, 200);
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:recently_viewed_products,id',
        ]);

        $recentlyViewed = RecentlyViewedProduct::with([
            'user',
            'product' => function($q) {
                $q->with(['media' => function($media) {
                    $media->where('is_primary', true)->orWhere('type', 'image')->orderBy('sort_order');
                }]);
            }
        ])->findOrFail($request->id);

        return $this->sendJsonResponse(true, 'Recently viewed product fetched successfully', $recentlyViewed, 200);
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:recently_viewed_products,id',
        ]);

        $recentlyViewed = RecentlyViewedProduct::findOrFail($request->id);
        $recentlyViewed->delete();

        return $this->sendJsonResponse(true, 'Recently viewed product deleted successfully', [], 200);
    }
}

