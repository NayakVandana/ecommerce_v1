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
        $users = User::where('role', 'user')->get();
        if ($users->isEmpty()) {
            return;
        }

        $products = [
            ['name' => 'Smartphone X', 'category' => 'Electronics', 'price' => 699.00, 'mrp' => 799.00, 'brand' => 'TechBrand'],
            ['name' => 'Laptop Pro', 'category' => 'Electronics', 'price' => 1299.00, 'mrp' => 1499.00, 'brand' => 'TechBrand'],
            ['name' => 'Wireless Earbuds', 'category' => 'Electronics', 'price' => 149.00, 'mrp' => 199.00, 'brand' => 'AudioTech'],
            ['name' => 'Running Shoes', 'category' => 'Sports', 'price' => 89.00, 'mrp' => 119.00, 'brand' => 'SportBrand'],
            ['name' => 'Yoga Mat', 'category' => 'Sports', 'price' => 29.00, 'mrp' => 39.00, 'brand' => 'FitnessPro'],
            ['name' => 'Cookware Set', 'category' => 'Home & Kitchen', 'price' => 199.00, 'mrp' => 249.00, 'brand' => 'HomeBrand'],
            ['name' => 'Coffee Maker', 'category' => 'Home & Kitchen', 'price' => 99.00, 'mrp' => 129.00, 'brand' => 'KitchenPro'],
            ['name' => 'Skincare Kit', 'category' => 'Beauty', 'price' => 79.00, 'mrp' => 99.00, 'brand' => 'BeautyBrand'],
            ['name' => 'Classic Novel', 'category' => 'Books', 'price' => 19.00, 'mrp' => 24.00, 'brand' => 'BookHouse'],
            ['name' => 'Denim Jacket', 'category' => 'Fashion', 'price' => 59.00, 'mrp' => 79.00, 'brand' => 'FashionBrand'],
        ];

        foreach ($products as $index => $productData) {
            $category = Category::where('slug', Str::slug($productData['category']))->first();
            if (!$category) {
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
            } else {
                $productDataArray['uuid'] = Str::uuid()->toString();
                Product::create($productDataArray);
            }
        }
    }
}

