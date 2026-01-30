<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class CategoryApiController extends Controller
{
    public function index()
    {
        try {
            // Check if parent_id column exists
            if (!Schema::hasColumn('categories', 'parent_id')) {
                // Fallback: return categories without hierarchical structure
                $categories = Category::withCount('products')
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get();
                
                return $this->sendJsonResponse(true, 'Categories fetched successfully', [
                    'flat' => $categories->toArray(),
                    'hierarchical' => []
                ], 200);
            }
            
            // Get all categories with their relationships
            $categories = Category::with(['parent', 'children'])
                ->withCount('products')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get();

            // Organize into hierarchical structure
            $hierarchical = $categories->whereNull('parent_id')->map(function ($category) use ($categories) {
                return $this->buildCategoryTree($category, $categories);
            })->values();

            return $this->sendJsonResponse(true, 'Categories fetched successfully', [
                'flat' => $categories->toArray(),
                'hierarchical' => $hierarchical->toArray()
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Category API index error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            // Fallback to simple list if hierarchical fails
            try {
                $categories = Category::withCount('products')
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get();
                return $this->sendJsonResponse(true, 'Categories fetched successfully', [
                    'flat' => $categories->toArray(),
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
            $category->children = collect([]);
            return $category;
        }
        
        $category->children = $allCategories->where('parent_id', $category->id)->map(function ($child) use ($allCategories, $depth) {
            return $this->buildCategoryTree($child, $allCategories, $depth + 1);
        })->values();
        
        return $category;
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:categories,id',
        ]);

        $category = Category::with('products')->findOrFail($request->id);

        return $this->sendJsonResponse(true, 'Category fetched successfully', $category, 200);
    }
}

