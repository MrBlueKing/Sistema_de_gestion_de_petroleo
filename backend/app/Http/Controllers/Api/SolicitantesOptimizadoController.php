<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Solicitantes;
use App\Models\PersonalInterno;
use App\Models\PersonalExterno;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SolicitantesOptimizadoController extends Controller
{
    /**
     * Obtener solicitantes internos con permisos para una faena específica
     * Optimizado: Solo trae los que tienen permiso, no todos
     */
    public function internosPorFaena(Request $request)
    {
        try {
            $idFaena = $request->query('id_faena');
            
            if (!$idFaena) {
                return response()->json([
                    'success' => false,
                    'message' => 'ID de faena es requerido',
                    'data' => []
                ], 400);
            }

            // Query optimizada con JOIN directo - solo trae solicitantes con permiso
            $solicitantesInternos = DB::table('solicitantes as s')
                ->join('solicitante_faena as sf', 's.id', '=', 'sf.id_dotacion')
                ->join('personal_interno as pi', 's.rut', '=', 'pi.rut')
                ->where('s.tipo_personal', 'Interno')
                ->where('sf.id_faena', $idFaena)
                ->select([
                    's.id',
                    's.rut',
                    's.tipo_personal',
                    'pi.id_personal_interno',
                    'pi.nombre',
                    'pi.apellido', 
                    'pi.cargo',
                    'pi.ubicacion',
                    'pi.created_at'
                ])
                ->orderBy('pi.nombre')
                ->get();

            // Formatear para mantener compatibilidad con el frontend
            $solicitantesFormateados = $solicitantesInternos->map(function ($item) {
                return [
                    'id' => $item->id,
                    'rut' => $item->rut,
                    'tipo_personal' => $item->tipo_personal,
                    'personal_interno' => [
                        'id_personal_interno' => $item->id_personal_interno,
                        'rut' => $item->rut,
                        'nombre' => $item->nombre,
                        'apellido' => $item->apellido,
                        'cargo' => $item->cargo,
                        'ubicacion' => $item->ubicacion,
                        'created_at' => $item->created_at
                    ]
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $solicitantesFormateados,
                'count' => $solicitantesFormateados->count(),
                'message' => "Solicitantes internos para faena {$idFaena} obtenidos exitosamente"
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener solicitantes internos: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Obtener solicitantes externos con permisos para una faena específica
     * Optimizado: Solo trae los que tienen permiso, no todos
     */
    public function externosPorFaena(Request $request)
    {
        try {
            $idFaena = $request->query('id_faena');
            
            if (!$idFaena) {
                return response()->json([
                    'success' => false,
                    'message' => 'ID de faena es requerido',
                    'data' => []
                ], 400);
            }

            // Query optimizada con JOIN directo - solo trae solicitantes con permiso
            $solicitantesExternos = DB::table('solicitantes as s')
                ->join('solicitante_faena as sf', 's.id', '=', 'sf.id_dotacion')
                ->join('personal_externo as pe', 's.rut', '=', 'pe.rut')
                ->join('empresas_externas as ee', 'pe.id_empresa', '=', 'ee.id_empresa')
                ->where('s.tipo_personal', 'Externo')
                ->where('sf.id_faena', $idFaena)
                ->select([
                    's.id',
                    's.rut',
                    's.tipo_personal',
                    'pe.id_personal as id_personal_externo',
                    'pe.nombre',
                    'pe.rut as pe_rut',
                    'pe.id_empresa',
                    'pe.created_at',
                    'ee.nombre as empresa_nombre',
                    'ee.contacto as empresa_contacto'
                ])
                ->orderBy('pe.nombre')
                ->get();

            // Formatear para mantener compatibilidad con el frontend
            $solicitantesFormateados = $solicitantesExternos->map(function ($item) {
                return [
                    'id' => $item->id,
                    'rut' => $item->rut,
                    'tipo_personal' => $item->tipo_personal,
                    'personal_externo' => [
                        'id_personal_externo' => $item->id_personal_externo,
                        'rut' => $item->pe_rut,
                        'nombre' => $item->nombre,
                        'apellido' => '', // Personal externo no tiene apellido separado
                        'cargo' => $item->empresa_nombre, // Usamos empresa como "cargo"
                        'ubicacion' => $item->empresa_contacto,
                        'id_empresa' => $item->id_empresa,
                        'created_at' => $item->created_at
                    ]
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $solicitantesFormateados,
                'count' => $solicitantesFormateados->count(),
                'message' => "Solicitantes externos para faena {$idFaena} obtenidos exitosamente"
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener solicitantes externos: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Método unificado que determina automáticamente qué tipo traer
     */
    public function porFaenaYTipo(Request $request)
    {
        try {
            $idFaena = $request->query('id_faena');
            $tipoSolicitante = $request->query('tipo_solicitante'); // 'interno' o 'externo'
            
            if (!$idFaena || !$tipoSolicitante) {
                return response()->json([
                    'success' => false,
                    'message' => 'ID de faena y tipo de solicitante son requeridos',
                    'data' => []
                ], 400);
            }

            if ($tipoSolicitante === 'interno') {
                $request->merge(['id_faena' => $idFaena]);
                return $this->internosPorFaena($request);
            } elseif ($tipoSolicitante === 'externo') {
                $request->merge(['id_faena' => $idFaena]);
                return $this->externosPorFaena($request);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Tipo de solicitante debe ser "interno" o "externo"',
                    'data' => []
                ], 400);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener solicitantes: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Método para búsqueda optimizada con paginación
     */
    public function buscarPorFaena(Request $request)
    {
        try {
            $idFaena = $request->query('id_faena');
            $tipoSolicitante = $request->query('tipo_solicitante');
            $termino = $request->query('search', '');
            $porPagina = $request->query('per_page', 15);
            
            if (!$idFaena || !$tipoSolicitante) {
                return response()->json([
                    'success' => false,
                    'message' => 'ID de faena y tipo de solicitante son requeridos',
                    'data' => []
                ], 400);
            }

            $query = DB::table('solicitantes as s')
                ->join('solicitante_faena as sf', 's.id', '=', 'sf.id_dotacion')
                ->where('s.tipo_personal', ucfirst($tipoSolicitante))
                ->where('sf.id_faena', $idFaena);

            if ($tipoSolicitante === 'interno') {
                $query->join('personal_interno as pi', 's.rut', '=', 'pi.rut')
                    ->select([
                        's.id',
                        's.rut',
                        's.tipo_personal',
                        'pi.id_personal_interno',
                        'pi.nombre',
                        'pi.apellido',
                        'pi.cargo',
                        'pi.ubicacion',
                        'pi.created_at'
                    ]);

                // Aplicar filtro de búsqueda
                if ($termino) {
                    $query->where(function($q) use ($termino) {
                        $q->where('pi.nombre', 'LIKE', "%{$termino}%")
                          ->orWhere('pi.apellido', 'LIKE', "%{$termino}%")
                          ->orWhere('pi.rut', 'LIKE', "%{$termino}%")
                          ->orWhere('pi.cargo', 'LIKE', "%{$termino}%");
                    });
                }

                $query->orderBy('pi.nombre');

            } else {
                $query->join('personal_externo as pe', 's.rut', '=', 'pe.rut')
                    ->join('empresas_externas as ee', 'pe.id_empresa', '=', 'ee.id_empresa')
                    ->select([
                        's.id',
                        's.rut',
                        's.tipo_personal',
                        'pe.id_personal as id_personal_externo',
                        'pe.nombre',
                        'pe.rut as pe_rut',
                        'pe.id_empresa',
                        'pe.created_at',
                        'ee.nombre as empresa_nombre',
                        'ee.contacto as empresa_contacto'
                    ]);

                // Aplicar filtro de búsqueda
                if ($termino) {
                    $query->where(function($q) use ($termino) {
                        $q->where('pe.nombre', 'LIKE', "%{$termino}%")
                          ->orWhere('pe.rut', 'LIKE', "%{$termino}%")
                          ->orWhere('ee.nombre', 'LIKE', "%{$termino}%");
                    });
                }

                $query->orderBy('pe.nombre');
            }

            $resultados = $query->paginate($porPagina);

            return response()->json([
                'success' => true,
                'data' => $resultados->items(),
                'pagination' => [
                    'current_page' => $resultados->currentPage(),
                    'last_page' => $resultados->lastPage(),
                    'per_page' => $resultados->perPage(),
                    'total' => $resultados->total(),
                    'from' => $resultados->firstItem(),
                    'to' => $resultados->lastItem()
                ],
                'message' => "Búsqueda completada. {$resultados->total()} resultado(s) encontrado(s)"
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error en la búsqueda: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }
}