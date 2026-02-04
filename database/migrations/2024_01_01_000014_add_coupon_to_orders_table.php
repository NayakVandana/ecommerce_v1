<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('coupon_code_id')->nullable()->after('country')->constrained('coupon_codes')->onDelete('set null');
            $table->decimal('discount', 10, 2)->default(0)->after('shipping');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['coupon_code_id']);
            $table->dropColumn(['coupon_code_id', 'discount']);
        });
    }
};

