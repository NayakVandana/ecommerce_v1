<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductMedia;
use App\Models\ProductVariation;
use App\Models\Fabric;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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
            'discount_percent' => 'sometimes|numeric|min:0|max:100',
            'category' => 'required|exists:categories,id',
            'subcategory_1' => 'sometimes|nullable|exists:categories,id',
            'subcategory_2' => 'sometimes|nullable|exists:categories,id',
            'subcategory_3' => 'sometimes|nullable|exists:categories,id',
            'subcategory_4' => 'sometimes|nullable|exists:categories,id',
            'subcategory_5' => 'sometimes|nullable|exists:categories,id',
            'subcategory_6' => 'sometimes|nullable|exists:categories,id',
            'total_quantity' => 'required|integer|min:0',
            'is_approve' => 'sometimes|integer|in:0,1',
            'is_returnable' => 'sometimes|boolean',
            'is_replaceable' => 'sometimes|boolean',
            'return_policy_note' => 'nullable|string|max:500',
        ]);

        $productData = $request->all();
        $productData['uuid'] = Str::uuid()->toString();
        $productData['user_id'] = auth()->id();
        
        // Calculate pricing fields according to ProductSeeder logic
        $price = floatval($productData['price'] ?? 0);
        $discountPercent = floatval($productData['discount_percent'] ?? 0);
        // $gst = intval($productData['gst'] ?? 18); // Default 18% GST like seeder
        $gst = intval($productData['gst'] ?? 0); // Default 18% GST like seeder
        
        // Calculate MRP: If discount_percent is provided, calculate MRP from price
        // MRP = price / (1 - discount_percent/100)
        if ($discountPercent > 0 && $discountPercent < 100) {
            $productData['mrp'] = round($price / (1 - ($discountPercent / 100)), 2);
        } else {
            // If no discount, MRP = price (or use provided MRP)
            $productData['mrp'] = floatval($productData['mrp'] ?? $price);
        }
        
        // Calculate GST amount and total with GST
        $gstAmount = ($price * $gst) / 100;
        $productData['total_with_gst'] = round($price + $gstAmount, 2);
        
        // Calculate commission (5% of price like seeder)
        $commission = ($price * 5) / 100;
        $productData['commission'] = round($commission, 2);
        
        // Calculate commission GST
        $commissionGst = ($commission * $gst) / 100;
        $productData['commission_gst_amount'] = round($commissionGst, 2);
        
        // Calculate total
        $productData['total'] = round($productData['total_with_gst'] + $commission + $commissionGst, 2);
        
        // Final price is the selling price (after discount if any)
        $productData['final_price'] = $price;
        
        // Ensure discount_percent is set
        if (!isset($productData['discount_percent']) || $productData['discount_percent'] == 0) {
            // Calculate discount_percent from MRP and price if MRP > price
            if ($productData['mrp'] > $price) {
                $productData['discount_percent'] = round((($productData['mrp'] - $price) / $productData['mrp']) * 100, 2);
            } else {
                $productData['discount_percent'] = 0;
            }
        }
        
        // Set GST
        $productData['gst'] = $gst;
        
        $product = Product::create($productData);

        // Handle variations if provided
        if ($request->has('variations') && is_array($request->variations)) {
            foreach ($request->variations as $variation) {
                ProductVariation::create([
                    'product_id' => $product->id,
                    'size' => $variation['size'] ?? null,
                    'color' => $variation['color'] ?? null,
                    'gender' => $variation['gender'] ?? null,
                    'stock_quantity' => $variation['stock_quantity'] ?? 0,
                    'in_stock' => $variation['in_stock'] ?? true,
                ]);
            }
        }

        // Handle fabrics if provided (array of fabric IDs)
        if ($request->has('fabric_ids') && is_array($request->fabric_ids)) {
            $fabricIds = array_filter($request->fabric_ids); // Remove empty values
            if (!empty($fabricIds)) {
                // Attach fabrics with sort order
                $syncData = [];
                foreach ($fabricIds as $index => $fabricId) {
                    $syncData[$fabricId] = ['sort_order' => $index];
                }
                $product->fabrics()->sync($syncData);
            }
        }

        return $this->sendJsonResponse(true, 'Product created successfully', $product->load(['media', 'variations', 'fabrics']), 201);
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:products,id',
        ]);

        $product = Product::with(['categoryRelation', 'media', 'variations', 'fabrics'])->findOrFail($request->id);

        return $this->sendJsonResponse(true, 'Product fetched successfully', $product, 200);
    }

    public function update(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:products,id',
            'product_name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'price' => 'sometimes|numeric|min:0',
            'discount_percent' => 'sometimes|numeric|min:0|max:100',
            'category' => 'sometimes|exists:categories,id',
            'subcategory_1' => 'sometimes|nullable|exists:categories,id',
            'subcategory_2' => 'sometimes|nullable|exists:categories,id',
            'subcategory_3' => 'sometimes|nullable|exists:categories,id',
            'subcategory_4' => 'sometimes|nullable|exists:categories,id',
            'subcategory_5' => 'sometimes|nullable|exists:categories,id',
            'subcategory_6' => 'sometimes|nullable|exists:categories,id',
            'total_quantity' => 'sometimes|integer|min:0',
            'is_approve' => 'sometimes|integer|in:0,1',
            'is_returnable' => 'sometimes|boolean',
            'is_replaceable' => 'sometimes|boolean',
            'return_policy_note' => 'nullable|string|max:500',
        ]);

        try {
            $product = Product::findOrFail($request->id);
            
            // IMPORTANT: Media is managed separately and should NEVER be deleted during product update
            // Only update product fields, exclude media, variations, and fabrics from update
            $updateData = $request->except(['id', 'variations', 'media', 'fabrics']);
            
            // Recalculate pricing fields if price or discount_percent changed (like ProductSeeder)
            if (isset($updateData['price']) || isset($updateData['discount_percent'])) {
                $price = floatval($updateData['price'] ?? $product->price);
                $discountPercent = floatval($updateData['discount_percent'] ?? $product->discount_percent ?? 0);
                $gst = intval($updateData['gst'] ?? $product->gst ?? 18);
                
                // Calculate MRP: If discount_percent is provided, calculate MRP from price
                if ($discountPercent > 0 && $discountPercent < 100) {
                    $updateData['mrp'] = round($price / (1 - ($discountPercent / 100)), 2);
                } else {
                    $updateData['mrp'] = floatval($updateData['mrp'] ?? $product->mrp ?? $price);
                }
                
                // Calculate GST amount and total with GST
                $gstAmount = ($price * $gst) / 100;
                $updateData['total_with_gst'] = round($price + $gstAmount, 2);
                
                // Calculate commission (5% of price like seeder)
                $commission = ($price * 5) / 100;
                $updateData['commission'] = round($commission, 2);
                
                // Calculate commission GST
                $commissionGst = ($commission * $gst) / 100;
                $updateData['commission_gst_amount'] = round($commissionGst, 2);
                
                // Calculate total
                $updateData['total'] = round($updateData['total_with_gst'] + $commission + $commissionGst, 2);
                
                // Final price is the selling price
                $updateData['final_price'] = $price;
                
                // Ensure discount_percent is set
                if (!isset($updateData['discount_percent']) || $updateData['discount_percent'] == 0) {
                    if ($updateData['mrp'] > $price) {
                        $updateData['discount_percent'] = round((($updateData['mrp'] - $price) / $updateData['mrp']) * 100, 2);
                    } else {
                        $updateData['discount_percent'] = 0;
                    }
                }
                
                // Set GST
                $updateData['gst'] = $gst;
            }
            
            $product->update($updateData);

            // Handle variations if provided
            if ($request->has('variations') && is_array($request->variations)) {
                // Get existing variations before deletion
                $existingVariations = ProductVariation::where('product_id', $product->id)->get();
                
                // Create a map of existing variation media by size, color, gender
                // This allows us to preserve media when variations are recreated
                $variationMediaMap = [];
                foreach ($existingVariations as $existingVariation) {
                    $key = $this->getVariationKey(
                        $existingVariation->size,
                        $existingVariation->color,
                        $existingVariation->gender
                    );
                    
                    // Get media linked to this variation
                    $variationMedia = ProductMedia::where('product_id', $product->id)
                        ->where('variation_id', $existingVariation->id)
                        ->get();
                    
                    if ($variationMedia->count() > 0) {
                        $variationMediaMap[$key] = $variationMedia->pluck('id')->toArray();
                    }
                }
                
                // IMPORTANT: Unlink media from variations BEFORE deleting variations
                // This prevents cascade delete from removing the media files
                ProductMedia::where('product_id', $product->id)
                    ->whereNotNull('variation_id')
                    ->update(['variation_id' => null]);
                
                // Now delete variations (media is already unlinked, so it won't be deleted)
                ProductVariation::where('product_id', $product->id)->delete();
                
                // Create new variations and re-link media
                foreach ($request->variations as $variation) {
                    // Handle in_stock - convert 1/0 to boolean if needed
                    $inStock = $variation['in_stock'] ?? true;
                    if (is_numeric($inStock)) {
                        $inStock = (bool) $inStock;
                    } elseif (is_string($inStock)) {
                        $inStock = filter_var($inStock, FILTER_VALIDATE_BOOLEAN);
                    } elseif ($inStock === null) {
                        $inStock = true; // Default to true if null
                    }
                    
                    // Normalize empty strings to null
                    $size = isset($variation['size']) && trim($variation['size']) !== '' ? trim($variation['size']) : null;
                    $color = isset($variation['color']) && trim($variation['color']) !== '' ? trim($variation['color']) : null;
                    $gender = isset($variation['gender']) && trim($variation['gender']) !== '' ? trim($variation['gender']) : null;
                    
                    $newVariation = ProductVariation::create([
                        'product_id' => $product->id,
                        'size' => $size,
                        'color' => $color,
                        'gender' => $gender,
                        'stock_quantity' => isset($variation['stock_quantity']) ? (int) $variation['stock_quantity'] : 0,
                        'in_stock' => $inStock,
                    ]);
                    
                    // Re-link media to new variation if it matches by size, color, gender
                    $key = $this->getVariationKey(
                        $newVariation->size,
                        $newVariation->color,
                        $newVariation->gender
                    );
                    
                    if (isset($variationMediaMap[$key]) && !empty($variationMediaMap[$key])) {
                        // Re-link media to the new variation
                        ProductMedia::whereIn('id', $variationMediaMap[$key])
                            ->where('product_id', $product->id)
                            ->whereNull('variation_id') // Only link media that was unlinked
                            ->update(['variation_id' => $newVariation->id]);
                    }
                }
            } elseif ($request->has('variations') && empty($request->variations)) {
                // If variations array is explicitly empty, delete all variations but preserve media
                ProductMedia::where('product_id', $product->id)
                    ->whereNotNull('variation_id')
                    ->update(['variation_id' => null]);
                ProductVariation::where('product_id', $product->id)->delete();
            }
            // If variations key is not present, don't touch existing variations

            // Handle fabrics if provided (array of fabric IDs)
            if ($request->has('fabric_ids')) {
                if (is_array($request->fabric_ids) && !empty($request->fabric_ids)) {
                    $fabricIds = array_filter($request->fabric_ids); // Remove empty values
                    // Attach fabrics with sort order
                    $syncData = [];
                    foreach ($fabricIds as $index => $fabricId) {
                        $syncData[$fabricId] = ['sort_order' => $index];
                    }
                    $product->fabrics()->sync($syncData);
                } else {
                    // If fabric_ids is empty array, detach all fabrics
                    $product->fabrics()->detach();
                }
            }
            // If fabric_ids key is not present, don't touch existing fabrics

            // Always return fresh product with all media, variations, and fabrics
            $product = $product->fresh(['media', 'variations', 'fabrics', 'categoryRelation']);
            return $this->sendJsonResponse(true, 'Product updated successfully', $product, 200);
            
        } catch (\Exception $e) {
            \Log::error('Product update error: ' . $e->getMessage(), [
                'product_id' => $request->id,
                'error' => $e->getTraceAsString()
            ]);
            return $this->sendJsonResponse(false, 'Failed to update product: ' . $e->getMessage(), null, 500);
        }
    }
    
    /**
     * Generate a unique key for variation matching (size, color, gender)
     * Used to preserve media when variations are updated
     */
    private function getVariationKey($size, $color, $gender)
    {
        $size = $size ? trim(strtolower($size)) : '';
        $color = $color ? trim(strtolower($color)) : '';
        $gender = $gender ? trim(strtolower($gender)) : '';
        return md5("{$size}|{$color}|{$gender}");
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
            'variation_id' => 'sometimes|nullable|string', // Allow string for temp IDs or numeric strings
        ]);

        $product = Product::findOrFail($request->product_id);
        $uploadedMedia = [];
        $color = $request->input('color');
        $variationIdInput = $request->input('variation_id');
        
        // Handle variation_id - can be null, empty string, numeric string, or number
        $variationId = null;
        if (!empty($variationIdInput) && $variationIdInput !== 'null' && $variationIdInput !== '') {
            // Convert to integer if it's numeric
            if (is_numeric($variationIdInput)) {
                $variationId = (int) $variationIdInput;
                
                // Verify that the variation exists and belongs to this product
                $variation = ProductVariation::where('id', $variationId)
                    ->where('product_id', $product->id)
                    ->first();
                
                if (!$variation) {
                    // Variation doesn't exist or doesn't belong to this product
                    // This can happen after product update when variations are recreated
                    // In this case, set variation_id to null and upload as general media
                    $variationId = null;
                    \Log::warning("Variation ID {$variationIdInput} not found for product {$product->id}, uploading as general media");
                } else {
                    // Variation exists - use it and get color if not provided
                    if (!$color && $variation->color) {
                        $color = $variation->color;
                    }
                }
            } else {
                // Non-numeric variation_id (like temp-* from frontend) - treat as null
                $variationId = null;
            }
        }

        // If variation_id is still valid, get color from variation if not explicitly provided
        if ($variationId && !$color) {
            $variation = ProductVariation::find($variationId);
            if ($variation && $variation->color) {
                $color = $variation->color;
            }
        }

        // For general media (no variation_id), don't set color
        // Only set color for variation-specific media
        $finalColor = ($variationId && $color) ? $color : null;

        try {
            foreach ($request->file('files') as $index => $file) {
                $path = $file->store("products/{$product->id}", 'public');
                // Generate URL using asset helper for better compatibility
                $url = asset('storage/' . $path);

                $media = ProductMedia::create([
                    'product_id' => $product->id,
                    'variation_id' => $variationId, // Can be null for general media
                    'type' => strpos($file->getMimeType(), 'image/') === 0 ? 'image' : 'video',
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                    'disk' => 'public',
                    'url' => $url,
                    'sort_order' => $index,
                    'is_primary' => $index === 0 && !$variationId, // Only set primary if not variation-specific
                    'color' => $finalColor, // null for general media, color value for variation media
                ]);

                $uploadedMedia[] = $media;
            }

            return $this->sendJsonResponse(true, 'Media uploaded successfully', $uploadedMedia, 201);
        } catch (\Exception $e) {
            \Log::error('Media upload error: ' . $e->getMessage(), [
                'product_id' => $product->id,
                'variation_id' => $variationId,
                'error' => $e->getTraceAsString()
            ]);
            return $this->sendJsonResponse(false, 'Failed to upload media: ' . $e->getMessage(), null, 500);
        }
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

