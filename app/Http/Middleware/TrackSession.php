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
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Track session activity
        $userId = $request->user()?->id;
        SessionTrackingService::updateSessionActivity($request, $userId);
        
        return $next($request);
    }
}

