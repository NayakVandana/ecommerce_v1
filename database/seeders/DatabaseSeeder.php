<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            ProductMediaSeeder::class,
            ProductVariationSeeder::class,
            DiscountSeeder::class,
            CouponCodeSeeder::class,
        ]);
    }
}

