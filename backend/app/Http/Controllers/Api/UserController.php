<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class UserController extends Controller
{
    public function show($id)
    {
        // Buscar al usuario con sus relaciones
        $user = User::with(['faena', 'rol'])->find($id);
    
        // Si no se encuentra el usuario, responder con un error
        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }
    
        // Devolver los detalles del usuario con sus relaciones
        return response()->json($user);
    }
    

    // ✅ Nuevo método para obtener usuarios recientes
    public function recientes()
    {
        // Carga los últimos 5 usuarios y su faena relacionada
        $usuarios = User::with(['faena', 'rol']) // ahora cargamos también 'rol'
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($usuario) {
                return [
                    'id' => $usuario->id,
                    'rut' => $usuario->rut,
                    'nombre' => $usuario->nombre,
                    'apellido' => $usuario->apellido,
                    'ubicacion_faena' => optional($usuario->faena)->ubicacion, // Aquí extraemos la ubicación
                    'rol' => optional($usuario->rol)->rol, // Aquí extraemos la ubicación
                    'created_at' => $usuario->created_at,
                    'estado' => $usuario->estado,
                ];
            });
    
        return response()->json($usuarios);
    }
    
}
