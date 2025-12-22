<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Models\Product;

class DiscountSeeder extends Seeder
{
    public function run(): void
    {
        $discounts = [
            [
                'name' => 'Summer Sale',
                'description' => 'Get amazing discounts on summer products',
                'type' => 'percentage',
                'value' => 20.00,
                'min_purchase_amount' => 100.00,
                'max_discount_amount' => 500.00,
                'start_date' => now()->subDays(5),
                'end_date' => now()->addDays(30),
                'usage_limit' => 1000,
            ],
            [
                'name' => 'Flash Sale',
                'description' => 'Limited time flash sale',
                'type' => 'percentage',
                'value' => 15.00,
                'min_purchase_amount' => 50.00,
                'max_discount_amount' => 300.00,
                'start_date' => now(),
                'end_date' => now()->addDays(7),
                'usage_limit' => 500,
            ],
            [
                'name' => 'Fixed Discount',
                'description' => 'Flat discount on selected items',
                'type' => 'fixed',
                'value' => 50.00,
                'min_purchase_amount' => 200.00,
                'max_discount_amount' => 50.00,
                'start_date' => now()->subDays(2),
                'end_date' => now()->addDays(15),
                'usage_limit' => 200,
            ],
        ];

        $products = Product::limit(5)->get();

        foreach ($discounts as $discountData) {
            $existing = DB::table('discounts')->where('name', $discountData['name'])->first();
            
            if ($existing) {
                $discountId = $existing->id;
                DB::table('discounts')->where('id', $discountId)->update([
                    'description' => $discountData['description'],
                    'type' => $discountData['type'],
                    'value' => $discountData['value'],
                    'min_purchase_amount' => $discountData['min_purchase_amount'],
                    'max_discount_amount' => $discountData['max_discount_amount'],
                    'start_date' => $discountData['start_date'],
                    'end_date' => $discountData['end_date'],
                    'usage_limit' => $discountData['usage_limit'],
                    'is_active' => true,
                    'updated_at' => now(),
                ]);
            } else {
                $discountId = DB::table('discounts')->insertGetId([
                    'uuid' => Str::uuid()->toString(),
                    'name' => $discountData['name'],
                    'description' => $discountData['description'],
                    'type' => $discountData['type'],
                    'value' => $discountData['value'],
                    'min_purchase_amount' => $discountData['min_purchase_amount'],
                    'max_discount_amount' => $discountData['max_discount_amount'],
                    'start_date' => $discountData['start_date'],
                    'end_date' => $discountData['end_date'],
                    'usage_limit' => $discountData['usage_limit'],
                    'usage_count' => 0,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Attach products to discount
            foreach ($products as $product) {
                DB::table('discount_product')->updateOrInsert(
                    [
                        'discount_id' => $discountId,
                        'product_id' => $product->id,
                    ],
                    [
                        'updated_at' => now(),
                        'created_at' => DB::raw('COALESCE(created_at, NOW())'),
                    ]
                );
            }
        }
    }
}

