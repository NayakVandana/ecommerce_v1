<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;

class AdminCategoryController extends Controller
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
                    'flat' => $categories,
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
            });

            return $this->sendJsonResponse(true, 'Categories fetched successfully', [
                'flat' => $categories,
                'hierarchical' => $hierarchical
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Category index error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return $this->sendJsonResponse(false, 'Failed to fetch categories: ' . $e->getMessage(), null, 500);
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

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:categories',
            'slug' => 'sometimes|string|max:255|unique:categories',
            'description' => 'nullable|string',
            'is_featured' => 'sometimes|boolean',
            'parent_id' => 'nullable|exists:categories,id',
            'icon' => 'nullable|string|max:255',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        $data = $request->all();
        $data['uuid'] = Str::uuid()->toString();
        
        // Auto-generate slug if not provided
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        
        $category = Category::create($data);

        return $this->sendJsonResponse(true, 'Category created successfully', $category->load('parent', 'children'), 201);
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:categories,id',
        ]);

        $category = Category::findOrFail($request->id);

        return $this->sendJsonResponse(true, 'Category fetched successfully', $category, 200);
    }

    public function update(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:categories,id',
            'name' => 'sometimes|string|max:255|unique:categories,name,' . $request->id,
            'slug' => 'sometimes|string|max:255|unique:categories,slug,' . $request->id,
            'description' => 'nullable|string',
            'is_featured' => 'sometimes|boolean',
            'parent_id' => 'nullable|exists:categories,id',
            'icon' => 'nullable|string|max:255',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        $category = Category::findOrFail($request->id);
        
        // Prevent setting parent_id to itself or its descendants
        if ($request->has('parent_id') && $request->parent_id) {
            if ($request->parent_id == $category->id) {
                return $this->sendJsonResponse(false, 'Category cannot be its own parent', null, 400);
            }
            
            // Check if parent_id is a descendant
            $descendants = $this->getDescendantIds($category);
            if (in_array($request->parent_id, $descendants)) {
                return $this->sendJsonResponse(false, 'Category cannot be a child of its own descendant', null, 400);
            }
        }
        
        $category->update($request->except('id'));

        return $this->sendJsonResponse(true, 'Category updated successfully', $category->fresh(['parent', 'children']), 200);
    }

    private function getDescendantIds($category)
    {
        $ids = [];
        foreach ($category->children as $child) {
            $ids[] = $child->id;
            $ids = array_merge($ids, $this->getDescendantIds($child));
        }
        return $ids;
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:categories,id',
        ]);

        $category = Category::findOrFail($request->id);
        
        // Check if category has products
        if ($category->products()->count() > 0) {
            return $this->sendJsonResponse(false, 'Cannot delete category with existing products', [], 400);
        }
        
        // Check if category has children
        if ($category->children()->count() > 0) {
            return $this->sendJsonResponse(false, 'Cannot delete category with subcategories. Please delete or move subcategories first.', [], 400);
        }

        $category->delete();

        return $this->sendJsonResponse(true, 'Category deleted successfully', [], 200);
    }
    
    public function getSubcategories(Request $request)
    {
        $request->validate([
            'parent_id' => 'required|exists:categories,id',
        ]);

        $subcategories = Category::where('parent_id', $request->parent_id)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return $this->sendJsonResponse(true, 'Subcategories fetched successfully', $subcategories, 200);
    }
}

