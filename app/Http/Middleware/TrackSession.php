<?php

namespace App\Http\Middleware;

use App\Services\SessionTrackingService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrackSession
{
    /**
     * Handle an incoming request.
     * Automatically creates/updates guest sessions for cart and recently viewed products
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip session tracking for admin users
        $user = $request->user();
        if ($user && $user->role === 'admin') {
            // Admin users don't need session tracking
            $request->merge(['session_id' => null]);
            return $next($request);
        }
        
        // Skip session tracking for admin routes (additional safety check)
        // Admin routes are prefixed with /api/admin
        if ($request->is('api/admin*') || str_starts_with($request->path(), 'api/admin')) {
            $request->merge(['session_id' => null]);
            return $next($request);
        }
        
        // Get or create session (works for both authenticated users and guests)
        $userId = $user?->id;
        $session = SessionTrackingService::getOrCreateSession($request, $userId);
        
        // For authenticated users, do NOT merge session_id into request
        // Controllers should use user_id only for authenticated users
        // For guests, merge session_id so controllers can use it
        if (!$userId) {
            $request->merge(['session_id' => $session->session_id]);
        } else {
            // For authenticated users, explicitly set session_id to null in request
            // This ensures controllers don't accidentally use session_id
            $request->merge(['session_id' => null]);
        }
        
        $response = $next($request);
        
        // Add session_id to response headers for frontend to store (only for guests)
        // For authenticated users, frontend should not need session_id
        if (method_exists($response, 'header') && !$userId) {
            $response->header('X-Session-ID', $session->session_id);
        }
        
        return $response;
    }
}

