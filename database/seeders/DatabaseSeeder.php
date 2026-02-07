<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * 
     * Execution Order (Critical for variant-wise media):
     * 1. Users - Base user data
     * 2. Categories - Product categories
     * 3. Products - Product base data
     * 4. ProductVariations - Product variations (size, color, gender) 
     *    - MUST run before ProductMedia (variations must exist for media linking)
     * 5. ProductMedia - Product media with variant-wise management
     *    - Links media to variations via variation_id
     *    - Creates general media (variation_id = null) and variation-specific media
     *    - Requires variations to exist (depends on step 4)
     * 6. Discounts - Product discounts
     * 7. CouponCodes - Coupon codes
     * 8. Addresses - User addresses (requires users to exist)
     * 
     * Variant-Wise Media Flow:
     * - ProductVariationSeeder creates all variations first
     * - ProductMediaSeeder then links media to specific variations
     * - Media can be general (variation_id = null) or variation-specific (variation_id = variation.id)
     * - Frontend displays media based on selected variation
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,              // Step 1: Create users
            AddressSeeder::class,           // Step 2: Create addresses (requires users)
            CategorySeeder::class,           // Step 3: Create categories
            ProductSeeder::class,            // Step 4: Create products
            ProductVariationSeeder::class,   // Step 5: Create variations (size, color, gender) - MUST be before media
            ProductMediaSeeder::class,       // Step 6: Create media (can link to variations) - Requires variations
            DiscountSeeder::class,          // Step 7: Create discounts
            CouponCodeSeeder::class,        // Step 8: Create coupon codes
        ]);
    }
}

