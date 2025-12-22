<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('session_id')->nullable();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('variation_id')->nullable()->constrained('product_variations')->onDelete('cascade');
            $table->string('size')->nullable();
            $table->string('color')->nullable();
            $table->integer('quantity');
            $table->timestamps();
            
            $table->unique(['user_id', 'product_id', 'variation_id'], 'cart_user_product_variation_unique');
            $table->unique(['session_id', 'product_id', 'variation_id'], 'cart_session_product_variation_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carts');
    }
};

