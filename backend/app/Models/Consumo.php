<?php

// ===================================
// MODEL: Consumo.php
// ===================================

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Consumo extends Model
{
    use HasFactory;

    protected $table = 'consumos';
    protected $primaryKey = 'id_consumo';
    
    protected $fillable = [
        'id_dotacion',
        'id_equipo',
        'id_usuario',
        'fecha_consumo',
        'litros_consumidos',
        'tipo_consumo',
        'tipo_operacion',
        'id_faena',
        'id_estanque',
        'medicion',
        'numeral_inicial',
        'numeral_final',
        'precio_litro',
        'observacion'
    ];

    protected $casts = [
        'fecha_consumo' => 'datetime',
        'litros_consumidos' => 'decimal:2',
        'medicion' => 'decimal:3',
        'numeral_inicial' => 'decimal:3',
        'numeral_final' => 'decimal:3',
        'precio_litro' => 'decimal:2'
    ];

    // ===================================
    // RELACIONES
    // ===================================

    /**
     * Un consumo puede tener múltiples estanques
     */
    public function consumoEstanques(): HasMany
    {
        return $this->hasMany(ConsumoEstanque::class, 'id_consumo', 'id_consumo');
    }

    /**
     * Relación con la faena
     */
    public function faena(): BelongsTo
    {
        return $this->belongsTo(Faena::class, 'id_faena', 'id_faena');
    }

    /**
     * Relación con el usuario
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id');
    }

    /**
     * Relación con el equipo/máquina
     */
    public function equipo(): BelongsTo
    {
        return $this->belongsTo(Maquina::class, 'id_equipo', 'id_maquina');
    }

    /**
     * Relación con el estanque principal (para consumos simples)
     */
    public function estanquePrincipal(): BelongsTo
    {
        return $this->belongsTo(Estanque::class, 'id_estanque', 'id_estanque');
    }

    // ===================================
    // SCOPES Y MÉTODOS AUXILIARES
    // ===================================

    /**
     * Scope para consumos simples (un solo estanque)
     */
    public function scopeSimples($query)
    {
        return $query->where('tipo_consumo', 'simple');
    }

    /**
     * Scope para consumos múltiples (varios estanques)
     */
    public function scopeMultiples($query)
    {
        return $query->where('tipo_consumo', 'multiple');
    }

    /**
     * Scope por faena
     */
    public function scopePorFaena($query, $idFaena)
    {
        return $query->where('id_faena', $idFaena);
    }

    /**
     * Verifica si es un consumo múltiple
     */
    public function esMultiple(): bool
    {
        return $this->tipo_consumo === 'multiple';
    }

    /**
     * Obtiene todos los estanques utilizados en este consumo
     */
    public function getEstanquesUtilizados()
    {
        if ($this->esMultiple()) {
            return $this->consumoEstanques()->with('estanque')->get();
        } else {
            return collect([$this->estanquePrincipal]);
        }
    }
}

// ===================================
// MODEL: ConsumoEstanque.php
// ===================================

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsumoEstanque extends Model
{
    use HasFactory;

    protected $table = 'consumo_estanques';
    protected $primaryKey = 'id_consumo_estanque';
    
    protected $fillable = [
        'id_consumo',
        'id_estanque',
        'litros_desde_estanque',
        'medicion_inicial',
        'medicion_final',
        'stock_inicial_estanque',
        'stock_final_estanque'
    ];

    protected $casts = [
        'litros_desde_estanque' => 'decimal:2',
        'medicion_inicial' => 'decimal:3',
        'medicion_final' => 'decimal:3',
        'stock_inicial_estanque' => 'decimal:2',
        'stock_final_estanque' => 'decimal:2'
    ];

    // ===================================
    // RELACIONES
    // ===================================

    /**
     * Relación con el consumo principal
     */
    public function consumo(): BelongsTo
    {
        return $this->belongsTo(Consumo::class, 'id_consumo', 'id_consumo');
    }

    /**
     * Relación con el estanque
     */
    public function estanque(): BelongsTo
    {
        return $this->belongsTo(Estanque::class, 'id_estanque', 'id_estanque');
    }

    // ===================================
    // MÉTODOS AUXILIARES
    // ===================================

    /**
     * Calcula la diferencia de stock
     */
    public function getDiferenciaStock(): float
    {
        return $this->stock_inicial_estanque - $this->stock_final_estanque;
    }

    /**
     * Calcula la diferencia de medición
     */
    public function getDiferenciaMedicion(): float
    {
        return $this->medicion_final - $this->medicion_inicial;
    }
}

