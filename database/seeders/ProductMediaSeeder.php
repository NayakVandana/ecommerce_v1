<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class ProductMediaSeeder extends Seeder
{
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
        $products = Product::all();

        foreach ($products as $index => $product) {
            // Create 2-4 media items per product (mix of images and videos)
            $mediaCount = rand(2, 4);
            
            // Get base image index for this product
            $baseImageIndex = ($index * 3) % count($this->imageUrls);
            $baseVideoIndex = ($index * 2) % count($this->videoUrls);
            
            // Determine if this product should have a video (30% chance)
            $hasVideo = rand(1, 100) <= 30;
            $videoIndex = $hasVideo ? rand(0, $mediaCount - 1) : -1;
            
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
        }
    }
}

