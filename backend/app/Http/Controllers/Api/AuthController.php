<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\RateLimiter;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\PersonalAccessToken;
use Carbon\Carbon;

class AuthController extends Controller
{
    /**
     * Registro de usuario con validaciones mejoradas
     */
    public function register(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'rut' => 'required|string|max:12|unique:users,rut',
                'nombre' => 'required|string|max:100',
                'apellido' => 'required|string|max:100',
                'id_rol' => 'required|exists:roles,id_rol',
                'id_faena' => 'required|exists:faenas,id_faena',
                'password' => 'required|string|min:8|',
                'email' => 'nullable|email|unique:users,email',
            ], [
                'rut.unique' => 'Este RUT ya está registrado en el sistema',
                'password.min' => 'La contraseña debe tener al menos 8 caracteres',
                //'password.confirmed' => 'Las contraseñas no coinciden',
                'id_rol.exists' => 'El rol especificado no existe',
                'id_faena.exists' => 'La faena especificada no existe',
                'email.unique' => 'Este email ya está registrado',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Errores de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = User::create([
                'rut' => $request->rut,
                'nombre' => $request->nombre,
                'apellido' => $request->apellido,
                'email' => $request->email,
                'id_rol' => $request->id_rol,
                'id_faena' => $request->id_faena,
                'password' => Hash::make($request->password),
                'estado' => 1, // Usuario activo por defecto
            ]);

            // Cargar relaciones para la respuesta
            $user->load(['rol', 'faena']);

            // Crear token con expiración de 24 horas
            $token = $user->createToken('api_token', ['*'], now()->addHours(24))->plainTextToken;

            Log::info('Usuario registrado exitosamente', [
                'user_id' => $user->id,
                'rut' => $user->rut,
                'rol' => $user->rol->rol ?? 'sin_rol'
            ]);

            return response()->json([
                'message' => 'Usuario registrado exitosamente',
                'user' => [
                    'id' => $user->id,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'rut' => $user->rut,
                    'email' => $user->email,
                    'rol' => $user->rol->rol ?? null,
                    'faena' => $user->faena->ubicacion ?? null,
                    'id_rol' => $user->id_rol,
                    'id_faena' => $user->id_faena,
                ],
                'token' => $token,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error en registro de usuario', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error interno del servidor',
                'error' => 'No se pudo completar el registro'
            ], 500);
        }
    }

    /**
     * Login con rate limiting y validaciones mejoradas
     */
    public function login(Request $request)
    {
        try {
            // Rate limiting por IP
            $key = 'login_attempts:' . $request->ip();
            $maxAttempts = 5;
            $decayMinutes = 15;

            if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
                $seconds = RateLimiter::availableIn($key);
                return response()->json([
                    'message' => 'Demasiados intentos de login',
                    'error' => "Intenta nuevamente en {$seconds} segundos"
                ], 429);
            }

            // Validación de entrada
            $validator = Validator::make($request->all(), [
                'rut' => 'required|string',
                'password' => 'required|string',
            ], [
                'rut.required' => 'El RUT es obligatorio',
                'password.required' => 'La contraseña es obligatoria',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Datos de entrada inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $credentials = $request->only('rut', 'password');
            
            Log::info('Intento de login', [
                'rut' => $request->rut,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            // Verificar que el usuario existe y está activo
            $user = User::where('rut', $request->rut)->first();
            
            if (!$user) {
                RateLimiter::hit($key, $decayMinutes * 60);
                return response()->json([
                    'message' => 'Credenciales inválidas',
                    'error' => 'RUT o contraseña incorrectos'
                ], 401);
            }

            if (!$user->estado) {
                return response()->json([
                    'message' => 'Cuenta inactiva',
                    'error' => 'Tu cuenta ha sido desactivada. Contacta al administrador.'
                ], 403);
            }

            // Intentar autenticación
            if (!Auth::attempt($credentials)) {
                RateLimiter::hit($key, $decayMinutes * 60);
                
                Log::warning('Intento de login fallido', [
                    'rut' => $request->rut,
                    'ip' => $request->ip()
                ]);

                return response()->json([
                    'message' => 'Credenciales inválidas',
                    'error' => 'RUT o contraseña incorrectos'
                ], 401);
            }

            // Login exitoso - limpiar rate limiting
            RateLimiter::clear($key);

            // Obtener usuario autenticado con relaciones
            $user = $request->user();
            $user->load(['rol', 'faena']);

            // Revocar tokens antiguos (opcional - mantener solo un token activo)
            // $user->tokens()->delete();

            // Crear nuevo token con expiración de 24 horas
            $token = $user->createToken('api_token', ['*'], now()->addHours(24))->plainTextToken;

            Log::info('Login exitoso', [
                'user_id' => $user->id,
                'rut' => $user->rut,
                'rol' => $user->rol->rol ?? 'sin_rol',
                'faena' => $user->faena->ubicacion ?? 'sin_faena'
            ]);

            return response()->json([
                'message' => 'Login exitoso',
                'user' => [
                    'id' => $user->id,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'rut' => $user->rut,
                    'email' => $user->email,
                    'rol' => $user->rol->rol ?? null,
                    'faena' => $user->faena->ubicacion ?? null,
                    'id_rol' => $user->id_rol,
                    'id_faena' => $user->id_faena,
                ],
                'token' => $token,
                'expires_at' => now()->addHours(24)->toISOString(),
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error en login', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'rut' => $request->rut ?? 'no_provided'
            ]);

            return response()->json([
                'message' => 'Error interno del servidor',
                'error' => 'No se pudo completar el login'
            ], 500);
        }
    }

    /**
     * Logout mejorado con limpieza de tokens
     */
    public function logout(Request $request)
    {
        try {
            $user = $request->user();
            
            // Obtener el token actual
            $currentToken = $request->user()->currentAccessToken();
            
            if ($currentToken) {
                // Eliminar solo el token actual
                $currentToken->delete();
                
                Log::info('Logout exitoso', [
                    'user_id' => $user->id,
                    'rut' => $user->rut
                ]);
            }

            return response()->json([
                'message' => 'Sesión cerrada exitosamente'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error en logout', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? 'unknown'
            ]);

            return response()->json([
                'message' => 'Error al cerrar sesión',
                'error' => 'Ocurrió un problema interno'
            ], 500);
        }
    }

    /**
     * Refrescar token
     */
    public function refresh(Request $request)
    {
        try {
            $user = $request->user();
            $currentToken = $request->user()->currentAccessToken();
            
            // Crear nuevo token
            $newToken = $user->createToken('api_token', ['*'], now()->addHours(24))->plainTextToken;
            
            // Eliminar token anterior
            if ($currentToken) {
                $currentToken->delete();
            }

            return response()->json([
                'message' => 'Token refrescado exitosamente',
                'token' => $newToken,
                'expires_at' => now()->addHours(24)->toISOString(),
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error al refrescar token', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? 'unknown'
            ]);

            return response()->json([
                'message' => 'Error al refrescar token',
                'error' => 'No se pudo generar un nuevo token'
            ], 500);
        }
    }

    /**
     * Verificar estado del token
     */
    public function verify(Request $request)
    {
        try {
            $user = $request->user();
            $user->load(['rol', 'faena']);
            
            $currentToken = $request->user()->currentAccessToken();
            
            return response()->json([
                'message' => 'Token válido',
                'user' => [
                    'id' => $user->id,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'rut' => $user->rut,
                    'email' => $user->email,
                    'rol' => $user->rol->rol ?? null,
                    'faena' => $user->faena->ubicacion ?? null,
                    'id_rol' => $user->id_rol,
                    'id_faena' => $user->id_faena,
                ],
                'token_info' => [
                    'created_at' => $currentToken->created_at,
                    'last_used_at' => $currentToken->last_used_at,
                    'expires_at' => $currentToken->expires_at,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Token inválido',
                'error' => 'El token no es válido o ha expirado'
            ], 401);
        }
    }

    /**
     * Revocar todos los tokens del usuario
     */
    public function revokeAll(Request $request)
    {
        try {
            $user = $request->user();
            
            // Eliminar todos los tokens del usuario
            $user->tokens()->delete();
            
            Log::info('Todos los tokens revocados', [
                'user_id' => $user->id,
                'rut' => $user->rut
            ]);

            return response()->json([
                'message' => 'Todas las sesiones han sido cerradas'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error al revocar tokens', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? 'unknown'
            ]);

            return response()->json([
                'message' => 'Error al cerrar sesiones',
                'error' => 'No se pudieron revocar todos los tokens'
            ], 500);
        }
    }
}