<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class ProductVariationSeeder extends Seeder
{
    /**
     * Seed product variations.
     * 
     * Flow for Fashion Products:
     * - Creates all size variants (XS, S, M, L, XL, XXL, XXXL) 
     * - For each gender (male, female)
     * - For each selected color (3-6 colors per product)
     * - Result: 7 sizes × 2 genders × 3-6 colors = 42-84 variations per fashion product
     * 
     * Flow for Non-Fashion Products:
     * - Creates 3-6 color-based variations without size/gender
     * - Only color variations (no size/gender)
     * 
     * Stock Management:
     * - Fashion: 70% chance of being in stock
     * - Non-fashion: 80% chance of being in stock
     * 
     * MUST run before ProductMediaSeeder as media can be linked to variations.
     */
    public function run(): void
    {
        $products = Product::with('categoryRelation')->get();
        $fashionSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
        $colors = ['#D0021B', '#0000ff', '#00ff00', '#000000', '#ffffff', '#808080', '#ffff00', '#ff1493', '#800080', '#ff9900', '#8b4513', '#87CEEB'];

        foreach ($products as $product) {
            // Get category name to check if it's Fashion
            $category = $product->categoryRelation;
            $isFashion = $category && strtolower($category->name) === 'fashion';
            
            if ($isFashion) {
                // For fashion products, create all size variants for each gender and color combination
                // This creates: genders × sizes × colors = 2 × 7 × 12 = 168 variations per product
                // But we'll limit to a reasonable subset for seeding
                $genders = ['male', 'female'];
                $selectedColors = array_slice($colors, 0, rand(3, 6)); // Select 3-6 colors per product
                
                foreach ($genders as $gender) {
                    foreach ($fashionSizes as $size) {
                        foreach ($selectedColors as $color) {
                            // Only create if in stock (70% chance)
                            $inStock = rand(1, 100) <= 70;
                            
                            DB::table('product_variations')->updateOrInsert(
                                [
                                    'product_id' => $product->id,
                                    'size' => $size,
                                    'color' => $color,
                                    'gender' => $gender,
                                ],
                                [
                                    'stock_quantity' => $inStock ? rand(5, 100) : 0,
                                    'in_stock' => $inStock,
                                    'updated_at' => now(),
                                    'created_at' => DB::raw('COALESCE(created_at, NOW())'),
                                ]
                            );
                        }
                    }
                }
            } else {
                // For non-fashion products, create 3-6 color-based variations without size/gender
                $variationCount = rand(3, 6);
                $usedCombinations = [];
                $selectedColors = array_slice($colors, 0, $variationCount);

                foreach ($selectedColors as $color) {
                    // Create unique combination key
                    $combination = "null-{$color}";

                    // Avoid duplicate combinations
                    if (in_array($combination, $usedCombinations)) {
                        continue;
                    }
                    $usedCombinations[] = $combination;
                    
                    // Only create if in stock (80% chance for non-fashion)
                    $inStock = rand(1, 100) <= 80;

                    DB::table('product_variations')->updateOrInsert(
                        [
                            'product_id' => $product->id,
                            'size' => null,
                            'color' => $color,
                            'gender' => null,
                        ],
                        [
                            'stock_quantity' => $inStock ? rand(10, 100) : 0,
                            'in_stock' => $inStock,
                            'updated_at' => now(),
                            'created_at' => DB::raw('COALESCE(created_at, NOW())'),
                        ]
                    );
                }
            }
        }
    }
}

