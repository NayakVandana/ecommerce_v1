<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class AdminProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('category');

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $products = $query->paginate(15);

        return $this->sendJsonResponse(true, 'Products fetched successfully', $products, 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'category_id' => 'required|exists:categories,id',
            'stock' => 'required|integer|min:0',
            'status' => 'required|in:active,inactive',
            'image' => 'nullable|string',
        ]);

        $product = Product::create($request->all());

        return $this->sendJsonResponse(true, 'Product created successfully', $product, 201);
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:products,id',
        ]);

        $product = Product::with('category')->findOrFail($request->id);

        return $this->sendJsonResponse(true, 'Product fetched successfully', $product, 200);
    }

    public function update(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:products,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'price' => 'sometimes|numeric|min:0',
            'category_id' => 'sometimes|exists:categories,id',
            'stock' => 'sometimes|integer|min:0',
            'status' => 'sometimes|in:active,inactive',
            'image' => 'nullable|string',
        ]);

        $product = Product::findOrFail($request->id);
        $product->update($request->except('id'));

        return $this->sendJsonResponse(true, 'Product updated successfully', $product->fresh(), 200);
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:products,id',
        ]);

        $product = Product::findOrFail($request->id);
        $product->delete();

        return $this->sendJsonResponse(true, 'Product deleted successfully', [], 200);
    }

    public function toggleStatus(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:products,id',
        ]);

        $product = Product::findOrFail($request->id);
        $product->status = $product->status === 'active' ? 'inactive' : 'active';
        $product->save();

        return $this->sendJsonResponse(true, 'Product status updated successfully', $product, 200);
    }
}

