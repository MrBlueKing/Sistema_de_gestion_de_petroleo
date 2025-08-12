<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class MaquinaPermisosController extends Controller
{
    public function index(Request $request)
    {
        try {
            // Query con LEFT JOIN para mostrar todas las máquinas, 
            // incluso las que no tienen permisos
            $maquinas = DB::table('maquinas as m')
                ->leftJoin('permisos_maquinas_faenas as pmf', 'm.id_maquina', '=', 'pmf.id_maquina')
                ->leftJoin('faenas as f', 'pmf.id_faena', '=', 'f.id_faena')
                ->select(
                    'm.id_maquina',
                    'm.nombre_maquina',
                    'm.tipo_maquina',
                    'm.estado',
                    'm.patente',
                    'm.chc_maquina',
                    'm.created_at as maquina_creada',
                    'm.updated_at as maquina_actualizada',
                    'f.id_faena',
                    'f.ubicacion as faena_ubicacion',
                    'f.detalle as faena_detalle',
                    'f.fecha_creacion as faena_creada'
                )
                ->orderBy('m.id_maquina', 'ASC')
                ->orderBy('f.id_faena', 'ASC')
                ->get();

            // Agrupar los resultados por máquina para mejor estructura de respuesta
            $maquinasAgrupadas = [];

            foreach ($maquinas as $registro) {
                $idMaquina = $registro->id_maquina;

                // Si es la primera vez que vemos esta máquina, inicializar
                if (!isset($maquinasAgrupadas[$idMaquina])) {
                    $maquinasAgrupadas[$idMaquina] = [
                        'id_maquina' => $registro->id_maquina,
                        'nombre_maquina' => $registro->nombre_maquina,
                        'tipo_maquina' => $registro->tipo_maquina,
                        'estado' => $registro->estado,
                        'patente' => $registro->patente,
                        'chc_maquina' => $registro->chc_maquina,
                        'created_at' => $registro->maquina_creada,
                        'updated_at' => $registro->maquina_actualizada,
                        'faenas_con_permiso' => []
                    ];
                }

                // Si hay una faena asociada, agregarla
                if ($registro->id_faena) {
                    $maquinasAgrupadas[$idMaquina]['faenas_con_permiso'][] = [
                        'id_faena' => $registro->id_faena,
                        'ubicacion' => $registro->faena_ubicacion,
                        'detalle' => $registro->faena_detalle,
                        'fecha_creacion' => $registro->faena_creada
                    ];
                }
            }

            // Convertir a array indexado para la respuesta JSON
            $resultado = array_values($maquinasAgrupadas);

            return response()->json([
                'success' => true,
                'message' => 'Máquinas y permisos obtenidos correctamente',
                'total_maquinas' => count($resultado),
                'data' => $resultado
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error al obtener máquinas con permisos: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }

    /**
     * Obtener máquinas con permisos usando INNER JOIN 
     * (solo máquinas que tienen al menos un permiso)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function indexConPermisos(Request $request)
    {
        try {
            $maquinas = DB::table('maquinas as m')
                ->join('permisos_maquinas_faenas as pmf', 'm.id_maquina', '=', 'pmf.id_maquina')
                ->join('faenas as f', 'pmf.id_faena', '=', 'f.id_faena')
                ->select(
                    'm.id_maquina',
                    'm.nombre_maquina',
                    'm.tipo_maquina',
                    'm.estado',
                    'm.patente',
                    'm.chc_maquina',
                    'm.created_at as maquina_creada',
                    'm.updated_at as maquina_actualizada',
                    'f.id_faena',
                    'f.ubicacion as faena_ubicacion',
                    'f.detalle as faena_detalle',
                    'f.fecha_creacion as faena_creada'
                )
                ->orderBy('m.id_maquina', 'ASC')
                ->orderBy('f.id_faena', 'ASC')
                ->get();

            // Agrupar igual que en el método anterior
            $maquinasAgrupadas = [];

            foreach ($maquinas as $registro) {
                $idMaquina = $registro->id_maquina;

                if (!isset($maquinasAgrupadas[$idMaquina])) {
                    $maquinasAgrupadas[$idMaquina] = [
                        'id_maquina' => $registro->id_maquina,
                        'nombre_maquina' => $registro->nombre_maquina,
                        'tipo_maquina' => $registro->tipo_maquina,
                        'estado' => $registro->estado,
                        'patente' => $registro->patente,
                        'chc_maquina' => $registro->chc_maquina,
                        'created_at' => $registro->maquina_creada,
                        'updated_at' => $registro->maquina_actualizada,
                        'faenas_con_permiso' => []
                    ];
                }

                $maquinasAgrupadas[$idMaquina]['faenas_con_permiso'][] = [
                    'id_faena' => $registro->id_faena,
                    'ubicacion' => $registro->faena_ubicacion,
                    'detalle' => $registro->faena_detalle,
                    'fecha_creacion' => $registro->faena_creada
                ];
            }

            $resultado = array_values($maquinasAgrupadas);

            return response()->json([
                'success' => true,
                'message' => 'Máquinas con permisos obtenidas correctamente',
                'total_maquinas' => count($resultado),
                'data' => $resultado
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error al obtener máquinas con permisos (INNER JOIN): ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }

    /**
     * Obtener máquinas de una faena específica
     * 
     * @param int $idFaena
     * @return \Illuminate\Http\JsonResponse
     */
    public function maquinasPorFaena($idFaena)
    {
        try {
            $maquinas = DB::table('maquinas as m')
                ->join('permisos_maquinas_faenas as pmf', 'm.id_maquina', '=', 'pmf.id_maquina')
                ->join('faenas as f', 'pmf.id_faena', '=', 'f.id_faena')
                ->where('f.id_faena', $idFaena)
                ->select(
                    'm.id_maquina',
                    'm.nombre_maquina',
                    'm.tipo_maquina',
                    'm.estado',
                    'm.patente',
                    'm.chc_maquina',
                    'f.id_faena',
                    'f.ubicacion as faena_ubicacion',
                    'f.detalle as faena_detalle'
                )
                ->orderBy('m.nombre_maquina', 'ASC')
                ->get();

            return response()->json([
                'success' => true,
                'message' => "Máquinas de la faena obtenidas correctamente",
                'total_maquinas' => $maquinas->count(),
                'id_faena' => $idFaena,
                'data' => $maquinas
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error al obtener máquinas por faena: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de máquinas y permisos
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function estadisticas()
    {
        try {
            $stats = [
                'total_maquinas' => DB::table('maquinas')->count(),
                'total_faenas' => DB::table('faenas')->count(),
                'total_permisos' => DB::table('permisos_maquinas_faenas')->count(),
                'maquinas_con_permisos' => DB::table('maquinas as m')
                    ->join('permisos_maquinas_faenas as pmf', 'm.id_maquina', '=', 'pmf.id_maquina')
                    ->distinct('m.id_maquina')
                    ->count(),
                'maquinas_sin_permisos' => DB::table('maquinas as m')
                    ->leftJoin('permisos_maquinas_faenas as pmf', 'm.id_maquina', '=', 'pmf.id_maquina')
                    ->whereNull('pmf.id_maquina')
                    ->count(),
                'por_estado' => DB::table('maquinas')
                    ->select('estado', DB::raw('COUNT(*) as cantidad'))
                    ->groupBy('estado')
                    ->get()
            ];

            return response()->json([
                'success' => true,
                'message' => 'Estadísticas obtenidas correctamente',
                'data' => $stats
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error al obtener estadísticas: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }

    /**
     * Asignar permiso a una máquina para una faena específica
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function asignarPermiso(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_maquina' => 'required|exists:maquinas,id_maquina',
            'id_faena' => 'required|exists:faenas,id_faena',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar si ya existe el permiso
            $permisoExiste = DB::table('permisos_maquinas_faenas')
                ->where('id_maquina', $request->id_maquina)
                ->where('id_faena', $request->id_faena)
                ->exists();

            if ($permisoExiste) {
                return response()->json([
                    'success' => false,
                    'message' => 'La máquina ya tiene permiso para esta faena'
                ], 409);
            }

            // Insertar el nuevo permiso
            DB::table('permisos_maquinas_faenas')->insert([
                'id_maquina' => $request->id_maquina,
                'id_faena' => $request->id_faena,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Permiso asignado correctamente'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error asignando permiso: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }

    /**
     * Remover permiso de una máquina para una faena específica
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function removerPermiso(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_maquina' => 'required|exists:maquinas,id_maquina',
            'id_faena' => 'required|exists:faenas,id_faena',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $filasAfectadas = DB::table('permisos_maquinas_faenas')
                ->where('id_maquina', $request->id_maquina)
                ->where('id_faena', $request->id_faena)
                ->delete();

            if ($filasAfectadas === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró el permiso a remover'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Permiso removido correctamente'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error removiendo permiso: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }

    /**
     * Actualizar todos los permisos de una máquina
     * (reemplaza todos los permisos existentes con los nuevos)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function actualizarPermisos(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_maquina' => 'required|exists:maquinas,id_maquina',
            'faenas' => 'array',
            'faenas.*' => 'exists:faenas,id_faena'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Remover todos los permisos existentes de la máquina
            DB::table('permisos_maquinas_faenas')
                ->where('id_maquina', $request->id_maquina)
                ->delete();

            // Insertar los nuevos permisos si hay faenas especificadas
            if (!empty($request->faenas)) {
                $permisosNuevos = [];
                foreach ($request->faenas as $idFaena) {
                    $permisosNuevos[] = [
                        'id_maquina' => $request->id_maquina,
                        'id_faena' => $idFaena,
                        'created_at' => now(),
                        'updated_at' => now()
                    ];
                }

                DB::table('permisos_maquinas_faenas')->insert($permisosNuevos);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Permisos actualizados correctamente',
                'total_permisos' => count($request->faenas ?? [])
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error actualizando permisos: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }

    /**
     * Obtener todas las faenas disponibles
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getFaenas()
    {
        try {
            $faenas = DB::table('faenas')
                ->select('id_faena', 'ubicacion', 'detalle', 'fecha_creacion')
                ->orderBy('ubicacion', 'ASC')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Faenas obtenidas correctamente',
                'total_faenas' => $faenas->count(),
                'data' => $faenas
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error obteniendo faenas: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }
    /**
     * Transferir máquina de una faena a otra (para drag & drop)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function transferirMaquina(Request $request)
    {
        // Log para debug
        Log::info('Recibiendo petición de transferencia:', $request->all());

        $validator = Validator::make($request->all(), [
            'id_maquina' => 'required|exists:maquinas,id_maquina',
            'faena_origen' => 'nullable|integer|exists:faenas,id_faena',
            'faena_destino' => 'nullable|integer|exists:faenas,id_faena',
        ]);

        if ($validator->fails()) {
            Log::warning('Validación fallida:', $validator->errors()->toArray());
            return response()->json([
                'success' => false,
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $idMaquina = $request->id_maquina;
            $faenaOrigen = $request->faena_origen;
            $faenaDestino = $request->faena_destino;

            Log::info('Procesando transferencia:', [
                'maquina' => $idMaquina,
                'origen' => $faenaOrigen,
                'destino' => $faenaDestino
            ]);

            // Si hay faena origen, remover ESE permiso específico
            if ($faenaOrigen) {
                $deleted = DB::table('permisos_maquinas_faenas')
                    ->where('id_maquina', $idMaquina)
                    ->where('id_faena', $faenaOrigen)
                    ->delete();

                Log::info("Permisos removidos de faena origen {$faenaOrigen}: {$deleted}");
            } else {
                // Si viene de "sin permisos", remover TODOS los permisos existentes
                $deleted = DB::table('permisos_maquinas_faenas')
                    ->where('id_maquina', $idMaquina)
                    ->delete();

                Log::info("Todos los permisos removidos (sin permisos): {$deleted}");
            }

            // Si hay faena destino, agregar ese permiso
            if ($faenaDestino) {
                // Verificar si ya existe el permiso
                $permisoExiste = DB::table('permisos_maquinas_faenas')
                    ->where('id_maquina', $idMaquina)
                    ->where('id_faena', $faenaDestino)
                    ->exists();

                if (!$permisoExiste) {
                    DB::table('permisos_maquinas_faenas')->insert([
                        'id_maquina' => $idMaquina,
                        'id_faena' => $faenaDestino
                    ]);
                    Log::info("Permiso agregado a faena destino {$faenaDestino}");
                } else {
                    Log::info("Permiso ya existía en faena destino {$faenaDestino}");
                }
            }

            DB::commit();

            Log::info('Transferencia completada exitosamente');

            return response()->json([
                'success' => true,
                'message' => 'Máquina transferida correctamente',
                'accion' => [
                    'maquina' => $idMaquina,
                    'desde' => $faenaOrigen ? "Faena $faenaOrigen" : 'Sin permisos',
                    'hacia' => $faenaDestino ? "Faena $faenaDestino" : 'Sin permisos'
                ]
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error transfiriendo máquina: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor: ' . $e->getMessage(),
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }
}
