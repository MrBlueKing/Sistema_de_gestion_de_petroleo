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
            // ✅ Limpiar RUT antes de validar y guardar
            $cleanedRut = $this->cleanRut($request->rut);

            $validator = Validator::make(array_merge($request->all(), ['rut' => $cleanedRut]), [
                'rut' => 'required|string|max:12|unique:users,rut',
                'nombre' => 'required|string|max:100',
                'apellido' => 'required|string|max:100',
                'id_rol' => 'required|exists:roles,id_rol',
                'id_faena' => 'required|exists:faenas,id_faena',
                'password' => 'required|string|min:8',
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
                'rut' => $cleanedRut,
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
        // 📝 LOG INICIAL - Captura TODO lo que llega
        Log::info('=== INICIO LOGIN ===', [
            'timestamp' => now()->toDateTimeString(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'rut_recibido' => $request->rut ?? 'no_enviado',
            'tiene_password' => !empty($request->password) ? 'SI' : 'NO',
            'todos_los_datos' => $request->except(['password']), // Todo excepto password
            'metodo_http' => $request->method(),
            'url_completa' => $request->fullUrl(),
            'headers' => $request->headers->all()
        ]);

        try {
            // Rate limiting por IP
            $key = 'login_attempts:' . $request->ip();
            $maxAttempts = 5;
            $decayMinutes = 15;

            if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
                $seconds = RateLimiter::availableIn($key);

                Log::warning('❌ RATE LIMIT EXCEDIDO', [
                    'ip' => $request->ip(),
                    'intentos' => RateLimiter::attempts($key),
                    'max_permitido' => $maxAttempts,
                    'segundos_restantes' => $seconds
                ]);

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
                Log::warning('❌ VALIDACIÓN FALLIDA', [
                    'errores' => $validator->errors()->toArray(),
                    'datos_recibidos' => $request->except(['password'])
                ]);

                return response()->json([
                    'message' => 'Datos de entrada inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            // ✅ Limpiar RUT antes de buscar usuario (permite login con cualquier formato)
            $cleanedRut = $this->cleanRut($request->rut);

            Log::info('✅ VALIDACIÓN CORRECTA - Buscando usuario', [
                'rut_original' => $request->rut,
                'rut_limpio' => $cleanedRut,
                'ip' => $request->ip()
            ]);

            // Verificar que el usuario existe y está activo
            $user = User::where('rut', $cleanedRut)->first();

            if (!$user) {
                RateLimiter::hit($key, $decayMinutes * 60);

                Log::warning('❌ USUARIO NO ENCONTRADO', [
                    'rut_buscado' => $request->rut,
                    'ip' => $request->ip(),
                    'intentos_acumulados' => RateLimiter::attempts($key)
                ]);

                return response()->json([
                    'message' => 'Credenciales inválidas',
                    'error' => 'RUT o contraseña incorrectos'
                ], 401);
            }

            Log::info('✅ USUARIO ENCONTRADO', [
                'user_id' => $user->id,
                'rut' => $user->rut,
                'nombre' => $user->nombre,
                'estado_activo' => $user->estado ? 'SI' : 'NO',
                'tiene_rol' => $user->id_rol ?? 'sin_rol',
                'tiene_faena' => $user->id_faena ?? 'sin_faena'
            ]);

            if (!$user->estado) {
                Log::warning('❌ CUENTA INACTIVA', [
                    'user_id' => $user->id,
                    'rut' => $user->rut,
                    'nombre' => $user->nombre
                ]);

                return response()->json([
                    'message' => 'Cuenta inactiva',
                    'error' => 'Tu cuenta ha sido desactivada. Contacta al administrador.'
                ], 403);
            }

            // Intentar autenticación con RUT limpio
            Log::info('🔐 INTENTANDO AUTENTICACIÓN', [
                'rut_limpio' => $cleanedRut
            ]);

            $credentials = [
                'rut' => $cleanedRut,
                'password' => $request->password
            ];

            if (!Auth::attempt($credentials)) {
                RateLimiter::hit($key, $decayMinutes * 60);

                Log::warning('❌ AUTENTICACIÓN FALLIDA - Password incorrecta', [
                    'user_id' => $user->id,
                    'rut' => $request->rut,
                    'ip' => $request->ip(),
                    'intentos_acumulados' => RateLimiter::attempts($key)
                ]);

                return response()->json([
                    'message' => 'Credenciales inválidas',
                    'error' => 'RUT o contraseña incorrectos'
                ], 401);
            }

            // Login exitoso - limpiar rate limiting
            RateLimiter::clear($key);

            Log::info('✅ AUTENTICACIÓN EXITOSA', [
                'user_id' => $user->id,
                'rut' => $request->rut
            ]);

            // Obtener usuario autenticado con relaciones
            $user = $request->user();

            try {
                $user->load(['rol', 'faena']);

                Log::info('✅ RELACIONES CARGADAS', [
                    'user_id' => $user->id,
                    'tiene_rol_cargado' => isset($user->rol) ? 'SI' : 'NO',
                    'tiene_faena_cargada' => isset($user->faena) ? 'SI' : 'NO',
                    'rol_nombre' => $user->rol->rol ?? 'sin_rol',
                    'faena_ubicacion' => $user->faena->ubicacion ?? 'sin_faena'
                ]);
            } catch (\Exception $loadError) {
                Log::error('❌ ERROR CARGANDO RELACIONES', [
                    'user_id' => $user->id,
                    'error' => $loadError->getMessage(),
                    'trace' => $loadError->getTraceAsString()
                ]);
            }

            // Crear nuevo token con expiración de 24 horas
            try {
                $token = $user->createToken('api_token', ['*'], now()->addHours(24))->plainTextToken;

                Log::info('✅ TOKEN CREADO', [
                    'user_id' => $user->id,
                    'expira_en' => now()->addHours(24)->toDateTimeString()
                ]);
            } catch (\Exception $tokenError) {
                Log::error('❌ ERROR CREANDO TOKEN', [
                    'user_id' => $user->id,
                    'error' => $tokenError->getMessage(),
                    'trace' => $tokenError->getTraceAsString()
                ]);
                throw $tokenError;
            }

            $responseData = [
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
            ];

            Log::info('=== LOGIN EXITOSO COMPLETO ===', [
                'user_id' => $user->id,
                'rut' => $user->rut,
                'rol' => $user->rol->rol ?? 'sin_rol',
                'faena' => $user->faena->ubicacion ?? 'sin_faena',
                'token_primeros_chars' => substr($token, 0, 10) . '...',
                'response_keys' => array_keys($responseData)
            ]);

            return response()->json($responseData, 200);
        } catch (\Exception $e) {
            Log::error('💥 ERROR CRÍTICO EN LOGIN', [
                'timestamp' => now()->toDateTimeString(),
                'error_mensaje' => $e->getMessage(),
                'error_linea' => $e->getLine(),
                'error_archivo' => $e->getFile(),
                'error_tipo' => get_class($e),
                'trace_completo' => $e->getTraceAsString(),
                'rut_intento' => $request->rut ?? 'no_provided',
                'ip' => $request->ip(),
                'datos_request' => $request->except(['password'])
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

    /**
     * Login con token del sistema centralizado
     * Este método permite autenticación desde el sistema de autenticación centralizado
     */
    public function loginWithCentralToken(Request $request)
    {
        // Log INMEDIATO para debug
        error_log('=== EJECUTANDO loginWithCentralToken ===');

        try {
            error_log('Token en header: ' . $request->header('Authorization'));
            error_log('Modulo ID: ' . $request->input('modulo_id'));

            Log::info('=== INICIO LOGIN CON TOKEN CENTRALIZADO ===', [
                'ip' => $request->ip(),
                'tiene_token' => $request->hasHeader('Authorization'),
                'rol_solicitado' => $request->input('rol_solicitado') // 🆕
            ]);

            $validator = Validator::make($request->all(), [
                'modulo_id' => 'required|integer',
                'rol_solicitado' => 'nullable|string' // 🆕 Opcional
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Obtener token del header
            $token = $request->bearerToken();

            Log::info('🔑 Token recibido', [
                'tiene_token' => !empty($token),
                'token_length' => $token ? strlen($token) : 0,
                'token_preview' => $token ? substr($token, 0, 30) . '...' : 'null',
                'authorization_header' => $request->header('Authorization')
            ]);

            if (!$token) {
                Log::warning('Token no proporcionado');
                return response()->json([
                    'success' => false,
                    'message' => 'Token no proporcionado'
                ], 401);
            }

            // Validar token con el sistema centralizado
            $centralizadoUrl = env('SISTEMA_CENTRALIZADO_URL', 'http://localhost:8001');
            $rolSolicitado = $request->input('rol_solicitado'); // 🆕

            Log::info('Validando token con sistema centralizado', [
                'url' => $centralizadoUrl,
                'modulo_id' => $request->modulo_id,
                'rol_solicitado' => $rolSolicitado // 🆕
            ]);

            $response = \Illuminate\Support\Facades\Http::withToken($token)
                ->post("{$centralizadoUrl}/api/validar-token", [
                    'modulo_id' => $request->modulo_id,
                    'rol_solicitado' => $rolSolicitado // 🆕 Enviar el rol
                ]);

            Log::info('📡 Respuesta del sistema centralizado', [
                'status' => $response->status(),
                'successful' => $response->successful(),
                'body' => $response->json(),
                'headers' => $response->headers()
            ]);

            if (!$response->successful() || !$response->json('valid')) {
                Log::warning('Token inválido o sin acceso al módulo', [
                    'status' => $response->status(),
                    'response' => $response->json()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Token inválido o sin acceso a este módulo'
                ], 401);
            }

            $userData = $response->json('user');
            $roles = $response->json('roles', []);
            $permisos = $response->json('permisos', []);
            $rolAsignado = $response->json('rol_asignado'); // 🆕 Rol específico asignado

            // ✅ Limpiar RUT del usuario antes de buscar/crear en el sistema local
            $cleanedRut = $this->cleanRut($userData['rut']);

            Log::info('Token válido', [
                'user_rut_original' => $userData['rut'],
                'user_rut_limpio' => $cleanedRut,
                'rol_asignado' => $rolAsignado, // 🆕
                'roles' => $roles,
                'permisos_count' => count($permisos)
            ]);

            // Buscar o crear usuario en el sistema local
            $user = User::where('rut', $cleanedRut)->first();

            // 🆕 Mapear rol ESPECÍFICO a ID local
            $idRolLocal = $this->obtenerIdRolLocal($rolAsignado ?: ($roles[0] ?? null));

            if (!$idRolLocal) {
                Log::error('Rol no mapeado', ['rol' => $rolAsignado ?: $roles[0] ?? 'null']);
                return response()->json([
                    'success' => false,
                    'message' => 'Rol no soportado en este sistema'
                ], 400);
            }

            if (!$user) {
                // Usuario no existe, crearlo automáticamente con el ROL ESPECÍFICO
                Log::info('Usuario no existe localmente, creando...', [
                    'rut_limpio' => $cleanedRut,
                    'rol_asignado' => $rolAsignado,
                    'id_rol_local' => $idRolLocal
                ]);

                $user = User::create([
                    'rut' => $cleanedRut,
                    'nombre' => $userData['nombre'],
                    'apellido' => $userData['apellido'],
                    'email' => $userData['email'],
                    'id_rol' => $idRolLocal, // 🆕 Usar el rol específico mapeado
                    'id_faena' => $userData['faena']['id'] ?? 1,
                    'password' => Hash::make(uniqid()), // Password random (no se usará)
                    'estado' => 1
                ]);

                Log::info('Usuario creado automáticamente', [
                    'user_id' => $user->id,
                    'rut' => $user->rut,
                    'id_rol' => $user->id_rol
                ]);
            } else {
                // Usuario existe, actualizar información Y ROL
                $user->update([
                    'nombre' => $userData['nombre'],
                    'apellido' => $userData['apellido'],
                    'email' => $userData['email'],
                    'id_rol' => $idRolLocal // 🆕 Actualizar el rol con el específico
                ]);

                Log::info('Usuario actualizado con rol específico', [
                    'user_id' => $user->id,
                    'id_rol_anterior' => $user->getOriginal('id_rol'),
                    'id_rol_nuevo' => $idRolLocal
                ]);
            }

            // Cargar relaciones
            $user->load(['rol', 'faena', 'faenaActiva']);

            // ✅ CREAR TOKEN LOCAL del sistema de petróleo
            // Eliminar tokens antiguos (opcional, para evitar múltiples sesiones)
            // $user->tokens()->delete();

            $tokenResult = $user->createToken('auth_token');
            $localToken = $tokenResult->plainTextToken;
            $tokenModel = $tokenResult->accessToken;

            // Establecer expiración (24 horas)
            $tokenModel->expires_at = now()->addHours(24);
            $tokenModel->save();

            // Preparar respuesta con datos del usuario local
            $responseData = [
                'success' => true,
                'message' => 'Autenticación exitosa desde sistema centralizado',
                'user' => [
                    'id' => $user->id,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'rut' => $user->rut,
                    'email' => $user->email,
                    'rol' => $user->rol->rol ?? null,
                    'faena' => $user->faena->ubicacion ?? null,
                    'id_rol' => $user->id_rol,
                    'id_faena' => $user->faena_activa_id ?? $user->id_faena,
                ],
                'token' => $localToken, // ✅ Token LOCAL del sistema de petróleo
                'expires_at' => $tokenModel->expires_at->toIso8601String(),
                'token_type' => 'Bearer',
                'authenticated_by' => 'sistema_centralizado',
                'roles_centralizados' => $roles,
                'permisos' => $permisos
            ];

            Log::info('=== LOGIN CENTRALIZADO EXITOSO ===', [
                'user_id' => $user->id,
                'rut' => $user->rut,
                'rol_local' => $user->rol->rol ?? 'sin_rol',
                'roles_centralizados' => $roles
            ]);

            return response()->json($responseData, 200);

        } catch (\Exception $e) {
            Log::error('💥 ERROR EN LOGIN CON TOKEN CENTRALIZADO', [
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al procesar autenticación centralizada',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🆕 Obtener ID del rol local basado en el rol_sistema_externo
     * Mapeo EXACTO de los roles definidos en modulo_roles
     */
    private function obtenerIdRolLocal($rolExterno)
    {
        if (!$rolExterno) {
            return null;
        }

        // Mapeo EXACTO según los nombres en rol_sistema_externo de la tabla modulo_roles
        $mapeo = [
            'admin' => 3,              // Administrador
            'bombero' => 1,            // Encargado de Operaciones de Combustible
            'gerente' => 2,            // Gerente
            'toneladas' => 4,          // Dispatch
            'planificador' => 5,       // Planificador / Taller Mecánico
            'OperadorVehiculo' => 6,   // Operador de Vehículo (⚠️ Case sensitive!)
            'asistente_bombero' => 7,  // Asistente de Operaciones
            'admin_operador' => 8,     // Administrador de Operadores
            'JefeMina' => 9,           // Jefe de Mina (⚠️ Case sensitive!)
        ];

        return $mapeo[$rolExterno] ?? null;
    }

    /**
     * 🆕 Cambiar rol activo del usuario sin cerrar sesión
     * Permite a un usuario con múltiples roles cambiar entre ellos
     */
    public function cambiarRol(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'rol_nuevo' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            $rolNuevo = $request->input('rol_nuevo');

            Log::info('=== CAMBIO DE ROL ===', [
                'user_id' => $user->id,
                'rol_actual' => $user->id_rol,
                'rol_solicitado' => $rolNuevo
            ]);

            // Mapear el rol solicitado a ID local
            $idRolNuevo = $this->obtenerIdRolLocal($rolNuevo);

            if (!$idRolNuevo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rol no válido para este sistema'
                ], 400);
            }

            // Validar con sistema centralizado que el usuario tiene este rol
            $centralizadoUrl = env('SISTEMA_CENTRALIZADO_URL', 'http://localhost:8001');

            // Obtener el token actual del usuario
            $currentToken = $request->user()->currentAccessToken();

            // Validar que el usuario tiene acceso a este rol en el módulo de petróleo
            // Esto lo hacemos consultando al sistema centralizado
            try {
                $response = \Illuminate\Support\Facades\Http::withToken($currentToken->token)
                    ->post("{$centralizadoUrl}/api/validar-token", [
                        'modulo_id' => 8, // Módulo de petróleo
                        'rol_solicitado' => $rolNuevo
                    ]);

                if (!$response->successful() || !$response->json('valid')) {
                    Log::warning('Usuario no tiene acceso al rol solicitado', [
                        'user_id' => $user->id,
                        'rol_solicitado' => $rolNuevo,
                        'response' => $response->json()
                    ]);

                    return response()->json([
                        'success' => false,
                        'message' => 'No tienes acceso a este rol'
                    ], 403);
                }
            } catch (\Exception $e) {
                Log::error('Error validando rol con sistema centralizado', [
                    'error' => $e->getMessage(),
                    'user_id' => $user->id,
                    'rol_solicitado' => $rolNuevo
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Error al validar rol con sistema centralizado'
                ], 500);
            }

            // Actualizar el rol del usuario en la BD local
            $user->id_rol = $idRolNuevo;
            $user->save();

            // Recargar relaciones
            $user->load(['rol', 'faena', 'faenaActiva']);

            Log::info('✅ Rol cambiado exitosamente', [
                'user_id' => $user->id,
                'rol_anterior' => $user->getOriginal('id_rol'),
                'rol_nuevo' => $idRolNuevo,
                'rol_nombre' => $user->rol->rol ?? 'sin_rol'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Rol cambiado exitosamente',
                'user' => [
                    'id' => $user->id,
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'rut' => $user->rut,
                    'email' => $user->email,
                    'rol' => $user->rol->rol ?? null,
                    'faena' => $user->faena->ubicacion ?? null,
                    'id_rol' => $user->id_rol,
                    'id_faena' => $user->faena_activa_id ?? $user->id_faena,
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('💥 ERROR EN CAMBIO DE ROL', [
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar de rol',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🆕 Obtener roles disponibles del usuario desde el sistema centralizado
     * Para mostrar en el dropdown de cambio de rol
     */
    public function getRolesDisponibles(Request $request)
    {
        try {
            $user = $request->user();
            $currentToken = $request->user()->currentAccessToken();
            $centralizadoUrl = env('SISTEMA_CENTRALIZADO_URL', 'http://localhost:8001');

            Log::info('Obteniendo roles disponibles del usuario', [
                'user_id' => $user->id,
                'rut' => $user->rut
            ]);

            // Consultar al sistema centralizado los módulos y roles disponibles
            $response = \Illuminate\Support\Facades\Http::withToken($currentToken->token)
                ->get("{$centralizadoUrl}/api/modulos-disponibles");

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al obtener roles disponibles'
                ], 500);
            }

            $modulos = $response->json('modulos', []);

            // Buscar el módulo de petróleo (id=8)
            $moduloPetroleo = collect($modulos)->firstWhere('id', 8);

            if (!$moduloPetroleo) {
                return response()->json([
                    'success' => true,
                    'roles_disponibles' => [],
                    'rol_actual' => $user->rol->rol ?? null
                ]);
            }

            return response()->json([
                'success' => true,
                'roles_disponibles' => $moduloPetroleo['roles'] ?? [],
                'rol_actual' => $user->rol->rol ?? null,
                'id_rol_actual' => $user->id_rol
            ]);

        } catch (\Exception $e) {
            Log::error('Error obteniendo roles disponibles', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? 'unknown'
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener roles disponibles'
            ], 500);
        }
    }

    /**
     * @deprecated Usar obtenerIdRolLocal() en su lugar
     * Mapear roles del sistema centralizado a roles locales
     */
    private function mapearRolCentralizado($rolCentralizado)
    {
        // Mapeo de roles del sistema centralizado a IDs locales
        $mapeo = [
            'administrador' => 3, // admin (id_rol = 3)
            'gerente' => 2, // gerente (id_rol = 2)
            'bombero' => 1, // bombero (id_rol = 1)
            'asistente_bombero' => 7, // asistente_bombero (id_rol = 7)
            'operador_vehiculo' => 6, // OperadorVehiculo (id_rol = 6)
            'planificador' => 5, // planificador (id_rol = 5)
            'jefe_mina' => 9, // JefeMina (id_rol = 9)
            'admin_operador' => 8, // admin_operador (id_rol = 8)
            'toneladas' => 4 // toneladas (id_rol = 4)
        ];

        // Normalizar a minúsculas para comparación
        $rolNormalizado = strtolower($rolCentralizado);

        return $mapeo[$rolNormalizado] ?? 1; // Por defecto: bombero
    }

    /**
     * ✅ Limpiar RUT para normalizarlo (solo números y K)
     * Permite login con cualquier formato: 12.345.678-9, 12345678-9, 123456789
     *
     * @param string $rut RUT en cualquier formato
     * @return string RUT limpio (solo números y K)
     */
    private function cleanRut($rut)
    {
        // Eliminar puntos, guiones, espacios
        // Mantener solo números y la letra K (mayúscula o minúscula)
        $cleanedRut = preg_replace('/[^0-9kK]/', '', $rut);

        Log::info('🧹 RUT limpiado', [
            'original' => $rut,
            'limpio' => $cleanedRut
        ]);

        return $cleanedRut;
    }
}
