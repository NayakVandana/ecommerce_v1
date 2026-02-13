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
            $table->string('replacement_reason')->nullable()->after('refund_amount');
            $table->text('replacement_notes')->nullable()->after('replacement_reason');
            $table->enum('replacement_status', ['pending', 'approved', 'rejected', 'processed'])->nullable()->after('replacement_notes');
            $table->timestamp('replacement_requested_at')->nullable()->after('replacement_status');
            $table->timestamp('replacement_processed_at')->nullable()->after('replacement_requested_at');
            $table->unsignedBigInteger('replacement_order_id')->nullable()->after('replacement_processed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['replacement_reason', 'replacement_notes', 'replacement_status', 'replacement_requested_at', 'replacement_processed_at', 'replacement_order_id']);
        });
    }
};