// ===================================
// CONTROLLER: ConsumoController.php
// ===================================

namespace App\Http\Controllers;

use App\Models\Consumo;
use App\Models\ConsumoEstanque;
use App\Models\Estanque;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ConsumoController extends Controller
{
    /**
     * Listar todos los consumos
     */
    public function index(Request $request)
    {
        try {
            $query = Consumo::with([
                'consumoEstanques.estanque',
                'faena',
                'usuario',
                'equipo',
                'estanquePrincipal'
            ]);

            // Filtrar por faena si se proporciona
            if ($request->has('id_faena')) {
                $query->porFaena($request->id_faena);
            }

            // Filtrar por tipo de consumo
            if ($request->has('tipo_consumo')) {
                if ($request->tipo_consumo === 'simple') {
                    $query->simples();
                } elseif ($request->tipo_consumo === 'multiple') {
                    $query->multiples();
                }
            }

            $consumos = $query->orderBy('fecha_consumo', 'desc')->paginate(15);

            return response()->json([
                'success' => true,
                'data' => $consumos
            ]);

        } catch (\Exception $e) {
            Log::error('Error al listar consumos: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar los consumos'
            ], 500);
        }
    }

    /**
     * Crear un nuevo consumo (simple o múltiple)
     */
    public function store(Request $request)
    {
        // Validación base más flexible
        $validator = Validator::make($request->all(), [
            'id_dotacion' => 'required|string',
            'id_equipo' => 'required|exists:maquinas,id_maquina',
            'id_usuario' => 'required|exists:users,id',
            'fecha_consumo' => 'required|date',
            'litros_consumidos' => 'required|numeric|min:0.01',
            'tipo_consumo' => 'nullable|in:simple,multiple', // Hacer nullable para compatibilidad
            'tipo_operacion' => 'nullable|in:normal,estanque_movil',
            'id_faena' => 'required|exists:faenas,id_faena',
            'numeral_inicial' => 'required|numeric|min:0',
            'numeral_final' => 'required|numeric|gt:numeral_inicial',
            'precio_litro' => 'nullable|numeric|min:0',
            'observacion' => 'nullable|string|max:255',
            
            // Para consumo simple
            'id_estanque' => 'nullable|exists:estanques,id_estanque',
            'medicion' => 'nullable|numeric|min:0',
            'horometro' => 'nullable|numeric|min:0',
            'kilometraje' => 'nullable|numeric|min:0',
            
            // Para consumo múltiple
            'estanques_multiples' => 'nullable|array|min:1',
            'estanques_multiples.*.id_estanque' => 'required|exists:estanques,id_estanque',
            'estanques_multiples.*.litros' => 'required|numeric|min:0.01',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        
        try {
            // 🔍 DETECTAR AUTOMÁTICAMENTE EL TIPO DE CONSUMO
            $tipoConsumo = 'simple'; // Por defecto
            $esMultiple = false;

            // Verificar si es múltiple basado en los datos recibidos
            if ($request->has('estanques_multiples') && count($request->estanques_multiples) > 0) {
                $tipoConsumo = 'multiple';
                $esMultiple = true;
            } elseif ($request->tipo_consumo === 'multiple') {
                $tipoConsumo = 'multiple';
                $esMultiple = true;
            }

            Log::info('🔍 Tipo de consumo detectado:', [
                'tipo' => $tipoConsumo,
                'es_multiple' => $esMultiple,
                'tiene_estanques_multiples' => $request->has('estanques_multiples'),
                'cantidad_estanques' => $request->has('estanques_multiples') ? count($request->estanques_multiples) : 0
            ]);

            // Crear el consumo principal
            $consumo = Consumo::create([
                'id_dotacion' => $request->id_dotacion,
                'id_equipo' => $request->id_equipo,
                'id_usuario' => $request->id_usuario,
                'fecha_consumo' => $request->fecha_consumo,
                'litros_consumidos' => $request->litros_consumidos,
                'tipo_consumo' => $tipoConsumo,
                'tipo_operacion' => $request->tipo_operacion ?? 'normal',
                'id_faena' => $request->id_faena,
                'id_estanque' => $esMultiple ? null : $request->id_estanque, // Solo para simple
                'medicion' => $request->medicion ?? $request->horometro ?? $request->kilometraje ?? 0,
                'numeral_inicial' => $request->numeral_inicial,
                'numeral_final' => $request->numeral_final,
                'precio_litro' => $request->precio_litro ?? 1500,
                'observacion' => $request->observacion
            ]);

            Log::info('✅ Consumo principal creado:', [
                'id_consumo' => $consumo->id_consumo,
                'tipo' => $tipoConsumo,
                'litros_total' => $consumo->litros_consumidos
            ]);

            // Procesar según el tipo de consumo
            if ($esMultiple) {
                $this->procesarConsumoMultiple($consumo, $request);
            } else {
                $this->procesarConsumoSimple($consumo, $request);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Consumo registrado exitosamente',
                'data' => $consumo->load('consumoEstanques.estanque')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al crear consumo: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar el consumo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Procesar consumo simple (un solo estanque)
     */
    private function procesarConsumoSimple(Consumo $consumo, Request $request)
    {
        $estanque = Estanque::findOrFail($request->id_estanque);
        $stockInicial = $estanque->stock_actual;
        $litrosConsumidos = $request->litros_consumidos;

        Log::info('📋 Procesando consumo SIMPLE:', [
            'estanque' => $estanque->nombre,
            'stock_inicial' => $stockInicial,
            'litros_a_consumir' => $litrosConsumidos
        ]);

        // Verificar stock suficiente
        if ($stockInicial < $litrosConsumidos) {
            throw new \Exception("Stock insuficiente en el estanque {$estanque->nombre}. Disponible: {$stockInicial}L, Requerido: {$litrosConsumidos}L");
        }

        $stockFinal = $stockInicial - $litrosConsumidos;

        // ✅ CREAR REGISTRO EN consumo_estanques (IGUAL QUE MÚLTIPLE)
        ConsumoEstanque::create([
            'id_consumo' => $consumo->id_consumo,
            'id_estanque' => $estanque->id_estanque,
            'litros_desde_estanque' => $litrosConsumidos,
            'medicion_inicial' => $request->medicion ?? $request->horometro ?? $request->kilometraje ?? 0,
            'medicion_final' => $request->medicion ?? $request->horometro ?? $request->kilometraje ?? 0,
            'stock_inicial_estanque' => $stockInicial,
            'stock_final_estanque' => $stockFinal
        ]);

        // Actualizar stock del estanque
        $estanque->update(['stock_actual' => $stockFinal]);

        Log::info('✅ Consumo simple procesado exitosamente:', [
            'stock_final' => $stockFinal,
            'diferencia' => $stockInicial - $stockFinal
        ]);
    }

    /**
     * Procesar consumo múltiple (varios estanques)
     */
    private function procesarConsumoMultiple(Consumo $consumo, Request $request)
    {
        $estanquesMultiples = $request->estanques_multiples;
        $totalLitrosDistribuidos = 0;

        Log::info('📋 Procesando consumo MÚLTIPLE:', [
            'total_estanques' => count($estanquesMultiples),
            'litros_total_requerido' => $consumo->litros_consumidos
        ]);

        foreach ($estanquesMultiples as $estanqueData) {
            $estanque = Estanque::findOrFail($estanqueData['id_estanque']);
            $litrosEstanque = floatval($estanqueData['litros']);
            $stockInicial = $estanque->stock_actual;

            Log::info("  🔸 Procesando estanque: {$estanque->nombre}", [
                'litros_asignados' => $litrosEstanque,
                'stock_inicial' => $stockInicial
            ]);

            // Verificar stock suficiente
            if ($stockInicial < $litrosEstanque) {
                throw new \Exception("Stock insuficiente en el estanque {$estanque->nombre}. Disponible: {$stockInicial}L, Requerido: {$litrosEstanque}L");
            }

            $stockFinal = $stockInicial - $litrosEstanque;
            $totalLitrosDistribuidos += $litrosEstanque;

            // ✅ CREAR REGISTRO EN consumo_estanques
            ConsumoEstanque::create([
                'id_consumo' => $consumo->id_consumo,
                'id_estanque' => $estanque->id_estanque,
                'litros_desde_estanque' => $litrosEstanque,
                'medicion_inicial' => 0, // En múltiple no manejamos mediciones individuales
                'medicion_final' => 0,
                'stock_inicial_estanque' => $stockInicial,
                'stock_final_estanque' => $stockFinal
            ]);

            // Actualizar stock del estanque
            $estanque->update(['stock_actual' => $stockFinal]);

            Log::info("    ✅ Estanque {$estanque->nombre} actualizado:", [
                'stock_final' => $stockFinal,
                'litros_extraidos' => $litrosEstanque
            ]);
        }

        // Verificar que la suma coincida con el total
        if (abs($totalLitrosDistribuidos - $consumo->litros_consumidos) > 0.01) {
            throw new \Exception("La suma de litros distribuidos ({$totalLitrosDistribuidos}L) no coincide con el total del consumo ({$consumo->litros_consumidos}L)");
        }

        Log::info('✅ Consumo múltiple procesado exitosamente:', [
            'total_distribuido' => $totalLitrosDistribuidos,
            'total_requerido' => $consumo->litros_consumidos,
            'diferencia' => abs($totalLitrosDistribuidos - $consumo->litros_consumidos)
        ]);
    }

    /**
     * Obtener un consumo específico
     */
    public function show($id)
    {
        try {
            $consumo = Consumo::with([
                'consumoEstanques.estanque',
                'faena',
                'usuario',
                'equipo',
                'estanquePrincipal'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $consumo
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Consumo no encontrado'
            ], 404);
        }
    }

    /**
     * Obtener estadísticas de consumos
     */
    public function estadisticas(Request $request)
    {
        try {
            $idFaena = $request->get('id_faena');
            $fechaInicio = $request->get('fecha_inicio');
            $fechaFin = $request->get('fecha_fin');

            $query = Consumo::query();

            if ($idFaena) {
                $query->where('id_faena', $idFaena);
            }

            if ($fechaInicio && $fechaFin) {
                $query->whereBetween('fecha_consumo', [$fechaInicio, $fechaFin]);
            }

            $estadisticas = [
                'total_consumos' => $query->count(),
                'consumos_simples' => $query->clone()->simples()->count(),
                'consumos_multiples' => $query->clone()->multiples()->count(),
                'total_litros' => $query->sum('litros_consumidos'),
                'promedio_litros' => $query->avg('litros_consumidos'),
                'consumo_por_dia' => $query->clone()
                    ->selectRaw('DATE(fecha_consumo) as fecha, SUM(litros_consumidos) as total_litros')
                    ->groupBy('fecha')
                    ->orderBy('fecha')
                    ->get()
            ];

            return response()->json([
                'success' => true,
                'data' => $estadisticas
            ]);

        } catch (\Exception $e) {
            Log::error('Error al obtener estadísticas: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar estadísticas'
            ], 500);
        }
    }
}