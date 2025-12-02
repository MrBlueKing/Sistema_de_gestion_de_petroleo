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
    public function recientes(Request $request)
    {
        // Si se pasa el parámetro 'all', devolver todos los usuarios
        $limit = $request->has('all') ? null : 5;

        $query = User::with(['faena', 'rol'])
            ->orderBy('created_at', 'desc');

        if ($limit) {
            $query->take($limit);
        }

        $usuarios = $query->get()
            ->map(function ($usuario) {
                return [
                    'id' => $usuario->id,
                    'rut' => $usuario->rut,
                    'nombre' => $usuario->nombre,
                    'apellido' => $usuario->apellido,
                    'id_faena' => $usuario->id_faena, // ID de la faena
                    'ubicacion_faena' => optional($usuario->faena)->ubicacion, // Aquí extraemos la ubicación
                    'id_rol' => $usuario->id_rol, // ✅ Agregar ID del rol
                    'rol' => optional($usuario->rol)->rol, // Aquí extraemos el nombre del rol
                    'created_at' => $usuario->created_at,
                    'estado' => $usuario->estado,
                ];
            });

        return response()->json($usuarios);
    }
    
}
