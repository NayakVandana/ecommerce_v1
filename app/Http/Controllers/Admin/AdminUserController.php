<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        // Date range filter
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [
                \Carbon\Carbon::parse($request->start_date)->startOfDay(),
                \Carbon\Carbon::parse($request->end_date)->endOfDay()
            ]);
        }

        $users = $query->latest()->paginate(15);

        return $this->sendJsonResponse(true, 'Users fetched successfully', $users, 200);
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:users,id',
        ]);

        $user = User::with(['orders', 'addresses'])->findOrFail($request->id);

        return $this->sendJsonResponse(true, 'User fetched successfully', $user, 200);
    }

    public function update(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:users,id',
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $request->id,
            'password' => 'sometimes|string|min:8',
            'role' => 'sometimes|in:user,admin',
        ]);

        $user = User::findOrFail($request->id);

        if ($request->has('name')) {
            $user->name = $request->name;
        }

        if ($request->has('email')) {
            $user->email = $request->email;
        }

        if ($request->has('password')) {
            $user->password = Hash::make($request->password);
        }

        if ($request->has('role')) {
            $user->role = $request->role;
        }

        $user->save();

        return $this->sendJsonResponse(true, 'User updated successfully', $user->fresh(), 200);
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($request->id);

        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return $this->sendJsonResponse(false, 'Cannot delete your own account', [], 400);
        }

        $user->delete();

        return $this->sendJsonResponse(true, 'User deleted successfully', [], 200);
    }

    public function toggleRole(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($request->id);

        // Prevent changing your own role
        if ($user->id === auth()->id()) {
            return $this->sendJsonResponse(false, 'Cannot change your own role', [], 400);
        }

        $user->role = $user->role === 'admin' ? 'user' : 'admin';
        $user->save();

        return $this->sendJsonResponse(true, 'User role updated successfully', $user, 200);
    }
}

