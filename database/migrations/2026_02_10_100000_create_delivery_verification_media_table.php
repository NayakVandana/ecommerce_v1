<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('delivery_verification_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('order_item_id')->nullable()->constrained('order_items')->onDelete('cascade');
            $table->string('type')->default('image'); // 'image' or 'video'
            $table->string('file_path')->nullable();
            $table->string('url')->nullable();
            $table->text('description')->nullable(); // Optional description of what's in the media
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_verification_media');
    }
};

