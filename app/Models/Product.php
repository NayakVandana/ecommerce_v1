<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'user_id',
        'product_name',
        'sku',
        'description',
        'hashtags',
        'brand',
        'category',
        'subcategory_1',
        'subcategory_2',
        'subcategory_3',
        'subcategory_4',
        'subcategory_5',
        'subcategory_6',
        'hsn_code',
        'features',
        'price',
        'gst',
        'total_with_gst',
        'commission',
        'commission_gst_amount',
        'total',
        'final_price',
        'mrp',
        'discount_percent',
        'is_approve',
        'total_quantity',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'total_with_gst' => 'decimal:2',
        'commission' => 'decimal:2',
        'commission_gst_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'final_price' => 'decimal:2',
        'mrp' => 'decimal:2',
        'discount_percent' => 'decimal:2',
        'gst' => 'integer',
        'is_approve' => 'integer',
        'total_quantity' => 'integer',
        'category' => 'integer',
        'subcategory_1' => 'integer',
        'subcategory_2' => 'integer',
        'subcategory_3' => 'integer',
        'subcategory_4' => 'integer',
        'subcategory_5' => 'integer',
        'subcategory_6' => 'integer',
        'features' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function categoryRelation()
    {
        return $this->belongsTo(Category::class, 'category');
    }

    public function media()
    {
        return $this->hasMany(ProductMedia::class);
    }

    public function variations()
    {
        return $this->hasMany(ProductVariation::class);
    }

    public function discounts()
    {
        return $this->belongsToMany(Discount::class, 'discount_product');
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function recentlyViewedProducts()
    {
        return $this->hasMany(RecentlyViewedProduct::class);
    }

    // Helper method for backward compatibility
    public function getNameAttribute()
    {
        return $this->product_name;
    }
}

