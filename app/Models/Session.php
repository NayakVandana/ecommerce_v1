<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'user_id',
        'device_type',
        'os',
        'browser',
        'user_agent',
        'ip_address',
        'location',
        'city',
        'country',
        'pincode',
        'last_activity',
    ];

    protected $casts = [
        'last_activity' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all cart items for this session
     */
    public function carts()
    {
        return $this->hasMany(Cart::class, 'session_id', 'session_id');
    }

    /**
     * Get all recently viewed products for this session
     */
    public function recentlyViewedProducts()
    {
        return $this->hasMany(RecentlyViewedProduct::class, 'session_id', 'session_id');
    }

    /**
     * Check if this is a guest session
     */
    public function isGuest(): bool
    {
        return $this->user_id === null;
    }

    /**
     * Get cart items count for this session
     */
    public function getCartCountAttribute(): int
    {
        return $this->carts()->count();
    }

    /**
     * Get recently viewed products count for this session
     */
    public function getRecentlyViewedCountAttribute(): int
    {
        return $this->recentlyViewedProducts()->count();
    }
}

