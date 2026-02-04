<?php

namespace App\Http\Middleware;

use App\Models\UserToken;
use Closure;
use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class Authenticate extends Middleware
{
    /**
     * Handle an incoming request.
     * 
     * First tries token-based authentication (for SPA with token),
     * then falls back to session-based authentication.
     */
    public function handle($request, Closure $next, ...$guards)
    {
        // Try token-based authentication first (for SPA)
        $token = $this->getTokenFromRequest($request);
        
        if ($token) {
            $userToken = UserToken::where(function ($q) use ($token) {
                $q->where('web_access_token', $token)
                  ->orWhere('app_access_token', $token);
            })->first();

            if ($userToken && $userToken->user) {
                Auth::login($userToken->user);
                return $next($request);
            }
        }

        // Fall back to parent implementation (session-based auth)
        return parent::handle($request, $next, ...$guards);
    }

    /**
     * Get token from request (cookie, header, or query)
     */
    protected function getTokenFromRequest(Request $request): ?string
    {
        // Check cookie first (for SPA)
        $token = $request->cookie('auth_token');
        
        // Check Authorization header
        if (!$token) {
            $token = $request->bearerToken();
        }
        
        // Check query parameter
        if (!$token) {
            $token = $request->query('token');
        }

        // Remove "Bearer " prefix if present
        if ($token && str_starts_with($token, 'Bearer ')) {
            $token = substr($token, 7);
        }

        return $token;
    }

    protected function redirectTo(Request $request): ?string
    {
        return $request->expectsJson() ? null : route('login');
    }
}

