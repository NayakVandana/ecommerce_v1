<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class ProductVariationSeeder extends Seeder
{
    public function run(): void
    {
        $products = Product::with('categoryRelation')->get();
        $fashionSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
        $colors = ['Red', 'Blue', 'Green', 'Black', 'White', 'Gray', 'Yellow', 'Pink'];

        foreach ($products as $product) {
            // Get category name to check if it's Fashion
            $category = $product->categoryRelation;
            $isFashion = $category && strtolower($category->name) === 'fashion';
            
            // Create 3-6 variations per product
            $variationCount = rand(3, 6);
            $usedCombinations = [];

            for ($i = 0; $i < $variationCount; $i++) {
                // Only use sizes for Fashion category
                $size = $isFashion ? $fashionSizes[array_rand($fashionSizes)] : null;
                $color = $colors[array_rand($colors)];
                
                // Create unique combination key
                $combination = $isFashion ? "{$size}-{$color}" : "null-{$color}";

                // Avoid duplicate combinations
                if (in_array($combination, $usedCombinations)) {
                    continue;
                }
                $usedCombinations[] = $combination;

                DB::table('product_variations')->updateOrInsert(
                    [
                        'product_id' => $product->id,
                        'size' => $size,
                        'color' => $color,
                    ],
                    [
                        'stock_quantity' => rand(0, 100),
                        'in_stock' => rand(0, 1) === 1,
                        'updated_at' => now(),
                        'created_at' => DB::raw('COALESCE(created_at, NOW())'),
                    ]
                );
            }
        }
    }
}

