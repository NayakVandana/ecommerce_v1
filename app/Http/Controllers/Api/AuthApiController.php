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

        // Get session_id from request (set by middleware or from frontend)
        // The middleware already ran and created/retrieved a session, so session_id should be in the request
        $sessionId = $request->input('session_id') 
            ?? $request->query('session_id')
            ?? $request->header('X-Session-ID')
            ?? SessionTrackingService::getSessionIdFromRequest($request);
        
        // Normalize: convert empty string to null
        if ($sessionId === '' || $sessionId === 'null') {
            $sessionId = null;
        }

        // Update existing session to associate with user
        // The middleware already created/retrieved a session, so we just need to update it with user_id
        if ($sessionId) {
            // Find the session created by middleware
            $session = \App\Models\Session::where('session_id', $sessionId)->first();
            if ($session) {
                // Update the session to associate with user
                $session->update([
                    'user_id' => $user->id,
                    'last_activity' => now(),
                ]);
            }
            // If session doesn't exist (shouldn't happen), the middleware would have created it
        }
        // Note: We don't create a new session here because the middleware already handled it

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

        // Get session_id from request (set by middleware or from frontend)
        // The middleware already ran and created/retrieved a session, so session_id should be in the request
        $sessionId = $request->input('session_id') 
            ?? $request->query('session_id')
            ?? $request->header('X-Session-ID')
            ?? SessionTrackingService::getSessionIdFromRequest($request);
        
        // Normalize: convert empty string to null
        if ($sessionId === '' || $sessionId === 'null') {
            $sessionId = null;
        }

        // Update existing session to associate with user
        // The middleware already created/retrieved a session, so we just need to update it with user_id
        if ($sessionId) {
            // Find the session created by middleware
            $session = \App\Models\Session::where('session_id', $sessionId)->first();
            if ($session) {
                // Update the session to associate with user
                $session->update([
                    'user_id' => $user->id,
                    'last_activity' => now(),
                ]);
            }
            // If session doesn't exist (shouldn't happen), the middleware would have created it
        }
        // Note: We don't create a new session here because the middleware already handled it

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
        
        // Log logout only if user is authenticated
        if ($user) {
            $this->logUserLogout($user->id, $request);
        }

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
     * 
     * Flow:
     * 1. Guest entries: user_id = null, session_id = X
     * 2. After login: Update guest entries to user_id = Y, session_id = null
     * 3. If user already has same item, merge quantities/dates and delete guest entry
     * 4. Clean up any orphaned entries that have both user_id and session_id
     * 
     * Also cleans up any orphaned entries and ensures all user data uses user_id
     */
    private function mergeGuestData(Request $request, int $userId): void
    {
        $sessionId = $request->input('session_id') 
            ?? $request->query('session_id')
            ?? $request->header('X-Session-ID')
            ?? SessionTrackingService::getSessionIdFromRequest($request);
        
        // Normalize: convert empty string to null
        if ($sessionId === '' || $sessionId === 'null') {
            $sessionId = null;
        }

        // Merge recently viewed products from guest session
        // Update all guest entries (session_id exists, user_id is null) to user account
        if ($sessionId) {
            // Get all guest views for this session (user_id is null, session_id matches)
            $guestViews = RecentlyViewedProduct::where('session_id', $sessionId)
                ->whereNull('user_id')
                ->get();
            
            foreach ($guestViews as $view) {
                // Check if user already has this product in recently viewed
                $existing = RecentlyViewedProduct::where('user_id', $userId)
                    ->where('product_id', $view->product_id)
                    ->whereNull('session_id')
                    ->first();
                
                if ($existing) {
                    // User already has this product - update viewed_at if guest viewed it more recently
                    if ($view->viewed_at && (!$existing->viewed_at || $view->viewed_at > $existing->viewed_at)) {
                        $existing->update(['viewed_at' => $view->viewed_at]);
                    }
                    // Delete the guest entry
                    $view->delete();
                } else {
                    // Migrate guest entry to user account - update directly
                    $view->update([
                        'user_id' => $userId,
                        'session_id' => null, // Set session_id to null
                    ]);
                }
            }
        }

        // Clean up any orphaned recently viewed entries that have session_id but should have user_id
        // This handles cases where entries were created incorrectly
        $orphanedViews = RecentlyViewedProduct::where('user_id', $userId)
            ->whereNotNull('session_id')
            ->get();
        foreach ($orphanedViews as $view) {
            // Check if there's a duplicate without session_id
            $existing = RecentlyViewedProduct::where('user_id', $userId)
                ->where('product_id', $view->product_id)
                ->whereNull('session_id')
                ->first();
            
            if ($existing) {
                // Keep the one without session_id, delete the orphaned one
                $view->delete();
            } else {
                // Update to remove session_id
                $view->update(['session_id' => null]);
            }
        }

        // Merge cart items from guest session
        // Update all guest entries (session_id exists, user_id is null) to user account
        if ($sessionId) {
            // Get all guest cart items for this session (user_id is null, session_id matches)
            $guestCartItems = Cart::where('session_id', $sessionId)
                ->whereNull('user_id')
                ->get();
            
            foreach ($guestCartItems as $item) {
                // Check if user already has this exact product/variation combination
                $existing = Cart::where('user_id', $userId)
                    ->whereNull('session_id')
                    ->where('product_id', $item->product_id)
                    ->where('variation_id', $item->variation_id)
                    ->first();

                if ($existing) {
                    // User already has this item - merge quantities
                    $existing->quantity += $item->quantity;
                    $existing->save();
                    // Delete the guest entry after merging
                    $item->delete();
                } else {
                    // Migrate guest item to user account - update directly
                    $item->update([
                        'user_id' => $userId,
                        'session_id' => null, // Set session_id to null
                    ]);
                }
            }
        }

        // Clean up any orphaned cart entries that have both user_id and session_id
        // Or entries with user_id but session_id is not null
        $orphanedCartItems = Cart::where('user_id', $userId)
            ->whereNotNull('session_id')
            ->get();
        
        foreach ($orphanedCartItems as $item) {
            // Check if there's a duplicate without session_id
            $existing = Cart::where('user_id', $userId)
                ->where('product_id', $item->product_id)
                ->where('variation_id', $item->variation_id)
                ->whereNull('session_id')
                ->first();
            
            if ($existing) {
                // Merge quantities and delete orphaned entry
                $existing->quantity += $item->quantity;
                $existing->save();
                $item->delete();
            } else {
                // Just remove session_id from this entry
                $item->update(['session_id' => null]);
            }
        }

        // Also ensure all user's cart and recently viewed entries have user_id set correctly
        // and session_id is null (for authenticated users)
        Cart::where('user_id', $userId)
            ->whereNotNull('session_id')
            ->update(['session_id' => null]);
        
        RecentlyViewedProduct::where('user_id', $userId)
            ->whereNotNull('session_id')
            ->update(['session_id' => null]);
    }
}

