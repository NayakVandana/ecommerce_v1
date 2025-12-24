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
        // Get or create session (works for both authenticated users and guests)
        $userId = $request->user()?->id;
        $session = SessionTrackingService::getOrCreateSession($request, $userId);
        
        // Attach session_id to request for easy access in controllers
        $request->merge(['session_id' => $session->session_id]);
        
        $response = $next($request);
        
        // Add session_id to response headers for frontend to store
        if (method_exists($response, 'header')) {
            $response->header('X-Session-ID', $session->session_id);
        }
        
        return $response;
    }
}

