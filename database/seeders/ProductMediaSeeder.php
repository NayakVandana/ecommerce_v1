<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\ProductVariation;
use Illuminate\Support\Facades\DB;

class ProductMediaSeeder extends Seeder
{
    /**
     * Seed product media with variant-wise management.
     * 
     * Flow for Fashion Products:
     * 1. Creates 2-4 general product media items (variation_id = null)
     * 2. For each unique color in variations:
     *    - Finds a representative variation (prefers Medium size, in-stock)
     *    - Creates 1-2 images linked to that specific variation via variation_id
     *    - Media color automatically matches variation color
     *    - All colors get media coverage
     *    - Each media item is properly linked to its variation
     * 
     * Flow for Non-Fashion Products:
     * 1. Creates 2-4 general product media items (variation_id = null)
     * 2. If variations exist, links media to color variations (max 2 colors)
     *    - Links via variation_id to specific variation
     *    - Media color matches variation color
     * 
     * Key Points:
     * - variation_id properly links media to specific variations (enables variant-wise display)
     * - Media color is automatically set from variation color when linked
     * - General media (variation_id = null) serves as fallback
     * - Fashion products get comprehensive color-wise media coverage
     * - Each variation can have multiple media items
     * 
     * Database Structure:
     * - product_media.variation_id references product_variations.id (FK with cascade delete)
     * - When variation is deleted, its media is automatically deleted
     * - Media can exist without variation (general product media)
     * 
     * MUST run after ProductVariationSeeder as it requires variations to exist.
     */
    
    // Free image URLs from Unsplash (different categories)
    private $imageUrls = [
        // Electronics/Smartphones
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
        
        // Laptops
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop',
        
        // Headphones/Earbuds
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&h=800&fit=crop',
        
        // Shoes
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop',
        
        // Home & Kitchen
        'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=800&fit=crop',
        
        // Beauty/Skincare
        'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop',
        
        // Books
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&h=800&fit=crop',
        
        // Fashion/Clothing
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=800&h=800&fit=crop',
    ];

    // Free video URLs from various sources (different categories)
    private $videoUrls = [
        // Product showcase videos - Sample videos from common CDNs
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
    ];

