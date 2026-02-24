<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\User;
use App\Models\Order;
use Illuminate\Http\Request;

class AdminCustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query();

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%')
                  ->orWhere('phone', 'like', '%' . $search . '%')
                  ->orWhere('mobile', 'like', '%' . $search . '%');
            });
        }

        // Status filter
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Registered/Unregistered filter
        if ($request->has('is_registered')) {
            $query->where('is_registered', $request->is_registered);
        }

        // Date range filter
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [
                \Carbon\Carbon::parse($request->start_date)->startOfDay(),
                \Carbon\Carbon::parse($request->end_date)->endOfDay()
            ]);
        }

        $customers = $query->with('user')->latest()->paginate(15);

        return $this->sendJsonResponse(true, 'Customers fetched successfully', $customers, 200);
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:customers,id',
        ]);

        $customer = Customer::with('user')->findOrFail($request->id);

        // Get orders based on customer type
        if ($customer->user_id) {
            $orders = Order::where('user_id', $customer->user_id)->latest()->limit(10)->get();
        } else {
            $ordersQuery = Order::query();
            if ($customer->email) {
                $ordersQuery->where('email', $customer->email);
            }
            if ($customer->phone || $customer->mobile) {
                $ordersQuery->orWhere(function($q) use ($customer) {
                    if ($customer->phone) $q->where('phone', $customer->phone);
                    if ($customer->mobile) $q->orWhere('phone', $customer->mobile);
                });
            }
            $orders = $ordersQuery->latest()->limit(10)->get();
        }
        
        $customer->orders = $orders;

        // Get additional stats
        if ($customer->user_id) {
            $customer->total_orders_count = Order::where('user_id', $customer->user_id)->count();
            $customer->total_spent_amount = Order::where('user_id', $customer->user_id)->where('status', '!=', 'cancelled')->sum('total');
        } else {
            $statsQuery = Order::query();
            if ($customer->email) {
                $statsQuery->where('email', $customer->email);
            }
            if ($customer->phone || $customer->mobile) {
                $statsQuery->orWhere(function($q) use ($customer) {
                    if ($customer->phone) $q->where('phone', $customer->phone);
                    if ($customer->mobile) $q->orWhere('phone', $customer->mobile);
                });
            }
            $customer->total_orders_count = $statsQuery->count();
            $customer->total_spent_amount = (clone $statsQuery)->where('status', '!=', 'cancelled')->sum('total');
        }

        return $this->sendJsonResponse(true, 'Customer fetched successfully', $customer, 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255|unique:customers,email',
            'phone' => 'nullable|string|max:20',
            'mobile' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,inactive,blocked',
            'notes' => 'nullable|string',
        ]);

        $customer = Customer::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'mobile' => $request->mobile,
            'address' => $request->address,
            'city' => $request->city,
            'state' => $request->state,
            'postal_code' => $request->postal_code,
            'country' => $request->country ?? 'India',
            'status' => $request->status ?? 'active',
            'notes' => $request->notes,
            'is_registered' => false,
        ]);

        return $this->sendJsonResponse(true, 'Customer created successfully', $customer, 201);
    }

    public function update(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:customers,id',
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:customers,email,' . $request->id,
            'phone' => 'sometimes|string|max:20',
            'mobile' => 'sometimes|string|max:20',
            'address' => 'sometimes|string',
            'city' => 'sometimes|string|max:255',
            'state' => 'sometimes|string|max:255',
            'postal_code' => 'sometimes|string|max:20',
            'country' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:active,inactive,blocked',
            'notes' => 'sometimes|string',
        ]);

        $customer = Customer::findOrFail($request->id);

        $customer->update($request->only([
            'name', 'email', 'phone', 'mobile', 'address', 'city', 
            'state', 'postal_code', 'country', 'status', 'notes'
        ]));

        return $this->sendJsonResponse(true, 'Customer updated successfully', $customer->fresh(), 200);
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:customers,id',
        ]);

        $customer = Customer::findOrFail($request->id);
        $customer->delete();

        return $this->sendJsonResponse(true, 'Customer deleted successfully', [], 200);
    }

    public function toggleStatus(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:customers,id',
        ]);

        $customer = Customer::findOrFail($request->id);
        $customer->status = $customer->status === 'active' ? 'inactive' : 'active';
        $customer->save();

        return $this->sendJsonResponse(true, 'Customer status updated successfully', $customer, 200);
    }
}
