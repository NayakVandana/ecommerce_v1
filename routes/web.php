<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Admin\AdminOrderController;

/*
|--------------------------------------------------------------------------
| Web Routes - Inertia.js Only
|--------------------------------------------------------------------------
|
| All web routes return Inertia.js responses for SPA experience.
| 
| IMPORTANT: 
| - This file ONLY contains GET routes that render Inertia pages
| - ALL API endpoints (POST/PUT/DELETE/PATCH) MUST be in api.php, NOT here
| - Frontend will call API endpoints from api.php for all data operations
|
*/

Route::get('/', function () {
    return Inertia::render('Home');
})->name('home');

// Product Routes
Route::get('/products/{id}', function ($id) {
    return Inertia::render('Products/Show', [
        'id' => $id
    ]);
})->name('products.show');

// Category Routes
Route::get('/categories', function () {
    return Inertia::render('Categories/Index');
})->name('categories.index');

Route::get('/categories/{slug}', function ($slug) {
    return Inertia::render('Categories/Show', [
        'slug' => $slug
    ]);
})->name('categories.show');

// Cart Route (public - works with both authenticated users and guest sessions)
Route::get('/cart', function () {
    return Inertia::render('Cart/Index');
})->name('cart.index');

// Recently Viewed Products Route (public - works with both authenticated users and guest sessions)
Route::get('/recently-viewed', function () {
    return Inertia::render('RecentlyViewed/Index');
})->name('recently-viewed.index');

// Wishlist Route (public - works with both authenticated users and guest sessions)
Route::get('/wishlist', function () {
    return Inertia::render('Wishlist/Index');
})->name('wishlist.index');

// Protected Routes (require authentication)
Route::middleware('auth')->group(function () {
    // Checkout Routes
    Route::get('/checkout', function () {
        return Inertia::render('Checkout/Index');
    })->name('checkout.index');

    // Order Routes
    Route::get('/orders', function () {
        return Inertia::render('Orders/Index');
    })->name('orders.index');

    Route::get('/orders/{id}', function ($id) {
        return Inertia::render('Orders/Show', [
            'id' => $id
        ]);
    })->name('orders.show');
    
    // Profile Routes
    Route::get('/profile', function () {
        return Inertia::render('Profile/Index');
    })->name('profile.index');
    
    // Address Routes
    Route::get('/addresses', function () {
        return Inertia::render('Addresses/Index');
    })->name('addresses.index');
    
    // Delivery Boy Dashboard
    Route::get('/delivery-boy', function () {
        return Inertia::render('DeliveryBoy/Index');
    })->name('delivery-boy.dashboard');
});

// Static Pages
Route::get('/about', function () {
    return Inertia::render('About');
})->name('about');

Route::get('/contact', function () {
    return Inertia::render('Contact');
})->name('contact');

Route::get('/faq', function () {
    return Inertia::render('FAQ');
})->name('faq');

Route::get('/shipping', function () {
    return Inertia::render('Shipping');
})->name('shipping');

Route::get('/privacy', function () {
    return Inertia::render('Privacy');
})->name('privacy');

Route::get('/terms', function () {
    return Inertia::render('Terms');
})->name('terms');

/*
|--------------------------------------------------------------------------
| Authentication Routes - Inertia.js Only
|--------------------------------------------------------------------------
|
| Note: Inertia is ONLY used in web.php routes, never in controllers or other route files.
| GET routes use Inertia::render() directly in closures.
| All API endpoints (login, register, logout) are in api.php
|
*/

