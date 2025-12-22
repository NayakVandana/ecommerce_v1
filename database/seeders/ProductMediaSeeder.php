<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class ProductMediaSeeder extends Seeder
{
    public function run(): void
    {
        $products = Product::all();

        foreach ($products as $product) {
            // Create 2-4 media items per product
            $mediaCount = rand(2, 4);
            
            for ($i = 0; $i < $mediaCount; $i++) {
                $filePath = "products/{$product->id}/image-{$i}.jpg";
                DB::table('product_media')->updateOrInsert(
                    [
                        'product_id' => $product->id,
                        'file_path' => $filePath,
                    ],
                    [
                        'type' => $i === 0 ? 'image' : (rand(0, 1) ? 'image' : 'video'),
                        'file_name' => "product-{$product->id}-image-{$i}.jpg",
                        'mime_type' => 'image/jpeg',
                        'file_size' => rand(100000, 5000000), // 100KB to 5MB
                        'disk' => 'public',
                        'url' => "https://example.com/products/{$product->id}/image-{$i}.jpg",
                        'sort_order' => $i,
                        'is_primary' => $i === 0,
                        'color' => $i > 0 ? ['red', 'blue', 'green', 'black', 'white'][rand(0, 4)] : null,
                        'updated_at' => now(),
                        'created_at' => DB::raw('COALESCE(created_at, NOW())'),
                    ]
                );
            }
        }
    }
}

