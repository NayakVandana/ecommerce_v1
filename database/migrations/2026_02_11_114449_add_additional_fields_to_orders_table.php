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
            $table->string('state')->nullable()->after('district');
            $table->string('house_no')->nullable()->after('address');
            $table->string('floor_no')->nullable()->after('house_no');
            $table->string('building_name')->nullable()->after('floor_no');
            $table->string('landmark')->nullable()->after('building_name');
            $table->string('receiver_name')->nullable()->after('name');
            $table->string('receiver_number')->nullable()->after('receiver_name');
            $table->string('address_type')->nullable()->after('landmark')->comment('home, office, other');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['state', 'house_no', 'floor_no', 'building_name', 'landmark', 'receiver_name', 'receiver_number', 'address_type']);
        });
    }
};
