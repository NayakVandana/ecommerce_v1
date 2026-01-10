<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductMedia extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'type',
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
        'disk',
        'url',
        'sort_order',
        'is_primary',
        'color',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'file_size' => 'integer',
        'sort_order' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Accessor to ensure URL is always available
     * If URL is missing or invalid, generate it from file_path
     */
    public function getUrlAttribute($value)
    {
        // If URL is already set and is a valid full URL, return it
        if ($value && (filter_var($value, FILTER_VALIDATE_URL) || str_starts_with($value, 'http'))) {
            return $value;
        }
        
        // Otherwise, generate URL from file_path using asset helper
        if ($this->attributes['file_path'] ?? null) {
            return asset('storage/' . $this->attributes['file_path']);
        }
        
        return $value;
    }
}

