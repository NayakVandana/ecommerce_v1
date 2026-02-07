<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\UserAddress;
use App\Models\User;

class AddressSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all users
        $users = User::all();
        
        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please run UserSeeder first.');
            return;
        }

        $this->command->info('Starting address seeding...');

        foreach ($users as $user) {
            // Create default address for each user
            $addressData = [
                'user_id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone ?? '1234567890',
                'address' => $this->getAddressForUser($user->email),
                'city' => $this->getCityForUser($user->email),
                'postal_code' => $this->getPostalCodeForUser($user->email),
                'country' => 'USA',
                'address_type' => 'home',
                'is_default' => true,
            ];

            // Check if default address already exists
            $existingDefault = UserAddress::where('user_id', $user->id)
                ->where('is_default', true)
                ->first();

            if (!$existingDefault) {
                UserAddress::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'is_default' => true,
                    ],
                    $addressData
                );
            }

            // Create additional addresses for some users
            if (in_array($user->email, ['john@example.com', 'jane@example.com'])) {
                $workAddress = [
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'phone' => $user->phone ?? '1234567890',
                    'address' => $this->getWorkAddressForUser($user->email),
                    'city' => $this->getCityForUser($user->email),
                    'postal_code' => $this->getPostalCodeForUser($user->email),
                    'country' => 'USA',
                    'address_type' => 'work',
                    'is_default' => false,
                ];

                UserAddress::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'address_type' => 'work',
                    ],
                    $workAddress
                );
            }
        }

        $addressCount = UserAddress::count();
        $this->command->info("Seeded {$addressCount} addresses successfully.");
    }

    private function getAddressForUser(string $email): string
    {
        $addresses = [
            'admin@example.com' => '123 Admin Street',
            'john@example.com' => '456 Main Street',
            'jane@example.com' => '789 Oak Avenue',
            'bob@example.com' => '321 Pine Road',
            'alice@example.com' => '654 Elm Street',
        ];

        return $addresses[$email] ?? '123 Default Street';
    }

    private function getWorkAddressForUser(string $email): string
    {
        $addresses = [
            'john@example.com' => '100 Business Plaza, Suite 200',
            'jane@example.com' => '200 Corporate Center, Floor 5',
        ];

        return $addresses[$email] ?? '100 Business Street';
    }

    private function getCityForUser(string $email): string
    {
        $cities = [
            'admin@example.com' => 'Admin City',
            'john@example.com' => 'New York',
            'jane@example.com' => 'Los Angeles',
            'bob@example.com' => 'Chicago',
            'alice@example.com' => 'Houston',
        ];

        return $cities[$email] ?? 'Default City';
    }

    private function getPostalCodeForUser(string $email): string
    {
        $postalCodes = [
            'admin@example.com' => '12345',
            'john@example.com' => '10001',
            'jane@example.com' => '90001',
            'bob@example.com' => '60601',
            'alice@example.com' => '77001',
        ];

        return $postalCodes[$email] ?? '12345';
    }
}
