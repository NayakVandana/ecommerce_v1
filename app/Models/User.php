<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'mobile',
        'is_registered',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_registered' => 'boolean',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function recentlyViewedProducts()
    {
        return $this->hasMany(RecentlyViewedProduct::class);
    }

    public function sessions()
    {
        return $this->hasMany(Session::class);
    }

    public function loginLogs()
    {
        return $this->hasMany(UserLoginLog::class);
    }

    public function userTokens()
    {
        return $this->hasMany(UserToken::class);
    }

    public function addresses()
    {
        return $this->hasMany(UserAddress::class);
    }

    public function defaultAddress()
    {
        return $this->hasOne(UserAddress::class)->where('is_default', true);
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isDeliveryBoy()
    {
        return $this->role === 'delivery_boy';
    }

    public function deliveryOrders()
    {
        return $this->hasMany(Order::class, 'delivery_boy_id');
    }
}

