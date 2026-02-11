<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserAddress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressApiController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->sendJsonResponse(false, 'User not authenticated', [], 401);
        }

        $addresses = UserAddress::where('user_id', $user->id)
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->sendJsonResponse(true, 'Addresses fetched successfully', $addresses, 200);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->sendJsonResponse(false, 'User not authenticated', [], 401);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string',
            'receiver_name' => 'nullable|string|max:255',
            'receiver_number' => 'required|string',
            'address' => 'required|string',
            'house_no' => 'nullable|string|max:50',
            'floor_no' => 'nullable|string|max:50',
            'building_name' => 'nullable|string|max:255',
            'landmark' => 'nullable|string|max:255',
            'district' => 'nullable|string|in:Valsad',
            'city' => 'required|string|in:Vapi',
            'postal_code' => 'required|string',
            'state' => 'nullable|string',
            'country' => 'required|string|in:India',
            'address_type' => 'nullable|string|in:home,office,other',
            'is_default' => 'nullable|boolean',
        ]);

        DB::beginTransaction();
        try {
            // If this is set as default, unset other defaults
            if ($request->is_default) {
                UserAddress::where('user_id', $user->id)
                    ->update(['is_default' => false]);
            }

            $address = UserAddress::create([
                'user_id' => $user->id,
                'name' => $request->name,
                'phone' => $request->receiver_number, // Use receiver_number as phone
                'receiver_name' => $request->receiver_name,
                'receiver_number' => $request->receiver_number,
                'address' => $request->address,
                'house_no' => $request->house_no,
                'floor_no' => $request->floor_no,
                'building_name' => $request->building_name,
                'landmark' => $request->landmark,
                'district' => $request->district ?? 'Valsad',
                'city' => $request->city ?? 'Vapi',
                'postal_code' => $request->postal_code,
                'state' => $request->state ?? 'Gujarat',
                'country' => $request->country ?? 'India',
                'address_type' => $request->address_type ?? 'home',
                'is_default' => $request->is_default ?? false,
            ]);

            DB::commit();
            return $this->sendJsonResponse(true, 'Address added successfully', $address, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendJsonResponse(false, 'Failed to add address', ['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->sendJsonResponse(false, 'User not authenticated', [], 401);
        }

        $request->validate([
            'id' => 'required|exists:addresses,id',
            'name' => 'required|string|max:255',
            'phone' => 'required|string',
            'receiver_name' => 'nullable|string|max:255',
            'receiver_number' => 'nullable|string',
            'address' => 'required|string',
            'house_no' => 'nullable|string|max:50',
            'floor_no' => 'nullable|string|max:50',
            'building_name' => 'nullable|string|max:255',
            'landmark' => 'nullable|string|max:255',
            'district' => 'nullable|string|in:Valsad',
            'city' => 'required|string|in:Vapi',
            'postal_code' => 'required|string',
            'state' => 'nullable|string',
            'country' => 'required|string|in:India',
            'address_type' => 'nullable|string|in:home,office,other',
            'is_default' => 'nullable|boolean',
        ]);

        $address = UserAddress::where('user_id', $user->id)
            ->findOrFail($request->id);

        DB::beginTransaction();
        try {
            // If this is set as default, unset other defaults
            if ($request->is_default) {
                UserAddress::where('user_id', $user->id)
                    ->where('id', '!=', $address->id)
                    ->update(['is_default' => false]);
            }

            $address->update([
                'name' => $request->name,
                'phone' => $request->receiver_number, // Use receiver_number as phone
                'receiver_name' => $request->receiver_name,
                'receiver_number' => $request->receiver_number,
                'address' => $request->address,
                'house_no' => $request->house_no,
                'floor_no' => $request->floor_no,
                'building_name' => $request->building_name,
                'landmark' => $request->landmark,
                'district' => $request->district ?? $address->district ?? 'Valsad',
                'city' => $request->city ?? 'Vapi',
                'postal_code' => $request->postal_code,
                'state' => $request->state ?? $address->state ?? 'Gujarat',
                'country' => $request->country ?? 'India',
                'address_type' => $request->address_type ?? $address->address_type,
                'is_default' => $request->is_default ?? $address->is_default,
            ]);

            DB::commit();
            return $this->sendJsonResponse(true, 'Address updated successfully', $address->fresh(), 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendJsonResponse(false, 'Failed to update address', ['error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->sendJsonResponse(false, 'User not authenticated', [], 401);
        }

        $request->validate([
            'id' => 'required|exists:addresses,id',
        ]);

        $address = UserAddress::where('user_id', $user->id)
            ->findOrFail($request->id);

        $address->delete();

        return $this->sendJsonResponse(true, 'Address deleted successfully', [], 200);
    }

    public function setDefault(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->sendJsonResponse(false, 'User not authenticated', [], 401);
        }

        $request->validate([
            'id' => 'required|exists:addresses,id',
        ]);

        DB::beginTransaction();
        try {
            // Unset all defaults
            UserAddress::where('user_id', $user->id)
                ->update(['is_default' => false]);

            // Set this as default
            $address = UserAddress::where('user_id', $user->id)
                ->findOrFail($request->id);
            
            $address->update(['is_default' => true]);

            DB::commit();
            return $this->sendJsonResponse(true, 'Default address updated successfully', $address->fresh(), 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendJsonResponse(false, 'Failed to set default address', ['error' => $e->getMessage()], 500);
        }
    }
}
