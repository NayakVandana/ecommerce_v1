<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Category;
use App\Models\Product;
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

        $products = [
            // Electronics (no sizes)
            ['name' => 'Smartphone X', 'category' => 'Electronics', 'price' => 699.00, 'mrp' => 799.00, 'brand' => 'TechBrand'],
            ['name' => 'Laptop Pro', 'category' => 'Electronics', 'price' => 1299.00, 'mrp' => 1499.00, 'brand' => 'TechBrand'],
            ['name' => 'Wireless Earbuds', 'category' => 'Electronics', 'price' => 149.00, 'mrp' => 199.00, 'brand' => 'AudioTech'],
            ['name' => 'Smart Watch', 'category' => 'Electronics', 'price' => 299.00, 'mrp' => 349.00, 'brand' => 'TechBrand'],
            
            // Fashion (with sizes XS, S, M, L, XL, XXL)
            ['name' => 'Denim Jacket', 'category' => 'Fashion', 'price' => 59.00, 'mrp' => 79.00, 'brand' => 'FashionBrand'],
            ['name' => 'Cotton T-Shirt', 'category' => 'Fashion', 'price' => 29.00, 'mrp' => 39.00, 'brand' => 'FashionBrand'],
            ['name' => 'Jeans', 'category' => 'Fashion', 'price' => 49.00, 'mrp' => 69.00, 'brand' => 'FashionBrand'],
            ['name' => 'Summer Dress', 'category' => 'Fashion', 'price' => 79.00, 'mrp' => 99.00, 'brand' => 'FashionBrand'],
            ['name' => 'Hoodie', 'category' => 'Fashion', 'price' => 69.00, 'mrp' => 89.00, 'brand' => 'FashionBrand'],
            
            // Sports (no sizes)
            ['name' => 'Running Shoes', 'category' => 'Sports', 'price' => 89.00, 'mrp' => 119.00, 'brand' => 'SportBrand'],
            ['name' => 'Yoga Mat', 'category' => 'Sports', 'price' => 29.00, 'mrp' => 39.00, 'brand' => 'FitnessPro'],
            ['name' => 'Basketball', 'category' => 'Sports', 'price' => 39.00, 'mrp' => 49.00, 'brand' => 'SportBrand'],
            
            // Home & Kitchen (no sizes)
            ['name' => 'Cookware Set', 'category' => 'Home & Kitchen', 'price' => 199.00, 'mrp' => 249.00, 'brand' => 'HomeBrand'],
            ['name' => 'Coffee Maker', 'category' => 'Home & Kitchen', 'price' => 99.00, 'mrp' => 129.00, 'brand' => 'KitchenPro'],
            ['name' => 'Dining Table', 'category' => 'Home & Kitchen', 'price' => 399.00, 'mrp' => 499.00, 'brand' => 'HomeBrand'],
            
            // Beauty (no sizes)
            ['name' => 'Skincare Kit', 'category' => 'Beauty', 'price' => 79.00, 'mrp' => 99.00, 'brand' => 'BeautyBrand'],
            ['name' => 'Makeup Palette', 'category' => 'Beauty', 'price' => 49.00, 'mrp' => 59.00, 'brand' => 'BeautyBrand'],
            
            // Books (no sizes)
            ['name' => 'Classic Novel', 'category' => 'Books', 'price' => 19.00, 'mrp' => 24.00, 'brand' => 'BookHouse'],
            ['name' => 'Cookbook', 'category' => 'Books', 'price' => 24.00, 'mrp' => 29.00, 'brand' => 'BookHouse'],
        ];

        $createdCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;

        foreach ($products as $index => $productData) {
            // Try multiple methods to find category
            $category = $this->findCategory($productData['category']);
            
            if (!$category) {
                $this->command->warn("Category '{$productData['category']}' not found for product '{$productData['name']}'. Skipping.");
                $skippedCount++;
                continue;
            }

            $user = $users->random();
            $price = $productData['price'];
            $mrp = $productData['mrp'];
            $gst = 18; // 18% GST
            $gstAmount = ($price * $gst) / 100;
            $totalWithGst = $price + $gstAmount;
            $commission = ($price * 5) / 100; // 5% commission
            $commissionGst = ($commission * $gst) / 100;
            $total = $totalWithGst + $commission + $commissionGst;
            $discountPercent = (($mrp - $price) / $mrp) * 100;

            $sku = 'SKU-' . Str::upper(Str::slug($productData['name'], ''));
            $existing = Product::where('sku', $sku)->first();
            
            $productDataArray = [
                'user_id' => $user->id,
                'product_name' => $productData['name'],
                'sku' => $sku,
                'description' => "High-quality {$productData['name']}. Perfect for everyday use.",
                'hashtags' => '#' . Str::slug($productData['name'], ''),
                'brand' => $productData['brand'],
                'category' => $category->id,
                'hsn_code' => 'HSN' . str_pad($category->id, 6, '0', STR_PAD_LEFT),
                'features' => json_encode([
                    'High Quality',
                    'Durable',
                    'Warranty Included',
                    'Easy to Use'
                ]),
                'price' => $price,
                'gst' => $gst,
                'total_with_gst' => $totalWithGst,
                'commission' => $commission,
                'commission_gst_amount' => $commissionGst,
                'total' => $total,
                'final_price' => $price,
                'mrp' => $mrp,
                'discount_percent' => round($discountPercent, 2),
                'is_approve' => 1,
                'total_quantity' => rand(10, 100),
            ];
            
            if ($existing) {
                $existing->update($productDataArray);
                $updatedCount++;
            } else {
                $productDataArray['uuid'] = Str::uuid()->toString();
                Product::create($productDataArray);
                $createdCount++;
            }
        }
        
        $this->command->info("Product seeding completed!");
        $this->command->info("Created: {$createdCount} products");
        $this->command->info("Updated: {$updatedCount} products");
        if ($skippedCount > 0) {
            $this->command->warn("Skipped: {$skippedCount} products (category not found)");
        }
    }
    
    /**
     * Find category by name or slug, handling hierarchical structure
     * Tries multiple methods to find the category
     */
    private function findCategory(string $categoryName): ?Category
    {
        // Method 1: Try exact name match (case-insensitive)
        $category = Category::whereRaw('LOWER(name) = ?', [strtolower($categoryName)])->first();
        if ($category) {
            return $category;
        }
        
        // Method 2: Try slug match
        $slug = Str::slug($categoryName);
        $category = Category::where('slug', $slug)->first();
        if ($category) {
            return $category;
        }
        
        // Method 3: Try to find in subcategories (search children of main categories)
        $category = Category::whereHas('parent', function($query) use ($categoryName) {
            $query->whereRaw('LOWER(name) = ?', [strtolower($categoryName)]);
        })->first();
        if ($category) {
            return $category;
        }
        
        // Method 4: Try partial name match (for cases like "Home & Kitchen")
        $category = Category::where('name', 'like', "%{$categoryName}%")->first();
        if ($category) {
            return $category;
        }
        
        // Method 5: Try to find by parent category name (e.g., if looking for "Fashion" but it's a parent)
        // This handles cases where we want the main category even if there are subcategories
        $category = Category::whereRaw('LOWER(name) = ?', [strtolower($categoryName)])
            ->whereNull('parent_id')
            ->first();
        if ($category) {
            return $category;
        }
        
        return null;
    }
}

