<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PersonalExterno;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Solicitante;
use App\Models\Faena;
use App\Models\SolicitanteFaena;

class PersonalExternoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
     // Función para listar los todos los usuarios registrados
    public function index()
{
    try {
        // Obtener todos los usuarios de la tabla 'personal_externo'
        $personalExterno = PersonalExterno::all();

        $usuariosDetallados = [];
        foreach ($personalExterno as $personal) {
            // Buscar el solicitante asociado por rut
            $solicitante = Solicitante::where('rut', $personal->rut)->first();

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

            // Usamos el RUT como id_dotacion (como string)
            $usuariosDetallados[] = [
                'id_dotacion' => $solicitante ? $solicitante->id : null,  // Ahora usamos el id del solicitante
                'personal_externo' => $personal,
                'faenas' => $faenas
            ];
        }

        return response()->json([
            'success' => true,
            'personal_externo' => $usuariosDetallados
        ], 200);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Hubo un error al obtener los usuarios.',
            'message' => $e->getMessage(),
        ], 500);
    }
}


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validar datos de entrada
        $validator = Validator::make($request->all(), [
            'rut' => 'required|unique:personal_externo,rut|unique:solicitantes,rut',
            'nombre_completo' => 'required|string',
            'id_empresa' => 'required|exists:empresas_externas,id_empresa',
            'ubicacion' => 'required|string', // ahora obligatorio si se usará para buscar/crear faena
        ]);
    
        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }
    
        try {
            // Procesar nombre y apellido
            $nombreCompleto = trim($request->nombre_completo);
            $partesNombre = explode(' ', $nombreCompleto);
    
            if (count($partesNombre) < 2) {
                return response()->json([
                    'error' => 'Debe proporcionar al menos un nombre y un apellido.'
                ], 422);
            }
    
            if (count($partesNombre) > 3) {
                $nombre = array_pop($partesNombre);
                $segundoNombre = array_pop($partesNombre);
                $apellido = implode(' ', $partesNombre);
                $nombre = $segundoNombre . ' ' . $nombre;
            } elseif (count($partesNombre) == 3) {
                $nombre = array_pop($partesNombre);
                $apellido = implode(' ', $partesNombre);
            } else {
                $nombre = array_pop($partesNombre);
                $apellido = implode(' ', $partesNombre);
            }
    
            if (empty($nombre) || empty($apellido)) {
                return response()->json([
                    'error' => 'El nombre y el apellido deben estar presentes.'
                ], 422);
            }
    
            // Crear solicitante
            $solicitante = Solicitante::create([
                'rut' => $request->rut,
                'tipo_personal' => 'Externo',
            ]);
    
            // Crear personal externo
            $personal = PersonalExterno::create([
                'rut' => $request->rut,
                'nombre' => $nombre . ' ' . $apellido,
                'id_empresa' => $request->id_empresa,
            ]);
    
            // Buscar o crear faena por ubicación
            $nombreFaena = $request->ubicacion;
            $faena = Faena::firstOrCreate(
                ['ubicacion' => $nombreFaena]
            );
    
            // Crear relación en solicitante_faena
            $solicitanteFaena = SolicitanteFaena::create([
                'id_dotacion' => $solicitante->id,
                'id_faena' => $faena->id_faena,
            ]);
    
            return response()->json([
                'success' => true,
                'message' => 'Personal externo registrado correctamente',
                'solicitante' => $solicitante,
                'personal_externo' => $personal,
                'solicitante_faena' => $solicitanteFaena
            ], 201);
    
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Hubo un error al registrar el personal externo.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    
    
    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
