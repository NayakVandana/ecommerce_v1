<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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
Route::get('/products', function () {
    return Inertia::render('Products/Index');
})->name('products.index');

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
    
    Route::get('/categories', function () {
        return Inertia::render('Admin/Category/index');
    })->name('admin.categories');
    
    Route::get('/orders', function () {
        return Inertia::render('Admin/Order/index');
    })->name('admin.orders');
    
    Route::get('/users', function () {
        return Inertia::render('Admin/User/index');
    })->name('admin.users');
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