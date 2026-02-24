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
     * Flow for Adult Fashion Products (Topwear):
     * - Creates all size variants (XS, S, M, L, XL, XXL, XXXL) 
     * - For each gender (male, female)
     * - For each selected color (3-6 colors per product)
     * - Result: 7 sizes × 2 genders × 3-6 colors = 42-84 variations per fashion product
     * 
     * Flow for Adult Bottomwear Products (Men):
     * - Creates all size variants (28, 30, 32, 34, 36, 38, 40, 42, 44)
     * - For each gender (male, female)
     * - For each selected color (3-6 colors per product)
     * - Result: 9 sizes × 2 genders × 3-6 colors = 54-108 variations per men's bottomwear product
     * 
     * Flow for Adult Bottomwear Products (Women):
     * - Creates all size variants (24, 26, 28, 30, 32, 34, 36, 38)
     * - For each gender (male, female)
     * - For each selected color (3-6 colors per product)
     * - Result: 8 sizes × 2 genders × 3-6 colors = 48-96 variations per women's bottomwear product
     * 
     * Flow for Kids Fashion Products (Boys/Girls):
     * - Creates all size variants (0M-3M, 3M-6M, 6M-9M, 9M-12M, 12M-18M, 18M-24M, Newborn, 2Y-4Y, 4Y-6Y, 6Y-8Y, 8Y-10Y, 10Y-12Y, 12Y-14Y, 14Y+)
     * - For each gender (male, female)
     * - For each selected color (3-6 colors per product)
     * - Result: 14 sizes × 2 genders × 3-6 colors = 84-168 variations per kids fashion product
     * 
     * Flow for Infant Fashion Products:
     * - Creates all size variants (0M-3M, 3M-6M, 6M-9M, 9M-12M, 12M-18M, 18M-24M, Newborn, 2T, 3T, 4T)
     * - For each gender (male, female)
     * - For each selected color (3-6 colors per product)
     * - Result: 10 sizes × 2 genders × 3-6 colors = 60-120 variations per infant fashion product
     * 
     * Flow for Adult Footwear Products:
     * - Creates all size variants (6, 7, 8, 9, 10, 11, 12)
     * - For each gender (male, female)
     * - For each selected color (3-6 colors per product)
     * - Result: 7 sizes × 2 genders × 3-6 colors = 42-84 variations per footwear product
     * 
     * Flow for Kids Footwear Products (Boys/Girls):
     * - Creates all size variants (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13)
     * - For each gender (male, female)
     * - For each selected color (3-6 colors per product)
     * - Result: 13 sizes × 2 genders × 3-6 colors = 78-156 variations per kids footwear product
     * 
     * Flow for Infant Footwear Products:
     * - Creates all size variants (1, 2, 3, 4, 5)
     * - For each gender (male, female)
     * - For each selected color (3-6 colors per product)
     * - Result: 5 sizes × 2 genders × 3-6 colors = 30-60 variations per infant footwear product
     * 
     * Flow for Bangle Products:
     * - Creates all size variants (2.0", 2.25", 2.5", 2.75", 3.0", 3.25", 3.5", 3.75", 4.0", 4.25", 4.5", 4.75", 5.0")
     * - For each selected color (3-6 colors per product)
     * - Result: 13 sizes × 3-6 colors = 39-78 variations per bangle product
     * 
     * Flow for Ring Products:
     * - Creates all size variants (4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14)
     * - For each selected color (3-6 colors per product)
     * - Result: 11 sizes × 3-6 colors = 33-66 variations per ring product
     * 
     * Flow for Non-Fashion Products:
     * - Creates 3-6 color-based variations without size/gender
     * - Only color variations (no size/gender)
     * 
     * Stock Management:
     * - Adult Fashion (Topwear): 70% chance of being in stock
     * - Adult Bottomwear (Men): 70% chance of being in stock
     * - Adult Bottomwear (Women): 70% chance of being in stock
     * - Kids Fashion: 70% chance of being in stock
     * - Infant Fashion: 70% chance of being in stock
     * - Adult Footwear: 70% chance of being in stock
     * - Kids Footwear: 70% chance of being in stock
     * - Infant Footwear: 70% chance of being in stock
     * - Bangle: 70% chance of being in stock
     * - Ring: 70% chance of being in stock
     * - Non-fashion: 80% chance of being in stock
     * 
     * MUST run before ProductMediaSeeder as media can be linked to variations.
     */
    public function run(): void
    {
        $products = Product::with('categoryRelation.parent')->get();
        $adultFashionSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
        $menBottomwearSizes = ['28', '30', '32', '34', '36', '38', '40', '42', '44'];
        $womenBottomwearSizes = ['24', '26', '28', '30', '32', '34', '36', '38'];
        $kidsFashionSizes = ['0M-3M', '3M-6M', '6M-9M', '9M-12M', '12M-18M', '18M-24M', 'Newborn', '2Y-4Y', '4Y-6Y', '6Y-8Y', '8Y-10Y', '10Y-12Y', '12Y-14Y', '14Y+'];
        $infantFashionSizes = ['0M-3M', '3M-6M', '6M-9M', '9M-12M', '12M-18M', '18M-24M', 'Newborn', '2T', '3T', '4T'];
        $adultFootwearSizes = ['6', '7', '8', '9', '10', '11', '12'];
        $kidsFootwearSizes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
        $infantFootwearSizes = ['1', '2', '3', '4', '5'];
        $bangleSizes = ['2.0', '2.25', '2.5', '2.75', '3.0', '3.25', '3.5', '3.75', '4.0', '4.25', '4.5', '4.75', '5.0'];
        $ringSizes = ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'];
        $colors = ['#D0021B', '#0000ff', '#00ff00', '#000000', '#ffffff', '#808080', '#ffff00', '#ff1493', '#800080', '#ff9900', '#8b4513', '#87CEEB'];

        foreach ($products as $product) {
            // Get category name to check if it's Fashion or Footwear
            $category = $product->categoryRelation;
            $isFashion = false;
            $isFootwear = false;
            $isBottomwear = false;
            $isMenBottomwear = false;
            $isBangle = false;
            $isRing = false;
            $isKidsFashion = false;
            $isInfantFashion = false;
            $isKidsFootwear = false;
            $isInfantFootwear = false;
            
            if ($category) {
                $categoryNameLower = strtolower($category->name);
                
                // Check if category name is Fashion (case-insensitive)
                $isFashion = $categoryNameLower === 'fashion';
                
                // Check if category name is Footwear (case-insensitive)
                $isFootwear = $categoryNameLower === 'footwear';
                
                // Check if category is Bottomwear (Jeans, Trousers, Shorts, Track Pants, Skirts)
                $bottomwearCategories = ['jeans', 'trousers', 'casual trousers', 'formal trousers', 'shorts', 'track pants', 'skirts'];
                foreach ($bottomwearCategories as $bwCat) {
                    if (strpos($categoryNameLower, $bwCat) !== false) {
                        $isBottomwear = true;
                        $isFashion = true; // Bottomwear is part of fashion
                        break;
                    }
                }
                
                // Check if category is Bangle
                if ($categoryNameLower === 'bangle') {
                    $isBangle = true;
                }
                
                // Check if category is Ring
                if ($categoryNameLower === 'ring' || strpos($categoryNameLower, 'ring') !== false) {
                    $isRing = true;
                }
                
                // Also check if parent category is Fashion or Footwear (for subcategories)
                if ((!$isFashion && !$isFootwear) && $category->parent_id) {
                    // Load parent if not already loaded
                    if (!$category->relationLoaded('parent')) {
                        $category->load('parent');
                    }
                    $parent = $category->parent;
                    if ($parent) {
                        $parentNameLower = strtolower($parent->name);
                        if ($parentNameLower === 'fashion') {
                            $isFashion = true;
                        } elseif ($parentNameLower === 'footwear') {
                            $isFootwear = true;
                        } elseif ($parentNameLower === 'men' || $parentNameLower === 'women') {
                            // Check if this is bottomwear under Men or Women
                            $bottomwearCategories = ['jeans', 'trousers', 'casual trousers', 'formal trousers', 'shorts', 'track pants', 'skirts'];
                            foreach ($bottomwearCategories as $bwCat) {
                                if (strpos($categoryNameLower, $bwCat) !== false) {
                                    $isBottomwear = true;
                                    $isMenBottomwear = ($parentNameLower === 'men');
                                    $isFashion = true;
                                    break;
                                }
                            }
                        } elseif ($parentNameLower === 'boys' || $parentNameLower === 'girls') {
                            // Check if this is fashion or footwear under Boys or Girls
                            // First check if grandparent is Fashion (for fashion items)
                            if ($parent->parent_id) {
                                if (!$parent->relationLoaded('parent')) {
                                    $parent->load('parent');
                                }
                                $grandParent = $parent->parent;
                                if ($grandParent && strtolower($grandParent->name) === 'fashion') {
                                    $isFashion = true;
                                    $isKidsFashion = true;
                                }
                            }
                            // Check if this is footwear under Boys or Girls
                            if ($categoryNameLower === 'footwear') {
                                $isFootwear = true;
                                $isKidsFootwear = true;
                            }
                        } elseif ($parentNameLower === 'infants') {
                            // Check if this is fashion or footwear under Infants
                            // First check if grandparent is Fashion (for fashion items)
                            if ($parent->parent_id) {
                                if (!$parent->relationLoaded('parent')) {
                                    $parent->load('parent');
                                }
                                $grandParent = $parent->parent;
                                if ($grandParent && strtolower($grandParent->name) === 'fashion') {
                                    $isFashion = true;
                                    $isInfantFashion = true;
                                }
                            }
                            // Check if this is footwear under Infants
                            if ($categoryNameLower === 'footwear') {
                                $isFootwear = true;
                                $isInfantFootwear = true;
                            }
                        }
                    }
                }
                
                // Also check if parent is Footwear/Fashion and grandparent is Boys/Girls/Infants
                // (for cases where Footwear/Fashion is a subcategory under kids categories)
                // Also check for bottomwear under Western Wear > Men/Women
                if ($category->parent_id) {
                    if (!$category->relationLoaded('parent')) {
                        $category->load('parent');
                    }
                    $parent = $category->parent;
                    if ($parent) {
                        $parentNameLower = strtolower($parent->name);
                        
                        // Check if parent is Western Wear and grandparent is Men/Women (for bottomwear)
                        if (($parentNameLower === 'western wear' || $parentNameLower === 'westernwear') && $parent->parent_id) {
                            if (!$parent->relationLoaded('parent')) {
                                $parent->load('parent');
                            }
                            $grandParent = $parent->parent;
                            if ($grandParent) {
                                $grandParentNameLower = strtolower($grandParent->name);
                                if ($grandParentNameLower === 'men' || $grandParentNameLower === 'women') {
                                    // Check if this is bottomwear
                                    $bottomwearCategories = ['jeans', 'trousers', 'casual trousers', 'formal trousers', 'shorts', 'track pants', 'skirts'];
                                    foreach ($bottomwearCategories as $bwCat) {
                                        if (strpos($categoryNameLower, $bwCat) !== false) {
                                            $isBottomwear = true;
                                            $isMenBottomwear = ($grandParentNameLower === 'men');
                                            $isFashion = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        
                        // If parent is Boys, Girls, or Infants
                        if ($parentNameLower === 'boys' || $parentNameLower === 'girls') {
                            if ($categoryNameLower === 'footwear') {
                                $isFootwear = true;
                                $isKidsFootwear = true;
                            } elseif ($isFashion) {
                                $isKidsFashion = true;
                            }
                        } elseif ($parentNameLower === 'infants') {
                            if ($categoryNameLower === 'footwear') {
                                $isFootwear = true;
                                $isInfantFootwear = true;
                            } elseif ($isFashion) {
                                $isInfantFashion = true;
                            }
                        }
                    }
                }
            }
            
            if ($isFashion) {
                // Determine which size array to use based on fashion type
                if ($isBottomwear) {
                    // Bottomwear sizes
                    if ($isMenBottomwear) {
                        $fashionSizesToUse = $menBottomwearSizes;
                    } else {
                        $fashionSizesToUse = $womenBottomwearSizes;
                    }
                } elseif ($isInfantFashion) {
                    $fashionSizesToUse = $infantFashionSizes;
                } elseif ($isKidsFashion) {
                    $fashionSizesToUse = $kidsFashionSizes;
                } else {
                    $fashionSizesToUse = $adultFashionSizes;
                }
                
                // For fashion products, create all size variants for each gender and color combination
                $genders = ['male', 'female'];
                $selectedColors = array_slice($colors, 0, rand(3, 6)); // Select 3-6 colors per product
                
                foreach ($genders as $gender) {
                    foreach ($fashionSizesToUse as $size) {
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
            } elseif ($isBangle) {
                // For bangle products, create all size variants for each color combination
                $selectedColors = array_slice($colors, 0, rand(3, 6)); // Select 3-6 colors per product
                
                foreach ($bangleSizes as $size) {
                    foreach ($selectedColors as $color) {
                        // Only create if in stock (70% chance)
                        $inStock = rand(1, 100) <= 70;
                        
                        DB::table('product_variations')->updateOrInsert(
                            [
                                'product_id' => $product->id,
                                'size' => $size,
                                'color' => $color,
                                'gender' => null, // Bangles don't have gender
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
            } elseif ($isRing) {
                // For ring products, create all size variants for each color combination
                $selectedColors = array_slice($colors, 0, rand(3, 6)); // Select 3-6 colors per product
                
                foreach ($ringSizes as $size) {
                    foreach ($selectedColors as $color) {
                        // Only create if in stock (70% chance)
                        $inStock = rand(1, 100) <= 70;
                        
                        DB::table('product_variations')->updateOrInsert(
                            [
                                'product_id' => $product->id,
                                'size' => $size,
                                'color' => $color,
                                'gender' => null, // Rings don't have gender
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
            } elseif ($isFootwear) {
                // Determine which size array to use based on footwear type
                if ($isInfantFootwear) {
                    $footwearSizesToUse = $infantFootwearSizes;
                } elseif ($isKidsFootwear) {
                    $footwearSizesToUse = $kidsFootwearSizes;
                } else {
                    $footwearSizesToUse = $adultFootwearSizes;
                }
                
                // For footwear products, create all size variants for each gender and color combination
                $genders = ['male', 'female'];
                $selectedColors = array_slice($colors, 0, rand(3, 6)); // Select 3-6 colors per product
                
                foreach ($genders as $gender) {
                    foreach ($footwearSizesToUse as $size) {
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