    public function run(): void
    {
        $products = Product::with(['variations', 'categoryRelation'])->get();

        foreach ($products as $index => $product) {
            // Get variations for this product
            $variations = $product->variations;
            $hasVariations = $variations && $variations->count() > 0;
            
            // Create 2-4 general media items per product (mix of images and videos)
            $mediaCount = rand(2, 4);
            
            // Get base image index for this product
            $baseImageIndex = ($index * 3) % count($this->imageUrls);
            $baseVideoIndex = ($index * 2) % count($this->videoUrls);
            
            // Determine if this product should have a video (30% chance)
            $hasVideo = rand(1, 100) <= 30;
            $videoIndex = $hasVideo ? rand(0, $mediaCount - 1) : -1;
            
            // Create general product media (not linked to any variation)
            for ($i = 0; $i < $mediaCount; $i++) {
                $isVideo = $hasVideo && $i === $videoIndex;
                
                if ($isVideo) {
                    // Create video media
                    $videoIndex = ($baseVideoIndex + $i) % count($this->videoUrls);
                    $videoUrl = $this->videoUrls[$videoIndex];
                    
                    $filePath = "products/{$product->id}/video-{$i}.mp4";
                    DB::table('product_media')->updateOrInsert(
                        [
                            'product_id' => $product->id,
                            'file_path' => $filePath,
                        ],
                        [
                            'variation_id' => null, // General product media
                            'type' => 'video',
                            'file_name' => "product-{$product->id}-video-{$i}.mp4",
                            'mime_type' => 'video/mp4',
                            'file_size' => rand(5000000, 50000000), // 5MB to 50MB
                            'disk' => 'public',
                            'url' => $videoUrl,
                            'sort_order' => $i,
                            'is_primary' => false, // Videos are never primary
                            'color' => null,
                            'updated_at' => now(),
                            'created_at' => DB::raw('COALESCE(created_at, NOW())'),
                        ]
                    );
                } else {
                    // Create image media
                    $imageIndex = ($baseImageIndex + $i) % count($this->imageUrls);
                    $imageUrl = $this->imageUrls[$imageIndex];
                    
                    // Add random seed to get different images
                    $imageUrl .= '&sig=' . rand(1000, 9999);
                    
                    $filePath = "products/{$product->id}/image-{$i}.jpg";
                    DB::table('product_media')->updateOrInsert(
                        [
                            'product_id' => $product->id,
                            'file_path' => $filePath,
                        ],
                        [
                            'variation_id' => null, // General product media
                            'type' => 'image',
                            'file_name' => "product-{$product->id}-image-{$i}.jpg",
                            'mime_type' => 'image/jpeg',
                            'file_size' => rand(100000, 5000000), // 100KB to 5MB
                            'disk' => 'public',
                            'url' => $imageUrl,
                            'sort_order' => $i,
                            'is_primary' => $i === 0,
                            'color' => $i > 0 ? ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Pink', 'Gray'][rand(0, 7)] : null,
                            'updated_at' => now(),
                            'created_at' => DB::raw('COALESCE(created_at, NOW())'),
                        ]
                    );
                }
            }
            
            // If product has variations, create variation-specific media
            if ($hasVariations) {
                // Get category to check if it's fashion
                $category = $product->categoryRelation;
                $isFashion = $category && strtolower($category->name) === 'fashion';
                
                // For fashion products, create variation-wise media for all color combinations
                if ($isFashion && $variations->count() > 0) {
                    // Get unique colors from variations
                    $uniqueColors = $variations->pluck('color')->unique()->filter();
                    
                    // Create media for each unique color
                    // For each color, create media linked to one variation of that color
                    // This ensures all colors have associated media
                    $sortOrderOffset = $mediaCount;
                    
                    foreach ($uniqueColors as $colorIndex => $color) {
                        // Get variations with this color, prefer in-stock, then prefer medium size
                        $variationsForColor = $variations->where('color', $color);
                        
                        // Try to get a medium size variation first (most common)
                        $variationForColor = $variationsForColor->where('size', 'M')
                            ->where('in_stock', true)
                            ->first()
                            ?? $variationsForColor->where('size', 'M')->first()
                            ?? $variationsForColor->where('in_stock', true)->first()
                            ?? $variationsForColor->first();
                        
                        if ($variationForColor) {
                            // Create 1-2 images for this color variation
                            $imagesPerColor = rand(1, 2);
                            
                            for ($imgIndex = 0; $imgIndex < $imagesPerColor; $imgIndex++) {
                                $imageIndex = ($baseImageIndex + $colorIndex + $imgIndex) % count($this->imageUrls);
                                $imageUrl = $this->imageUrls[$imageIndex] . '&sig=' . rand(1000, 9999);
                                
                                $filePath = "products/{$product->id}/variation-{$variationForColor->id}-color-{$colorIndex}-img-{$imgIndex}.jpg";
                                DB::table('product_media')->updateOrInsert(
                                    [
                                        'product_id' => $product->id,
                                        'file_path' => $filePath,
                                    ],
                                    [
                                        'variation_id' => $variationForColor->id, // Link to specific variation
                                        'type' => 'image',
                                        'file_name' => "product-{$product->id}-variation-{$variationForColor->id}-color-{$colorIndex}-img-{$imgIndex}.jpg",
                                        'mime_type' => 'image/jpeg',
                                        'file_size' => rand(100000, 5000000),
                                        'disk' => 'public',
                                        'url' => $imageUrl,
                                        'sort_order' => $sortOrderOffset + ($colorIndex * 10) + $imgIndex,
                                        'is_primary' => false,
                                        'color' => $variationForColor->color, // Automatically set from variation color
                                        'updated_at' => now(),
                                        'created_at' => DB::raw('COALESCE(created_at, NOW())'),
                                    ]
                                );
                            }
                        }
                    }
                } else if ($hasVariations) {
                    // For non-fashion products with variations, link media to color variations
                    $uniqueColors = $variations->pluck('color')->unique()->filter()->take(2); // Max 2 colors
                    
                    foreach ($uniqueColors as $color) {
                        $variationForColor = $variations->where('color', $color)
                            ->where('in_stock', true)
                            ->first() 
                            ?? $variations->where('color', $color)->first();
                        
                        if ($variationForColor) {
                            // Create 1 image for this color variation
                            $imageIndex = ($baseImageIndex + rand(0, count($this->imageUrls) - 1)) % count($this->imageUrls);
                            $imageUrl = $this->imageUrls[$imageIndex] . '&sig=' . rand(1000, 9999);
                            
                            $filePath = "products/{$product->id}/variation-{$variationForColor->id}-image.jpg";
                            DB::table('product_media')->updateOrInsert(
                                [
                                    'product_id' => $product->id,
                                    'file_path' => $filePath,
                                ],
                                [
                                    'variation_id' => $variationForColor->id, // Link to specific variation
                                    'type' => 'image',
                                    'file_name' => "product-{$product->id}-variation-{$variationForColor->id}-image.jpg",
                                    'mime_type' => 'image/jpeg',
                                    'file_size' => rand(100000, 5000000),
                                    'disk' => 'public',
                                    'url' => $imageUrl,
                                    'sort_order' => $mediaCount + 1,
                                    'is_primary' => false,
                                    'color' => $variationForColor->color, // Automatically set from variation color
                                    'updated_at' => now(),
                                    'created_at' => DB::raw('COALESCE(created_at, NOW())'),
                                ]
                            );
                        }
                    }
                }
            }
        }
    }
}

