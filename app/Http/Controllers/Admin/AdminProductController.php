<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductMedia;
use App\Models\ProductVariation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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

        // Date range filter
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [
                \Carbon\Carbon::parse($request->start_date)->startOfDay(),
                \Carbon\Carbon::parse($request->end_date)->endOfDay()
            ]);
        }

        $perPage = $request->input('per_page', 15);
        $page = $request->input('page', $request->query('page', 1));
        
        // Set page in query string for paginate() to work correctly
        $request->query->set('page', $page);
        
        $products = $query->orderBy('created_at', 'desc')->paginate($perPage);

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

        $productData = $request->all();
        $productData['uuid'] = Str::uuid()->toString();
        $productData['user_id'] = auth()->id();
        
        // Set default values for required fields that don't have defaults
        $productData['gst'] = $productData['gst'] ?? 0;
        $productData['total_with_gst'] = $productData['total_with_gst'] ?? $productData['price'];
        $productData['commission'] = $productData['commission'] ?? 0;
        $productData['commission_gst_amount'] = $productData['commission_gst_amount'] ?? 0;
        $productData['total'] = $productData['total'] ?? $productData['price'];
        $productData['final_price'] = $productData['final_price'] ?? $productData['price'];
        $productData['mrp'] = $productData['mrp'] ?? $productData['price'];
        $productData['discount_percent'] = $productData['discount_percent'] ?? 0;
        
        $product = Product::create($productData);

        // Handle variations if provided
        if ($request->has('variations') && is_array($request->variations)) {
            foreach ($request->variations as $variation) {
                ProductVariation::create([
                    'product_id' => $product->id,
                    'size' => $variation['size'] ?? null,
                    'color' => $variation['color'] ?? null,
                    'stock_quantity' => $variation['stock_quantity'] ?? 0,
                    'in_stock' => $variation['in_stock'] ?? true,
                ]);
            }
        }

        return $this->sendJsonResponse(true, 'Product created successfully', $product->load(['media', 'variations']), 201);
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
        $product->update($request->except(['id', 'variations']));

        // Handle variations if provided
        if ($request->has('variations') && is_array($request->variations)) {
            // Delete existing variations
            ProductVariation::where('product_id', $product->id)->delete();
            
            // Create new variations
            foreach ($request->variations as $variation) {
                ProductVariation::create([
                    'product_id' => $product->id,
                    'size' => $variation['size'] ?? null,
                    'color' => $variation['color'] ?? null,
                    'stock_quantity' => $variation['stock_quantity'] ?? 0,
                    'in_stock' => $variation['in_stock'] ?? true,
                ]);
            }
        }

        return $this->sendJsonResponse(true, 'Product updated successfully', $product->fresh(['media', 'variations']), 200);
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

    public function uploadMedia(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'files' => 'required|array',
            'files.*' => 'required|file|mimes:jpeg,jpg,png,gif,webp,mp4,mov,avi|max:10240', // 10MB max
            'color' => 'sometimes|string|max:50',
        ]);

        $product = Product::findOrFail($request->product_id);
        $uploadedMedia = [];
        $color = $request->input('color');

        foreach ($request->file('files') as $index => $file) {
            $path = $file->store("products/{$product->id}", 'public');
            // Generate URL using asset helper for better compatibility
            $url = asset('storage/' . $path);

            $media = ProductMedia::create([
                'product_id' => $product->id,
                'type' => strpos($file->getMimeType(), 'image/') === 0 ? 'image' : 'video',
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'disk' => 'public',
                'url' => $url,
                'sort_order' => $index,
                'is_primary' => $index === 0,
                'color' => $color,
            ]);

            $uploadedMedia[] = $media;
        }

        return $this->sendJsonResponse(true, 'Media uploaded successfully', $uploadedMedia, 201);
    }

    public function updateMedia(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:product_media,id',
            'color' => 'sometimes|string|max:50|nullable',
            'is_primary' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer',
        ]);

        $media = ProductMedia::findOrFail($request->id);
        
        // If setting as primary, unset other primary media for this product
        if ($request->has('is_primary') && $request->is_primary) {
            ProductMedia::where('product_id', $media->product_id)
                ->where('id', '!=', $media->id)
                ->update(['is_primary' => false]);
        }

        $media->update($request->only(['color', 'is_primary', 'sort_order']));

        return $this->sendJsonResponse(true, 'Media updated successfully', $media->fresh(), 200);
    }

    public function deleteMedia(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:product_media,id',
        ]);

        $media = ProductMedia::findOrFail($request->id);
        
        // Delete file from storage
        if ($media->file_path && Storage::disk($media->disk)->exists($media->file_path)) {
            Storage::disk($media->disk)->delete($media->file_path);
        }

        $media->delete();

        return $this->sendJsonResponse(true, 'Media deleted successfully', [], 200);
    }

    public function updateMediaOrder(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'media' => 'required|array',
            'media.*.id' => 'required|exists:product_media,id',
            'media.*.sort_order' => 'required|integer',
            'media.*.is_primary' => 'sometimes|boolean',
        ]);

        foreach ($request->media as $mediaData) {
            ProductMedia::where('id', $mediaData['id'])
                ->where('product_id', $request->product_id)
                ->update([
                    'sort_order' => $mediaData['sort_order'],
                    'is_primary' => $mediaData['is_primary'] ?? false,
                ]);
        }

        return $this->sendJsonResponse(true, 'Media order updated successfully', [], 200);
    }
}

