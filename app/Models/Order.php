<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'delivery_boy_id',
        'order_number',
        'name',
        'email',
        'phone',
        'address',
        'city',
        'postal_code',
        'country',
        'total',
        'subtotal',
        'tax',
        'shipping',
        'discount',
        'coupon_code_id',
        'status',
        'notes',
        'cancellation_reason',
        'cancellation_notes',
        'return_reason',
        'return_notes',
        'return_status',
        'return_requested_at',
        'return_processed_at',
        'refund_amount',
        'otp_code',
        'otp_verified',
        'otp_generated_at',
        'delivered_at',
    ];

    protected $casts = [
        'total' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'otp_verified' => 'boolean',
        'otp_generated_at' => 'datetime',
        'delivered_at' => 'datetime',
        'return_requested_at' => 'datetime',
        'return_processed_at' => 'datetime',
    ];

    // Accessor for payment_method (always cash on delivery, not stored in DB)
    public function getPaymentMethodAttribute()
    {
        return 'cash_on_delivery';
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function couponCode()
    {
        return $this->belongsTo(CouponCode::class);
    }

    public function deliveryBoy()
    {
        return $this->belongsTo(User::class, 'delivery_boy_id');
    }

    /**
     * Generate OTP for order delivery
     */
    public function generateOTP()
    {
        $otp = str_pad((string)rand(100000, 999999), 6, '0', STR_PAD_LEFT);
        $this->update([
            'otp_code' => $otp,
            'otp_generated_at' => now(),
            'otp_verified' => false,
        ]);
        return $otp;
    }

    /**
     * Verify OTP for order delivery
     */
    public function verifyOTP($otp)
    {
        if ($this->otp_code === $otp && !$this->otp_verified) {
            $this->update([
                'otp_verified' => true,
                'status' => 'delivered',
                'delivered_at' => now(),
            ]);
            return true;
        }
        return false;
    }
}

