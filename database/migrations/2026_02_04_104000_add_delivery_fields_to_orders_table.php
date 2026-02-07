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
            $table->foreignId('delivery_boy_id')->nullable()->after('user_id')->constrained('users')->onDelete('set null');
            $table->string('otp_code', 6)->nullable()->after('status');
            $table->boolean('otp_verified')->default(false)->after('otp_code');
            $table->timestamp('otp_generated_at')->nullable()->after('otp_verified');
            $table->timestamp('delivered_at')->nullable()->after('otp_verified');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['delivery_boy_id']);
            $table->dropColumn(['delivery_boy_id', 'otp_code', 'otp_verified', 'otp_generated_at', 'delivered_at']);
        });
    }
};

