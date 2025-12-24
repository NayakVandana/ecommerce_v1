<?php

namespace App\Services;

use App\Models\Session;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SessionTrackingService
{
    /**
     * Get or create a session record
     */
    public static function getOrCreateSession(Request $request, $userId = null)
    {
        $sessionId = $request->input('session_id') ?? self::getSessionIdFromRequest($request) ?? Str::random(40);
        
        // Try to find existing session
        $session = Session::where('session_id', $sessionId)->first();
        
        if (!$session) {
            $session = Session::create([
                'session_id' => $sessionId,
                'user_id' => $userId,
                'device_type' => self::detectDeviceType($request),
                'os' => self::detectOS($request),
                'browser' => self::detectBrowser($request),
                'user_agent' => $request->userAgent(),
                'ip_address' => $request->ip(),
                'location' => null, // Can be populated with geolocation service
                'city' => null,
                'country' => null,
                'pincode' => null,
                'last_activity' => now(),
            ]);
        } else {
            // Update existing session
            $session->update([
                'user_id' => $userId ?? $session->user_id,
                'last_activity' => now(),
                'ip_address' => $request->ip(),
            ]);
        }
        
        return $session;
    }

    /**
     * Update session activity
     */
    public static function updateSessionActivity(Request $request, $userId = null)
    {
        $sessionId = $request->input('session_id') ?? self::getSessionIdFromRequest($request);
        
        if ($sessionId) {
            Session::where('session_id', $sessionId)->update([
                'user_id' => $userId ?? Session::where('session_id', $sessionId)->value('user_id'),
                'last_activity' => now(),
                'ip_address' => $request->ip(),
            ]);
        }
    }

    /**
     * Get session ID for guest (creates if doesn't exist)
     */
    public static function getGuestSessionId(Request $request): ?string
    {
        $session = self::getOrCreateSession($request);
        return $session->session_id ?? null;
    }

    /**
     * Detect device type from user agent
     */
    public static function detectDeviceType(Request $request)
    {
        $userAgent = $request->userAgent() ?? '';
        $userAgent = strtolower($userAgent);
        
        if (preg_match('/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i', $userAgent)) {
            return 'mobile';
        } elseif (preg_match('/tablet|ipad/i', $userAgent)) {
            return 'tablet';
        }
        
        return 'web';
    }

    /**
     * Detect operating system
     */
    public static function detectOS(Request $request)
    {
        $userAgent = $request->userAgent() ?? '';
        $userAgent = strtolower($userAgent);
        
        if (preg_match('/windows/i', $userAgent)) {
            return 'Windows';
        } elseif (preg_match('/macintosh|mac os x/i', $userAgent)) {
            return 'macOS';
        } elseif (preg_match('/linux/i', $userAgent)) {
            return 'Linux';
        } elseif (preg_match('/android/i', $userAgent)) {
            return 'Android';
        } elseif (preg_match('/iphone|ipad|ipod/i', $userAgent)) {
            return 'iOS';
        }
        
        return 'Unknown';
    }

    /**
     * Detect browser
     */
    public static function detectBrowser(Request $request)
    {
        $userAgent = $request->userAgent() ?? '';
        $userAgent = strtolower($userAgent);
        
        if (preg_match('/chrome/i', $userAgent) && !preg_match('/edg/i', $userAgent)) {
            return 'Chrome';
        } elseif (preg_match('/firefox/i', $userAgent)) {
            return 'Firefox';
        } elseif (preg_match('/safari/i', $userAgent) && !preg_match('/chrome/i', $userAgent)) {
            return 'Safari';
        } elseif (preg_match('/edg/i', $userAgent)) {
            return 'Edge';
        } elseif (preg_match('/opera|opr/i', $userAgent)) {
            return 'Opera';
        }
        
        return 'Unknown';
    }

    /**
     * Safely get session ID from request
     */
    public static function getSessionIdFromRequest(Request $request)
    {
        try {
            if ($request->hasSession()) {
                return $request->session()->getId();
            }
        } catch (\Exception $e) {
            // Session not available
        }
        
        return null;
    }
}

