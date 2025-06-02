<?php
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
