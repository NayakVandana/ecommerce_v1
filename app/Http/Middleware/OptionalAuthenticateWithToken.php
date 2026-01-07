<?php

namespace App\Http\Middleware;

use App\Models\UserToken;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Optional Authentication Middleware
 * 
 * Sets the authenticated user if a valid token is provided,
 * but does NOT require authentication (allows guest users).
 * 
 * This is useful for routes that work for both authenticated and guest users.
 */
class OptionalAuthenticateWithToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if this is an admin impersonation request
        $impersonateUserId = $request->header('X-Impersonate-User') ?? $request->get('impersonate_user_id');
        
        if ($impersonateUserId) {
            // Skip normal token verification for admin impersonation
            // The AdminImpersonation middleware will handle this
            return $next($request);
        }

        // Try to get token from request
        $token = $request->bearerToken() ?? $request->get('Authorization');
        
        // Remove "Bearer " prefix if present
        if ($token && str_starts_with($token, 'Bearer ')) {
            $token = substr($token, 7);
        }

        // If token exists, try to authenticate user
        if ($token) {
            $userToken = UserToken::where(function ($q) use ($token) {
                $q->where('web_access_token', $token)
                  ->orWhere('app_access_token', $token);
            })->first();

            if ($userToken && $userToken->user) {
                // Set authenticated user
                Auth::login($userToken->user);
            }
        }

        // Continue with request (whether authenticated or not)
        return $next($request);
    }
}

