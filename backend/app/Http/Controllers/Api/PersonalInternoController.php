<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PersonalInterno;
use Illuminate\Support\Facades\Validator;
use App\Models\Solicitante;

class PersonalInternoController extends Controller
{
    public function register(Request $request)
    {
        // Validación de los datos
        $validator = Validator::make($request->all(), [
            'rut' => 'required|unique:personal_interno,rut|unique:solicitantes,rut',
            'nombre_completo' => 'required|string',  // Cambié 'nombre' por 'nombre_completo'
            'cargo' => 'nullable|string',
            'ubicacion' => 'nullable|string',
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

            // Ahora puedes continuar con la creación de solicitante y personal


            // Ahora puedes continuar con la creación de solicitante y personal

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

            return response()->json([
                'message' => 'Solicitante interno registrado correctamente',
                'solicitante' => $solicitante,
                'personal_interno' => $personal
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

            return response()->json([
                'solicitante' => $solicitante,
                'personal_interno' => $personalInterno
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Hubo un error al consultar el usuario.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // Función para listar todos los usuarios registrados
    public function index()
    {
        try {
            // Obtener todos los usuarios de la tabla 'personal_interno'
            $personalInterno = PersonalInterno::all();

            return response()->json([
                'personal_interno' => $personalInterno
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Hubo un error al obtener los usuarios.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
