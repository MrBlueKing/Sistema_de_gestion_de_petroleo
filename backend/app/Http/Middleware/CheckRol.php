<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!$request->user()) {
            return response()->json([
                'message' => 'No autenticado'
            ], 401);
        }

        $user = $request->user();
        
        if (!$user->relationLoaded('rol')) {
            $user->load('rol');
        }

        if (!$user->rol) {
            return response()->json([
                'message' => 'Usuario sin rol asignado'
            ], 403);
        }

        $userRole = $user->rol->rol;

        if (empty($roles)) {
            return $next($request);
        }

        if (!in_array($userRole, $roles)) {
            return response()->json([
                'message' => 'Acceso denegado',
                'required_roles' => $roles,
                'user_role' => $userRole
            ], 403);
        }

        return $next($request);
    }
}