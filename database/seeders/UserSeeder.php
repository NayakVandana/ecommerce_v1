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
                'address' => '123 Admin Street',
                'city' => 'Admin City',
                'postal_code' => '12345',
                'country' => 'USA',
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
                'address' => '456 Main Street',
                'city' => 'New York',
                'postal_code' => '10001',
                'country' => 'USA',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Jane Smith',
                'email' => 'jane@example.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'phone' => '1234567892',
                'address' => '789 Oak Avenue',
                'city' => 'Los Angeles',
                'postal_code' => '90001',
                'country' => 'USA',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Bob Johnson',
                'email' => 'bob@example.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'phone' => '1234567893',
                'address' => '321 Pine Road',
                'city' => 'Chicago',
                'postal_code' => '60601',
                'country' => 'USA',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Alice Williams',
                'email' => 'alice@example.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'phone' => '1234567894',
                'address' => '654 Elm Street',
                'city' => 'Houston',
                'postal_code' => '77001',
                'country' => 'USA',
                'email_verified_at' => now(),
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }
}

