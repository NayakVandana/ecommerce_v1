<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('product_name');
            $table->string('sku')->nullable();          
            $table->text('description')->nullable();
            $table->string('hashtags')->nullable();
            $table->string('brand')->nullable();
            $table->integer('category');           
            $table->integer('subcategory_1')->nullable();
            $table->integer('subcategory_2')->nullable();
            $table->integer('subcategory_3')->nullable();
            $table->integer('subcategory_4')->nullable();
            $table->integer('subcategory_5')->nullable();
            $table->integer('subcategory_6')->nullable();
            $table->string('hsn_code')->nullable();
            $table->longText('features')->nullable();
            $table->decimal('price', 10, 2);
            $table->integer('gst');
            $table->decimal('total_with_gst', 10, 2);
            $table->decimal('commission', 10, 2);
            $table->decimal('commission_gst_amount', 10, 2);
            $table->decimal('total', 10, 2);
            $table->decimal('final_price', 10, 2);
            $table->decimal('mrp', 10, 2);
            $table->decimal('discount_percent', 10, 2);
            $table->integer('is_approve')->default(0);
            $table->integer('total_quantity')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};

