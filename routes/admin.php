<?php

use App\Http\Controllers\Admin\AdminProductController;
use App\Http\Controllers\Admin\AdminCategoryController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminCartController;
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
    
    // Product Management
    Route::prefix('products')->group(function () {
        Route::post('/', [AdminProductController::class, 'index']);
        Route::post('/store', [AdminProductController::class, 'store']);
        Route::post('/show', [AdminProductController::class, 'show']);
        Route::post('/update', [AdminProductController::class, 'update']);
        Route::post('/delete', [AdminProductController::class, 'destroy']);
        Route::post('/toggle-status', [AdminProductController::class, 'toggleStatus']);
    });
    
    // Category Management
    Route::prefix('categories')->group(function () {
        Route::post('/', [AdminCategoryController::class, 'index']);
        Route::post('/store', [AdminCategoryController::class, 'store']);
        Route::post('/show', [AdminCategoryController::class, 'show']);
        Route::post('/update', [AdminCategoryController::class, 'update']);
        Route::post('/delete', [AdminCategoryController::class, 'destroy']);
    });
    
    // Order Management
    Route::prefix('orders')->group(function () {
        Route::post('/', [AdminOrderController::class, 'index']);
        Route::post('/show', [AdminOrderController::class, 'show']);
        Route::post('/update-status', [AdminOrderController::class, 'updateStatus']);
        Route::post('/cancel', [AdminOrderController::class, 'cancel']);
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
});
