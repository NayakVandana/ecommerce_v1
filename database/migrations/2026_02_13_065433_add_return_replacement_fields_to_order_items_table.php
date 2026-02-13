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
        Schema::table('order_items', function (Blueprint $table) {
            $table->string('return_reason')->nullable()->after('is_replaceable');
            $table->text('return_notes')->nullable()->after('return_reason');
            $table->enum('return_status', ['pending', 'approved', 'rejected', 'refunded'])->nullable()->after('return_notes');
            $table->timestamp('return_requested_at')->nullable()->after('return_status');
            $table->timestamp('return_processed_at')->nullable()->after('return_requested_at');
            $table->decimal('return_refund_amount', 10, 2)->nullable()->after('return_processed_at');
            $table->string('replacement_reason')->nullable()->after('return_refund_amount');
            $table->text('replacement_notes')->nullable()->after('replacement_reason');
            $table->enum('replacement_status', ['pending', 'approved', 'rejected', 'processed'])->nullable()->after('replacement_notes');
            $table->timestamp('replacement_requested_at')->nullable()->after('replacement_status');
            $table->timestamp('replacement_processed_at')->nullable()->after('replacement_requested_at');
            $table->unsignedBigInteger('replacement_order_item_id')->nullable()->after('replacement_processed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn([
                'return_reason',
                'return_notes',
                'return_status',
                'return_requested_at',
                'return_processed_at',
                'return_refund_amount',
                'replacement_reason',
                'replacement_notes',
                'replacement_status',
                'replacement_requested_at',
                'replacement_processed_at',
                'replacement_order_item_id',
            ]);
        });
    }
};
