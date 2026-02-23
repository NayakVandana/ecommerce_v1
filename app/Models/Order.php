<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\PaymentType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'is_direct_order',
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
        'payment_method',
        'payment_type',
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

    /**
     * Get the payment method attribute
     */
    public function getPaymentMethodAttribute($value)
    {
        if (is_null($value)) {
            return PaymentMethod::default()->value;
        }
        
        // Try to get enum from value, fallback to default if invalid
        try {
            $enum = PaymentMethod::tryFrom($value);
            return $enum ? $enum->value : PaymentMethod::default()->value;
        } catch (\Exception $e) {
            return PaymentMethod::default()->value;
        }
    }

    /**
     * Set the payment method attribute
     */
    public function setPaymentMethodAttribute($value)
    {
        if (is_null($value)) {
            $this->attributes['payment_method'] = PaymentMethod::default()->value;
            return;
        }
        
        // Try to get enum from value, fallback to default if invalid
        try {
            $enum = PaymentMethod::tryFrom($value);
            $this->attributes['payment_method'] = $enum ? $enum->value : PaymentMethod::default()->value;
        } catch (\Exception $e) {
            $this->attributes['payment_method'] = PaymentMethod::default()->value;
        }
    }

    /**
     * Get the payment type attribute
     */
    public function getPaymentTypeAttribute($value)
    {
        if (is_null($value)) {
            return PaymentType::default()->value;
        }
        
        // Try to get enum from value, fallback to default if invalid
        try {
            $enum = PaymentType::tryFrom($value);
            return $enum ? $enum->value : PaymentType::default()->value;
        } catch (\Exception $e) {
            return PaymentType::default()->value;
        }
    }

    /**
     * Set the payment type attribute
     */
    public function setPaymentTypeAttribute($value)
    {
        if (is_null($value)) {
            $this->attributes['payment_type'] = PaymentType::default()->value;
            return;
        }
        
        // Try to get enum from value, fallback to default if invalid
        try {
            $enum = PaymentType::tryFrom($value);
            $this->attributes['payment_type'] = $enum ? $enum->value : PaymentType::default()->value;
        } catch (\Exception $e) {
            $this->attributes['payment_type'] = PaymentType::default()->value;
        }
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

