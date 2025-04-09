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
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100',
            'rut' => 'required|string|max:12|unique:users,rut',
            'password' => 'required|string|min:8|confirmed',
        ]);
    
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }
    
        $user = User::create([
            'nombre' => $request->nombre,
            'rut' => $request->rut,
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

        $user = $request->user();
        $token = $user->createToken('api_token')->plainTextToken;

        return response()->json([
            'user' => $user,
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