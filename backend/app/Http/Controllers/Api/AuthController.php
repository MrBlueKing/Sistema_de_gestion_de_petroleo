<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    // Método para registrar un nuevo usuario
    // Este método recibe una solicitud HTTP y crea un nuevo usuario en la base de datos.

    // Registro de usuario
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'rut' => 'required|string|max:12|unique:users,rut',
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'id_rol' => 'required|exists:roles,id_rol',
            'id_faena' => 'required|integer', // o valida contra tabla faenas si existe
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $user = User::create([
            'rut' => $request->rut,
            'nombre' => $request->nombre,
            'apellido' => $request->apellido,
            'id_rol' => $request->id_rol,
            'id_faena' => $request->id_faena,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('MyAppToken')->plainTextToken;

        return response()->json([
            'message' => 'Usuario registrado exitosamente',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    // Método para iniciar sesión
    // Este método recibe una solicitud HTTP y autentica al usuario.
    public function login(Request $request)
    {
        $credentials = $request->only('rut', 'password');
    
        Log::info('Login request data:', $request->all());
    
        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Credenciales inválidas'], 401);
        }
    
        $user = $request->user()->load('rol'); // Cargar la relación con el rol
        $token = $user->createToken('api_token')->plainTextToken;

        // Luego, accede al nombre del rol de manera explícita:
        $rolNombre = $user->rol->rol;  // 'rol' es el campo que contiene el nombre del rol

        Log::info('Datos usuario', $user->toArray());
    
        return response()->json([
            'user' => [
                'id' => $user->id,
                'nombre' => $user->nombre,
                'rut' => $user->rut,
                'id_rol' => $user->id_rol,
                'rol' => $rolNombre, 
                'apellido' => $user->apellido,
            ],
            'token' => $token,
        ]);
    }
    

    // Método para cerrar sesión
    // Este método recibe una solicitud HTTP y cierra la sesión del usuario actual.
    public function logout(Request $request)
    {       
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada']);
    }
}