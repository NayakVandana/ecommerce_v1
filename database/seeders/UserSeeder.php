<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create Admin User
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'phone' => '1234567890',
                'email_verified_at' => now(),
            ]
        );

        // Create Regular Users
        $users = [
            [
                'name' => 'John Doe',
                'email' => 'john@example.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'phone' => '1234567891',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Jane Smith',
                'email' => 'jane@example.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'phone' => '1234567892',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Bob Johnson',
                'email' => 'bob@example.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'phone' => '1234567893',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Alice Williams',
                'email' => 'alice@example.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'phone' => '1234567894',
                'email_verified_at' => now(),
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }

        // Create Delivery Boy Users
        $deliveryBoys = [
            [
                'name' => 'Rajesh Kumar',
                'email' => 'rajesh.delivery@example.com',
                'password' => Hash::make('password'),
                'role' => 'delivery_boy',
                'phone' => '9876543210',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Amit Singh',
                'email' => 'amit.delivery@example.com',
                'password' => Hash::make('password'),
                'role' => 'delivery_boy',
                'phone' => '9876543211',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Vikram Sharma',
                'email' => 'vikram.delivery@example.com',
                'password' => Hash::make('password'),
                'role' => 'delivery_boy',
                'phone' => '9876543212',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Suresh Patel',
                'email' => 'suresh.delivery@example.com',
                'password' => Hash::make('password'),
                'role' => 'delivery_boy',
                'phone' => '9876543213',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Mohan Reddy',
                'email' => 'mohan.delivery@example.com',
                'password' => Hash::make('password'),
                'role' => 'delivery_boy',
                'phone' => '9876543214',
                'email_verified_at' => now(),
            ],
        ];

        foreach ($deliveryBoys as $deliveryBoyData) {
            User::updateOrCreate(
                ['email' => $deliveryBoyData['email']],
                $deliveryBoyData
            );
        }
    }
}

