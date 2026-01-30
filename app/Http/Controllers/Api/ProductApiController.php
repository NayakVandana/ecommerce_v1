<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\RecentlyViewedProduct;
use App\Models\UserToken;
use App\Services\SessionTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
            $categoryId = $request->input('category');
            
            // Log for debugging
            \Log::info('Product API - Category filter', [
                'category_id' => $categoryId,
                'request_data' => $request->all()
            ]);
            
            if ($categoryId) {
                // Get all category IDs including the selected category and all its subcategories
                $categoryIds = $this->getCategoryIdsWithChildren($categoryId);
                
                \Log::info('Product API - Category IDs to filter', [
                    'category_ids' => $categoryIds
                ]);
                
                // Filter products by category IDs
                $query->whereIn('category', $categoryIds);
            }
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

        $perPage = $request->input('per_page', 12);
        $page = $request->input('page', $request->query('page', 1));
        
        // Set page in query string for paginate() to work correctly
        $request->query->set('page', $page);
        
        $products = $query->orderBy('created_at', 'desc')->paginate($perPage);
        
        // Log for debugging
        \Log::info('Product API - Query result', [
            'total_products' => $products->total(),
            'current_page' => $products->currentPage(),
            'per_page' => $perPage,
            'has_category_filter' => $request->has('category'),
            'category_id' => $request->input('category')
        ]);

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
            'media.variation' => function($q) {
                $q->select('id', 'size', 'color', 'gender');
            },
            'variations' => function($q) {
                $q->orderBy('gender')->orderBy('size')->orderBy('color');
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
        // First check if user is authenticated via middleware (for protected routes)
        $userId = $request->user()?->id;
        
        // If not authenticated via middleware, check for token manually (for public routes)
        if (!$userId) {
            $userId = $this->getUserIdFromToken($request);
        }
        
        // For authenticated users, ignore session_id completely
        if ($userId) {
            try {
                DB::transaction(function () use ($userId, $productId) {
                    // Create or update entry with user_id and null session_id
                    // This ensures authenticated users never have entries with session_id
                    // First, check if there's an existing entry with user_id and null session_id
                    $existing = RecentlyViewedProduct::where('user_id', $userId)
                        ->whereNull('session_id')
                        ->where('product_id', $productId)
                        ->first();
                    
                    if ($existing) {
                        // Update viewed_at
                        $existing->update(['viewed_at' => now()]);
                    } else {
                        // Create new entry with user_id and session_id = null
                        RecentlyViewedProduct::create([
                            'user_id' => $userId,
                            'session_id' => null, // Always null for authenticated users
                            'product_id' => $productId,
                            'viewed_at' => now(),
                        ]);
                    }
                });
            } catch (\Exception $e) {
                // Silently fail if there's a constraint violation
                // This can happen in race conditions
            }
            return;
        }
        
        // For guests, get and use session_id
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

        // Use database transaction to handle unique constraint
        try {
            DB::transaction(function () use ($sessionId, $productId) {
                // For guests, check if entry exists with session_id and null user_id
                $existing = RecentlyViewedProduct::where('session_id', $sessionId)
                    ->whereNull('user_id')
                    ->where('product_id', $productId)
                    ->first();
                
                if ($existing) {
                    // Update viewed_at
                    $existing->update(['viewed_at' => now()]);
                } else {
                    // Create new entry with session_id and user_id = null
                    RecentlyViewedProduct::create([
                        'user_id' => null, // Always null for guests
                        'session_id' => $sessionId,
                        'product_id' => $productId,
                        'viewed_at' => now(),
                    ]);
                }
            });
        } catch (\Exception $e) {
            // Silently fail if there's a constraint violation
            // This can happen in race conditions
        }
    }

    /**
     * Helper: Get user ID from token for public routes
     * Since product routes are public, we need to manually check for authentication
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

    /**
     * Get category ID and all its children category IDs recursively
     * This allows filtering products by a category and all its subcategories
     */
    private function getCategoryIdsWithChildren($categoryId): array
    {
        $categoryIds = [(int) $categoryId];
        
        try {
            $category = Category::find($categoryId);
            if ($category) {
                // Get all children recursively
                $this->getChildrenIds($category, $categoryIds);
            }
        } catch (\Exception $e) {
            \Log::warning('Error getting category children: ' . $e->getMessage());
            // If there's an error, just return the original category ID
        }
        
        return array_unique($categoryIds);
    }

    /**
     * Recursively get all children category IDs
     */
    private function getChildrenIds(Category $category, array &$categoryIds, int $depth = 0)
    {
        // Prevent infinite recursion (max depth of 10 levels)
        if ($depth > 10) {
            \Log::warning('Category tree depth exceeded limit for category: ' . $category->id);
            return;
        }
        
        $children = $category->children;
        foreach ($children as $child) {
            $categoryIds[] = $child->id;
            // Recursively get grandchildren
            $this->getChildrenIds($child, $categoryIds, $depth + 1);
        }
    }

}

