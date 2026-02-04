<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CouponCode;
use App\Models\CouponCodeUsage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCouponController extends Controller
{
    public function index(Request $request)
    {
        $query = CouponCode::with('usages');

        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('code', 'like', '%' . $request->search . '%')
                  ->orWhere('name', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        // Date range filter
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [
                \Carbon\Carbon::parse($request->start_date)->startOfDay(),
                \Carbon\Carbon::parse($request->end_date)->endOfDay()
            ]);
        }

        $coupons = $query->latest()->paginate(15);

        return $this->sendJsonResponse(true, 'Coupons fetched successfully', $coupons, 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:50|unique:coupon_codes,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'min_purchase_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_user' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);

        $coupon = CouponCode::create([
            'uuid' => Str::uuid()->toString(),
            'code' => strtoupper($request->code),
            'name' => $request->name,
            'description' => $request->description,
            'type' => $request->type,
            'value' => $request->value,
            'min_purchase_amount' => $request->min_purchase_amount,
            'max_discount_amount' => $request->max_discount_amount,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'usage_limit' => $request->usage_limit,
            'usage_limit_per_user' => $request->usage_limit_per_user,
            'usage_count' => 0,
            'is_active' => $request->has('is_active') ? $request->is_active : true,
        ]);

        return $this->sendJsonResponse(true, 'Coupon created successfully', $coupon, 201);
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:coupon_codes,id',
        ]);

        $coupon = CouponCode::with(['usages.user', 'usages.order'])->findOrFail($request->id);

        return $this->sendJsonResponse(true, 'Coupon fetched successfully', $coupon, 200);
    }

    public function update(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:coupon_codes,id',
            'code' => 'sometimes|string|max:50|unique:coupon_codes,code,' . $request->id,
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'type' => 'sometimes|in:percentage,fixed',
            'value' => 'sometimes|numeric|min:0',
            'min_purchase_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_user' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);

        $coupon = CouponCode::findOrFail($request->id);

        $updateData = [];
        if ($request->has('code')) {
            $updateData['code'] = strtoupper($request->code);
        }
        if ($request->has('name')) {
            $updateData['name'] = $request->name;
        }
        if ($request->has('description')) {
            $updateData['description'] = $request->description;
        }
        if ($request->has('type')) {
            $updateData['type'] = $request->type;
        }
        if ($request->has('value')) {
            $updateData['value'] = $request->value;
        }
        if ($request->has('min_purchase_amount')) {
            $updateData['min_purchase_amount'] = $request->min_purchase_amount;
        }
        if ($request->has('max_discount_amount')) {
            $updateData['max_discount_amount'] = $request->max_discount_amount;
        }
        if ($request->has('start_date')) {
            $updateData['start_date'] = $request->start_date;
        }
        if ($request->has('end_date')) {
            $updateData['end_date'] = $request->end_date;
        }
        if ($request->has('usage_limit')) {
            $updateData['usage_limit'] = $request->usage_limit;
        }
        if ($request->has('usage_limit_per_user')) {
            $updateData['usage_limit_per_user'] = $request->usage_limit_per_user;
        }
        if ($request->has('is_active')) {
            $updateData['is_active'] = $request->is_active;
        }

        $coupon->update($updateData);

        return $this->sendJsonResponse(true, 'Coupon updated successfully', $coupon->fresh(), 200);
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:coupon_codes,id',
        ]);

        $coupon = CouponCode::findOrFail($request->id);
        $coupon->delete();

        return $this->sendJsonResponse(true, 'Coupon deleted successfully', [], 200);
    }

    public function toggleStatus(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:coupon_codes,id',
        ]);

        $coupon = CouponCode::findOrFail($request->id);
        $coupon->is_active = !$coupon->is_active;
        $coupon->save();

        return $this->sendJsonResponse(true, 'Coupon status updated successfully', $coupon->fresh(), 200);
    }

    public function getUsages(Request $request)
    {
        if ($request->has('id') && $request->id) {
            $request->validate([
                'id' => 'required|exists:coupon_codes,id',
            ]);

            $query = CouponCodeUsage::with(['user', 'order', 'couponCode'])
                ->where('coupon_code_id', $request->id);
        } else {
            // Get all usages from all coupons
            $query = CouponCodeUsage::with(['user', 'order', 'couponCode']);
        }

        // Date range filter
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [
                \Carbon\Carbon::parse($request->start_date)->startOfDay(),
                \Carbon\Carbon::parse($request->end_date)->endOfDay()
            ]);
        }

        $usages = $query->latest()->paginate(15);

        return $this->sendJsonResponse(true, 'Coupon usages fetched successfully', $usages, 200);
    }

    public function getAllUsages(Request $request)
    {
        $query = CouponCodeUsage::with(['user', 'order', 'couponCode']);

        // Date range filter
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [
                \Carbon\Carbon::parse($request->start_date)->startOfDay(),
                \Carbon\Carbon::parse($request->end_date)->endOfDay()
            ]);
        }

        // Coupon filter
        if ($request->has('coupon_id') && $request->coupon_id) {
            $query->where('coupon_code_id', $request->coupon_id);
        }

        $usages = $query->latest()->paginate(50);

        return $this->sendJsonResponse(true, 'All coupon usages fetched successfully', $usages, 200);
    }
}

