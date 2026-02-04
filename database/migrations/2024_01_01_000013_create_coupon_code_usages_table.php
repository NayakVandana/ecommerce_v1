<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupon_code_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coupon_code_id')->constrained('coupon_codes')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('order_id')->nullable()->constrained('orders')->onDelete('set null');
            $table->decimal('discount_amount', 10, 2);
            $table->decimal('order_total', 10, 2);
            $table->string('user_email')->nullable();
            $table->string('user_name')->nullable();
            $table->timestamps();
            
            $table->index('coupon_code_id');
            $table->index('user_id');
            $table->index('order_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupon_code_usages');
    }
};

