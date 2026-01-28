<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Migration Flow:
     * 1. Create product_variations table with gender field
     * 2. Add foreign key constraint to product_media.variation_id
     *    (product_media table was created in previous migration but FK is added here)
     * 
     * Variant-Wise Media Support:
     * - Creates foreign key: product_media.variation_id -> product_variations.id
     * - Cascade delete: When variation is deleted, its linked media is automatically deleted
     * - Enables variant-wise media management (each variation can have its own media)
     */
    public function up(): void
    {
        Schema::create('product_variations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('size', 50)->nullable();
            $table->string('color', 50)->nullable();
            $table->string('gender', 20)->nullable()->comment('male, female, unisex');
            $table->integer('stock_quantity')->default(0);
            $table->boolean('in_stock')->default(true);
            $table->timestamps();
            
            // Unique constraint includes gender to allow same size/color for different genders
            $table->unique(['product_id', 'size', 'color', 'gender'], 'product_variations_unique');
        });
        
        // Add foreign key constraint to product_media.variation_id
        // This is done here because product_variations table must exist first
        // Check if foreign key doesn't already exist to avoid errors on re-running migrations
        if (Schema::hasTable('product_media')) {
            // Check if foreign key already exists
            $fkExists = false;
            try {
                $foreignKeys = DB::select("
                    SELECT CONSTRAINT_NAME 
                    FROM information_schema.KEY_COLUMN_USAGE 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = 'product_media' 
                    AND COLUMN_NAME = 'variation_id' 
                    AND REFERENCED_TABLE_NAME IS NOT NULL
                ");
                $fkExists = !empty($foreignKeys);
            } catch (\Exception $e) {
                // If query fails, try to add the FK anyway (might be different DB driver)
            }
            
            if (!$fkExists) {
                Schema::table('product_media', function (Blueprint $table) {
                    $table->foreign('variation_id')
                          ->references('id')
                          ->on('product_variations')
                          ->onDelete('cascade');
                });
            }
        }
    }

    public function down(): void
    {
        // Drop foreign key constraint first
        Schema::table('product_media', function (Blueprint $table) {
            $table->dropForeign(['variation_id']);
        });
        
        Schema::dropIfExists('product_variations');
    }
};

