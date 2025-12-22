<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class AdminCategoryController extends Controller
{
    public function index()
    {
        $categories = Category::withCount('products')->get();

        return $this->sendJsonResponse(true, 'Categories fetched successfully', $categories, 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:categories',
            'slug' => 'required|string|max:255|unique:categories',
            'description' => 'nullable|string',
            'is_featured' => 'boolean',
        ]);

        $category = Category::create($request->all());

        return $this->sendJsonResponse(true, 'Category created successfully', $category, 201);
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:categories,id',
        ]);

        $category = Category::with('products')->findOrFail($request->id);

        return $this->sendJsonResponse(true, 'Category fetched successfully', $category, 200);
    }

    public function update(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:categories,id',
            'name' => 'sometimes|string|max:255|unique:categories,name,' . $request->id,
            'slug' => 'sometimes|string|max:255|unique:categories,slug,' . $request->id,
            'description' => 'nullable|string',
            'is_featured' => 'boolean',
        ]);

        $category = Category::findOrFail($request->id);
        $category->update($request->except('id'));

        return $this->sendJsonResponse(true, 'Category updated successfully', $category->fresh(), 200);
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

        $category->delete();

        return $this->sendJsonResponse(true, 'Category deleted successfully', [], 200);
    }
}

