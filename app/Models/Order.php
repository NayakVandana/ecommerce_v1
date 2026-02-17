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
        'receiver_name',
        'receiver_number',
        'address',
        'house_no',
        'floor_no',
        'building_name',
        'landmark',
        'district',
        'city',
        'postal_code',
        'state',
        'country',
        'delivery_area',
        'address_type',
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
        'replacement_reason',
        'replacement_notes',
        'replacement_status',
        'replacement_requested_at',
        'replacement_processed_at',
        'replacement_order_id',
        'otp_code',
        'otp_verified',
        'otp_generated_at',
        'delivered_at',
        'delivery_date',
        'processing_at',
        'shipped_at',
        'out_for_delivery_at',
        'cancelled_at',
    ];

    protected $casts = [
        'total' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'otp_verified' => 'boolean',
        'otp_generated_at' => 'datetime',
        'delivered_at' => 'datetime',
        'delivery_date' => 'date',
        'return_requested_at' => 'datetime',
        'return_processed_at' => 'datetime',
        'replacement_requested_at' => 'datetime',
        'replacement_processed_at' => 'datetime',
        'processing_at' => 'datetime',
        'shipped_at' => 'datetime',
        'out_for_delivery_at' => 'datetime',
        'cancelled_at' => 'datetime',
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

    public function deliveryVerificationMedia()
    {
        return $this->hasMany(DeliveryVerificationMedia::class);
    }

    public function replacementOrder()
    {
        return $this->belongsTo(Order::class, 'replacement_order_id');
    }

    public function originalOrder()
    {
        return $this->hasOne(Order::class, 'replacement_order_id');
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

