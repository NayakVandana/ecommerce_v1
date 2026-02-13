<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'variation_id',
        'product_name',
        'product_sku',
        'size',
        'color',
        'quantity',
        'price',
        'subtotal',
        'is_returnable',
        'is_replaceable',
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
    ];

    protected $casts = [
        'quantity' => 'integer',
        'price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'is_returnable' => 'boolean',
        'is_replaceable' => 'boolean',
        'return_refund_amount' => 'decimal:2',
        'return_requested_at' => 'datetime',
        'return_processed_at' => 'datetime',
        'replacement_requested_at' => 'datetime',
        'replacement_processed_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variation()
    {
        return $this->belongsTo(ProductVariation::class);
    }

    public function replacementOrderItem()
    {
        return $this->belongsTo(OrderItem::class, 'replacement_order_item_id');
    }

    public function originalOrderItem()
    {
        return $this->hasOne(OrderItem::class, 'replacement_order_item_id');
    }
}

