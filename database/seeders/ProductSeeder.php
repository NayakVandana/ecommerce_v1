<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Category;
use App\Models\Product;
use App\Models\Fabric;
use App\Models\User;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Starting product seeding...');
        
        $users = User::where('role', 'user')->get();
        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please run UserSeeder first.');
            return;
        }

        // Get ALL categories (including parent categories) - add 2 products to EVERY category
        // Eager load parent relationship to avoid N+1 queries when checking for fashion category
        $categories = Category::with('parent')->orderBy('id')->get();
        $totalCategories = $categories->count();
        
        $this->command->info("Found {$totalCategories} categories. Adding 2 products to each category...");

        $createdCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;
        $categoriesProcessed = 0;

        // Create 2 products for EACH category (including parent categories)
        foreach ($categories as $category) {
            $categoriesProcessed++;
            $this->command->info("Processing category {$categoriesProcessed}/{$totalCategories}: {$category->name} (ID: {$category->id})");
            
            for ($i = 1; $i <= 2; $i++) {
                try {
                    $productName = $this->generateProductName($category->name, $i);
                    $user = $users->random();
                    
                    // Generate realistic pricing
                    $basePrice = $this->getBasePrice($category->name);
                    $mrp = $basePrice * (1 + (rand(20, 50) / 100)); // MRP is 20-50% higher
                    $price = $basePrice;
                    $gst = 18; // 18% GST
                    $gstAmount = ($price * $gst) / 100;
                    $totalWithGst = $price + $gstAmount;
                    $commission = ($price * 5) / 100; // 5% commission
                    $commissionGst = ($commission * $gst) / 100;
                    $total = $totalWithGst + $commission + $commissionGst;
                    $discountPercent = round((($mrp - $price) / $mrp) * 100, 2);

                    // Make SKU unique by including category ID
                    $sku = 'SKU-' . str_pad($category->id, 4, '0', STR_PAD_LEFT) . '-' . Str::upper(Str::slug($category->name, '')) . '-' . $i;
                    $existing = Product::where('sku', $sku)->first();
                    
                    $productData = [
                        'user_id' => $user->id,
                        'product_name' => $productName,
                        'sku' => $sku,
                        'description' => $this->generateDescription($category->name, $i),
                        'hashtags' => '#' . Str::slug($category->name, '') . ' #quality #premium',
                        'brand' => $this->generateBrand($category->name),
                        'category' => $category->id,
                        'hsn_code' => 'HSN' . str_pad($category->id, 6, '0', STR_PAD_LEFT),
                        'features' => json_encode([
                            'High Quality',
                            'Durable',
                            'Warranty Included',
                            'Easy to Use',
                            'Premium Material'
                        ]),
                        'price' => $price,
                        'gst' => $gst,
                        'total_with_gst' => $totalWithGst,
                        'commission' => $commission,
                        'commission_gst_amount' => $commissionGst,
                        'total' => $total,
                        'final_price' => $price,
                        'mrp' => $mrp,
                        'discount_percent' => $discountPercent,
                        'is_approve' => 1,
                        'total_quantity' => rand(10, 100),
                        'is_returnable' => true,
                        'return_policy_note' => '7 days return policy',
                    ];
                    
                    if ($existing) {
                        $existing->update($productData);
                        $product = $existing;
                        $updatedCount++;
                        $this->command->line("  ✓ Updated product {$i}/2: {$productName}");
                    } else {
                        $productData['uuid'] = Str::uuid()->toString();
                        $product = Product::create($productData);
                        $createdCount++;
                        $this->command->line("  ✓ Created product {$i}/2: {$productName}");
                    }
                    
                    // Add fabrics for fashion category products
                    if ($this->isFashionCategory($category)) {
                        $this->addFabricsToProduct($product, $category->name);
                    }
                } catch (\Exception $e) {
                    $this->command->error("  ✗ Error creating product {$i}/2 for category '{$category->name}': " . $e->getMessage());
                    $skippedCount++;
                }
            }
        }
        
        $this->command->info("");
        $this->command->info("═══════════════════════════════════════════════════════");
        $this->command->info("Product seeding completed!");
        $this->command->info("═══════════════════════════════════════════════════════");
        $this->command->info("Total categories processed: {$categoriesProcessed}");
        $this->command->info("Total products created: {$createdCount}");
        $this->command->info("Total products updated: {$updatedCount}");
        if ($skippedCount > 0) {
            $this->command->warn("Total products skipped: {$skippedCount}");
        }
        $this->command->info("Expected products: " . ($categoriesProcessed * 2));
        $this->command->info("Actual products: " . ($createdCount + $updatedCount));
    }
    
    /**
     * Generate product name based on category
     */
    private function generateProductName(string $categoryName, int $index): string
    {
        $prefixes = ['Premium', 'Classic', 'Modern', 'Trendy', 'Elegant', 'Stylish', 'Designer'];
        $suffixes = ['Collection', 'Edition', 'Series', 'Line', 'Style'];
        
        $prefix = $prefixes[array_rand($prefixes)];
        $suffix = $suffixes[array_rand($suffixes)];
        
        return "{$prefix} {$categoryName} {$suffix} {$index}";
    }
    
    /**
     * Generate description based on category
     */
    private function generateDescription(string $categoryName, int $index): string
    {
        return "High-quality {$categoryName} product. Made with premium materials and excellent craftsmanship. Perfect for everyday use. This is product {$index} in the {$categoryName} category.";
    }
    
    /**
     * Generate brand name based on category
     */
    private function generateBrand(string $categoryName): string
    {
        $brands = [
            'Fashion' => ['FashionHub', 'StyleCo', 'TrendyBrand', 'Elegance'],
            'Men' => ['MenStyle', 'Gentleman', 'ManBrand', 'ClassicMen'],
            'Women' => ['WomenStyle', 'Feminine', 'LadyBrand', 'ElegantWomen'],
            'Boys' => ['KidsBrand', 'YoungStyle', 'BoyBrand', 'ActiveKids'],
            'Girls' => ['GirlStyle', 'PrettyBrand', 'YoungLady', 'GirlsFashion'],
            'Infants' => ['BabyBrand', 'TinyStyle', 'InfantCo', 'LittleOnes'],
            'Tech' => ['TechPro', 'SmartTech', 'DigitalCo', 'TechHub'],
            'Crafts' => ['CraftIndia', 'Handmade', 'Artisan', 'Traditional'],
            'Mobiles' => ['MobileTech', 'SmartPhone', 'PhonePro', 'MobileHub'],
            'Electronics' => ['ElectroTech', 'DigitalPro', 'TechWorld', 'ElectroHub'],
            'TVs' => ['TVPro', 'ScreenTech', 'DisplayHub', 'TVWorld'],
            'Home' => ['HomePro', 'HomeStyle', 'HomeHub', 'HomeTech'],
            'Kitchen' => ['KitchenPro', 'CookHub', 'KitchenStyle', 'CookTech'],
            'Beauty' => ['BeautyPro', 'GlowHub', 'BeautyStyle', 'GlowTech'],
            'Skincare' => ['GlowSkin', 'PureSkin', 'Radiant', 'SkinCarePro'],
            'Makeup' => ['MakeupPro', 'Glamour', 'CosmeticCo', 'BeautyGlam'],
            'Hair Care' => ['HairPro', 'SilkyHair', 'HairCare', 'LuxuryHair'],
            'Bath & Body' => ['BodyCare', 'Refresh', 'BathLux', 'BodyEssence'],
            'Personal Care' => ['PersonalCare', 'HygienePro', 'CarePlus', 'Wellness'],
            'Men\'s Grooming' => ['GroomPro', 'Gentleman', 'ManCare', 'Grooming'],
            'Fragrance' => ['FragrancePro', 'ScentLux', 'PerfumeCo', 'Aroma'],
            'Beauty Tools' => ['ToolPro', 'BeautyTools', 'ProTools', 'ToolLux'],
            'Herbal' => ['HerbalCare', 'NaturalPro', 'Organic', 'Ayurvedic'],
            'Baby Care' => ['BabyCare', 'TenderCare', 'BabySoft', 'GentleBaby'],
            'Sports' => ['SportPro', 'FitHub', 'SportStyle', 'FitTech'],
            'Books' => ['BookHouse', 'ReadHub', 'BookWorld', 'ReadPro'],
            'Groceries' => ['FreshMart', 'GroceryHub', 'FreshPro', 'GroceryWorld'],
        ];
        
        foreach ($brands as $key => $brandList) {
            if (stripos($categoryName, $key) !== false) {
                return $brandList[array_rand($brandList)];
            }
        }
        
        return 'PremiumBrand';
    }
    
    /**
     * Get base price based on category type
     */
    private function getBasePrice(string $categoryName): float
    {
        $categoryLower = strtolower($categoryName);
        
        // High-end categories
        if (stripos($categoryLower, 'jewellery') !== false || 
            stripos($categoryLower, 'precious') !== false ||
            stripos($categoryLower, 'gemstone') !== false) {
            return rand(500, 2000);
        }
        
        // Electronics and Tech (high value)
        if (stripos($categoryLower, 'mobile') !== false ||
            stripos($categoryLower, 'tablet') !== false ||
            stripos($categoryLower, 'laptop') !== false ||
            stripos($categoryLower, 'computer') !== false ||
            stripos($categoryLower, 'tv') !== false ||
            stripos($categoryLower, 'television') !== false ||
            stripos($categoryLower, 'electronics') !== false) {
            return rand(5000, 50000);
        }
        
        // Appliances
        if (stripos($categoryLower, 'appliance') !== false ||
            stripos($categoryLower, 'air conditioner') !== false ||
            stripos($categoryLower, 'ac') !== false) {
            return rand(10000, 50000);
        }
        
        // Mid-range categories
        if (stripos($categoryLower, 'watch') !== false ||
            stripos($categoryLower, 'footwear') !== false ||
            stripos($categoryLower, 'bag') !== false ||
            stripos($categoryLower, 'camera') !== false ||
            stripos($categoryLower, 'audio') !== false ||
            stripos($categoryLower, 'gaming') !== false) {
            return rand(200, 800);
        }
        
        // Furniture
        if (stripos($categoryLower, 'furniture') !== false ||
            stripos($categoryLower, 'couch') !== false ||
            stripos($categoryLower, 'sofa') !== false) {
            return rand(2000, 10000);
        }
        
        // Kitchen items
        if (stripos($categoryLower, 'kitchen') !== false ||
            stripos($categoryLower, 'dining') !== false ||
            stripos($categoryLower, 'cookware') !== false) {
            return rand(200, 2000);
        }
        
        // Beauty products - comprehensive pricing
        if (stripos($categoryLower, 'beauty') !== false ||
            stripos($categoryLower, 'skincare') !== false ||
            stripos($categoryLower, 'makeup') !== false ||
            stripos($categoryLower, 'fragrance') !== false ||
            stripos($categoryLower, 'hair care') !== false ||
            stripos($categoryLower, 'bath') !== false ||
            stripos($categoryLower, 'body') !== false ||
            stripos($categoryLower, 'personal care') !== false ||
            stripos($categoryLower, 'grooming') !== false ||
            stripos($categoryLower, 'perfume') !== false ||
            stripos($categoryLower, 'cleanser') !== false ||
            stripos($categoryLower, 'toner') !== false ||
            stripos($categoryLower, 'moisturizer') !== false ||
            stripos($categoryLower, 'serum') !== false ||
            stripos($categoryLower, 'sunscreen') !== false ||
            stripos($categoryLower, 'mask') !== false ||
            stripos($categoryLower, 'scrub') !== false ||
            stripos($categoryLower, 'foundation') !== false ||
            stripos($categoryLower, 'concealer') !== false ||
            stripos($categoryLower, 'lipstick') !== false ||
            stripos($categoryLower, 'mascara') !== false ||
            stripos($categoryLower, 'eyeliner') !== false ||
            stripos($categoryLower, 'nail polish') !== false ||
            stripos($categoryLower, 'shampoo') !== false ||
            stripos($categoryLower, 'conditioner') !== false ||
            stripos($categoryLower, 'hair oil') !== false ||
            stripos($categoryLower, 'deodorant') !== false ||
            stripos($categoryLower, 'oral care') !== false ||
            stripos($categoryLower, 'beard') !== false ||
            stripos($categoryLower, 'shaving') !== false ||
            stripos($categoryLower, 'baby') !== false ||
            stripos($categoryLower, 'herbal') !== false ||
            stripos($categoryLower, 'organic') !== false ||
            stripos($categoryLower, 'beauty tools') !== false ||
            stripos($categoryLower, 'brush') !== false ||
            stripos($categoryLower, 'hair dryer') !== false ||
            stripos($categoryLower, 'straightener') !== false ||
            stripos($categoryLower, 'trimmer') !== false) {
            // Beauty products range from 50 to 2000 depending on type
            if (stripos($categoryLower, 'tools') !== false || 
                stripos($categoryLower, 'dryer') !== false ||
                stripos($categoryLower, 'straightener') !== false ||
                stripos($categoryLower, 'trimmer') !== false) {
                return rand(500, 3000); // Tools are more expensive
            }
            if (stripos($categoryLower, 'perfume') !== false ||
                stripos($categoryLower, 'fragrance') !== false ||
                stripos($categoryLower, 'attar') !== false) {
                return rand(300, 2000); // Fragrances are mid-high range
            }
            if (stripos($categoryLower, 'serum') !== false ||
                stripos($categoryLower, 'foundation') !== false ||
                stripos($categoryLower, 'palette') !== false) {
                return rand(200, 1500); // Premium products
            }
            return rand(100, 1000); // Standard beauty products
        }
        
        // Sports equipment
        if (stripos($categoryLower, 'sport') !== false ||
            stripos($categoryLower, 'fitness') !== false ||
            stripos($categoryLower, 'outdoor') !== false) {
            return rand(300, 2000);
        }
        
        // Books
        if (stripos($categoryLower, 'book') !== false ||
            stripos($categoryLower, 'academic') !== false) {
            return rand(50, 500);
        }
        
        // Groceries
        if (stripos($categoryLower, 'grocery') !== false ||
            stripos($categoryLower, 'food') !== false ||
            stripos($categoryLower, 'snack') !== false ||
            stripos($categoryLower, 'dairy') !== false) {
            return rand(20, 500);
        }
        
        // Clothing categories
        if (stripos($categoryLower, 'wear') !== false ||
            stripos($categoryLower, 'clothing') !== false ||
            stripos($categoryLower, 'ethnic') !== false ||
            stripos($categoryLower, 'western') !== false) {
            return rand(100, 500);
        }
        
        // Accessories
        if (stripos($categoryLower, 'accessories') !== false ||
            stripos($categoryLower, 'eyewear') !== false ||
            stripos($categoryLower, 'inner') !== false) {
            return rand(50, 300);
        }
        
        // Tech and Smart devices
        if (stripos($categoryLower, 'tech') !== false ||
            stripos($categoryLower, 'wearable') !== false ||
            stripos($categoryLower, 'smart') !== false) {
            return rand(300, 1500);
        }
        
        // Home decor
        if (stripos($categoryLower, 'decor') !== false ||
            stripos($categoryLower, 'home') !== false) {
            return rand(100, 1000);
        }
        
        // Default
        return rand(100, 500);
    }
    
    /**
     * Check if category is Fashion or has Fashion as parent
     */
    private function isFashionCategory(Category $category): bool
    {
        // Check if category name is Fashion (case-insensitive)
        if (strtolower($category->name) === 'fashion') {
            return true;
        }
        
        // Also check if parent category is Fashion (for subcategories)
        if ($category->parent_id) {
            // Load parent if not already loaded
            if (!$category->relationLoaded('parent')) {
                $category->load('parent');
            }
            $parent = $category->parent;
            if ($parent && strtolower($parent->name) === 'fashion') {
                return true;
            }
            
            // Check grandparent if exists
            if ($parent && $parent->parent_id) {
                if (!$parent->relationLoaded('parent')) {
                    $parent->load('parent');
                }
                $grandParent = $parent->parent;
                if ($grandParent && strtolower($grandParent->name) === 'fashion') {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Add fabrics to fashion product
     */
    private function addFabricsToProduct(Product $product, string $categoryName): void
    {
        // Get active fabrics from master table
        $availableFabrics = Fabric::where('is_active', true)->orderBy('sort_order')->get();
        
        if ($availableFabrics->isEmpty()) {
            $this->command->warn("    → No fabrics available in master table. Run FabricSeeder first.");
            return;
        }
        
        // Select 3-5 random fabrics per product
        $fabricCount = min(rand(3, 5), $availableFabrics->count());
        $selectedFabrics = $availableFabrics->random($fabricCount);
        
        // Attach fabrics to product with sort order
        $syncData = [];
        foreach ($selectedFabrics as $index => $fabric) {
            $syncData[$fabric->id] = ['sort_order' => $index];
        }
        
        $product->fabrics()->sync($syncData);
        
        $this->command->line("    → Added " . count($selectedFabrics) . " fabric(s) to fashion product");
    }
}
