<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates product_media table with variant-wise media support.
     * 
     * Key Features:
     * - variation_id: Links media to specific product variations (nullable for general media)
     * - Foreign key constraint is added in product_variations migration (000006)
     * - This ensures both tables exist before the foreign key is created
     * - Cascade delete: When variation is deleted, its media is automatically deleted
     * - color: Stores color value (can be set from variation color automatically)
     * 
     * Media Types:
     * - General media: variation_id = null (shown for all variations)
     * - Variation-specific media: variation_id = variation.id (shown only for that variation)
     */
    public function up(): void
    {
        Schema::create('product_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('variation_id')->nullable()->comment('Links to product_variations.id - FK added in migration 000006');
            $table->string('type', 20)->default('image')->comment('image, video');
            $table->string('file_path');
            $table->string('file_name')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('disk')->default('public');
            $table->string('url')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_primary')->default(false);
            $table->string('color', 50)->nullable()->comment('Color value - can be set from variation color');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_media');
    }
};

