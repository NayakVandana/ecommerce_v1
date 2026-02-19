<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Fabric;

class FabricSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Seeds the master fabrics table with common fabric types.
     */
    public function run(): void
    {
        $fabrics = [
            ['fabric_name' => 'Cotton', 'description' => '100% Pure Cotton, Breathable and comfortable', 'sort_order' => 1],
            ['fabric_name' => 'Polyester', 'description' => 'Durable and wrinkle-resistant', 'sort_order' => 2],
            ['fabric_name' => 'Silk', 'description' => 'Premium silk fabric, smooth and luxurious', 'sort_order' => 3],
            ['fabric_name' => 'Linen', 'description' => 'Natural linen, cool and breathable', 'sort_order' => 4],
            ['fabric_name' => 'Wool', 'description' => 'Warm and cozy wool fabric', 'sort_order' => 5],
            ['fabric_name' => 'Denim', 'description' => 'Classic denim fabric, durable and stylish', 'sort_order' => 6],
            ['fabric_name' => 'Rayon', 'description' => 'Soft and smooth rayon fabric', 'sort_order' => 7],
            ['fabric_name' => 'Chiffon', 'description' => 'Light and flowy chiffon fabric', 'sort_order' => 8],
            ['fabric_name' => 'Georgette', 'description' => 'Elegant georgette fabric', 'sort_order' => 9],
            ['fabric_name' => 'Crepe', 'description' => 'Textured crepe fabric with elegant drape', 'sort_order' => 10],
            ['fabric_name' => 'Satin', 'description' => 'Smooth and glossy satin fabric', 'sort_order' => 11],
            ['fabric_name' => 'Velvet', 'description' => 'Luxurious velvet fabric with soft texture', 'sort_order' => 12],
            ['fabric_name' => 'Jersey', 'description' => 'Soft and stretchy jersey fabric', 'sort_order' => 13],
            ['fabric_name' => 'Organza', 'description' => 'Sheer and crisp organza fabric', 'sort_order' => 14],
            ['fabric_name' => 'Taffeta', 'description' => 'Crisp and smooth taffeta fabric', 'sort_order' => 15],
            ['fabric_name' => 'Brocade', 'description' => 'Rich decorative brocade fabric', 'sort_order' => 16],
            ['fabric_name' => 'Muslin', 'description' => 'Lightweight and breathable muslin fabric', 'sort_order' => 17],
            ['fabric_name' => 'Canvas', 'description' => 'Heavy-duty canvas fabric', 'sort_order' => 18],
            ['fabric_name' => 'Twill', 'description' => 'Durable twill weave fabric', 'sort_order' => 19],
            ['fabric_name' => 'Corduroy', 'description' => 'Textured corduroy fabric with ridges', 'sort_order' => 20],
        ];

        foreach ($fabrics as $fabric) {
            Fabric::updateOrCreate(
                ['fabric_name' => $fabric['fabric_name']],
                [
                    'description' => $fabric['description'],
                    'sort_order' => $fabric['sort_order'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Fabrics seeded successfully!');
    }
}