// Admin Routes
Route::prefix('admin')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Admin/Dashboard/index');
    })->name('admin.dashboard');
    
    Route::get('/products', function () {
        return Inertia::render('Admin/Product/index');
    })->name('admin.products');
    
    Route::get('/products/create', function () {
        return Inertia::render('Admin/Product/Create');
    })->name('admin.products.create');
    
    Route::get('/products/{id}/edit', function ($id) {
        return Inertia::render('Admin/Product/Create', [
            'id' => $id
        ]);
    })->name('admin.products.edit');
    
    Route::get('/products/{id}', function ($id) {
        return Inertia::render('Admin/Product/Show', [
            'id' => $id
        ]);
    })->name('admin.products.show');
    
    Route::get('/categories', function () {
        return Inertia::render('Admin/Category/index');
    })->name('admin.categories');
    
    Route::get('/orders', function () {
        return Inertia::render('Admin/Order/index', [
            'section' => 'all'
        ]);
    })->name('admin.orders');
    
    Route::get('/orders/all', function () {
        return Inertia::render('Admin/Order/index', [
            'section' => 'all'
        ]);
    })->name('admin.orders.all');
    
    Route::get('/orders/pending', function () {
        return Inertia::render('Admin/Order/index', [
            'section' => 'pending'
        ]);
    })->name('admin.orders.pending');
    
    Route::get('/orders/ready-for-shipping', function () {
        return Inertia::render('Admin/Order/index', [
            'section' => 'ready-for-shipping'
        ]);
    })->name('admin.orders.ready-for-shipping');
    
    Route::get('/orders/shipped', function () {
        return Inertia::render('Admin/Order/index', [
            'section' => 'shipped'
        ]);
    })->name('admin.orders.shipped');
    
    Route::get('/orders/out-for-delivery', function () {
        return Inertia::render('Admin/Order/index', [
            'section' => 'out-for-delivery'
        ]);
    })->name('admin.orders.out-for-delivery');
    
    Route::get('/orders/delivered', function () {
        return Inertia::render('Admin/Order/index', [
            'section' => 'delivered'
        ]);
    })->name('admin.orders.delivered');
    
    Route::get('/orders/failed-delivery', function () {
        return Inertia::render('Admin/Order/index', [
            'section' => 'failed-delivery'
        ]);
    })->name('admin.orders.failed-delivery');
    
    Route::get('/orders/picked-up', function () {
        return Inertia::render('Admin/Order/index', [
            'section' => 'picked-up'
        ]);
    })->name('admin.orders.picked-up');
    
    Route::get('/orders/completed', function () {
        return Inertia::render('Admin/Order/index', [
            'section' => 'completed'
        ]);
    })->name('admin.orders.completed');
    
    Route::get('/orders/cancelled', function () {
        return Inertia::render('Admin/Order/index', [
            'section' => 'cancelled'
        ]);
    })->name('admin.orders.cancelled');
    
    Route::get('/orders/return-refund', function () {
        return Inertia::render('Admin/Order/index', [
            'section' => 'return-refund'
        ]);
    })->name('admin.orders.return-refund');
    
    Route::get('/orders/replacement', function () {
        return Inertia::render('Admin/Order/index', [
            'section' => 'replacement'
        ]);
    })->name('admin.orders.replacement');
    
    Route::get('/orders/processed', function () {
        return Inertia::render('Admin/Order/index', [
            'section' => 'processed'
        ]);
    })->name('admin.orders.processed');
    
    Route::get('/orders/direct-orders', function () {
        return Inertia::render('Admin/Order/index', [
            'section' => 'direct-orders'
        ]);
    })->name('admin.orders.direct-orders');
    
    Route::get('/orders/{id}', function ($id) {
        $section = request()->query('section', 'all');
        return Inertia::render('Admin/Order/Show', [
            'id' => $id,
            'section' => $section
        ]);
    })->name('admin.orders.show');
    
    // Invoice routes
    Route::get('/orders/{id}/invoice', [AdminOrderController::class, 'invoice'])
        ->name('admin.orders.invoice');
    Route::get('/orders/{id}/invoice/download', [AdminOrderController::class, 'downloadInvoice'])
        ->name('admin.orders.invoice.download');
    
    Route::get('/users', function () {
        return Inertia::render('Admin/User/index');
    })->name('admin.users');
    
    Route::get('/users/{id}', function ($id) {
        return Inertia::render('Admin/User/Show', [
            'id' => $id
        ]);
    })->name('admin.users.show');
    
    Route::get('/carts', function () {
        return Inertia::render('Admin/Cart/index');
    })->name('admin.carts');
    
    Route::get('/recently-viewed', function () {
        return Inertia::render('Admin/RecentlyViewed/index');
    })->name('admin.recently-viewed');
    
    Route::get('/revenue', function () {
        return Inertia::render('Admin/Revenue/index');
    })->name('admin.revenue');
    
    Route::get('/coupons', function () {
        return Inertia::render('Admin/Coupon/index');
    })->name('admin.coupons');
    
    Route::get('/coupons/usage', function () {
        return Inertia::render('Admin/Coupon/Usage');
    })->name('admin.coupons.usage');
    
    Route::get('/coupons/{id}', function ($id) {
        return Inertia::render('Admin/Coupon/Show', [
            'id' => $id
        ]);
    })->name('admin.coupons.show');
    
    Route::get('/fabrics', function () {
        return Inertia::render('Admin/Fabric/index');
    })->name('admin.fabrics');
});

// Guest Routes (only accessible when not authenticated)
Route::middleware('guest')->group(function () {
    Route::get('/login', function () {
        return Inertia::render('Auth/Login');
    })->name('login');
    
    Route::get('/register', function () {
        return Inertia::render('Auth/Register');
    })->name('register');
});