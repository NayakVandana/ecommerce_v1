<?php

use App\Http\Controllers\Admin\AdminProductController;
use App\Http\Controllers\Admin\AdminCategoryController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminCartController;
use App\Http\Controllers\Admin\AdminRecentlyViewedController;
use App\Http\Controllers\Admin\AdminCouponController;
use App\Http\Controllers\Admin\AdminFabricController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin API Routes - POST Methods Only
|--------------------------------------------------------------------------
|
| All admin API routes use POST method only. These routes are protected by admin middleware.
|
*/

Route::prefix('admin')->middleware(['auth.token', 'admin'])->group(function () {
    
    // Dashboard
    Route::post('/dashboard', [AdminDashboardController::class, 'index']);
    Route::post('/stats', [AdminDashboardController::class, 'stats']);
    Route::post('/revenue', [AdminDashboardController::class, 'revenue']);
    
    // Product Management
    Route::prefix('products')->group(function () {
        Route::post('/', [AdminProductController::class, 'index']);
        Route::post('/store', [AdminProductController::class, 'store']);
        Route::post('/show', [AdminProductController::class, 'show']);
        Route::post('/update', [AdminProductController::class, 'update']);
        Route::post('/delete', [AdminProductController::class, 'destroy']);
        Route::post('/toggle-status', [AdminProductController::class, 'toggleStatus']);
        Route::post('/upload-media', [AdminProductController::class, 'uploadMedia']);
        Route::post('/update-media', [AdminProductController::class, 'updateMedia']);
        Route::post('/delete-media', [AdminProductController::class, 'deleteMedia']);
        Route::post('/update-media-order', [AdminProductController::class, 'updateMediaOrder']);
    });
    
    // Category Management
    Route::prefix('categories')->group(function () {
        Route::post('/', [AdminCategoryController::class, 'index']);
        Route::post('/store', [AdminCategoryController::class, 'store']);
        Route::post('/show', [AdminCategoryController::class, 'show']);
        Route::post('/update', [AdminCategoryController::class, 'update']);
        Route::post('/delete', [AdminCategoryController::class, 'destroy']);
        Route::post('/subcategories', [AdminCategoryController::class, 'getSubcategories']);
    });
    
    // Order Management
    Route::prefix('orders')->group(function () {
        Route::post('/', [AdminOrderController::class, 'index']);
        Route::post('/show', [AdminOrderController::class, 'show']);
        Route::post('/update-status', [AdminOrderController::class, 'updateStatus']);
        Route::post('/cancel', [AdminOrderController::class, 'cancel']);
        Route::post('/counts', [AdminOrderController::class, 'getCounts']);
        Route::post('/assign-delivery-boy', [AdminOrderController::class, 'assignDeliveryBoy']);
        Route::post('/delivery-boys', [AdminOrderController::class, 'getDeliveryBoys']);
        Route::post('/approve-return', [AdminOrderController::class, 'approveReturn']);
        Route::post('/reject-return', [AdminOrderController::class, 'rejectReturn']);
        Route::post('/process-refund', [AdminOrderController::class, 'processRefund']);
        Route::post('/approve-replacement', [AdminOrderController::class, 'approveReplacement']);
        Route::post('/reject-replacement', [AdminOrderController::class, 'rejectReplacement']);
        Route::post('/process-replacement', [AdminOrderController::class, 'processReplacement']);
        Route::post('/update-delivery-date', [AdminOrderController::class, 'updateDeliveryDate']);
        Route::post('/create-direct-order', [AdminOrderController::class, 'createDirectOrder']);
    });
    
    // User Management
    Route::prefix('users')->group(function () {
        Route::post('/', [AdminUserController::class, 'index']);
        Route::post('/show', [AdminUserController::class, 'show']);
        Route::post('/update', [AdminUserController::class, 'update']);
        Route::post('/delete', [AdminUserController::class, 'destroy']);
        Route::post('/toggle-role', [AdminUserController::class, 'toggleRole']);
    });
    
    // Cart Management
    Route::prefix('carts')->group(function () {
        Route::post('/', [AdminCartController::class, 'index']);
        Route::post('/show', [AdminCartController::class, 'show']);
        Route::post('/delete', [AdminCartController::class, 'destroy']);
    });
    
    // Recently Viewed Products Management
    Route::prefix('recently-viewed')->group(function () {
        Route::post('/', [AdminRecentlyViewedController::class, 'index']);
        Route::post('/show', [AdminRecentlyViewedController::class, 'show']);
        Route::post('/delete', [AdminRecentlyViewedController::class, 'destroy']);
    });
    
    // Coupon Management
    Route::prefix('coupons')->group(function () {
        Route::post('/', [AdminCouponController::class, 'index']);
        Route::post('/store', [AdminCouponController::class, 'store']);
        Route::post('/show', [AdminCouponController::class, 'show']);
        Route::post('/update', [AdminCouponController::class, 'update']);
        Route::post('/delete', [AdminCouponController::class, 'destroy']);
        Route::post('/toggle-status', [AdminCouponController::class, 'toggleStatus']);
        Route::post('/usages', [AdminCouponController::class, 'getUsages']);
        Route::post('/all-usages', [AdminCouponController::class, 'getAllUsages']);
    });
    
    // Fabric Management
    Route::prefix('fabrics')->group(function () {
        Route::post('/', [AdminFabricController::class, 'index']);
        Route::post('/list', [AdminFabricController::class, 'list']);
        Route::post('/store', [AdminFabricController::class, 'store']);
        Route::post('/show', [AdminFabricController::class, 'show']);
        Route::post('/update', [AdminFabricController::class, 'update']);
        Route::post('/delete', [AdminFabricController::class, 'destroy']);
        Route::post('/toggle-status', [AdminFabricController::class, 'toggleStatus']);
    });
});
