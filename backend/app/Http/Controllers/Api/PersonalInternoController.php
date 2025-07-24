<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PersonalInterno;
use Illuminate\Support\Facades\Validator;
use App\Models\Solicitante;
use App\Models\Faena;
use App\Models\PersonalExterno;
use App\Models\SolicitanteFaena;
use Illuminate\Support\Facades\Log;

class PersonalInternoController extends Controller
{
    public function register(Request $request)
    {
        // Validación de los datos
        $validator = Validator::make($request->all(), [
            'rut' => 'required|unique:personal_interno,rut|unique:solicitantes,rut',
            'nombre_completo' => 'required|string',
            'cargo' => 'nullable|string',
            'ubicacion' => 'nullable|string', // Este campo contiene la faena
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Separar el nombre completo en nombre y apellido
            $nombreCompleto = $request->nombre_completo;

            // Validación de que el campo nombre completo no esté vacío
            if (empty($nombreCompleto)) {
                return response()->json([
                    'error' => 'El nombre completo es obligatorio.'
                ], 422);
            }

            // Eliminar espacios extra al inicio y final
            $nombreCompleto = trim($nombreCompleto);

            // Separar el nombre completo en partes
            $partesNombre = explode(' ', $nombreCompleto);

            // Validación: Al menos un nombre y un apellido
            if (count($partesNombre) < 2) {
                return response()->json([
                    'error' => 'Debe proporcionar al menos un nombre y un apellido.'
                ], 422);
            }

            // Si hay más de 3 partes, tratamos los dos últimos como nombres y el resto como apellido
            if (count($partesNombre) > 3) {
                // Los últimos dos elementos como nombre
                $nombre = array_pop($partesNombre);  // Último elemento como nombre
                $segundoNombre = array_pop($partesNombre); // Penúltimo elemento como segundo nombre
                $apellido = implode(' ', $partesNombre);  // El resto como apellido

                // Concatenar el segundo nombre al primer nombre
                $nombre = $segundoNombre . ' ' . $nombre;
            } elseif (count($partesNombre) == 3) {
                // Si hay 3 partes, el último es el nombre y el resto es apellido
                $nombre = array_pop($partesNombre);  // Último elemento como nombre
                $apellido = implode(' ', $partesNombre);  // El resto como apellido

            } else {
                // Si solo hay 2 partes, el primero es el apellido y el segundo es el nombre
                $nombre = array_pop($partesNombre);  // Último elemento como nombre
                $apellido = implode(' ', $partesNombre);  // Primer elemento como apellido
            }

            // Verificar si nombre o apellido están vacíos después de la separación
            if (empty($nombre) || empty($apellido)) {
                return response()->json([
                    'error' => 'El nombre y el apellido deben estar presentes.'
                ], 422);
            }

            // 1. Crear el solicitante (tabla 'solicitantes')
            $solicitante = Solicitante::create([
                'rut' => $request->rut,
                'tipo_personal' => 'Interno',
            ]);

            // 2. Crear personal interno relacionado (tabla 'personal_interno')
            $personal = PersonalInterno::create([
                'rut' => $request->rut,
                'nombre' => $nombre,
                'apellido' => $apellido,
                'cargo' => $request->cargo,
                'ubicacion' => $request->ubicacion,
            ]);

            // 3. Buscar o crear la faena
            $faena = null;
            if ($request->has('id_faena') && is_numeric($request->id_faena)) {
                // Si se proporcionó un ID de faena específico
                $faena = Faena::find($request->id_faena);
                if (!$faena) {
                    return response()->json([
                        'error' => 'La faena con ID ' . $request->id_faena . ' no existe.'
                    ], 404);
                }
            } else {
                // Buscar o crear por ubicación
                $nombreFaena = $request->ubicacion;
                $faena = Faena::where('ubicacion', $nombreFaena)->first();

                if (!$faena) {
                    // Si no existe la faena, la creamos
                    $faena = Faena::create([
                        'ubicacion' => $nombreFaena
                    ]);
                }
            }

            // 4. Crear la relación en solicitantefaena usando id_personal_interno como id_dotacion
            $solicitanteFaena = SolicitanteFaena::create([
                'id_dotacion' => $solicitante->id, // ✅ Este es el ID correcto
                'id_faena' => $faena->id_faena,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Solicitante interno registrado correctamente',
                'solicitante' => $solicitante,
                'personal_interno' => $personal,
                'solicitante_faena' => $solicitanteFaena
            ], 201);
        } catch (\Exception $e) {
            // En caso de una excepción, puedes manejarla aquí
            return response()->json([
                'error' => 'Hubo un error al registrar el solicitante interno.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // Función para consultar un usuario por RUT
    public function show($rut)
    {
        try {
            // Buscar el solicitante en la tabla 'solicitantes'
            $solicitante = Solicitante::where('rut', $rut)->first();

            if (!$solicitante) {
                return response()->json([
                    'error' => 'Solicitante no encontrado.'
                ], 404);
            }

            // Buscar el personal interno relacionado con el solicitante
            $personalInterno = PersonalInterno::where('rut', $rut)->first();

            if (!$personalInterno) {
                return response()->json([
                    'error' => 'Personal interno no encontrado.'
                ], 404);
            }

            // Buscar las faenas relacionadas a través de SolicitanteFaena
            $solicitanteFaenas = SolicitanteFaena::where('id_dotacion', $personalInterno->id_personal_interno)->get();
            $faenas = [];

            foreach ($solicitanteFaenas as $sf) {
                $faena = Faena::where('id_faena', $sf->id_faena)->first();
                if ($faena) {
                    $faenas[] = $faena;
                }
            }

            return response()->json([
                'success' => true,
                'solicitante' => $solicitante,
                'personal_interno' => $personalInterno,
                'faenas' => $faenas
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Hubo un error al consultar el usuario.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Función para listar usuarios internos - MEJORADA CON FILTRO POR FAENA
     */
    public function index(Request $request)
    {
        try {
            // 🎯 OBTENER EL PARÁMETRO DE FAENA
            $idFaena = $request->query('id_faena');
            
            Log::info('PersonalInternoController::index - Parámetros recibidos:', [
                'id_faena' => $idFaena,
                'todos_los_params' => $request->all()
            ]);

            if ($idFaena) {
                // ✅ FILTRAR POR FAENA ESPECÍFICA
                Log::info("Filtrando personal interno por faena: {$idFaena}");
                
                // 1. Obtener IDs de solicitantes que pertenecen a la faena
                $solicitantesEnFaena = SolicitanteFaena::where('id_faena', $idFaena)
                    ->pluck('id_dotacion') // Estos son los IDs de la tabla solicitantes
                    ->toArray();

                Log::info('Solicitantes encontrados en faena:', [
                    'ids' => $solicitantesEnFaena,
                    'cantidad' => count($solicitantesEnFaena)
                ]);

                if (empty($solicitantesEnFaena)) {
                    return response()->json([
                        'success' => true,
                        'message' => "No hay personal interno asignado a la faena {$idFaena}",
                        'personal_interno' => []
                    ], 200);
                }

                // 2. Obtener los RUTs de esos solicitantes
                $solicitantes = Solicitante::whereIn('id', $solicitantesEnFaena)
                    ->where('tipo_personal', 'Interno')
                    ->pluck('rut')
                    ->toArray();

                Log::info('RUTs de solicitantes internos en faena:', [
                    'ruts' => $solicitantes,
                    'cantidad' => count($solicitantes)
                ]);

                // 3. Obtener el personal interno con esos RUTs
                $personalInterno = PersonalInterno::whereIn('rut', $solicitantes)->get();

            } else {
                // ✅ SIN FILTRO - OBTENER TODOS (comportamiento original)
                Log::info('Sin filtro de faena - obteniendo todo el personal interno');
                $personalInterno = PersonalInterno::all();
            }

            Log::info('Personal interno obtenido:', [
                'cantidad' => $personalInterno->count(),
                'con_filtro_faena' => $idFaena ? true : false
            ]);

            // 🔄 PROCESAR LOS RESULTADOS (igual que antes)
            $usuariosDetallados = [];
            foreach ($personalInterno as $personal) {
                // Buscar el solicitante asociado por rut
                $solicitante = Solicitante::where('rut', $personal->rut)->first();

                // Obtener las faenas del solicitante
                $solicitanteFaenas = [];
                if ($solicitante) {
                    $solicitanteFaenas = SolicitanteFaena::where('id_dotacion', $solicitante->id)->get();
                }

                $faenas = [];
                foreach ($solicitanteFaenas as $sf) {
                    $faena = Faena::where('id_faena', $sf->id_faena)->first();
                    if ($faena) {
                        $faenas[] = $faena;
                    }
                }

                $usuariosDetallados[] = [
                    'id_dotacion' => $solicitante ? $solicitante->id : null,
                    'personal_interno' => $personal,
                    'faenas' => $faenas
                ];
            }

            return response()->json([
                'success' => true,
                'personal_interno' => $usuariosDetallados,
                'filtros_aplicados' => [
                    'id_faena' => $idFaena,
                    'total_encontrados' => count($usuariosDetallados)
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error en PersonalInternoController::index:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Hubo un error al obtener los usuarios.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // Nueva función para registrar usuario desde el frontend (ruta /api/registrarUsuarioInterno)
    public function registrarUsuarioInterno(Request $request)
    {
        // Redirigimos al método register con los mismos parámetros
        return $this->register($request);
    }

    // Método para listar todas las faenas disponibles
    public function listarFaenas()
    {
        try {
            $faenas = Faena::select('id_faena', 'ubicacion')->get();

            return response()->json([
                'success' => true,
                'faenas' => $faenas
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Hubo un error al obtener las faenas: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function asignarPermisoSolicitante(Request $request)
    {
        // Validar los datos recibidos
        $validator = Validator::make($request->all(), [
            'id_dotacion' => 'required|exists:solicitantes,id',
            'id_faena' => 'required|exists:faenas,id_faena',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar si ya existe esta relación para evitar duplicados
            $existe = SolicitanteFaena::where('id_dotacion', $request->id_dotacion)
                ->where('id_faena', $request->id_faena)
                ->first();

            if ($existe) {
                return response()->json([
                    'message' => 'Este solicitante ya tiene un permiso asignado para esta faena.'
                ], 409);
            }

            // Crear la relación
            $solicitanteFaena = SolicitanteFaena::create([
                'id_dotacion' => $request->id_dotacion,
                'id_faena' => $request->id_faena,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Permiso asignado correctamente al solicitante.',
                'solicitante_faena' => $solicitanteFaena
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Hubo un error al asignar el permiso.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function indexInternoExterno()
    {
        try {
            $personalInterno = PersonalInterno::all();
            $personalExterno = PersonalExterno::all();

            $usuariosDetallados = [];

            // Procesar personal interno
            foreach ($personalInterno as $personal) {
                $solicitante = \App\Models\Solicitante::where('rut', $personal->rut)->first();
                $usuariosDetallados[] = [
                    'tipo' => 'Interno',
                    'id' => $solicitante ? $solicitante->id : null, // id desde solicitantes
                    'rut' => $personal->rut,
                    'nombre' => trim("{$personal->nombre} {$personal->apellido}"),
                ];
            }

            // Procesar personal externo
            foreach ($personalExterno as $personal) {
                $solicitante = \App\Models\Solicitante::where('rut', $personal->rut)->first();
                $usuariosDetallados[] = [
                    'tipo' => 'Externo',
                    'id' => $solicitante ? $solicitante->id : null, // id desde solicitantes
                    'rut' => $personal->rut,
                    'nombre' => $personal->nombre,
                    'cargo' => $personal->cargo ?? null,
                ];
            }

            return response()->json([
                'success' => true,
                'personal' => $usuariosDetallados
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Hubo un error al obtener los usuarios.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function listarSolicitantes()
    {
        try {
            Log::info('Solicitantes:');
            $solicitantes = Solicitante::all();

            return response()->json([
                'success' => true,
                'solicitantes' => $solicitantes
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los solicitantes: ' . $e->getMessage()
            ], 500);
        }
    }
}