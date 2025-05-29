<?php
// app/Http/Middleware/CheckRole.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Verificar que el usuario esté autenticado
        if (!$request->user()) {
            return response()->json([
                'message' => 'No autenticado',
                'error' => 'Token de acceso no válido o expirado'
            ], 401);
        }

        $user = $request->user();
        
        // Cargar la relación con el rol si no está cargada
        if (!$user->relationLoaded('rol')) {
            $user->load('rol');
        }

        // Verificar que el usuario tenga un rol asignado
        if (!$user->rol) {
            return response()->json([
                'message' => 'Usuario sin rol asignado',
                'error' => 'El usuario no tiene permisos definidos'
            ], 403);
        }

        $userRole = $user->rol->rol;

        // Si no se especifican roles, permitir acceso (solo verificar autenticación)
        if (empty($roles)) {
            return $next($request);
        }

        // Verificar si el usuario tiene uno de los roles permitidos
        if (!in_array($userRole, $roles)) {
            return response()->json([
                'message' => 'Acceso denegado',
                'error' => "Se requiere uno de los siguientes roles: " . implode(', ', $roles),
                'user_role' => $userRole
            ], 403);
        }

        return $next($request);
    }
}

// app/Http/Middleware/CheckFaena.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckFaena
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Verificar que el usuario esté autenticado
        if (!$request->user()) {
            return response()->json([
                'message' => 'No autenticado',
                'error' => 'Token de acceso no válido o expirado'
            ], 401);
        }

        $user = $request->user();
        
        // Cargar la relación con la faena si no está cargada
        if (!$user->relationLoaded('faena')) {
            $user->load('faena');
        }

        // Verificar que el usuario tenga una faena asignada
        if (!$user->id_faena || !$user->faena) {
            return response()->json([
                'message' => 'Usuario sin faena asignada',
                'error' => 'El usuario no tiene una faena de trabajo asignada'
            ], 403);
        }

        // Verificar acceso a faena específica si se pasa como parámetro
        $faenaId = $request->route('id_faena') ?? $request->route('idFaena') ?? $request->input('id_faena');
        
        if ($faenaId && $user->id_faena != $faenaId) {
            // Verificar si es admin o gerente (pueden acceder a todas las faenas)
            if (!$user->relationLoaded('rol')) {
                $user->load('rol');
            }
            
            $allowedRoles = ['admin', 'gerente'];
            $userRole = $user->rol->rol ?? null;
            
            if (!in_array($userRole, $allowedRoles)) {
                return response()->json([
                    'message' => 'Acceso denegado a esta faena',
                    'error' => 'No tienes permisos para acceder a esta faena',
                    'user_faena' => $user->id_faena,
                    'requested_faena' => $faenaId
                ], 403);
            }
        }

        return $next($request);
    }
}

// app/Http/Middleware/TokenExpired.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class TokenExpired
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Obtener el token del header Authorization
        $token = $request->bearerToken();
        
        if (!$token) {
            return response()->json([
                'message' => 'Token no proporcionado',
                'error' => 'Se requiere un token de acceso válido'
            ], 401);
        }

        // Buscar el token en la base de datos
        $accessToken = PersonalAccessToken::findToken($token);
        
        if (!$accessToken) {
            return response()->json([
                'message' => 'Token inválido',
                'error' => 'El token proporcionado no es válido'
            ], 401);
        }

        // Verificar si el token ha expirado (Laravel Sanctum maneja esto automáticamente)
        // Pero podemos agregar verificaciones adicionales
        
        // Verificar si el usuario aún existe y está activo
        $user = $accessToken->tokenable;
        if (!$user || !$user->estado) {
            return response()->json([
                'message' => 'Usuario inactivo',
                'error' => 'La cuenta de usuario está inactiva'
            ], 403);
        }

        // Opcional: Verificar última actividad del token
        if ($accessToken->last_used_at && $accessToken->last_used_at->diffInDays(now()) > 30) {
            // Token no usado por más de 30 días - opcional revocarlo
            return response()->json([
                'message' => 'Token expirado por inactividad',
                'error' => 'El token ha expirado por falta de uso'
            ], 401);
        }

        return $next($request);
    }
}