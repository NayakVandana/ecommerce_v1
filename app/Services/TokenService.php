<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserToken;
use Illuminate\Support\Str;

class TokenService
{
    /**
     * Generate a secure token
     */
    public static function generateToken(): string
    {
        return Str::random(80);
    }

    /**
     * Create and store a token for user
     */
    public static function createToken(User $user, $deviceType = 'web', $deviceToken = null): string
    {
        $token = self::generateToken();
        
        $data = [
            'user_id' => $user->id,
            'device_type' => $deviceType,
            'device_token' => $deviceToken,
        ];
        
        // Store token in appropriate field based on device type
        if ($deviceType === 'web') {
            $data['web_access_token'] = $token;
        } else {
            $data['app_access_token'] = $token;
        }
        
        UserToken::create($data);
        
        return $token;
    }

    /**
     * Validate token and return user
     */
    public static function validateToken($token): ?User
    {
        $userToken = UserToken::where(function($query) use ($token) {
            $query->where('web_access_token', $token)
                  ->orWhere('app_access_token', $token);
        })->first();
        
        if ($userToken && $userToken->user) {
            return $userToken->user;
        }
        
        return null;
    }

    /**
     * Delete token
     */
    public static function deleteToken($token): bool
    {
        return UserToken::where(function($query) use ($token) {
            $query->where('web_access_token', $token)
                  ->orWhere('app_access_token', $token);
        })->delete() > 0;
    }

    /**
     * Delete all tokens for a user
     */
    public static function deleteAllUserTokens($userId): bool
    {
        return UserToken::where('user_id', $userId)->delete() > 0;
    }
}

