<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Starting category seeding...');
        
        // Check if categories table exists and is accessible
        try {
            $categoryCount = Category::count();
            $this->command->info("Found {$categoryCount} existing categories.");
        } catch (\Exception $e) {
            $this->command->error("Error accessing categories table: " . $e->getMessage());
            $this->command->error("Please ensure the categories table exists and migrations have been run.");
            return;
        }
        
        // Ensure we have a clean state - check for any orphaned categories first
        $this->fixOrphanedCategories();
        
        // Define hierarchical category structure
        $categoryStructure = [
            // Main Categories
            [
                'name' => 'Mobiles & Tablets',
                'description' => 'Smartphones, tablets, and accessories',
                'is_featured' => true,
                'icon' => 'fa-mobile-alt',
                'sort_order' => 1,
                'children' => [
                    ['name' => 'Smartphones', 'description' => 'Latest smartphones', 'sort_order' => 1],
                    ['name' => 'Tablets', 'description' => 'Tablets and e-readers', 'sort_order' => 2],
                    ['name' => 'Mobile Accessories', 'description' => 'Cases, chargers, and more', 'sort_order' => 3],
                ]
            ],
            [
                'name' => 'Fashion',
                'description' => 'Clothing and accessories for men, women, and kids',
                'is_featured' => true,
                'icon' => 'fa-tshirt',
                'sort_order' => 2,
                'children' => [
                    [
                        'name' => "Men's Top Wear",
                        'description' => 'Shirts, t-shirts, and tops for men',
                        'sort_order' => 1,
                        'children' => [
                            ['name' => "Men's T-Shirts", 'description' => 'Casual t-shirts', 'sort_order' => 1],
                            ['name' => "Men's Casual Shirts", 'description' => 'Casual shirts', 'sort_order' => 2],
                            ['name' => "Men's Formal Shirts", 'description' => 'Formal dress shirts', 'sort_order' => 3],
                            ['name' => "Men's Kurtas", 'description' => 'Traditional kurtas', 'sort_order' => 4],
                            ['name' => "Men's Ethnic Sets", 'description' => 'Ethnic wear sets', 'sort_order' => 5],
                            ['name' => "Men's Blazers", 'description' => 'Blazers and jackets', 'sort_order' => 6],
                            ['name' => "Men's Raincoat", 'description' => 'Raincoats and outerwear', 'sort_order' => 7],
                            ['name' => "Men's Windcheaters", 'description' => 'Windcheaters and hoodies', 'sort_order' => 8],
                            ['name' => "Men's Suit", 'description' => 'Formal suits', 'sort_order' => 9],
                            ['name' => "Men's Fabrics", 'description' => 'Fabric materials', 'sort_order' => 10],
                        ]
                    ],
                    [
                        'name' => "Men's Bottom Wear",
                        'description' => 'Pants, jeans, and bottoms for men',
                        'sort_order' => 2,
                        'children' => [
                            ['name' => "Men's Jeans", 'description' => 'Denim jeans', 'sort_order' => 1],
                            ['name' => "Men's Trousers", 'description' => 'Formal trousers', 'sort_order' => 2],
                            ['name' => "Men's Shorts", 'description' => 'Casual shorts', 'sort_order' => 3],
                            ['name' => "Men's Track Pants", 'description' => 'Sports and track pants', 'sort_order' => 4],
                        ]
                    ],
                    [
                        'name' => 'Women Ethnic',
                        'description' => 'Traditional ethnic wear for women',
                        'sort_order' => 3,
                        'children' => [
                            ['name' => "Women's Sarees", 'description' => 'Traditional sarees', 'sort_order' => 1],
                            ['name' => "Women's Kurtis", 'description' => 'Kurtis and kurtas', 'sort_order' => 2],
                            ['name' => "Women's Lehengas", 'description' => 'Lehengas and skirts', 'sort_order' => 3],
                            ['name' => "Women's Salwar Suits", 'description' => 'Salwar kameez', 'sort_order' => 4],
                        ]
                    ],
                    [
                        'name' => 'Women Western',
                        'description' => 'Western wear for women',
                        'sort_order' => 4,
                        'children' => [
                            ['name' => "Women's Tops", 'description' => 'Tops and blouses', 'sort_order' => 1],
                            ['name' => "Women's Dresses", 'description' => 'Dresses and gowns', 'sort_order' => 2],
                            ['name' => "Women's Jeans", 'description' => 'Denim jeans', 'sort_order' => 3],
                            ['name' => "Women's Skirts", 'description' => 'Skirts and shorts', 'sort_order' => 4],
                        ]
                    ],
                    [
                        'name' => "Men Footwear",
                        'description' => 'Shoes and footwear for men',
                        'sort_order' => 5,
                        'children' => [
                            ['name' => "Men's Casual Shoes", 'description' => 'Casual footwear', 'sort_order' => 1],
                            ['name' => "Men's Formal Shoes", 'description' => 'Formal dress shoes', 'sort_order' => 2],
                            ['name' => "Men's Sports Shoes", 'description' => 'Athletic footwear', 'sort_order' => 3],
                            ['name' => "Men's Sandals", 'description' => 'Sandals and flip-flops', 'sort_order' => 4],
                        ]
                    ],
                    [
                        'name' => "Women Footwear",
                        'description' => 'Shoes and footwear for women',
                        'sort_order' => 6,
                        'children' => [
                            ['name' => "Women's Heels", 'description' => 'High heels and pumps', 'sort_order' => 1],
                            ['name' => "Women's Flats", 'description' => 'Flat shoes and ballerinas', 'sort_order' => 2],
                            ['name' => "Women's Sports Shoes", 'description' => 'Athletic footwear', 'sort_order' => 3],
                            ['name' => "Women's Sandals", 'description' => 'Sandals and flip-flops', 'sort_order' => 4],
                        ]
                    ],
                    [
                        'name' => 'Watches and Accessories',
                        'description' => 'Watches, jewelry, and accessories',
                        'sort_order' => 7,
                        'children' => [
                            ['name' => "Men's Watches", 'description' => 'Watches for men', 'sort_order' => 1],
                            ['name' => "Women's Watches", 'description' => 'Watches for women', 'sort_order' => 2],
                            ['name' => 'Jewelry', 'description' => 'Rings, necklaces, and more', 'sort_order' => 3],
                            ['name' => 'Belts', 'description' => 'Belts and buckles', 'sort_order' => 4],
                        ]
                    ],
                    [
                        'name' => 'Bags, Suitcases & Luggage',
                        'description' => 'Bags, luggage, and travel accessories',
                        'sort_order' => 8,
                        'children' => [
                            ['name' => "Men's Bags", 'description' => 'Bags for men', 'sort_order' => 1],
                            ['name' => "Women's Handbags", 'description' => 'Handbags and purses', 'sort_order' => 2],
                            ['name' => 'Backpacks', 'description' => 'Backpacks and rucksacks', 'sort_order' => 3],
                            ['name' => 'Luggage', 'description' => 'Suitcases and travel bags', 'sort_order' => 4],
                        ]
                    ],
                    [
                        'name' => 'Kids',
                        'description' => 'Clothing and accessories for kids',
                        'sort_order' => 9,
                        'children' => [
                            ['name' => "Boys' Clothing", 'description' => 'Clothing for boys', 'sort_order' => 1],
                            ['name' => "Girls' Clothing", 'description' => 'Clothing for girls', 'sort_order' => 2],
                            ['name' => "Kids' Footwear", 'description' => 'Shoes for kids', 'sort_order' => 3],
                            ['name' => "Kids' Accessories", 'description' => 'Accessories for kids', 'sort_order' => 4],
                        ]
                    ],
                    [
                        'name' => 'Essentials',
                        'description' => 'Essential fashion items',
                        'sort_order' => 10,
                    ],
                    [
                        'name' => 'Winter',
                        'description' => 'Winter clothing and accessories',
                        'sort_order' => 11,
                        'children' => [
                            ['name' => "Men's Winter Wear", 'description' => 'Winter clothing for men', 'sort_order' => 1],
                            ['name' => "Women's Winter Wear", 'description' => 'Winter clothing for women', 'sort_order' => 2],
                            ['name' => "Kids' Winter Wear", 'description' => 'Winter clothing for kids', 'sort_order' => 3],
                        ]
                    ],
                ]
            ],
            [
                'name' => 'Electronics',
                'description' => 'Electronics, gadgets, and tech accessories',
                'is_featured' => true,
                'icon' => 'fa-laptop',
                'sort_order' => 3,
                'children' => [
                    ['name' => 'Laptops', 'description' => 'Laptops and notebooks', 'sort_order' => 1],
                    ['name' => 'Computers', 'description' => 'Desktops and components', 'sort_order' => 2],
                    ['name' => 'Audio', 'description' => 'Headphones, speakers, and audio devices', 'sort_order' => 3],
                    ['name' => 'Cameras', 'description' => 'Cameras and photography equipment', 'sort_order' => 4],
                    ['name' => 'Gaming', 'description' => 'Gaming consoles and accessories', 'sort_order' => 5],
                ]
            ],
            [
                'name' => 'TVs & Appliances',
                'description' => 'Televisions and home appliances',
                'is_featured' => true,
                'icon' => 'fa-tv',
                'sort_order' => 4,
                'children' => [
                    ['name' => 'Televisions', 'description' => 'Smart TVs and displays', 'sort_order' => 1],
                    ['name' => 'Home Appliances', 'description' => 'Kitchen and home appliances', 'sort_order' => 2],
                    ['name' => 'Air Conditioners', 'description' => 'ACs and cooling systems', 'sort_order' => 3],
                ]
            ],
            [
                'name' => 'Home & Kitchen',
                'description' => 'Furniture, decor, and kitchen items',
                'is_featured' => true,
                'icon' => 'fa-home',
                'sort_order' => 5,
                'children' => [
                    ['name' => 'Furniture', 'description' => 'Home and office furniture', 'sort_order' => 1],
                    ['name' => 'Kitchen & Dining', 'description' => 'Kitchenware and dining sets', 'sort_order' => 2],
                    ['name' => 'Home Decor', 'description' => 'Decorative items and accessories', 'sort_order' => 3],
                ]
            ],
            [
                'name' => 'Beauty',
                'description' => 'Skincare, makeup, and personal care',
                'is_featured' => false,
                'icon' => 'fa-spa',
                'sort_order' => 6,
                'children' => [
                    ['name' => 'Skincare', 'description' => 'Face and body care products', 'sort_order' => 1],
                    ['name' => 'Makeup', 'description' => 'Cosmetics and makeup products', 'sort_order' => 2],
                    ['name' => 'Hair Care', 'description' => 'Hair care products', 'sort_order' => 3],
                    ['name' => 'Fragrances', 'description' => 'Perfumes and colognes', 'sort_order' => 4],
                ]
            ],
            [
                'name' => 'Sports',
                'description' => 'Fitness and outdoor gear',
                'is_featured' => false,
                'icon' => 'fa-dumbbell',
                'sort_order' => 7,
                'children' => [
                    ['name' => 'Fitness Equipment', 'description' => 'Gym and fitness equipment', 'sort_order' => 1],
                    ['name' => 'Outdoor Sports', 'description' => 'Outdoor and adventure gear', 'sort_order' => 2],
                    ['name' => 'Sports Apparel', 'description' => 'Activewear and sports clothing', 'sort_order' => 3],
                ]
            ],
            [
                'name' => 'Books',
                'description' => 'Fiction, non-fiction, and educational books',
                'is_featured' => false,
                'icon' => 'fa-book',
                'sort_order' => 8,
                'children' => [
                    ['name' => 'Fiction', 'description' => 'Fiction books and novels', 'sort_order' => 1],
                    ['name' => 'Non-Fiction', 'description' => 'Non-fiction and educational books', 'sort_order' => 2],
                    ['name' => 'Academic', 'description' => 'Textbooks and academic materials', 'sort_order' => 3],
                ]
            ],
        ];

        $createdCount = 0;
        $updatedCount = 0;
        $initialCount = Category::count();

        // Create categories hierarchically
        foreach ($categoryStructure as $mainCategory) {
            try {
                $parent = $this->createOrUpdateCategory($mainCategory, null);
                
                if (!$parent) {
                    $this->command->error("Failed to create main category: {$mainCategory['name']}");
                    continue;
                }
                
                // Create subcategories (level 2)
                if (isset($mainCategory['children']) && is_array($mainCategory['children'])) {
                    foreach ($mainCategory['children'] as $subCategory) {
                        try {
                            $subParent = $this->createOrUpdateCategory($subCategory, $parent->id);
                            
                            if (!$subParent) {
                                $this->command->warn("Failed to create subcategory: {$subCategory['name']}");
                                continue;
                            }
                            
                            // Create sub-subcategories (level 3)
                            if (isset($subCategory['children']) && is_array($subCategory['children'])) {
                                foreach ($subCategory['children'] as $subSubCategory) {
                                    try {
                                        $this->createOrUpdateCategory($subSubCategory, $subParent->id);
                                    } catch (\Exception $e) {
                                        $this->command->error("Error creating sub-subcategory '{$subSubCategory['name']}': " . $e->getMessage());
                                    }
                                }
                            }
                        } catch (\Exception $e) {
                            $this->command->error("Error creating subcategory '{$subCategory['name']}': " . $e->getMessage());
                        }
                    }
                }
            } catch (\Exception $e) {
                $this->command->error("Error creating main category '{$mainCategory['name']}': " . $e->getMessage());
            }
        }
        
        $finalCount = Category::count();
        $newCategories = $finalCount - $initialCount;
        
        $this->command->info("Category seeding completed!");
        $this->command->info("Total categories in database: {$finalCount}");
        if ($newCategories > 0) {
            $this->command->info("New categories created: {$newCategories}");
        }
        
        // Verify hierarchy integrity
        $this->verifyHierarchy();
    }
    
    /**
     * Fix orphaned categories (categories with invalid parent_id)
     */
    private function fixOrphanedCategories(): void
    {
        $categories = Category::whereNotNull('parent_id')->get();
        $fixedCount = 0;
        
        foreach ($categories as $category) {
            $parent = Category::find($category->parent_id);
            if (!$parent) {
                // Parent doesn't exist, convert to main category
                $category->update(['parent_id' => null]);
                $fixedCount++;
                $this->command->warn("Fixed orphaned category: {$category->name} (converted to main category)");
            }
        }
        
        if ($fixedCount > 0) {
            $this->command->info("Fixed {$fixedCount} orphaned categories.");
        }
    }
    
    /**
     * Verify category hierarchy integrity
     */
    private function verifyHierarchy(): void
    {
        $categories = Category::all();
        $orphanedCategories = [];

        foreach ($categories as $category) {
            if ($category->parent_id !== null) {
                $parent = Category::find($category->parent_id);
                if (!$parent) {
                    $orphanedCategories[] = $category;
                }
            }
        }
        
        if (count($orphanedCategories) > 0) {
            $this->command->warn("Found " . count($orphanedCategories) . " orphaned categories (parent not found):");
            foreach ($orphanedCategories as $orphan) {
                $this->command->warn("  - {$orphan->name} (ID: {$orphan->id}, Parent ID: {$orphan->parent_id})");
            }
        } else {
            $this->command->info("Category hierarchy verified: All categories have valid parent relationships.");
        }
    }

    /**
     * Create or update a category
     * Handles cases where category doesn't exist or needs updating
     */
    private function createOrUpdateCategory(array $categoryData, ?int $parentId = null): ?Category
    {
        try {
            $slug = Str::slug($categoryData['name']);
            
            // Check if parent exists (if parent_id is provided)
            if ($parentId !== null) {
                $parent = Category::find($parentId);
                if (!$parent) {
                    $this->command->warn("Warning: Parent category with ID {$parentId} not found for '{$categoryData['name']}'. Creating as main category.");
                    $parentId = null; // Fallback to main category
                }
            }
            
            // Try to find existing category by name first (most reliable)
            $existing = Category::where('name', $categoryData['name'])->first();
            
            // If not found by name, try by slug
            if (!$existing) {
                $existing = Category::where('slug', $slug)->first();
            }
            
            // Handle duplicate slug case for new categories - append number if needed
            if (!$existing) {
                $originalSlug = $slug;
                $slugCounter = 1;
                while (Category::where('slug', $slug)->exists()) {
                    $slug = $originalSlug . '-' . $slugCounter;
                    $slugCounter++;
                }
            }
            
            $data = [
                'name' => $categoryData['name'],
                'slug' => $slug,
                'description' => $categoryData['description'] ?? null,
                'is_featured' => $categoryData['is_featured'] ?? false,
                'parent_id' => $parentId,
                'icon' => $categoryData['icon'] ?? null,
                'sort_order' => $categoryData['sort_order'] ?? 0,
            ];
            
            if ($existing) {
                // Update existing category
                $existing->update($data);
                $this->command->info("Updated category: {$categoryData['name']}");
                return $existing;
            } else {
                // Create new category
                $data['uuid'] = Str::uuid()->toString();
                $category = Category::create($data);
                $this->command->info("Created category: {$categoryData['name']}" . ($parentId ? " (under parent ID: {$parentId})" : " (main category)"));
                return $category;
            }
        } catch (\Exception $e) {
            $this->command->error("Error creating/updating category '{$categoryData['name']}': " . $e->getMessage());
            return null;
        }
    }
}

