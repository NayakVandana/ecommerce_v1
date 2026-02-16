<?php

use App\Http\Controllers\Api\ProductApiController;
use App\Http\Controllers\Api\CategoryApiController;
use App\Http\Controllers\Api\CartApiController;
use App\Http\Controllers\Api\OrderApiController;
use App\Http\Controllers\Api\AuthApiController;
use App\Http\Controllers\Api\RecentlyViewedProductApiController;
use App\Http\Controllers\Api\WishlistApiController;
use App\Http\Controllers\Api\CouponApiController;
use App\Http\Controllers\Api\AddressApiController;
use App\Http\Controllers\Api\DeliveryBoyApiController;
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
Route::post('/products/filter-options', [ProductApiController::class, 'getFilterOptions']);

// Public Category Routes
Route::post('/categories', [CategoryApiController::class, 'index']);
Route::post('/categories/show', [CategoryApiController::class, 'show']);
Route::post('/categories/home', [CategoryApiController::class, 'home']);

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
    
    // Wishlist Routes (works with both authenticated users and guest sessions)
    Route::prefix('wishlist')->group(function () {
        Route::post('/', [WishlistApiController::class, 'index']);
        Route::post('/add', [WishlistApiController::class, 'add']);
        Route::post('/remove', [WishlistApiController::class, 'remove']);
        Route::post('/clear', [WishlistApiController::class, 'clear']);
        Route::post('/check', [WishlistApiController::class, 'check']);
    });
    
    // Coupon Validation (works with both authenticated users and guests)
    Route::prefix('coupons')->group(function () {
        Route::post('/validate', [CouponApiController::class, 'validateCoupon']);
    });
});

// Protected Routes (require authentication) - only for authenticated users
Route::middleware('auth.token')->prefix('auth')->group(function () {
    // User Profile (require authentication)
    Route::post('/user', [AuthApiController::class, 'getUser']);
    Route::post('/user/update', [AuthApiController::class, 'updateProfile']);
    // Logout with higher rate limit to prevent 429 errors
    Route::middleware('throttle:logout')->post('/logout', [AuthApiController::class, 'logout']);
    
    // Order Routes (require authentication)
    Route::prefix('orders')->group(function () {
        Route::post('/', [OrderApiController::class, 'index']);
        Route::post('/store', [OrderApiController::class, 'store']);
        Route::post('/show', [OrderApiController::class, 'show']);
        Route::post('/cancel', [OrderApiController::class, 'cancel']);
        Route::post('/request-return', [OrderApiController::class, 'requestReturn']);
        Route::post('/request-replacement', [OrderApiController::class, 'requestReplacement']);
    });
    
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
    
    // Address Routes (require authentication)
    Route::prefix('addresses')->group(function () {
        Route::post('/', [AddressApiController::class, 'index']);
        Route::post('/store', [AddressApiController::class, 'store']);
        Route::post('/update', [AddressApiController::class, 'update']);
        Route::post('/delete', [AddressApiController::class, 'destroy']);
        Route::post('/set-default', [AddressApiController::class, 'setDefault']);
    });
    
    // Delivery Boy Routes (require authentication and delivery_boy role)
    Route::prefix('delivery-boy')->group(function () {
        Route::post('/orders', [DeliveryBoyApiController::class, 'index']);
        Route::post('/orders/show', [DeliveryBoyApiController::class, 'show']);
        Route::post('/orders/generate-otp', [DeliveryBoyApiController::class, 'generateOTP']);
        Route::post('/orders/verify-otp', [DeliveryBoyApiController::class, 'verifyOTP']);
        Route::post('/orders/upload-open-box-media', [DeliveryBoyApiController::class, 'uploadOpenBoxMedia']);
        Route::post('/orders/get-open-box-media', [DeliveryBoyApiController::class, 'getOpenBoxMedia']);
        Route::post('/orders/delete-open-box-media', [DeliveryBoyApiController::class, 'deleteOpenBoxMedia']);
        Route::post('/stats', [DeliveryBoyApiController::class, 'getStats']);
    });
});
