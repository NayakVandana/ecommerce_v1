<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CouponCode;
use App\Models\CouponCodeUsage;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CouponApiController extends Controller
{
    public function validate(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0',
        ]);

        $code = strtoupper(trim($request->code));
        $subtotal = $request->subtotal;
        $userId = $request->user() ? $request->user()->id : null;

        $coupon = CouponCode::where('code', $code)->first();

        if (!$coupon) {
            return $this->sendJsonResponse(false, 'Invalid coupon code', [], 400);
        }

        // Check if coupon is active
        if (!$coupon->is_active) {
            return $this->sendJsonResponse(false, 'This coupon is not active', [], 400);
        }

        // Check date validity
        $now = Carbon::now();
        if ($coupon->start_date && $now < Carbon::parse($coupon->start_date)) {
            return $this->sendJsonResponse(false, 'This coupon is not yet valid', [], 400);
        }

        if ($coupon->end_date && $now > Carbon::parse($coupon->end_date)) {
            return $this->sendJsonResponse(false, 'This coupon has expired', [], 400);
        }

        // Check usage limit
        if ($coupon->usage_limit && $coupon->usage_count >= $coupon->usage_limit) {
            return $this->sendJsonResponse(false, 'This coupon has reached its usage limit', [], 400);
        }

        // Check minimum purchase amount
        if ($coupon->min_purchase_amount && $subtotal < $coupon->min_purchase_amount) {
            return $this->sendJsonResponse(false, "Minimum purchase amount of $" . number_format($coupon->min_purchase_amount, 2) . " required", [], 400);
        }

        // Check per-user usage limit
        if ($userId && $coupon->usage_limit_per_user) {
            $userUsageCount = CouponCodeUsage::where('coupon_code_id', $coupon->id)
                ->where('user_id', $userId)
                ->count();

            if ($userUsageCount >= $coupon->usage_limit_per_user) {
                return $this->sendJsonResponse(false, 'You have reached the maximum usage limit for this coupon', [], 400);
            }
        }

        // Calculate discount
        $discount = $this->calculateDiscount($coupon, $subtotal);

        return $this->sendJsonResponse(true, 'Coupon is valid', [
            'coupon' => $coupon,
            'discount' => $discount,
            'discount_formatted' => $coupon->type === 'percentage' 
                ? number_format($discount, 2) . '%' 
                : '$' . number_format($discount, 2),
        ], 200);
    }

    private function calculateDiscount(CouponCode $coupon, float $subtotal): float
    {
        if ($coupon->type === 'percentage') {
            $discount = ($subtotal * $coupon->value) / 100;
            
            // Apply max discount limit if set
            if ($coupon->max_discount_amount && $discount > $coupon->max_discount_amount) {
                $discount = $coupon->max_discount_amount;
            }
        } else {
            // Fixed amount
            $discount = $coupon->value;
            
            // Don't allow discount to exceed subtotal
            if ($discount > $subtotal) {
                $discount = $subtotal;
            }
        }

        return round($discount, 2);
    }
}

