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

    public function register(Request $request)
    {
        Log::info('Datos recibidos en el registro: ', ['id_rol' => $request->id_rol]);
        Log::info('Datos recibidos en el registro: ', ['nombre' => $request->nombre]);
        Log::info('Datos recibidos en el registro: ', ['rut' => $request->rut]);
        // Validar los datos recibidos
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100',
            'rut' => 'required|string|max:12|unique:users,rut',
            'password' => 'required|string|min:8|confirmed',
            'id_rol' => 'required|exists:roles,id_rol', // Asegura que sea un rol válido
        ]);

        // Si la validación falla, devolver los errores
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        // Mostrar los datos que se están recibiendo
        Log::info('Datos recibidos en el registro: ', $request->all());

        // Crear el usuario con los datos válidos
        $user = User::create([
            'nombre' => $request->nombre,
            'rut' => $request->rut,
            'password' => Hash::make($request->password),
            'id_rol' => $request->id_rol, // Asignar el rol recibido
        ]);

        // Crear un token para el usuario
        $token = $user->createToken('MyAppToken')->plainTextToken;

        // Devolver la respuesta con los datos del usuario y token
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
                'nombre' => $user->nombre,
                'rut' => $user->rut,
                'id_rol' => $user->id_rol,
                'rol' => $rolNombre, 
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