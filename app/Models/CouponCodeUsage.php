<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CouponCodeUsage extends Model
{
    use HasFactory;

    protected $fillable = [
        'coupon_code_id',
        'user_id',
        'order_id',
        'discount_amount',
        'order_total',
        'user_email',
        'user_name',
    ];

    protected $casts = [
        'discount_amount' => 'decimal:2',
        'order_total' => 'decimal:2',
    ];

    public function couponCode()
    {
        return $this->belongsTo(CouponCode::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}

