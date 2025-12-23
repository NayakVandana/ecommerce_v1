<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class AdminProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['categoryRelation', 'media']);

        if ($request->has('search')) {
            $query->where('product_name', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        if ($request->has('is_approve')) {
            $query->where('is_approve', $request->is_approve);
        }

        $products = $query->orderBy('created_at', 'desc')->paginate(15);

        return $this->sendJsonResponse(true, 'Products fetched successfully', $products, 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'category' => 'required|exists:categories,id',
            'total_quantity' => 'required|integer|min:0',
            'is_approve' => 'sometimes|integer|in:0,1',
        ]);

        $product = Product::create($request->all());

        return $this->sendJsonResponse(true, 'Product created successfully', $product, 201);
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:products,id',
        ]);

        $product = Product::with(['categoryRelation', 'media', 'variations'])->findOrFail($request->id);

        return $this->sendJsonResponse(true, 'Product fetched successfully', $product, 200);
    }

    public function update(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:products,id',
            'product_name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'price' => 'sometimes|numeric|min:0',
            'category' => 'sometimes|exists:categories,id',
            'total_quantity' => 'sometimes|integer|min:0',
            'is_approve' => 'sometimes|integer|in:0,1',
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
        $product->is_approve = $product->is_approve === 1 ? 0 : 1;
        $product->save();

        return $this->sendJsonResponse(true, 'Product status updated successfully', $product, 200);
    }
}

