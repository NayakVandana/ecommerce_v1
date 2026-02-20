<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Starting category seeding...');
        
        // Check if categories table exists and is accessible
        try {
            $categoryCount = Category::count();
            $this->command->info("Found {$categoryCount} existing categories.");
        } catch (\Exception $e) {
            $this->command->error("Error accessing categories table: " . $e->getMessage());
            $this->command->error("Please ensure the categories table exists and migrations have been run.");
            return;
        }
        
        // Ensure we have a clean state - check for any orphaned categories first
        $this->fixOrphanedCategories();
        
        // Define hierarchical category structure based on the e-commerce platform
        $categoryStructure = [
            [
                'name' => 'Fashion',
                'description' => 'Clothing and accessories for all',
                'is_featured' => true,
                'icon' => 'fa-tshirt',
                'sort_order' => 1,
                'children' => [
                    [
                        'name' => 'Men',
                        'description' => 'Men\'s fashion and accessories',
                        'icon' => 'fa-user',
                        'sort_order' => 1,
                        'children' => [
                            [
                                'name' => 'Western Wear', 
                                'description' => 'Western clothing for men', 
                                'icon' => 'fa-tshirt', 
                                'sort_order' => 1,
                                'children' => [
                                    ['name' => 'T-Shirts', 'description' => 'Men\'s t-shirts', 'sort_order' => 1],
                                    ['name' => 'Casual Shirts', 'description' => 'Casual shirts', 'sort_order' => 2],
                                    ['name' => 'Formal Shirts', 'description' => 'Formal shirts', 'sort_order' => 3],
                                    ['name' => 'Sweatshirts', 'description' => 'Sweatshirts & hoodies', 'sort_order' => 4],
                                    ['name' => 'Sweaters', 'description' => 'Sweaters & cardigans', 'sort_order' => 5],
                                    ['name' => 'Jackets', 'description' => 'Jackets & coats', 'sort_order' => 6],
                                    ['name' => 'Blazers', 'description' => 'Blazers', 'sort_order' => 7],
                                    ['name' => 'Suits', 'description' => 'Suits', 'sort_order' => 8],
                                    ['name' => 'Jeans', 'description' => 'Jeans', 'sort_order' => 9],
                                    ['name' => 'Casual Trousers', 'description' => 'Casual trousers', 'sort_order' => 10],
                                    ['name' => 'Formal Trousers', 'description' => 'Formal trousers', 'sort_order' => 11],
                                    ['name' => 'Shorts', 'description' => 'Shorts', 'sort_order' => 12],
                                    ['name' => 'Track Pants', 'description' => 'Track pants', 'sort_order' => 13],
                                ]
                            ],
                            [
                                'name' => 'Inner Wear', 
                                'description' => 'Men\'s innerwear', 
                                'icon' => 'fa-vest', 
                                'sort_order' => 2,
                                'children' => [
                                    ['name' => 'Briefs', 'description' => 'Briefs', 'sort_order' => 1],
                                    ['name' => 'Trunks', 'description' => 'Trunks', 'sort_order' => 2],
                                    ['name' => 'Boxers', 'description' => 'Boxers', 'sort_order' => 3],
                                    ['name' => 'Vests', 'description' => 'Vests', 'sort_order' => 4],
                                    ['name' => 'Thermals', 'description' => 'Thermals', 'sort_order' => 5],
                                ]
                            ],
                            [
                                'name' => 'Ethnic Wear', 
                                'description' => 'Traditional ethnic wear for men', 
                                'icon' => 'fa-tshirt', 
                                'sort_order' => 3,
                                'children' => [
                                    ['name' => 'Kurtas', 'description' => 'Kurtas', 'sort_order' => 1],
                                    ['name' => 'Kurta Sets', 'description' => 'Kurta sets', 'sort_order' => 2],
                                    ['name' => 'Sherwanis', 'description' => 'Sherwanis', 'sort_order' => 3],
                                    ['name' => 'Nehru Jackets', 'description' => 'Nehru jackets', 'sort_order' => 4],
                                ]
                            ],
                            [
                                'name' => 'Footwear', 
                                'description' => 'Men\'s shoes and footwear', 
                                'icon' => 'fa-shoe-prints', 
                                'sort_order' => 4,
                                'children' => [
                                    ['name' => 'Casual Shoes', 'description' => 'Casual shoes', 'sort_order' => 1],
                                    ['name' => 'Sports Shoes', 'description' => 'Sports shoes', 'sort_order' => 2],
                                    ['name' => 'Formal Shoes', 'description' => 'Formal shoes', 'sort_order' => 3],
                                    ['name' => 'Sneakers', 'description' => 'Sneakers', 'sort_order' => 4],
                                    ['name' => 'Sandals', 'description' => 'Sandals & floaters', 'sort_order' => 5],
                                    ['name' => 'Flip Flops', 'description' => 'Flip flops', 'sort_order' => 6],
                                    ['name' => 'Socks', 'description' => 'Socks', 'sort_order' => 7],
                                ]
                            ],
                            ['name' => 'Night & Loungewear', 'description' => 'Nightwear and loungewear', 'icon' => 'fa-bed', 'sort_order' => 5],
                            ['name' => 'Clothing Accessories', 'description' => 'Caps, sunglasses, and accessories', 'icon' => 'fa-hat-cowboy', 'sort_order' => 6],
                            [
                                'name' => 'Watches', 
                                'description' => 'Men\'s watches', 
                                'icon' => 'fa-clock', 
                                'sort_order' => 7,
                                'children' => [
                                    ['name' => 'Analog Watches', 'description' => 'Analog watches', 'sort_order' => 1],
                                    ['name' => 'Digital Watches', 'description' => 'Digital watches', 'sort_order' => 2],
                                    ['name' => 'Smart Watches', 'description' => 'Smart watches', 'sort_order' => 3],
                                ]
                            ],
                            ['name' => 'Eyewear', 'description' => 'Sunglasses and eyewear', 'icon' => 'fa-glasses', 'sort_order' => 8],
                            [
                                'name' => 'Bags, Belts & Wallets', 
                                'description' => 'Bags, belts, and wallets', 
                                'icon' => 'fa-briefcase', 
                                'sort_order' => 9,
                                'children' => [
                                    ['name' => 'Backpacks', 'description' => 'Backpacks', 'sort_order' => 1],
                                    ['name' => 'Wallets', 'description' => 'Wallets', 'sort_order' => 2],
                                    ['name' => 'Belts', 'description' => 'Belts', 'sort_order' => 3],
                                    ['name' => 'Messenger Bags', 'description' => 'Messenger bags', 'sort_order' => 4],
                                ]
                            ],
                        ]
                    ],
                    [
                        'name' => 'Women',
                        'description' => 'Women\'s fashion and accessories',
                        'icon' => 'fa-user',
                        'sort_order' => 2,
                        'children' => [
                            [
                                'name' => 'Ethnic Wear', 
                                'description' => 'Traditional ethnic wear for women', 
                                'icon' => 'fa-tshirt', 
                                'sort_order' => 1,
                                'children' => [
                                    ['name' => 'Sarees', 'description' => 'Sarees', 'sort_order' => 1],
                                    ['name' => 'Kurtas & Suits', 'description' => 'Kurtas and suits', 'sort_order' => 2],
                                    ['name' => 'Kurtis & Tunics', 'description' => 'Kurtis and tunics', 'sort_order' => 3],
                                    ['name' => 'Lehenga Cholis', 'description' => 'Lehenga cholis', 'sort_order' => 4],
                                    ['name' => 'Dress Materials', 'description' => 'Dress materials', 'sort_order' => 5],
                                    ['name' => 'Salwar & Churidars', 'description' => 'Salwar and churidars', 'sort_order' => 6],
                                    ['name' => 'Dupattas', 'description' => 'Dupattas', 'sort_order' => 7],
                                ]
                            ],
                            [
                                'name' => 'Western Wear', 
                                'description' => 'Western clothing for women', 
                                'icon' => 'fa-tshirt', 
                                'sort_order' => 2,
                                'children' => [
                                    ['name' => 'Dresses', 'description' => 'Dresses', 'sort_order' => 1],
                                    ['name' => 'Tops', 'description' => 'Tops', 'sort_order' => 2],
                                    ['name' => 'T-Shirts', 'description' => 'T-shirts', 'sort_order' => 3],
                                    ['name' => 'Jeans', 'description' => 'Jeans', 'sort_order' => 4],
                                    ['name' => 'Trousers', 'description' => 'Trousers', 'sort_order' => 5],
                                    ['name' => 'Skirts', 'description' => 'Skirts', 'sort_order' => 6],
                                    ['name' => 'Shorts', 'description' => 'Shorts', 'sort_order' => 7],
                                    ['name' => 'Jumpsuits', 'description' => 'Jumpsuits', 'sort_order' => 8],
                                    ['name' => 'Jackets', 'description' => 'Jackets & coats', 'sort_order' => 9],
                                    ['name' => 'Sweaters', 'description' => 'Sweaters', 'sort_order' => 10],
                                ]
                            ],
                            [
                                'name' => 'Footwear', 
                                'description' => 'Women\'s shoes and footwear', 
                                'icon' => 'fa-shoe-prints', 
                                'sort_order' => 3,
                                'children' => [
                                    ['name' => 'Flats', 'description' => 'Flats', 'sort_order' => 1],
                                    ['name' => 'Heels', 'description' => 'Heels', 'sort_order' => 2],
                                    ['name' => 'Casual Shoes', 'description' => 'Casual shoes', 'sort_order' => 3],
                                    ['name' => 'Boots', 'description' => 'Boots', 'sort_order' => 4],
                                    ['name' => 'Sports Shoes', 'description' => 'Sports shoes', 'sort_order' => 5],
                                    ['name' => 'Sandals', 'description' => 'Sandals', 'sort_order' => 6],
                                ]
                            ],
                            [
                                'name' => 'Bags, Belts & Wallets', 
                                'description' => 'Handbags, belts, and wallets', 
                                'icon' => 'fa-handbag', 
                                'sort_order' => 4,
                                'children' => [
                                    ['name' => 'Handbags', 'description' => 'Handbags', 'sort_order' => 1],
                                    ['name' => 'Clutches', 'description' => 'Clutches', 'sort_order' => 2],
                                    ['name' => 'Wallets', 'description' => 'Wallets', 'sort_order' => 3],
                                    ['name' => 'Backpacks', 'description' => 'Backpacks', 'sort_order' => 4],
                                    ['name' => 'Belts', 'description' => 'Belts', 'sort_order' => 5],
                                ]
                            ],
                            ['name' => 'Watches', 'description' => 'Women\'s watches', 'icon' => 'fa-clock', 'sort_order' => 5],
                            ['name' => 'Eyewear', 'description' => 'Sunglasses and eyewear', 'icon' => 'fa-glasses', 'sort_order' => 6],
                            [
                                'name' => 'Lingerie & Innerwear', 
                                'description' => 'Lingerie and innerwear', 
                                'icon' => 'fa-vest', 
                                'sort_order' => 7,
                                'children' => [
                                    ['name' => 'Bras', 'description' => 'Bras', 'sort_order' => 1],
                                    ['name' => 'Briefs', 'description' => 'Briefs', 'sort_order' => 2],
                                    ['name' => 'Shapewear', 'description' => 'Shapewear', 'sort_order' => 3],
                                    ['name' => 'Camisoles', 'description' => 'Camisoles', 'sort_order' => 4],
                                ]
                            ],
                            ['name' => 'Night & Loungewear', 'description' => 'Nightwear and loungewear', 'icon' => 'fa-bed', 'sort_order' => 8],
                            ['name' => 'Fashion Jewellery', 'description' => 'Fashion jewelry', 'icon' => 'fa-ring', 'sort_order' => 9],
                        ]
                    ],
                    [
                        'name' => 'Boys',
                        'description' => 'Boys\' fashion and accessories',
                        'icon' => 'fa-child',
                        'sort_order' => 3,
                        'children' => [
                            ['name' => 'Western Wear', 'description' => 'Western clothing for boys', 'icon' => 'fa-tshirt', 'sort_order' => 1],
                            ['name' => 'Ethnic Wear', 'description' => 'Traditional ethnic wear for boys', 'icon' => 'fa-tshirt', 'sort_order' => 2],
                            ['name' => 'Footwear', 'description' => 'Boys\' shoes and footwear', 'icon' => 'fa-shoe-prints', 'sort_order' => 3],
                            ['name' => 'Night & Loungewear', 'description' => 'Nightwear and loungewear', 'icon' => 'fa-bed', 'sort_order' => 4],
                            ['name' => 'Inner Wear', 'description' => 'Boys\' innerwear', 'icon' => 'fa-vest', 'sort_order' => 5],
                            ['name' => 'Clothing Accessories', 'description' => 'Caps, accessories', 'icon' => 'fa-hat-cowboy', 'sort_order' => 6],
                            ['name' => 'Bags, Belts & Wallets', 'description' => 'Bags, belts, and wallets', 'icon' => 'fa-briefcase', 'sort_order' => 7],
                            ['name' => 'Watches', 'description' => 'Boys\' watches', 'icon' => 'fa-clock', 'sort_order' => 8],
                            ['name' => 'Eyewear', 'description' => 'Sunglasses and eyewear', 'icon' => 'fa-glasses', 'sort_order' => 9],
                            ['name' => 'Watch Accessories', 'description' => 'Watch straps and accessories', 'icon' => 'fa-clock', 'sort_order' => 10],
                            ['name' => 'Accessories', 'description' => 'Various accessories', 'icon' => 'fa-bag-shopping', 'sort_order' => 11],
                            ['name' => 'Inner & Nightwear', 'description' => 'Innerwear and nightwear', 'icon' => 'fa-bed', 'sort_order' => 12],
                        ]
                    ],
                    [
                        'name' => 'Girls',
                        'description' => 'Girls\' fashion and accessories',
                        'icon' => 'fa-child',
                        'sort_order' => 4,
                        'children' => [
                            ['name' => 'Western Wear', 'description' => 'Western clothing for girls', 'icon' => 'fa-tshirt', 'sort_order' => 1],
                            ['name' => 'Ethnic Wear', 'description' => 'Traditional ethnic wear for girls', 'icon' => 'fa-tshirt', 'sort_order' => 2],
                            ['name' => 'Footwear', 'description' => 'Girls\' shoes and footwear', 'icon' => 'fa-shoe-prints', 'sort_order' => 3],
                            ['name' => 'Night & Loungewear', 'description' => 'Nightwear and loungewear', 'icon' => 'fa-bed', 'sort_order' => 4],
                            ['name' => 'Inner Wear', 'description' => 'Girls\' innerwear', 'icon' => 'fa-vest', 'sort_order' => 5],
                            ['name' => 'Clothing Accessories', 'description' => 'Hair accessories, accessories', 'icon' => 'fa-scarf', 'sort_order' => 6],
                            ['name' => 'Bags, Belts & Wallets', 'description' => 'Bags, belts, and wallets', 'icon' => 'fa-handbag', 'sort_order' => 7],
                            ['name' => 'Watches', 'description' => 'Girls\' watches', 'icon' => 'fa-clock', 'sort_order' => 8],
                            ['name' => 'Eyewear', 'description' => 'Sunglasses and eyewear', 'icon' => 'fa-glasses', 'sort_order' => 9],
                            ['name' => 'Watch Accessories', 'description' => 'Watch straps and accessories', 'icon' => 'fa-clock', 'sort_order' => 10],
                            ['name' => 'Inner & Nightwear', 'description' => 'Innerwear and nightwear', 'icon' => 'fa-bed', 'sort_order' => 11],
                            ['name' => 'Accessories', 'description' => 'Various accessories', 'icon' => 'fa-bag-shopping', 'sort_order' => 12],
                        ]
                    ],
                    [
                        'name' => 'Infants',
                        'description' => 'Infant clothing and accessories',
                        'icon' => 'fa-baby',
                        'sort_order' => 5,
                        'children' => [
                            ['name' => 'Western Wear', 'description' => 'Western clothing for infants', 'icon' => 'fa-tshirt', 'sort_order' => 1],
                            ['name' => 'Clothing Accessories', 'description' => 'Hats, accessories', 'icon' => 'fa-hat-cowboy', 'sort_order' => 2],
                            ['name' => 'Footwear', 'description' => 'Infant shoes', 'icon' => 'fa-shoe-prints', 'sort_order' => 3],
                            ['name' => 'Ethnic Wear', 'description' => 'Traditional ethnic wear for infants', 'icon' => 'fa-tshirt', 'sort_order' => 4],
                            ['name' => 'Night & Loungewear', 'description' => 'Nightwear and loungewear', 'icon' => 'fa-bed', 'sort_order' => 5],
                        ]
                    ],
                ]
            ],
            [
                'name' => 'Tech',
                'description' => 'Technology and smart devices',
                'is_featured' => true,
                'icon' => 'fa-laptop',
                'sort_order' => 2,
                        'children' => [
                    ['name' => 'Smart Wearables', 'description' => 'Smartwatches and fitness trackers', 'icon' => 'fa-smartwatch', 'sort_order' => 1],
                ]
            ],
            [
                'name' => 'Crafts of India',
                'description' => 'Traditional Indian crafts and handicrafts',
                'is_featured' => true,
                'icon' => 'fa-hands',
                'sort_order' => 3,
                        'children' => [
                    ['name' => 'Footwear', 'description' => 'Traditional Indian footwear', 'icon' => 'fa-shoe-prints', 'sort_order' => 1],
                    ['name' => 'Women', 'description' => 'Traditional crafts for women', 'icon' => 'fa-user', 'sort_order' => 2],
                ]
            ],
            [
                'name' => 'Mobiles & Tablets',
                'description' => 'Smartphones, tablets, and mobile accessories',
                'is_featured' => true,
                'icon' => 'fa-mobile-alt',
                'sort_order' => 4,
                        'children' => [
                    ['name' => 'Smartphones', 'description' => 'Latest smartphones', 'icon' => 'fa-mobile-alt', 'sort_order' => 1],
                    ['name' => 'Tablets', 'description' => 'Tablets and e-readers', 'icon' => 'fa-tablet-alt', 'sort_order' => 2],
                    ['name' => 'Mobile Accessories', 'description' => 'Cases, chargers, and more', 'icon' => 'fa-headphones', 'sort_order' => 3],
                ]
            ],
            [
                'name' => 'Electronics',
                'description' => 'Electronics, gadgets, and tech accessories',
                'is_featured' => true,
                'icon' => 'fa-laptop',
                'sort_order' => 5,
                'children' => [
                    ['name' => 'Laptops', 'description' => 'Laptops and notebooks', 'icon' => 'fa-laptop', 'sort_order' => 1],
                    ['name' => 'Computers', 'description' => 'Desktops and components', 'icon' => 'fa-desktop', 'sort_order' => 2],
                    ['name' => 'Audio', 'description' => 'Headphones, speakers, and audio devices', 'icon' => 'fa-headphones', 'sort_order' => 3],
                    ['name' => 'Cameras', 'description' => 'Cameras and photography equipment', 'icon' => 'fa-camera', 'sort_order' => 4],
                    ['name' => 'Gaming', 'description' => 'Gaming consoles and accessories', 'icon' => 'fa-gamepad', 'sort_order' => 5],
                ]
            ],
            [
                'name' => 'TVs & Appliances',
                'description' => 'Televisions and home appliances',
                'is_featured' => true,
                'icon' => 'fa-tv',
                'sort_order' => 6,
                'children' => [
                    ['name' => 'Televisions', 'description' => 'Smart TVs and displays', 'icon' => 'fa-tv', 'sort_order' => 1],
                    ['name' => 'Home Appliances', 'description' => 'Kitchen and home appliances', 'icon' => 'fa-blender', 'sort_order' => 2],
                    ['name' => 'Air Conditioners', 'description' => 'ACs and cooling systems', 'icon' => 'fa-wind', 'sort_order' => 3],
                ]
            ],
            [
                'name' => 'Home & Kitchen',
                'description' => 'Furniture, decor, and kitchen items',
                'is_featured' => true,
                'icon' => 'fa-home',
                'sort_order' => 7,
                'children' => [
                    ['name' => 'Furniture', 'description' => 'Home and office furniture', 'icon' => 'fa-couch', 'sort_order' => 1],
                    ['name' => 'Kitchen & Dining', 'description' => 'Kitchenware and dining sets', 'icon' => 'fa-utensils', 'sort_order' => 2],
                    ['name' => 'Home Decor', 'description' => 'Decorative items and accessories', 'icon' => 'fa-palette', 'sort_order' => 3],
                ]
            ],
            [
                'name' => 'Beauty',
                'description' => 'Skincare, makeup, and personal care',
                'is_featured' => true,
                'icon' => 'fa-spa',
                'sort_order' => 8,
                'children' => [
                    [
                        'name' => 'Skincare',
                        'description' => 'Face and body care products',
                        'icon' => 'fa-spa',
                        'sort_order' => 1,
                        'children' => [
                            ['name' => 'Cleansers', 'description' => 'Face wash and cleansers', 'icon' => 'fa-spa', 'sort_order' => 1],
                            ['name' => 'Toners', 'description' => 'Alcohol-free and herbal toners', 'icon' => 'fa-spa', 'sort_order' => 2],
                            ['name' => 'Moisturizers', 'description' => 'Day and night creams', 'icon' => 'fa-spa', 'sort_order' => 3],
                            ['name' => 'Serums', 'description' => 'Vitamin C and hyaluronic acid serums', 'icon' => 'fa-spa', 'sort_order' => 4],
                            ['name' => 'Sunscreen', 'description' => 'SPF 30 and SPF 50 sunscreens', 'icon' => 'fa-spa', 'sort_order' => 5],
                            ['name' => 'Masks & Packs', 'description' => 'Sheet masks and clay masks', 'icon' => 'fa-spa', 'sort_order' => 6],
                            ['name' => 'Scrubs & Exfoliators', 'description' => 'Face scrubs and chemical peels', 'icon' => 'fa-spa', 'sort_order' => 7],
                            ['name' => 'Eye Care', 'description' => 'Eye creams and eye gels', 'icon' => 'fa-spa', 'sort_order' => 8],
                            ['name' => 'Lip Care', 'description' => 'Lip balms and lip scrubs', 'icon' => 'fa-spa', 'sort_order' => 9],
                        ]
                    ],
                    [
                        'name' => 'Makeup',
                        'description' => 'Cosmetics and makeup products',
                        'icon' => 'fa-palette',
                        'sort_order' => 2,
                        'children' => [
                            [
                                'name' => 'Face Makeup',
                                'description' => 'Foundation, concealer, and face products',
                                'icon' => 'fa-palette',
                                'sort_order' => 1,
                                'children' => [
                                    ['name' => 'Foundation', 'description' => 'Liquid, stick, and powder foundation', 'icon' => 'fa-palette', 'sort_order' => 1],
                                    ['name' => 'Concealer', 'description' => 'Cream and liquid concealer', 'icon' => 'fa-palette', 'sort_order' => 2],
                                    ['name' => 'Primer', 'description' => 'Matte and hydrating primer', 'icon' => 'fa-palette', 'sort_order' => 3],
                                    ['name' => 'Compact / Setting Powder', 'description' => 'Setting and compact powders', 'icon' => 'fa-palette', 'sort_order' => 4],
                                    ['name' => 'Blush', 'description' => 'Cream and powder blush', 'icon' => 'fa-palette', 'sort_order' => 5],
                                    ['name' => 'Bronzer', 'description' => 'Bronzing powders and creams', 'icon' => 'fa-palette', 'sort_order' => 6],
                                    ['name' => 'Highlighter', 'description' => 'Highlighting products', 'icon' => 'fa-palette', 'sort_order' => 7],
                                    ['name' => 'BB / CC Cream', 'description' => 'BB and CC creams', 'icon' => 'fa-palette', 'sort_order' => 8],
                                ]
                            ],
                            [
                                'name' => 'Eye Makeup',
                                'description' => 'Eye cosmetics and products',
                                'icon' => 'fa-palette',
                                'sort_order' => 2,
                                'children' => [
                                    ['name' => 'Kajal', 'description' => 'Kajal pencils and liners', 'icon' => 'fa-palette', 'sort_order' => 1],
                                    ['name' => 'Eyeliner', 'description' => 'Pen, gel, and liquid eyeliners', 'icon' => 'fa-palette', 'sort_order' => 2],
                                    ['name' => 'Mascara', 'description' => 'Waterproof and volumizing mascara', 'icon' => 'fa-palette', 'sort_order' => 3],
                                    ['name' => 'Eyeshadow', 'description' => 'Eyeshadow palettes and singles', 'icon' => 'fa-palette', 'sort_order' => 4],
                                    ['name' => 'Eyebrow', 'description' => 'Eyebrow pencils and gels', 'icon' => 'fa-palette', 'sort_order' => 5],
                                    ['name' => 'False Lashes', 'description' => 'False eyelashes and accessories', 'icon' => 'fa-palette', 'sort_order' => 6],
                                ]
                            ],
                            [
                                'name' => 'Lip Makeup',
                                'description' => 'Lip cosmetics and products',
                                'icon' => 'fa-palette',
                                'sort_order' => 3,
                                'children' => [
                                    ['name' => 'Lipstick', 'description' => 'Matte, glossy, and liquid lipsticks', 'icon' => 'fa-palette', 'sort_order' => 1],
                                    ['name' => 'Lip Gloss', 'description' => 'Lip gloss products', 'icon' => 'fa-palette', 'sort_order' => 2],
                                    ['name' => 'Lip Liner', 'description' => 'Lip liner pencils', 'icon' => 'fa-palette', 'sort_order' => 3],
                                    ['name' => 'Lip Tint', 'description' => 'Lip tint products', 'icon' => 'fa-palette', 'sort_order' => 4],
                                ]
                            ],
                            [
                                'name' => 'Nail Makeup',
                                'description' => 'Nail care and polish',
                                'icon' => 'fa-palette',
                                'sort_order' => 4,
                                'children' => [
                                    ['name' => 'Nail Polish', 'description' => 'Nail polish colors', 'icon' => 'fa-palette', 'sort_order' => 1],
                                    ['name' => 'Nail Art', 'description' => 'Nail art accessories', 'icon' => 'fa-palette', 'sort_order' => 2],
                                    ['name' => 'Nail Remover', 'description' => 'Nail polish removers', 'icon' => 'fa-palette', 'sort_order' => 3],
                                ]
                            ],
                        ]
                    ],
                    [
                        'name' => 'Hair Care',
                        'description' => 'Hair care products',
                        'icon' => 'fa-spa',
                        'sort_order' => 3,
                        'children' => [
                            ['name' => 'Shampoo', 'description' => 'Anti-dandruff and herbal shampoos', 'icon' => 'fa-spa', 'sort_order' => 1],
                            ['name' => 'Conditioner', 'description' => 'Smoothening and repair conditioners', 'icon' => 'fa-spa', 'sort_order' => 2],
                            ['name' => 'Hair Oil', 'description' => 'Coconut and argan hair oils', 'icon' => 'fa-spa', 'sort_order' => 3],
                            ['name' => 'Hair Serum', 'description' => 'Hair serums and treatments', 'icon' => 'fa-spa', 'sort_order' => 4],
                            ['name' => 'Hair Mask', 'description' => 'Hair masks and deep conditioners', 'icon' => 'fa-spa', 'sort_order' => 5],
                            ['name' => 'Hair Cream', 'description' => 'Hair creams and styling products', 'icon' => 'fa-spa', 'sort_order' => 6],
                            ['name' => 'Hair Color / Dye', 'description' => 'Hair coloring products', 'icon' => 'fa-spa', 'sort_order' => 7],
                            ['name' => 'Styling Products', 'description' => 'Gel, wax, and spray styling products', 'icon' => 'fa-spa', 'sort_order' => 8],
                        ]
                    ],
                    [
                        'name' => 'Bath & Body',
                        'description' => 'Body care and bath products',
                        'icon' => 'fa-spa',
                        'sort_order' => 4,
                        'children' => [
                            ['name' => 'Body Wash / Shower Gel', 'description' => 'Body washes and shower gels', 'icon' => 'fa-spa', 'sort_order' => 1],
                            ['name' => 'Soap', 'description' => 'Bath soaps', 'icon' => 'fa-spa', 'sort_order' => 2],
                            ['name' => 'Body Scrub', 'description' => 'Body scrubs and exfoliators', 'icon' => 'fa-spa', 'sort_order' => 3],
                            ['name' => 'Body Lotion', 'description' => 'Body lotions and moisturizers', 'icon' => 'fa-spa', 'sort_order' => 4],
                            ['name' => 'Body Butter', 'description' => 'Body butters and creams', 'icon' => 'fa-spa', 'sort_order' => 5],
                            ['name' => 'Body Mist', 'description' => 'Body mists and sprays', 'icon' => 'fa-spa', 'sort_order' => 6],
                            ['name' => 'Bath Salt', 'description' => 'Bath salts and bath products', 'icon' => 'fa-spa', 'sort_order' => 7],
                        ]
                    ],
                    [
                        'name' => 'Personal Care',
                        'description' => 'Personal hygiene and care products',
                        'icon' => 'fa-spa',
                        'sort_order' => 5,
                        'children' => [
                            ['name' => 'Deodorant', 'description' => 'Deodorants and antiperspirants', 'icon' => 'fa-spa', 'sort_order' => 1],
                            ['name' => 'Perfume', 'description' => 'Perfumes and fragrances', 'icon' => 'fa-spa', 'sort_order' => 2],
                            ['name' => 'Feminine Hygiene', 'description' => 'Feminine care products', 'icon' => 'fa-spa', 'sort_order' => 3],
                            ['name' => 'Oral Care', 'description' => 'Toothpaste and mouthwash', 'icon' => 'fa-spa', 'sort_order' => 4],
                            ['name' => 'Hand & Foot Care', 'description' => 'Hand and foot care products', 'icon' => 'fa-spa', 'sort_order' => 5],
                            ['name' => 'Intimate Care', 'description' => 'Intimate hygiene products', 'icon' => 'fa-spa', 'sort_order' => 6],
                        ]
                    ],
                    [
                        'name' => 'Men\'s Grooming',
                        'description' => 'Men\'s grooming and care products',
                        'icon' => 'fa-user',
                        'sort_order' => 6,
                        'children' => [
                            ['name' => 'Beard Care', 'description' => 'Beard oil and beard balm', 'icon' => 'fa-user', 'sort_order' => 1],
                            ['name' => 'Face Care', 'description' => 'Face wash and moisturizer for men', 'icon' => 'fa-user', 'sort_order' => 2],
                            ['name' => 'Shaving', 'description' => 'Shaving cream, razor, and after shave', 'icon' => 'fa-user', 'sort_order' => 3],
                            ['name' => 'Hair Styling', 'description' => 'Hair gel and wax for men', 'icon' => 'fa-user', 'sort_order' => 4],
                        ]
                    ],
                    [
                        'name' => 'Fragrance',
                        'description' => 'Perfumes and fragrances',
                        'icon' => 'fa-spray-can',
                        'sort_order' => 7,
                        'children' => [
                            ['name' => 'Perfume', 'description' => 'Men, women, and unisex perfumes', 'icon' => 'fa-spray-can', 'sort_order' => 1],
                            ['name' => 'Body Spray', 'description' => 'Body sprays and mists', 'icon' => 'fa-spray-can', 'sort_order' => 2],
                            ['name' => 'Roll-on', 'description' => 'Roll-on deodorants and perfumes', 'icon' => 'fa-spray-can', 'sort_order' => 3],
                            ['name' => 'Attar', 'description' => 'Traditional attars and perfumes', 'icon' => 'fa-spray-can', 'sort_order' => 4],
                        ]
                    ],
                    [
                        'name' => 'Beauty Tools & Accessories',
                        'description' => 'Beauty tools and accessories',
                        'icon' => 'fa-spa',
                        'sort_order' => 8,
                        'children' => [
                            ['name' => 'Makeup Brushes', 'description' => 'Makeup brushes and tools', 'icon' => 'fa-spa', 'sort_order' => 1],
                            ['name' => 'Beauty Sponge', 'description' => 'Beauty sponges and blenders', 'icon' => 'fa-spa', 'sort_order' => 2],
                            ['name' => 'Hair Dryer', 'description' => 'Hair dryers and styling tools', 'icon' => 'fa-spa', 'sort_order' => 3],
                            ['name' => 'Straightener / Curler', 'description' => 'Hair straighteners and curlers', 'icon' => 'fa-spa', 'sort_order' => 4],
                            ['name' => 'Trimmer', 'description' => 'Hair trimmers and clippers', 'icon' => 'fa-spa', 'sort_order' => 5],
                            ['name' => 'Facial Roller', 'description' => 'Facial rollers and gua sha tools', 'icon' => 'fa-spa', 'sort_order' => 6],
                            ['name' => 'Mirrors', 'description' => 'Beauty mirrors and accessories', 'icon' => 'fa-spa', 'sort_order' => 7],
                        ]
                    ],
                    [
                        'name' => 'Herbal / Organic',
                        'description' => 'Herbal and organic beauty products',
                        'icon' => 'fa-spa',
                        'sort_order' => 9,
                        'children' => [
                            ['name' => 'Ayurvedic Skincare', 'description' => 'Ayurvedic skincare products', 'icon' => 'fa-spa', 'sort_order' => 1],
                            ['name' => 'Herbal Hair Care', 'description' => 'Herbal hair care products', 'icon' => 'fa-spa', 'sort_order' => 2],
                            ['name' => 'Natural Soaps', 'description' => 'Natural and organic soaps', 'icon' => 'fa-spa', 'sort_order' => 3],
                            ['name' => 'Essential Oils', 'description' => 'Essential oils and aromatherapy', 'icon' => 'fa-spa', 'sort_order' => 4],
                        ]
                    ],
                    [
                        'name' => 'Baby Care',
                        'description' => 'Baby care and hygiene products',
                        'icon' => 'fa-spa',
                        'sort_order' => 10,
                        'children' => [
                            ['name' => 'Baby Shampoo', 'description' => 'Baby shampoos', 'icon' => 'fa-spa', 'sort_order' => 1],
                            ['name' => 'Baby Lotion', 'description' => 'Baby lotions and moisturizers', 'icon' => 'fa-spa', 'sort_order' => 2],
                            ['name' => 'Baby Soap', 'description' => 'Baby soaps', 'icon' => 'fa-spa', 'sort_order' => 3],
                            ['name' => 'Baby Oil', 'description' => 'Baby oils', 'icon' => 'fa-spa', 'sort_order' => 4],
                            ['name' => 'Diapers', 'description' => 'Baby diapers', 'icon' => 'fa-spa', 'sort_order' => 5],
                            ['name' => 'Baby Cream', 'description' => 'Baby creams and skincare', 'icon' => 'fa-spa', 'sort_order' => 6],
                        ]
                    ],
                ]
            ],
            [
                'name' => 'Jewellery',
                'description' => 'Jewelry and accessories for all',
                'is_featured' => true,
                'icon' => 'fa-ring',
                'sort_order' => 9,
                'children' => [
                    [
                        'name' => 'Fashion Jewellery',
                        'description' => 'Fashion jewelry',
                        'icon' => 'fa-ring',
                        'sort_order' => 1,
                        'children' => [
                            ['name' => 'Necklaces', 'description' => 'Necklaces and chains', 'sort_order' => 1],
                            ['name' => 'Earrings', 'description' => 'Earrings and studs', 'sort_order' => 2],
                            ['name' => 'Rings', 'description' => 'Rings and bands', 'sort_order' => 3],
                            ['name' => 'Bracelets', 'description' => 'Bracelets and bangles', 'sort_order' => 4],
                            ['name' => 'Anklets', 'description' => 'Anklets', 'sort_order' => 5],
                            ['name' => 'Pendants', 'description' => 'Pendants and lockets', 'sort_order' => 6],
                            ['name' => 'Hair Accessories', 'description' => 'Hair pins and clips', 'sort_order' => 7],
                            ['name' => 'Brooches', 'description' => 'Brooches and pins', 'sort_order' => 8],
                        ]
                    ],
                    [
                        'name' => 'Fine Jewellery',
                        'description' => 'Fine jewelry with precious metals and stones',
                        'icon' => 'fa-gem',
                        'sort_order' => 2,
                        'children' => [
                            ['name' => 'Gold Jewellery', 'description' => 'Gold jewelry', 'sort_order' => 1],
                            ['name' => 'Silver Jewellery', 'description' => 'Silver jewelry', 'sort_order' => 2],
                            ['name' => 'Diamond Jewellery', 'description' => 'Diamond jewelry', 'sort_order' => 3],
                            ['name' => 'Pearl Jewellery', 'description' => 'Pearl jewelry', 'sort_order' => 4],
                            ['name' => 'Gemstone Jewellery', 'description' => 'Gemstone jewelry', 'sort_order' => 5],
                        ]
                    ],
                    [
                        'name' => 'Men\'s Jewellery',
                        'description' => 'Jewelry for men',
                        'icon' => 'fa-ring',
                        'sort_order' => 3,
                        'children' => [
                            ['name' => 'Men\'s Rings', 'description' => 'Rings for men', 'sort_order' => 1],
                            ['name' => 'Men\'s Chains', 'description' => 'Chains and necklaces for men', 'sort_order' => 2],
                            ['name' => 'Men\'s Bracelets', 'description' => 'Bracelets for men', 'sort_order' => 3],
                            ['name' => 'Men\'s Watches', 'description' => 'Watches for men', 'sort_order' => 4],
                        ]
                    ],
                    [
                        'name' => 'Kids Jewellery',
                        'description' => 'Jewelry for kids',
                        'icon' => 'fa-ring',
                        'sort_order' => 4,
                        'children' => [
                            ['name' => 'Kids Necklaces', 'description' => 'Necklaces for kids', 'sort_order' => 1],
                            ['name' => 'Kids Earrings', 'description' => 'Earrings for kids', 'sort_order' => 2],
                            ['name' => 'Kids Bracelets', 'description' => 'Bracelets for kids', 'sort_order' => 3],
                            ['name' => 'Kids Rings', 'description' => 'Rings for kids', 'sort_order' => 4],
                        ]
                    ],
                ]
            ],
            [
                'name' => 'Sports',
                'description' => 'Fitness and outdoor gear',
                'is_featured' => true,
                'icon' => 'fa-dumbbell',
                'sort_order' => 10,
                'children' => [
                    ['name' => 'Fitness Equipment', 'description' => 'Gym and fitness equipment', 'icon' => 'fa-dumbbell', 'sort_order' => 1],
                    ['name' => 'Outdoor Sports', 'description' => 'Outdoor and adventure gear', 'icon' => 'fa-mountain', 'sort_order' => 2],
                    ['name' => 'Sports Apparel', 'description' => 'Activewear and sports clothing', 'icon' => 'fa-tshirt', 'sort_order' => 3],
                ]
            ],
            [
                'name' => 'Books',
                'description' => 'Fiction, non-fiction, and educational books',
                'is_featured' => false,
                'icon' => 'fa-book',
                'sort_order' => 11,
                'children' => [
                    ['name' => 'Fiction', 'description' => 'Fiction books and novels', 'icon' => 'fa-book', 'sort_order' => 1],
                    ['name' => 'Non-Fiction', 'description' => 'Non-fiction and educational books', 'icon' => 'fa-book', 'sort_order' => 2],
                    ['name' => 'Academic', 'description' => 'Textbooks and academic materials', 'icon' => 'fa-graduation-cap', 'sort_order' => 3],
                ]
            ],
            [
                'name' => 'Groceries',
                'description' => 'Food items and daily essentials',
                'is_featured' => true,
                'icon' => 'fa-shopping-cart',
                'sort_order' => 12,
                'children' => [
                    ['name' => 'Food & Beverages', 'description' => 'Food and drinks', 'icon' => 'fa-utensils', 'sort_order' => 1],
                    ['name' => 'Snacks', 'description' => 'Snacks and munchies', 'icon' => 'fa-cookie', 'sort_order' => 2],
                    ['name' => 'Dairy Products', 'description' => 'Milk, cheese, and dairy', 'icon' => 'fa-milk', 'sort_order' => 3],
                ]
            ],
        ];

        $createdCount = 0;
        $updatedCount = 0;
        $initialCount = Category::count();

        // Create categories hierarchically
        foreach ($categoryStructure as $mainCategory) {
            try {
                $parent = $this->createOrUpdateCategory($mainCategory, null);
                
                if (!$parent) {
                    $this->command->error("Failed to create main category: {$mainCategory['name']}");
                    continue;
                }
                
                // Create subcategories (level 2)
                if (isset($mainCategory['children']) && is_array($mainCategory['children'])) {
                    foreach ($mainCategory['children'] as $subCategory) {
                        try {
                            $subParent = $this->createOrUpdateCategory($subCategory, $parent->id);
                            
                            if (!$subParent) {
                                $this->command->warn("Failed to create subcategory: {$subCategory['name']}");
                                continue;
                            }
                            
                            // Create sub-subcategories (level 3)
                            if (isset($subCategory['children']) && is_array($subCategory['children'])) {
                                foreach ($subCategory['children'] as $subSubCategory) {
                                    try {
                                        $subSubParent = $this->createOrUpdateCategory($subSubCategory, $subParent->id);
                                        
                                        if (!$subSubParent) {
                                            $this->command->warn("Failed to create sub-subcategory: {$subSubCategory['name']}");
                                            continue;
                                        }
                                        
                                        // Create sub-sub-subcategories (level 4)
                                        if (isset($subSubCategory['children']) && is_array($subSubCategory['children'])) {
                                            foreach ($subSubCategory['children'] as $subSubSubCategory) {
                                                try {
                                                    $this->createOrUpdateCategory($subSubSubCategory, $subSubParent->id);
                                                } catch (\Exception $e) {
                                                    $this->command->error("Error creating sub-sub-subcategory '{$subSubSubCategory['name']}': " . $e->getMessage());
                                                }
                                            }
                                        }
                                    } catch (\Exception $e) {
                                        $this->command->error("Error creating sub-subcategory '{$subSubCategory['name']}': " . $e->getMessage());
                                    }
                                }
                            }
                        } catch (\Exception $e) {
                            $this->command->error("Error creating subcategory '{$subCategory['name']}': " . $e->getMessage());
                        }
                    }
                }
            } catch (\Exception $e) {
                $this->command->error("Error creating main category '{$mainCategory['name']}': " . $e->getMessage());
            }
        }
        
        $finalCount = Category::count();
        $newCategories = $finalCount - $initialCount;
        
        $this->command->info("Category seeding completed!");
        $this->command->info("Total categories in database: {$finalCount}");
        if ($newCategories > 0) {
            $this->command->info("New categories created: {$newCategories}");
        }
        
        // Verify hierarchy integrity
        $this->verifyHierarchy();
    }
    
    /**
     * Fix orphaned categories (categories with invalid parent_id)
     */
    private function fixOrphanedCategories(): void
    {
        $categories = Category::whereNotNull('parent_id')->get();
        $fixedCount = 0;
        
        foreach ($categories as $category) {
            $parent = Category::find($category->parent_id);
            if (!$parent) {
                // Parent doesn't exist, convert to main category
                $category->update(['parent_id' => null]);
                $fixedCount++;
                $this->command->warn("Fixed orphaned category: {$category->name} (converted to main category)");
            }
        }
        
        if ($fixedCount > 0) {
            $this->command->info("Fixed {$fixedCount} orphaned categories.");
        }
    }
    
    /**
     * Verify category hierarchy integrity
     */
    private function verifyHierarchy(): void
    {
        $categories = Category::all();
        $orphanedCategories = [];

        foreach ($categories as $category) {
            if ($category->parent_id !== null) {
                $parent = Category::find($category->parent_id);
                if (!$parent) {
                    $orphanedCategories[] = $category;
                }
            }
        }
        
        if (count($orphanedCategories) > 0) {
            $this->command->warn("Found " . count($orphanedCategories) . " orphaned categories (parent not found):");
            foreach ($orphanedCategories as $orphan) {
                $this->command->warn("  - {$orphan->name} (ID: {$orphan->id}, Parent ID: {$orphan->parent_id})");
            }
        } else {
            $this->command->info("Category hierarchy verified: All categories have valid parent relationships.");
        }
    }

    /**
     * Create or update a category
     * Handles cases where category doesn't exist or needs updating
     */
    private function createOrUpdateCategory(array $categoryData, ?int $parentId = null): ?Category
    {
        try {
            // Check if parent exists (if parent_id is provided)
            if ($parentId !== null) {
                $parent = Category::find($parentId);
                if (!$parent) {
                    $this->command->warn("Warning: Parent category with ID {$parentId} not found for '{$categoryData['name']}'. Creating as main category.");
                    $parentId = null; // Fallback to main category
                }
            }
            
            // Try to find existing category by name AND parent_id (to handle duplicate names in different branches)
            $existing = Category::where('name', $categoryData['name'])
                ->where('parent_id', $parentId)
                ->first();
            
            // Generate base slug
            $baseSlug = Str::slug($categoryData['name']);
            $slug = $baseSlug;
            
            if ($existing) {
                // Category exists with same name and parent_id - update it
                $data = [
                    'name' => $categoryData['name'],
                    'slug' => $existing->slug, // Keep existing slug
                    'description' => $categoryData['description'] ?? null,
                    'is_featured' => $categoryData['is_featured'] ?? false,
                    'parent_id' => $parentId,
                    'icon' => $categoryData['icon'] ?? null,
                    'sort_order' => $categoryData['sort_order'] ?? 0,
                ];
                $existing->update($data);
                $this->command->info("Updated category: {$categoryData['name']}");
                return $existing;
            } else {
                // Category doesn't exist with this name+parent combination
                // Check if slug already exists - if so, make it unique
                $slugCounter = 1;
                while (Category::where('slug', $slug)->exists()) {
                    $slug = $baseSlug . '-' . $slugCounter;
                    $slugCounter++;
            }
            
                // Create new category
            $data = [
                    'uuid' => Str::uuid()->toString(),
                'name' => $categoryData['name'],
                'slug' => $slug,
                'description' => $categoryData['description'] ?? null,
                'is_featured' => $categoryData['is_featured'] ?? false,
                'parent_id' => $parentId,
                'icon' => $categoryData['icon'] ?? null,
                'sort_order' => $categoryData['sort_order'] ?? 0,
            ];
            
                $category = Category::create($data);
                $this->command->info("Created category: {$categoryData['name']}" . ($parentId ? " (under parent ID: {$parentId})" : " (main category)") . " with slug: {$slug}");
                return $category;
            }
        } catch (\Exception $e) {
            $this->command->error("Error creating/updating category '{$categoryData['name']}': " . $e->getMessage());
            return null;
        }
    }
}
