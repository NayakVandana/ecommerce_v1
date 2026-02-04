<?php

use App\Http\Controllers\Api\ProductApiController;
use App\Http\Controllers\Api\CategoryApiController;
use App\Http\Controllers\Api\CartApiController;
use App\Http\Controllers\Api\OrderApiController;
use App\Http\Controllers\Api\AuthApiController;
use App\Http\Controllers\Api\RecentlyViewedProductApiController;
use App\Http\Controllers\Api\CouponApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - POST Methods Only
|--------------------------------------------------------------------------
|
| ALL API endpoints (returning JSON responses) MUST be defined here.
| Do NOT create API routes in web.php or other route files.
|
| All API routes use POST method only for consistency.
| All routes are prefixed with /api/ (set in RouteServiceProvider)
|
*/

// Authentication Routes
Route::post('/register', [AuthApiController::class, 'register']);
Route::post('/login', [AuthApiController::class, 'login']);

// Public Product Routes
Route::post('/products', [ProductApiController::class, 'index']);
Route::post('/products/show', [ProductApiController::class, 'show']);
Route::post('/products/search', [ProductApiController::class, 'search']);

// Public Category Routes
Route::post('/categories', [CategoryApiController::class, 'index']);
Route::post('/categories/show', [CategoryApiController::class, 'show']);

// Routes with optional auth (work for both authenticated users and guest sessions)
// Uses optional auth middleware to set user if token is provided, but allows guests
// Guest users use these routes directly (no auth prefix)
Route::middleware('auth.optional')->group(function () {
    // Recently Viewed Products (works with both authenticated users and guest sessions)
    Route::prefix('recently-viewed')->group(function () {
        Route::post('/', [RecentlyViewedProductApiController::class, 'index']);
        Route::post('/clear', [RecentlyViewedProductApiController::class, 'clear']);
        Route::post('/remove', [RecentlyViewedProductApiController::class, 'remove']);
    });
    
    // Cart Routes (works with both authenticated users and guest sessions)
    Route::prefix('cart')->group(function () {
        Route::post('/', [CartApiController::class, 'index']);
        Route::post('/add', [CartApiController::class, 'add']);
        Route::post('/update', [CartApiController::class, 'update']);
        Route::post('/remove', [CartApiController::class, 'remove']);
        Route::post('/clear', [CartApiController::class, 'clear']);
    });
});

// Protected Routes (require authentication) - only for authenticated users
Route::middleware('auth.token')->prefix('auth')->group(function () {
    // User Profile (require authentication)
    Route::post('/user', [AuthApiController::class, 'getUser']);
    Route::post('/user/update', [AuthApiController::class, 'updateProfile']);
    Route::post('/logout', [AuthApiController::class, 'logout']);
    
    // Order Routes (require authentication)
    Route::prefix('orders')->group(function () {
        Route::post('/', [OrderApiController::class, 'index']);
        Route::post('/store', [OrderApiController::class, 'store']);
        Route::post('/show', [OrderApiController::class, 'show']);
        Route::post('/cancel', [OrderApiController::class, 'cancel']);
    });
    
    // Coupon Routes (require authentication)
    Route::prefix('coupons')->group(function () {
        Route::post('/validate', [CouponApiController::class, 'validate']);
    });
    
    // Public Coupon Routes (for validation before checkout)
    Route::post('/coupons/validate', [CouponApiController::class, 'validate']);
    
    // Cart Routes for authenticated users (optional - can also use /cart)
    Route::prefix('cart')->group(function () {
        Route::post('/', [CartApiController::class, 'index']);
        Route::post('/add', [CartApiController::class, 'add']);
        Route::post('/update', [CartApiController::class, 'update']);
        Route::post('/remove', [CartApiController::class, 'remove']);
        Route::post('/clear', [CartApiController::class, 'clear']);
    });
    
    // Recently Viewed Products for authenticated users (optional - can also use /recently-viewed)
    Route::prefix('recently-viewed')->group(function () {
        Route::post('/', [RecentlyViewedProductApiController::class, 'index']);
        Route::post('/clear', [RecentlyViewedProductApiController::class, 'clear']);
        Route::post('/remove', [RecentlyViewedProductApiController::class, 'remove']);
    });
});
