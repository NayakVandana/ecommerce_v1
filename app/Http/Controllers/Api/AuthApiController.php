<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\RecentlyViewedProduct;
use App\Models\Cart;
use App\Models\UserLoginLog;
use App\Models\VerificationToken;
use App\Services\SessionTrackingService;
use App\Services\TokenService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class AuthApiController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|regex:/^[6-9]\d{9}$/|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'phone.required' => 'Phone number is required.',
            'phone.regex' => 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.',
            'phone.unique' => 'This phone number is already registered.',
            'email.unique' => 'This email address is already registered.',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
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
            'email' => 'required',
            'password' => 'required',
        ]);

        $emailOrPhone = $request->email;
        
        // Determine if input is email or phone
        $isEmail = filter_var($emailOrPhone, FILTER_VALIDATE_EMAIL);
        $isPhone = preg_match('/^[6-9]\d{9}$/', $emailOrPhone);
        
        if (!$isEmail && !$isPhone) {
            throw ValidationException::withMessages([
                'email' => ['Please enter a valid email address or phone number.'],
            ]);
        }

        // Find user by email or phone
        if ($isEmail) {
            $user = User::where('email', $emailOrPhone)->first();
        } else {
            $user = User::where('phone', $emailOrPhone)->first();
        }

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

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required',
        ]);

        $emailOrPhone = $request->email;
        
        // Determine if input is email or phone
        $isEmail = filter_var($emailOrPhone, FILTER_VALIDATE_EMAIL);
        $isPhone = preg_match('/^[6-9]\d{9}$/', $emailOrPhone);
        
        if (!$isEmail && !$isPhone) {
            throw ValidationException::withMessages([
                'email' => ['Please enter a valid email address or phone number.'],
            ]);
        }

        // Find user by email or phone
        if ($isEmail) {
            $user = User::where('email', $emailOrPhone)->first();
            $userEmail = $user ? $user->email : null;
            $userPhone = $user ? $user->phone : null;
        } else {
            $user = User::where('phone', $emailOrPhone)->first();
            $userEmail = $user ? $user->email : null;
            $userPhone = $user ? $user->phone : null;
        }

        if (!$user) {
            // Don't reveal if user exists or not for security
            return $this->sendJsonResponse(true, 'If that email/phone exists, we have sent an OTP.', [], 200);
        }

        // Generate 6-digit OTP (100000 to 999999)
        $otp = (string) rand(100000, 999999);
        
        // Generate verification token
        $verificationToken = Str::random(64);

        // Delete any existing verification tokens for this email/phone
        VerificationToken::where('email', $userEmail)
            ->orWhere('mobile', $userPhone)
            ->where('request_type', 'FORGOT_PASSWORD')
            ->delete();

        // Create new verification token record
        VerificationToken::create([
            'email' => $userEmail,
            'mobile' => $userPhone,
            'request_type' => 'FORGOT_PASSWORD',
            'otp' => $otp,
            'verification_token' => Hash::make($verificationToken),
            'otp_verified' => false,
            'attempt_counter' => 1,
        ]);

        // In development, log the OTP
        if (app()->environment(['local', 'testing'])) {
            Log::info('Password Reset OTP', [
                'email' => $userEmail,
                'mobile' => $userPhone,
                'otp' => $otp,
                'verification_token' => $verificationToken,
            ]);
        }

        // TODO: Send OTP via SMS/Email
        // if ($userPhone) {
        //     // Send SMS with OTP
        // }
        // if ($userEmail) {
        //     // Send Email with OTP
        //     // Mail::to($userEmail)->send(new PasswordResetOTP($otp));
        // }

        return $this->sendJsonResponse(true, 'If that email/phone exists, we have sent an OTP.', [
            'verification_token' => app()->environment(['local', 'testing']) ? $verificationToken : null, // Only in dev
            'otp' => app()->environment(['local', 'testing']) ? $otp : null, // Only in dev
            'email' => $userEmail,
            'mobile' => $userPhone,
        ], 200);
    }

    public function resendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required',
        ]);

        $emailOrPhone = $request->email;
        
        // Determine if input is email or phone
        $isEmail = filter_var($emailOrPhone, FILTER_VALIDATE_EMAIL);
        $isPhone = preg_match('/^[6-9]\d{9}$/', $emailOrPhone);
        
        if (!$isEmail && !$isPhone) {
            throw ValidationException::withMessages([
                'email' => ['Please enter a valid email address or phone number.'],
            ]);
        }

        // Find user by email or phone
        if ($isEmail) {
            $user = User::where('email', $emailOrPhone)->first();
            $userEmail = $user ? $user->email : null;
            $userPhone = $user ? $user->phone : null;
        } else {
            $user = User::where('phone', $emailOrPhone)->first();
            $userEmail = $user ? $user->email : null;
            $userPhone = $user ? $user->phone : null;
        }

        if (!$user) {
            // Don't reveal if user exists or not for security
            return $this->sendJsonResponse(true, 'If that email/phone exists, we have sent an OTP.', [], 200);
        }

        // Check for existing verification token to get rate limiting
        $existingToken = VerificationToken::where('email', $userEmail)
            ->orWhere('mobile', $userPhone)
            ->where('request_type', 'FORGOT_PASSWORD')
            ->where('otp_verified', false)
            ->first();

        // Rate limiting: Check if OTP was sent within last 60 seconds
        if ($existingToken) {
            $secondsSinceCreation = Carbon::parse($existingToken->created_at)->diffInSeconds(now());
            if ($secondsSinceCreation < 60) {
                $remainingSeconds = 60 - $secondsSinceCreation;
                throw ValidationException::withMessages([
                    'email' => ["Please wait {$remainingSeconds} seconds before requesting a new OTP."],
                ]);
            }
        }

        // Generate new 6-digit OTP (100000 to 999999)
        $otp = (string) rand(100000, 999999);
        
        // Generate new verification token
        $verificationToken = Str::random(64);

        // Delete any existing verification tokens for this email/phone
        VerificationToken::where('email', $userEmail)
            ->orWhere('mobile', $userPhone)
            ->where('request_type', 'FORGOT_PASSWORD')
            ->delete();

        // Create new verification token record
        VerificationToken::create([
            'email' => $userEmail,
            'mobile' => $userPhone,
            'request_type' => 'FORGOT_PASSWORD',
            'otp' => $otp,
            'verification_token' => Hash::make($verificationToken),
            'otp_verified' => false,
            'attempt_counter' => 1,
        ]);

        // In development, log the OTP
        if (app()->environment(['local', 'testing'])) {
            Log::info('Password Reset OTP (Resent)', [
                'email' => $userEmail,
                'mobile' => $userPhone,
                'otp' => $otp,
                'verification_token' => $verificationToken,
            ]);
        }

        // TODO: Send OTP via SMS/Email
        // if ($userPhone) {
        //     // Send SMS with OTP
        // }
        // if ($userEmail) {
        //     // Send Email with OTP
        //     // Mail::to($userEmail)->send(new PasswordResetOTP($otp));
        // }

        return $this->sendJsonResponse(true, 'A new OTP has been sent to your email/phone.', [
            'verification_token' => app()->environment(['local', 'testing']) ? $verificationToken : null, // Only in dev
            'otp' => app()->environment(['local', 'testing']) ? $otp : null, // Only in dev
            'email' => $userEmail,
            'mobile' => $userPhone,
        ], 200);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'verification_token' => 'required|string',
            'otp' => 'required|string|size:6',
            'email' => 'required|string',
        ]);

        // Find verification token record
        $verificationRecord = VerificationToken::where('email', $request->email)
            ->where('request_type', 'FORGOT_PASSWORD')
            ->where('otp_verified', false)
            ->first();

        if (!$verificationRecord) {
            throw ValidationException::withMessages([
                'otp' => ['Invalid or expired OTP. Please request a new one.'],
            ]);
        }

        // Check if verification token matches
        if (!Hash::check($request->verification_token, $verificationRecord->verification_token)) {
            throw ValidationException::withMessages([
                'verification_token' => ['Invalid verification token.'],
            ]);
        }

        // Check OTP expiration (15 minutes)
        $otpAge = Carbon::parse($verificationRecord->created_at)->diffInMinutes(now());
        if ($otpAge > 15) {
            $verificationRecord->delete();
            throw ValidationException::withMessages([
                'otp' => ['OTP has expired. Please request a new one.'],
            ]);
        }

        // Check attempt counter (max 5 attempts)
        if ($verificationRecord->attempt_counter >= 5) {
            $verificationRecord->delete();
            throw ValidationException::withMessages([
                'otp' => ['Maximum OTP verification attempts exceeded. Please request a new OTP.'],
            ]);
        }

        // Verify OTP
        if ($request->otp !== $verificationRecord->otp) {
            $verificationRecord->increment('attempt_counter');
            throw ValidationException::withMessages([
                'otp' => ['Invalid OTP. Please try again.'],
            ]);
        }

        // Mark OTP as verified
        $verificationRecord->update([
            'otp_verified' => true,
            'verification_datetime' => now(),
        ]);

        return $this->sendJsonResponse(true, 'OTP verified successfully.', [
            'verification_token' => $request->verification_token,
            'email' => $request->email,
        ], 200);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'verification_token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Find verified verification token record
        $verificationRecord = VerificationToken::where('email', $request->email)
            ->where('request_type', 'FORGOT_PASSWORD')
            ->where('otp_verified', true)
            ->first();

        if (!$verificationRecord) {
            throw ValidationException::withMessages([
                'verification_token' => ['OTP not verified. Please verify OTP first.'],
            ]);
        }

        // Verify verification token
        if (!Hash::check($request->verification_token, $verificationRecord->verification_token)) {
            throw ValidationException::withMessages([
                'verification_token' => ['Invalid verification token.'],
            ]);
        }

        // Check if verification is still valid (30 minutes from verification)
        if ($verificationRecord->verification_datetime) {
            $verificationAge = Carbon::parse($verificationRecord->verification_datetime)->diffInMinutes(now());
            if ($verificationAge > 30) {
                $verificationRecord->delete();
                throw ValidationException::withMessages([
                    'verification_token' => ['Verification has expired. Please request a new OTP.'],
                ]);
            }
        }

        // Find user and update password
        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['User not found.'],
            ]);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        // Delete the verification token record
        $verificationRecord->delete();

        return $this->sendJsonResponse(true, 'Your password has been reset successfully. You can now login with your new password.', [], 200);
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

