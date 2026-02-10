<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryVerificationMedia extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'order_item_id',
        'type',
        'file_path',
        'url',
        'description',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

    /**
     * Get the full URL for the media
     */
    public function getMediaUrlAttribute()
    {
        if ($this->url) {
            return $this->url;
        }
        
        if ($this->file_path) {
            return asset('storage/' . $this->file_path);
        }
        
        return null;
    }
}

