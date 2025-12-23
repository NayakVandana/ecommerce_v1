<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\RecentlyViewedProduct;
use App\Models\Cart;
use App\Models\UserLoginLog;
use App\Services\SessionTrackingService;
use App\Services\TokenService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthApiController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Generate and store token
        $deviceType = SessionTrackingService::detectDeviceType($request);
        $token = TokenService::createToken($user, $deviceType, $request->input('device_token'));

        // Track session
        SessionTrackingService::getOrCreateSession($request, $user->id);

        // Merge guest data (recently viewed, cart) if session existed
        $this->mergeGuestData($request, $user->id);

        // Log registration/login
        $this->logUserLogin($user->id, $request, 'web');

        return $this->sendJsonResponse(true, 'User registered successfully', [
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Developer password for testing (only in non-production environments)
        $developerPassword = 'developer';
        $isDeveloperLogin = app()->environment(['local', 'testing']) && $request->password === $developerPassword;
        
        // Check password: either developer password or actual password
        if (!$isDeveloperLogin && !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Generate and store token
        $loginType = $request->input('login_type', 'web');
        $deviceType = $loginType === 'app' ? 'mobile' : SessionTrackingService::detectDeviceType($request);
        $token = TokenService::createToken($user, $deviceType, $request->input('device_token'));

        // Track session
        SessionTrackingService::getOrCreateSession($request, $user->id);

        // Merge guest data (recently viewed, cart) if session existed
        $this->mergeGuestData($request, $user->id);

        // Log login
        $this->logUserLogin($user->id, $request, $loginType);

        return $this->sendJsonResponse(true, 'Login successful', [
            'user' => $user,
            'token' => $token,
        ], 200);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        
        // Log logout
        $this->logUserLogout($user->id, $request);

        // Delete token
        $token = $request->bearerToken() ?? $request->header('Authorization');
        if ($token && str_starts_with($token, 'Bearer ')) {
            $token = substr($token, 7);
        }
        
        if ($token) {
            TokenService::deleteToken($token);
        }

        return $this->sendJsonResponse(true, 'Logged out successfully', [], 200);
    }

    public function getUser(Request $request)
    {
        return $this->sendJsonResponse(true, 'User fetched successfully', $request->user(), 200);
    }

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $request->user()->id,
            'password' => 'sometimes|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if ($request->has('name')) {
            $user->name = $request->name;
        }

        if ($request->has('email')) {
            $user->email = $request->email;
        }

        if ($request->has('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return $this->sendJsonResponse(true, 'Profile updated successfully', $user, 200);
    }

    /**
     * Log user login
     */
    private function logUserLogin($userId, Request $request, $loginType = 'web')
    {
        UserLoginLog::create([
            'user_id' => $userId,
            'ip_address' => $request->ip(),
            'login_type' => $loginType,
            'os_version' => SessionTrackingService::detectOS($request),
            'app_version' => $request->input('app_version'),
            'login_at' => now(),
        ]);
    }

    /**
     * Log user logout
     */
    private function logUserLogout($userId, Request $request)
    {
        $latestLogin = UserLoginLog::where('user_id', $userId)
            ->whereNull('logout_at')
            ->latest('login_at')
            ->first();

        if ($latestLogin) {
            $latestLogin->update([
                'logout_at' => now(),
            ]);
        }
    }

    /**
     * Merge guest session data into user account on login/register
     */
    private function mergeGuestData(Request $request, int $userId): void
    {
        $sessionId = $request->input('session_id') ?? SessionTrackingService::getSessionIdFromRequest($request);

        if (!$sessionId) {
            return;
        }

        // Merge recently viewed
        $guestViews = RecentlyViewedProduct::where('session_id', $sessionId)->get();
        foreach ($guestViews as $view) {
            RecentlyViewedProduct::updateOrCreate(
                [
                    'user_id' => $userId,
                    'product_id' => $view->product_id,
                ],
                [
                    'viewed_at' => $view->viewed_at ?? now(),
                ]
            );
        }
        // Remove guest entries after merge
        RecentlyViewedProduct::where('session_id', $sessionId)->delete();

        // Merge cart items
        $guestCartItems = Cart::where('session_id', $sessionId)->get();
        foreach ($guestCartItems as $item) {
            $existing = Cart::where('user_id', $userId)
                ->where('product_id', $item->product_id)
                ->where('variation_id', $item->variation_id)
                ->first();

            if ($existing) {
                $existing->quantity += $item->quantity;
                $existing->save();
                $item->delete();
            } else {
                $item->user_id = $userId;
                $item->session_id = null;
                $item->save();
            }
        }
    }
}

