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
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('processing_at')->nullable()->after('status');
            $table->timestamp('shipped_at')->nullable()->after('processing_at');
            $table->timestamp('out_for_delivery_at')->nullable()->after('shipped_at');
            $table->timestamp('cancelled_at')->nullable()->after('out_for_delivery_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['processing_at', 'shipped_at', 'out_for_delivery_at', 'cancelled_at']);
        });
    }
};
