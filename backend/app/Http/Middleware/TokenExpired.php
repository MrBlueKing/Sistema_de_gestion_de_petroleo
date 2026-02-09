<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class TokenExpired
{
    public function handle(Request $request, Closure $next): Response
    {
        // ✅ IMPORTANTE: Excluir ruta de login centralizado
        // Este endpoint usa tokens del sistema centralizado, no del local
        if ($request->is('api/login-centralizado')) {
            return $next($request);
        }

        $token = $request->bearerToken();

        if (!$token) {
            return $next($request); // Dejar que auth:sanctum maneje esto
        }

        $accessToken = PersonalAccessToken::findToken($token);
        
        if (!$accessToken) {
            return response()->json([
                'message' => 'Token inválido'
            ], 401);
        }

        $user = $accessToken->tokenable;
        if (!$user || (isset($user->estado) && !$user->estado)) {
            return response()->json([
                'message' => 'Usuario inactivo'
            ], 403);
        }

        // Opcional: Verificar inactividad (30 días)
        if ($accessToken->last_used_at && $accessToken->last_used_at->diffInDays(now()) > 30) {
            $accessToken->delete();
            return response()->json([
                'message' => 'Token expirado por inactividad'
            ], 401);
        }

        return $next($request);
    }
}