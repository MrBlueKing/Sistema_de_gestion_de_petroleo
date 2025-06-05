import React, { useState, useEffect } from "react";
import axios from '../../lib/axios';
import { FiLoader, FiTrendingUp, FiAlertCircle, FiInfo, FiBarChart, FiDollarSign } from "react-icons/fi";

const ConsumoPorMaquinaPureTable = ({ 
  fechaDesde, 
  fechaHasta, 
  faenaSeleccionada,
  refreshKey
}) => {
  const [datosConsumo, setDatosConsumo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resumenGeneral, setResumenGeneral] = useState(null);

  // Cargar datos del ConsumoCategoriasController
  const cargarDatosConsumoCategoria = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/consumo-categorias/calcular', {
        fecha_inicio: fechaDesde,
        fecha_fin: fechaHasta,
        id_faena: faenaSeleccionada !== 'todas' ? parseInt(faenaSeleccionada) : null,
        incluir_simulacion: true,
        usar_fechas_automaticas: false
      });

      console.log("DAtos:",response.data);

      if (!response.data?.success) {
        throw new Error('Error en respuesta del ConsumoCategoriasController');
      }

      // Extraer máquinas del análisis por categoría
      const maquinasData = [];
      
      if (response.data.analisis_por_categoria) {
        response.data.analisis_por_categoria.forEach(categoria => {
          if (categoria.analisis_detallado) {
            categoria.analisis_detallado.forEach(maquinaAnalisis => {
              const maquina = maquinaAnalisis.maquina;
              const resumen = maquinaAnalisis.resumen_ejecutivo;
              const costos = maquinaAnalisis.costos;
              const rendimiento = maquinaAnalisis.rendimiento;
              
              maquinasData.push({
                // Datos básicos de la máquina
                id_maquina: maquina.id,
                nombre_maquina: maquina.nombre,
                patente: maquina.patente,
                categoria: categoria.categoria.nombre,
                tipo_medicion: categoria.categoria.tipo_medicion,
                faena: maquina.faena?.nombre || 'N/A',
                
                // Datos de consumo
                litros_confirmados: resumen.litros_confirmados || 0,
                litros_simulados: resumen.litros_simulados || 0,
                litros_totales: resumen.litros_totales || 0,
                porcentaje_confirmado: resumen.porcentaje_confirmado || 0,
                
                // ✅ DATOS DE COSTOS (LO QUE NECESITAS)
                precio_promedio_litro: costos.precio_promedio_litro || 0,
                valor_total: costos.valor_total || 0,
                costo_por_dia: costos.costo_por_dia || 0,
                
                // Datos de rendimiento
                rendimiento: {
                  valor: rendimiento.rendimiento_valor || 0,
                  unidad: rendimiento.tipo_medicion === 'Horometro' ? 'hr' : 'km',
                  formateado: rendimiento.rendimiento_formateado || 'N/A',
                  interpretacion: rendimiento.interpretacion || 'No disponible'
                },
                
                // Estadísticas
                estadisticas: maquinaAnalisis.estadisticas || null,
                periodos_confirmados: maquinaAnalisis.periodos_confirmados || [],
                simulacion: maquinaAnalisis.simulacion || null,
                
                // Metadata
                categoria_completa: categoria,
                analisis_completo: maquinaAnalisis
              });
            });
          }
        });
      }

      setDatosConsumo(maquinasData);
      setResumenGeneral(response.data.resumen_ejecutivo);
      
      console.log('✅ Datos ConsumoCategoriasController cargados:', {
        maquinas: maquinasData.length,
        ejemploPrecio: maquinasData[0]?.precio_promedio_litro,
        resumen: response.data.resumen_ejecutivo
      });

    } catch (err) {
      console.error('Error al cargar datos ConsumoCategoriasController:', err);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos cuando cambien los parámetros
  useEffect(() => {
    if (fechaDesde && fechaHasta) {
      cargarDatosConsumoCategoria();
    }
  }, [fechaDesde, fechaHasta, faenaSeleccionada, refreshKey]);

  // Funciones auxiliares para colores
  const getColorPrecision = (precision) => {
    if (precision >= 80) return 'text-green-600 bg-green-50';
    if (precision >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getColorRendimiento = (interpretacion) => {
    if (!interpretacion || interpretacion === 'No disponible') return 'text-gray-500';
    if (interpretacion.includes('eficiente') || interpretacion.includes('bajo')) return 'text-green-600';
    if (interpretacion.includes('moderado') || interpretacion.includes('normal')) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBadgeRendimiento = (interpretacion) => {
    if (!interpretacion || interpretacion === 'No disponible') return 'bg-gray-100 text-gray-600';
    if (interpretacion.includes('eficiente') || interpretacion.includes('bajo')) return 'bg-green-100 text-green-700';
    if (interpretacion.includes('moderado') || interpretacion.includes('normal')) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  // Estados de carga y error
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex items-center justify-center">
          <FiLoader className="animate-spin h-8 w-8 text-blue-500 mr-3" />
          <span className="text-gray-600">Cargando análisis de consumo por categorías...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center text-red-600">
          <FiAlertCircle className="h-5 w-5 mr-2" />
          <div>
            <h4 className="font-medium">Error al cargar datos</h4>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!datosConsumo || datosConsumo.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-md font-medium text-gray-800 mb-4">
          Análisis por Máquina - ConsumoCategoriasController
        </h3>
        <div className="text-center text-gray-500 py-8">
          <FiInfo className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No hay datos disponibles para el período seleccionado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      {/* Header con datos del resumen ejecutivo */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiDollarSign className="h-5 w-5 mr-2 text-purple-500" />
              Análisis por Máquina - ConsumoCategoriasController
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Precios específicos por máquina con precisión de datos
            </p>
          </div>
          
          {/* Estadísticas del resumen ejecutivo */}
          {resumenGeneral && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-lg font-bold text-blue-600">
                  {resumenGeneral.consumo_total.litros}L
                </div>
                <div className="text-xs text-gray-500">Total Consumo</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-lg font-bold text-green-600">
                  {resumenGeneral.consumo_total.porcentaje_confirmado}%
                </div>
                <div className="text-xs text-gray-500">Confirmado</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-lg font-bold text-purple-600">
                  ${Math.round(resumenGeneral.costo_estimado.total).toLocaleString('es-CL')}
                </div>
                <div className="text-xs text-gray-500">Costo Total</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-lg font-bold text-orange-600">
                  ${resumenGeneral.costo_estimado.precio_promedio_litro}
                </div>
                <div className="text-xs text-gray-500">Precio Prom.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Máquina
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Faena
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consumo Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio Específico
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rendimiento
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precisión
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {datosConsumo.map((maquina, index) => (
              <tr key={`${maquina.id_maquina}-${index}`} className="hover:bg-gray-50 transition-colors">
                {/* Columna Máquina */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="font-medium text-gray-900">
                      {maquina.nombre_maquina}
                    </div>
                    <div className="text-sm text-gray-500">{maquina.patente}</div>
                    <div className="text-xs text-gray-400">ID: {maquina.id_maquina}</div>
                  </div>
                </td>

                {/* Columna Categoría */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      maquina.tipo_medicion === "Horometro"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {maquina.tipo_medicion}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">{maquina.categoria}</div>
                  </div>
                </td>

                {/* Columna Faena */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {maquina.faena}
                  </div>
                </td>

                {/* Columna Consumo Total */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex flex-col items-end">
                    <div className="text-sm font-bold text-gray-900">
                      {maquina.litros_totales.toLocaleString("es-CL", { maximumFractionDigits: 1 })}L
                    </div>
                    <div className="text-xs text-gray-500">
                      {maquina.litros_confirmados > 0 && (
                        <span className="text-green-600">
                          {maquina.litros_confirmados}L conf.
                        </span>
                      )}
                      {maquina.litros_simulados > 0 && (
                        <span className="text-blue-600 ml-1">
                          +{maquina.litros_simulados}L sim.
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Columna Precio Específico - ✅ ESTO ES LO QUE NECESITAS */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex flex-col items-end">
                    <div className="text-sm font-bold text-purple-600">
                      ${maquina.precio_promedio_litro}/L
                    </div>
                    <div className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                      Precio específico máquina
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ${Math.round(maquina.costo_por_dia)}/día
                    </div>
                  </div>
                </td>

                {/* Columna Valor Total */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex flex-col items-end">
                    <div className="text-sm font-bold text-gray-900">
                      ${Math.round(maquina.valor_total).toLocaleString("es-CL")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {maquina.litros_totales > 0 && 
                        `${Math.round(maquina.valor_total / maquina.litros_totales)} promedio/L`
                      }
                    </div>
                  </div>
                </td>

                {/* Columna Rendimiento */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {maquina.rendimiento && maquina.rendimiento.valor > 0 ? (
                    <div className="flex flex-col items-end">
                      <div className="text-sm font-bold text-gray-900">
                        {maquina.rendimiento.formateado}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${getBadgeRendimiento(maquina.rendimiento.interpretacion)}`}>
                        {maquina.rendimiento.interpretacion.replace('Consumo ', '').replace(' - revisar eficiencia', '').replace(' - revisar condiciones operativas', '')}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 italic">Sin datos</div>
                  )}
                </td>

                {/* Columna Precisión */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getColorPrecision(maquina.porcentaje_confirmado)}`}>
                    {maquina.porcentaje_confirmado.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {maquina.porcentaje_confirmado >= 80 ? 'Alta' : 
                     maquina.porcentaje_confirmado >= 60 ? 'Media' : 
                     maquina.porcentaje_confirmado > 0 ? 'Baja' : 'Solo simulación'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer con información */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
          <div className="text-sm text-gray-600">
            <span className="font-medium">🎯 Fuente única:</span>
            <span className="ml-1">ConsumoCategoriasController - Precios específicos por máquina</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>
              <strong>{datosConsumo.length}</strong> máquina{datosConsumo.length !== 1 ? 's' : ''} analizadas
            </span>
            <span>•</span>
            <span>
              <strong>{datosConsumo.filter(m => m.porcentaje_confirmado > 0).length}</strong> con datos confirmados
            </span>
            <span>•</span>
            <span>
              <strong>{datosConsumo.filter(m => m.litros_simulados > 0).length}</strong> con simulación
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsumoPorMaquinaPureTable;