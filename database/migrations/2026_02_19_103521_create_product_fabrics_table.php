<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates product_fabrics table to manage fabric types for fashion products.
     * This allows products in the fashion category to have multiple fabric options.
     */
    public function up(): void
    {
        Schema::create('product_fabrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('fabric_name', 100);
            $table->text('description')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            // Index for faster queries
            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_fabrics');
    }
};
