<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class CategoryApiController extends Controller
{
    public function index(Request $request)
    {
        try {
            // Check if only featured categories are requested (for home page)
            $featuredOnly = $request->has('featured_only') && $request->featured_only === true;
            // Check if parent_id column exists
            if (!Schema::hasColumn('categories', 'parent_id')) {
                // Fallback: return categories without hierarchical structure - only required fields
                $categories = Category::select('id', 'parent_id', 'name', 'slug', 'icon', 'description', 'is_featured', 'sort_order')
                    ->withCount('products')
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get();
                
                $flatCategories = $categories->map(function ($category) {
                    // Only return required fields, filter out null/empty values
                    $result = [];
                    if ($category->id) $result['id'] = $category->id;
                    if ($category->name) $result['name'] = $category->name;
                    if ($category->slug) $result['slug'] = $category->slug;
                    if ($category->icon) $result['icon'] = $category->icon;
                    if ($category->description) $result['description'] = $category->description;
                    if ($category->is_featured !== null) $result['is_featured'] = (bool)$category->is_featured;
                    $result['products_count'] = $category->products_count ?? 0;
                    return $result;
                })->filter(function($cat) {
                    // Remove empty/null categories - must have at least id and name
                    return $cat && isset($cat['id']) && isset($cat['name']) && !empty($cat['name']);
                })->values();
                
                return $this->sendJsonResponse(true, 'Categories fetched successfully', [
                    'flat' => $flatCategories->toArray(),
                    'hierarchical' => []
                ], 200);
            }
            
            // Get all categories with their relationships - select only required fields
            $query = Category::select('id', 'parent_id', 'name', 'slug', 'icon', 'description', 'is_featured', 'sort_order')
                ->withCount('products');
            
            // If only featured categories requested, filter them
            if ($featuredOnly) {
                $query->where('is_featured', true);
            }
            
            $categories = $query->orderBy('sort_order')
                ->orderBy('name')
                ->get();

            // Organize into hierarchical structure with only required fields
            $hierarchical = $categories->whereNull('parent_id')
                ->map(function ($category) use ($categories) {
                    return $this->buildCategoryTree($category, $categories);
                })
                ->filter(function($cat) {
                    // Remove empty/null categories
                    return $cat && isset($cat['id']) && isset($cat['name']);
                })
                ->values();

            // Return only required fields for flat structure (for home page)
            $flatCategories = $categories->map(function ($category) {
                // Only return required fields, filter out null/empty values
                $result = [];
                if ($category->id) $result['id'] = $category->id;
                if ($category->name) $result['name'] = $category->name;
                if ($category->slug) $result['slug'] = $category->slug;
                if ($category->icon) $result['icon'] = $category->icon;
                if ($category->description) $result['description'] = $category->description;
                if ($category->is_featured !== null) $result['is_featured'] = (bool)$category->is_featured;
                $result['products_count'] = $category->products_count ?? 0;
                return $result;
            })->filter(function($cat) {
                // Remove empty/null categories - must have at least id and name
                return $cat && isset($cat['id']) && isset($cat['name']) && !empty($cat['name']);
            })->values();

            return $this->sendJsonResponse(true, 'Categories fetched successfully', [
                'flat' => $flatCategories->toArray(),
                'hierarchical' => $hierarchical->toArray()
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Category API index error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            // Fallback to simple list if hierarchical fails - only required fields
            try {
                $categories = Category::select('id', 'parent_id', 'name', 'slug', 'icon', 'description', 'is_featured', 'sort_order')
                    ->withCount('products')
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get();
                
                $flatCategories = $categories->map(function ($category) {
                    // Only return required fields, filter out null/empty values
                    $result = [];
                    if ($category->id) $result['id'] = $category->id;
                    if ($category->name) $result['name'] = $category->name;
                    if ($category->slug) $result['slug'] = $category->slug;
                    if ($category->icon) $result['icon'] = $category->icon;
                    if ($category->description) $result['description'] = $category->description;
                    if ($category->is_featured !== null) $result['is_featured'] = (bool)$category->is_featured;
                    $result['products_count'] = $category->products_count ?? 0;
                    return $result;
                })->filter(function($cat) {
                    // Remove empty/null categories - must have at least id and name
                    return $cat && isset($cat['id']) && isset($cat['name']) && !empty($cat['name']);
                })->values();
                
                return $this->sendJsonResponse(true, 'Categories fetched successfully', [
                    'flat' => $flatCategories->toArray(),
                    'hierarchical' => []
                ], 200);
            } catch (\Exception $e2) {
                \Log::error('Category API fallback error: ' . $e2->getMessage());
                return $this->sendJsonResponse(false, 'Failed to fetch categories', [
                    'flat' => [],
                    'hierarchical' => []
                ], 500);
            }
        }
    }

    private function buildCategoryTree($category, $allCategories, $depth = 0)
    {
        // Prevent infinite recursion (max depth of 10 levels)
        if ($depth > 10) {
            \Log::warning('Category tree depth exceeded limit for category: ' . $category->id);
            return [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'icon' => $category->icon,
                'description' => $category->description,
                'is_featured' => $category->is_featured,
                'products_count' => $category->products_count ?? 0,
                'children' => []
            ];
        }
        
        $children = $allCategories->where('parent_id', $category->id)
            ->map(function ($child) use ($allCategories, $depth) {
                return $this->buildCategoryTree($child, $allCategories, $depth + 1);
            })
            ->filter(function($child) {
                // Remove empty/null children
                return $child && isset($child['id']) && isset($child['name']);
            })
            ->values();
        
        // Return only required fields (no uuid, parent_id, timestamps, etc.)
        // Only include fields that have values
        $result = [];
        if ($category->id) $result['id'] = $category->id;
        if ($category->name) $result['name'] = $category->name;
        if ($category->slug) $result['slug'] = $category->slug;
        if ($category->icon) $result['icon'] = $category->icon;
        if ($category->description) $result['description'] = $category->description;
        if ($category->is_featured !== null) $result['is_featured'] = (bool)$category->is_featured;
        $result['products_count'] = $category->products_count ?? 0;
        
        // Only add children array if there are children and filter out empty ones
        if ($children->isNotEmpty()) {
            $result['children'] = $children->filter(function($child) {
                return $child && isset($child['id']) && isset($child['name']) && !empty($child['name']);
            })->values()->toArray();
        }
        
        return $result;
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:categories,id',
        ]);

        $category = Category::with('products')->findOrFail($request->id);

        return $this->sendJsonResponse(true, 'Category fetched successfully', $category, 200);
    }

    /**
     * Get categories for home page - only required fields
     * Returns minimal data: id, name, slug, icon, description, is_featured, sort_order, products_count
     * Only returns main categories (parent_id = null)
     */
    public function home(Request $request)
    {
        try {
            $categories = Category::select('id', 'parent_id', 'name', 'slug', 'icon', 'description', 'is_featured', 'sort_order')
                ->withCount('products')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->whereNull('parent_id')
                ->get();

            // Return only required fields, filter out null/empty values
            $filteredCategories = $categories->map(function ($category) {
                $result = [];
                if ($category->id) $result['id'] = $category->id;
                if ($category->name) $result['name'] = $category->name;
                if ($category->slug) $result['slug'] = $category->slug;
                if ($category->icon) $result['icon'] = $category->icon;
                if ($category->description) $result['description'] = $category->description;
                if ($category->is_featured !== null) $result['is_featured'] = (bool)$category->is_featured;
                $result['products_count'] = $category->products_count ?? 0;
                return $result;
            })->filter(function($cat) {
                // Remove empty/null categories - must have at least id and name
                return $cat && isset($cat['id']) && isset($cat['name']) && !empty($cat['name']);
            })->values();

            return $this->sendJsonResponse(true, 'Home categories fetched successfully', $filteredCategories->toArray(), 200);
        } catch (\Exception $e) {
            \Log::error('Home categories API error: ' . $e->getMessage());
            return $this->sendJsonResponse(false, 'Failed to fetch home categories', [], 500);
        }
    }
}

