<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_id', 100)->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('device_type')->nullable()->comment('web, mobile, tablet');
            $table->string('os', 255)->nullable()->comment('Operating System');
            $table->string('browser', 255)->nullable()->comment('Browser name and version');
            $table->string('user_agent')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('location', 255)->nullable()->comment('Full location string');
            $table->string('city', 255)->nullable()->comment('City name');
            $table->string('country', 255)->nullable()->comment('Country name');
            $table->string('pincode', 20)->nullable()->comment('Postal/ZIP code');
            $table->timestamp('last_activity')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};

