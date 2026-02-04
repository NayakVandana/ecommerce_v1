<?php

namespace Database\Seeders;

use App\Models\CouponCode;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Carbon\Carbon;

class CouponCodeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $coupons = [
            [
                'code' => 'WELCOME10',
                'name' => 'Welcome Discount',
                'description' => '10% off on your first purchase. Minimum purchase of $50 required.',
                'type' => 'percentage',
                'value' => 10.00,
                'min_purchase_amount' => 50.00,
                'max_discount_amount' => 200.00,
                'start_date' => Carbon::now()->subDays(10),
                'end_date' => Carbon::now()->addDays(90),
                'usage_limit' => 1000,
                'usage_limit_per_user' => 1,
                'is_active' => true,
            ],
            [
                'code' => 'SAVE20',
                'name' => 'Save 20%',
                'description' => 'Get 20% off on orders above $100. Maximum discount of $500.',
                'type' => 'percentage',
                'value' => 20.00,
                'min_purchase_amount' => 100.00,
                'max_discount_amount' => 500.00,
                'start_date' => Carbon::now(),
                'end_date' => Carbon::now()->addDays(60),
                'usage_limit' => 500,
                'usage_limit_per_user' => 3,
                'is_active' => true,
            ],
            [
                'code' => 'FLAT50',
                'name' => 'Flat $50 Off',
                'description' => 'Get $50 off on orders above $200. Perfect for big purchases!',
                'type' => 'fixed',
                'value' => 50.00,
                'min_purchase_amount' => 200.00,
                'max_discount_amount' => 50.00,
                'start_date' => Carbon::now()->subDays(5),
                'end_date' => Carbon::now()->addDays(30),
                'usage_limit' => 200,
                'usage_limit_per_user' => 2,
                'is_active' => true,
            ],
            [
                'code' => 'NEWYEAR25',
                'name' => 'New Year Special',
                'description' => '25% off on all products. Limited time offer!',
                'type' => 'percentage',
                'value' => 25.00,
                'min_purchase_amount' => 150.00,
                'max_discount_amount' => 1000.00,
                'start_date' => Carbon::now(),
                'end_date' => Carbon::now()->addDays(45),
                'usage_limit' => 300,
                'usage_limit_per_user' => 1,
                'is_active' => true,
            ],
            [
                'code' => 'SUMMER15',
                'name' => 'Summer Sale',
                'description' => '15% off on all summer products. No minimum purchase required!',
                'type' => 'percentage',
                'value' => 15.00,
                'min_purchase_amount' => null,
                'max_discount_amount' => 300.00,
                'start_date' => Carbon::now(),
                'end_date' => Carbon::now()->addDays(90),
                'usage_limit' => 1000,
                'usage_limit_per_user' => 5,
                'is_active' => true,
            ],
            [
                'code' => 'FREESHIP',
                'name' => 'Free Shipping',
                'description' => 'Get free shipping on orders above $75. Flat $10 discount equivalent.',
                'type' => 'fixed',
                'value' => 10.00,
                'min_purchase_amount' => 75.00,
                'max_discount_amount' => 10.00,
                'start_date' => Carbon::now(),
                'end_date' => Carbon::now()->addDays(120),
                'usage_limit' => null,
                'usage_limit_per_user' => null,
                'is_active' => true,
            ],
            [
                'code' => 'VIP30',
                'name' => 'VIP Member Discount',
                'description' => 'Exclusive 30% off for VIP members. Maximum discount of $750.',
                'type' => 'percentage',
                'value' => 30.00,
                'min_purchase_amount' => 200.00,
                'max_discount_amount' => 750.00,
                'start_date' => Carbon::now(),
                'end_date' => Carbon::now()->addDays(180),
                'usage_limit' => 100,
                'usage_limit_per_user' => 1,
                'is_active' => true,
            ],
            [
                'code' => 'FLASH100',
                'name' => 'Flash Sale $100 Off',
                'description' => 'Limited time offer! Get $100 off on orders above $500.',
                'type' => 'fixed',
                'value' => 100.00,
                'min_purchase_amount' => 500.00,
                'max_discount_amount' => 100.00,
                'start_date' => Carbon::now(),
                'end_date' => Carbon::now()->addDays(7),
                'usage_limit' => 50,
                'usage_limit_per_user' => 1,
                'is_active' => true,
            ],
        ];

        foreach ($coupons as $couponData) {
            $coupon = CouponCode::where('code', $couponData['code'])->first();
            
            if ($coupon) {
                // Update existing coupon (preserve usage_count)
                $coupon->update([
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
                    'is_active' => $couponData['is_active'],
                ]);
                
                $this->command->info("Updated coupon: {$couponData['code']}");
            } else {
                // Create new coupon
                CouponCode::create([
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
                    'is_active' => $couponData['is_active'],
                ]);
                
                $this->command->info("Created coupon: {$couponData['code']}");
            }
        }
        
        $this->command->info('Coupon codes seeded successfully!');
    }
}

