<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckFaena
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user()) {
            return response()->json([
                'message' => 'No autenticado'
            ], 401);
        }

        $user = $request->user();
        
        if (!$user->relationLoaded('faena')) {
            $user->load('faena');
        }

        if (!$user->id_faena || !$user->faena) {
            return response()->json([
                'message' => 'Usuario sin faena asignada'
            ], 403);
        }

        $faenaId = $request->route('id_faena') ?? $request->route('idFaena') ?? $request->input('id_faena');
        
        if ($faenaId && $user->id_faena != $faenaId) {
            if (!$user->relationLoaded('rol')) {
                $user->load('rol');
            }
            
            $allowedRoles = ['admin', 'gerente'];
            $userRole = $user->rol->rol ?? null;
            
            if (!in_array($userRole, $allowedRoles)) {
                return response()->json([
                    'message' => 'Acceso denegado a esta faena'
                ], 403);
            }
        }

        return $next($request);
    }