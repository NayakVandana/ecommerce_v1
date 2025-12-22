<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryApiController extends Controller
{
    public function index()
    {
        $categories = Category::withCount('products')->get();

        return $this->sendJsonResponse(true, 'Categories fetched successfully', $categories, 200);
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

