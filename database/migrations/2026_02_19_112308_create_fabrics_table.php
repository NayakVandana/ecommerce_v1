<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates master fabrics table - a centralized list of all available fabric types.
     * Products will reference fabrics from this table via many-to-many relationship.
     */
    public function up(): void
    {
        // Drop old product_fabrics table if it exists
        if (Schema::hasTable('product_fabrics')) {
            Schema::dropIfExists('product_fabrics');
        }
        
        Schema::create('fabrics', function (Blueprint $table) {
            $table->id();
            $table->string('fabric_name', 100)->unique();
            $table->text('description')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('is_active');
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fabrics');
    }
};
