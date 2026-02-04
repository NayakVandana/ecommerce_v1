<?php

namespace App\Http\Middleware;

use App\Models\UserToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    /**
     * Handle the incoming request.
     * Authenticate user from token if available (for SPA token-based auth).
     */
    public function handle(Request $request, \Closure $next)
    {
        // Try to authenticate user from token if not already authenticated
        if (!$request->user()) {
            $token = $this->getTokenFromRequest($request);
            
            if ($token) {
                $userToken = UserToken::where(function ($q) use ($token) {
                    $q->where('web_access_token', $token)
                      ->orWhere('app_access_token', $token);
                })->first();

                if ($userToken && $userToken->user) {
                    Auth::login($userToken->user);
                }
            }
        }

        return parent::handle($request, $next);
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

        // Check X-Auth-Token header (for Inertia requests)
        if (!$token) {
            $token = $request->header('X-Auth-Token');
        }

        // Remove "Bearer " prefix if present
        if ($token && str_starts_with($token, 'Bearer ')) {
            $token = substr($token, 7);
        }

        return $token;
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'error' => fn () => $request->session()->get('error'),
                'success' => fn () => $request->session()->get('success'),
            ],
            'url' => $request->url(),
        ];
    }
}

