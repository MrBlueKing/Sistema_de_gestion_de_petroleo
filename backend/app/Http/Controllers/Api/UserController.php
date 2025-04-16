<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class UserController extends Controller
{
    // Obtener un usuario por ID
    public function show($id)
    {
        // Buscar al usuario por su ID
        $user = User::find($id);

        // Si no se encuentra el usuario, responder con un error
        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        // Devolver los detalles del usuario
        return response()->json($user);
    }
}
