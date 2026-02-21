<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class VerificationToken extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'mobile',
        'email',
        'request_type',
        'otp',
        'verification_token',
        'otp_verified',
        'verification_datetime',
        'attempt_counter',
    ];

    protected $casts = [
        'otp_verified' => 'boolean',
        'verification_datetime' => 'datetime',
    ];
}

