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
            $table->string('return_reason')->nullable()->after('cancellation_notes');
            $table->text('return_notes')->nullable()->after('return_reason');
            $table->enum('return_status', ['pending', 'approved', 'rejected', 'refunded'])->nullable()->after('return_notes');
            $table->timestamp('return_requested_at')->nullable()->after('return_status');
            $table->timestamp('return_processed_at')->nullable()->after('return_requested_at');
            $table->decimal('refund_amount', 10, 2)->nullable()->after('return_processed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['return_reason', 'return_notes', 'return_status', 'return_requested_at', 'return_processed_at', 'refund_amount']);
        });
    }
};
