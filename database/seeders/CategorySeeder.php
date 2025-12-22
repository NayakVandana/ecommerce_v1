<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Electronics', 'description' => 'Phones, laptops, and gadgets', 'is_featured' => true],
            ['name' => 'Fashion', 'description' => 'Clothing and accessories', 'is_featured' => true],
            ['name' => 'Home & Kitchen', 'description' => 'Furniture and appliances', 'is_featured' => true],
            ['name' => 'Beauty', 'description' => 'Skincare, makeup, and more'],
            ['name' => 'Sports', 'description' => 'Fitness and outdoor gear'],
            ['name' => 'Books', 'description' => 'Fiction, non-fiction, and more'],
        ];

        foreach ($categories as $category) {
            $existing = Category::where('slug', Str::slug($category['name']))->first();
            
            if ($existing) {
                $existing->update([
                    'name' => $category['name'],
                    'description' => $category['description'] ?? null,
                    'is_featured' => $category['is_featured'] ?? false,
                ]);
            } else {
                Category::create([
                    'uuid' => Str::uuid()->toString(),
                    'name' => $category['name'],
                    'slug' => Str::slug($category['name']),
                    'description' => $category['description'] ?? null,
                    'is_featured' => $category['is_featured'] ?? false,
                ]);
            }
        }
    }
}

