<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class CouponCodeSeeder extends Seeder
{
    public function run(): void
    {
        $coupons = [
            [
                'code' => 'WELCOME10',
                'name' => 'Welcome Discount',
                'description' => '10% off on your first purchase',
                'type' => 'percentage',
                'value' => 10.00,
                'min_purchase_amount' => 50.00,
                'max_discount_amount' => 200.00,
                'start_date' => now()->subDays(10),
                'end_date' => now()->addDays(90),
                'usage_limit' => 1000,
                'usage_limit_per_user' => 1,
            ],
            [
                'code' => 'SAVE20',
                'name' => 'Save 20%',
                'description' => 'Get 20% off on orders above $100',
                'type' => 'percentage',
                'value' => 20.00,
                'min_purchase_amount' => 100.00,
                'max_discount_amount' => 500.00,
                'start_date' => now(),
                'end_date' => now()->addDays(60),
                'usage_limit' => 500,
                'usage_limit_per_user' => 3,
            ],
            [
                'code' => 'FLAT50',
                'name' => 'Flat $50 Off',
                'description' => 'Get $50 off on orders above $200',
                'type' => 'fixed',
                'value' => 50.00,
                'min_purchase_amount' => 200.00,
                'max_discount_amount' => 50.00,
                'start_date' => now()->subDays(5),
                'end_date' => now()->addDays(30),
                'usage_limit' => 200,
                'usage_limit_per_user' => 2,
            ],
            [
                'code' => 'NEWYEAR25',
                'name' => 'New Year Special',
                'description' => '25% off on all products',
                'type' => 'percentage',
                'value' => 25.00,
                'min_purchase_amount' => 150.00,
                'max_discount_amount' => 1000.00,
                'start_date' => now(),
                'end_date' => now()->addDays(45),
                'usage_limit' => 300,
                'usage_limit_per_user' => 1,
            ],
        ];

        foreach ($coupons as $couponData) {
            $existing = DB::table('coupon_codes')->where('code', $couponData['code'])->first();
            
            if ($existing) {
                DB::table('coupon_codes')->where('code', $couponData['code'])->update([
                    'name' => $couponData['name'],
                    'description' => $couponData['description'],
                    'type' => $couponData['type'],
                    'value' => $couponData['value'],
                    'min_purchase_amount' => $couponData['min_purchase_amount'],
                    'max_discount_amount' => $couponData['max_discount_amount'],
                    'start_date' => $couponData['start_date'],
                    'end_date' => $couponData['end_date'],
                    'usage_limit' => $couponData['usage_limit'],
                    'usage_limit_per_user' => $couponData['usage_limit_per_user'],
                    'is_active' => true,
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('coupon_codes')->insert([
                    'uuid' => Str::uuid()->toString(),
                    'code' => $couponData['code'],
                    'name' => $couponData['name'],
                    'description' => $couponData['description'],
                    'type' => $couponData['type'],
                    'value' => $couponData['value'],
                    'min_purchase_amount' => $couponData['min_purchase_amount'],
                    'max_discount_amount' => $couponData['max_discount_amount'],
                    'start_date' => $couponData['start_date'],
                    'end_date' => $couponData['end_date'],
                    'usage_limit' => $couponData['usage_limit'],
                    'usage_limit_per_user' => $couponData['usage_limit_per_user'],
                    'usage_count' => 0,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}

