import React, { useState, useEffect, useMemo } from "react";
import axios from '../../lib/axios';
import { FiLoader, FiAlertCircle, FiInfo, FiMapPin, FiClock, FiDroplet, FiTrendingUp } from "react-icons/fi";

const ConsumoPorFaenaTable = ({ 
  fechaDesde, 
  fechaHasta, 
  horaDesde,
  horaHasta,
  faenaSeleccionada,
  refreshKey 
}) => {
  const [datosConsumo, setDatosConsumo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadatos, setMetadatos] = useState(null);

  // FUNCIÓN: Formatear fecha con hora
  const formatearFechaHora = (fecha, hora) => {
    if (!fecha) return fecha;
    if (!hora) return fecha;
    return `${fecha} ${hora}:00`;
  };

  // FUNCIÓN ESTÉTICA: Obtener colores por faena (del componente original)
  const getFaenaColorsSutil = (nombreFaena) => {
    const colores = {
      'Cabildo': { 
         light: "bg-green-50/30", // Verde muy suave con transparencia
    border: "border-l-green-300/40", // Borde izquierdo sutil
    hover: "hover:bg-green-50/50", // Hover ligeramente más visible
    badge: "bg-green-100/70 text-green-700/80", // Badge con transparencia
    icon: "🌿",
      },
      'Tiltil': { 
       light: "bg-red-50/30", // Rojo muy suave con transparencia
    border: "border-l-red-300/40", // Borde izquierdo sutil
    hover: "hover:bg-red-50/50", // Hover ligeramente más visible
    badge: "bg-red-100/70 text-red-700/80", // Badge con transparencia
    icon: "🏔️",
      }
    };

    return colores[nombreFaena] || { 
      light: 'bg-gray-50', 
      border: 'border-l-4 border-gray-400', 
      hover: 'hover:bg-gray-100',
      icon: '📍',
      accent: 'text-gray-600'
    };
  };

  // FUNCIÓN PRINCIPAL: Procesar datos usando periodos_confirmados (lógica del nuevo componente)
  const procesarDatosConPeriodosConfirmados = (analisisPorCategoria) => {
    console.log('🔍 [PROCESADOR] Iniciando procesamiento con periodos confirmados');
    
    const faenasMap = new Map();

    analisisPorCategoria.forEach((categoria, categoriaIndex) => {
      const categoriaNombre = categoria.categoria?.nombre || 'Sin categoría';
      
      if (!categoria.analisis_detallado || categoria.analisis_detallado.length === 0) {
        return;
      }

      categoria.analisis_detallado.forEach((maquinaData, maquinaIndex) => {
        const maquina = maquinaData.maquina;
        const resumenEjecutivo = maquinaData.resumen_ejecutivo;
        const costos = maquinaData.costos;
        const periodosConfirmados = maquinaData.periodos_confirmados || [];
        const simulacion = maquinaData.simulacion;

        // PROCESAR PERÍODOS CONFIRMADOS
        if (periodosConfirmados && periodosConfirmados.length > 0) {
          periodosConfirmados.forEach((periodo) => {
            const faenaId = periodo.faena_id;
            const litrosConfirmados = periodo.consumo?.litros || 0;
            
            // Obtener nombre de faena
            let faenaNombre = `Faena ${faenaId}`;
            if (maquina?.faena?.faenas_detalle) {
              const faenaDetalle = maquina.faena.faenas_detalle.find(f => f.id === faenaId);
              if (faenaDetalle) {
                faenaNombre = faenaDetalle.nombre;
              }
            }

            // Calcular costo proporcional
            const totalLitrosConfirmados = resumenEjecutivo?.litros_confirmados || 1;
            const proporcionConfirmada = litrosConfirmados / totalLitrosConfirmados;
            const costoConfirmado = (costos?.valor_total || 0) * proporcionConfirmada;

            // Agregar a faena
            agregarAFaena(faenasMap, faenaId, faenaNombre, {
              maquina: maquina,
              categoria: categoria.categoria,
              litrosConfirmados: litrosConfirmados,
              litrosSimulados: 0,
              costo: costoConfirmado
            });
          });
        }

        // PROCESAR SIMULACIÓN
        if (simulacion && simulacion.stock && simulacion.stock.disponible_para_consumo > 0) {
          const litrosSimulados = simulacion.stock.disponible_para_consumo;
          const faenaSimulacion = maquinaData.ultima_carga_info?.faena_id;
          
          if (faenaSimulacion) {
            let faenaNombre = `Faena ${faenaSimulacion}`;
            if (maquina?.faena?.faenas_detalle) {
              const faenaDetalle = maquina.faena.faenas_detalle.find(f => f.id === faenaSimulacion);
              if (faenaDetalle) {
                faenaNombre = faenaDetalle.nombre;
              }
            }

            const totalLitrosSimulados = resumenEjecutivo?.litros_simulados || 1;
            const proporcionSimulada = litrosSimulados / totalLitrosSimulados;
            const costoSimulado = (costos?.valor_total || 0) * proporcionSimulada;

            agregarAFaena(faenasMap, faenaSimulacion, faenaNombre, {
              maquina: maquina,
              categoria: categoria.categoria,
              litrosConfirmados: 0,
              litrosSimulados: litrosSimulados,
              costo: costoSimulado
            });
          }
        }
      });
    });

    return Array.from(faenasMap.values()).sort((a, b) => b.consumo_total - a.consumo_total);
  };

  // FUNCIÓN AUXILIAR: Agregar datos a faena
  const agregarAFaena = (faenasMap, faenaId, faenaNombre, datos) => {
    const faenaKey = `faena_${faenaId}`;
    
    if (!faenasMap.has(faenaKey)) {
      faenasMap.set(faenaKey, {
        id_faena: faenaId,
        nombre_faena: faenaNombre,
        consumo_total: 0,
        litros_confirmados: 0,
        litros_simulados: 0,
        valor_total: 0,
        maquinas_count: 0,
        consumos_count: 0,
        categorias: new Set(),
        maquinas_detalle: []
      });
    }

    const faenaData = faenasMap.get(faenaKey);
    
    // Verificar si la máquina ya existe
    let maquinaExistente = faenaData.maquinas_detalle.find(m => m.id === datos.maquina.id);
    
    if (maquinaExistente) {
      maquinaExistente.litros_confirmados += datos.litrosConfirmados;
      maquinaExistente.litros_simulados += datos.litrosSimulados;
      maquinaExistente.valor_total += datos.costo;
    } else {
      faenaData.maquinas_count += 1;
      faenaData.maquinas_detalle.push({
        id: datos.maquina.id,
        nombre: datos.maquina.nombre,
        patente: datos.maquina.patente,
        categoria: datos.categoria?.nombre,
        litros_confirmados: datos.litrosConfirmados,
        litros_simulados: datos.litrosSimulados,
        valor_total: datos.costo
      });
    }

    // Actualizar totales de faena
    faenaData.consumo_total += (datos.litrosConfirmados + datos.litrosSimulados);
    faenaData.litros_confirmados += datos.litrosConfirmados;
    faenaData.litros_simulados += datos.litrosSimulados;
    faenaData.valor_total += datos.costo;
    faenaData.consumos_count += (datos.litrosConfirmados > 0 ? 1 : 0) + (datos.litrosSimulados > 0 ? 1 : 0);
    faenaData.categorias.add(datos.categoria?.nombre || 'Sin categoría');
  };

  // FUNCIÓN PRINCIPAL: Cargar datos
  const cargarDatosConsumoFaena = async () => {
    try {
      setLoading(true);
      setError(null);

      const fechaInicioFormateada = formatearFechaHora(fechaDesde, horaDesde);
      const fechaFinFormateada = formatearFechaHora(fechaHasta, horaHasta);

      const diasPeriodo = fechaDesde && fechaHasta ? 
        Math.ceil((new Date(fechaHasta) - new Date(fechaDesde)) / (1000 * 60 * 60 * 24)) + 1 : 30;

      const response = await axios.post('/api/consumo-categorias/calcular', {
        fecha_inicio: fechaInicioFormateada,
        fecha_fin: fechaFinFormateada,
        id_faena: faenaSeleccionada !== 'todas' ? parseInt(faenaSeleccionada) : null,
        incluir_simulacion: true,
        usar_fechas_automaticas: false,
        periodo_dias: diasPeriodo,
        incluir_sabados: true,
        incluir_domingos: false
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Error en respuesta del servidor');
      }

      const analisisPorCategoria = response.data.analisis_por_categoria || [];
      const metadatosResponse = response.data.metadatos || {};
      
      setMetadatos(metadatosResponse);

      // USAR PROCESADOR MEJORADO
      const faenasArray = procesarDatosConPeriodosConfirmados(analisisPorCategoria);
      setDatosConsumo(faenasArray);

    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      setError(err.message || 'Error al cargar datos de consumo');
      setDatosConsumo([]);
    } finally {
      setLoading(false);
    }
  };

  // Effect para cargar datos
  useEffect(() => {
    if (fechaDesde && fechaHasta && horaDesde && horaHasta) {
      cargarDatosConsumoFaena();
    }
  }, [fechaDesde, fechaHasta, horaDesde, horaHasta, faenaSeleccionada, refreshKey]);

  // Calcular totales (usando la lógica del componente original)
  const totales = useMemo(() => {
    return datosConsumo.reduce((acc, faena) => {
      acc.litros_confirmados += faena.litros_confirmados || 0;
      acc.litros_simulados += faena.litros_simulados || 0;
      acc.litros_totales += faena.consumo_total || 0;
      acc.valor += faena.valor_total || 0;
      acc.maquinas += faena.maquinas_count || 0;
      return acc;
    }, {
      litros_confirmados: 0,
      litros_simulados: 0,
      litros_totales: 0,
      valor: 0,
      maquinas: 0
    });
  }, [datosConsumo]);

  // ESTADOS DE CARGA Y ERROR (con estética del componente original)
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <FiLoader className="animate-spin text-4xl text-orange-500 mb-4" />
            <p className="text-gray-600">Cargando datos de consumo por faena...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center text-center">
            <FiAlertCircle className="text-4xl text-red-500 mb-4" />
            <p className="text-red-600 font-medium mb-2">Error al cargar datos</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (datosConsumo.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center text-center">
            <FiInfo className="text-4xl text-yellow-500 mb-4" />
            <p className="text-gray-700 font-medium mb-2">Sin datos de consumo</p>
            <p className="text-gray-600 text-sm">No se encontraron registros para el período seleccionado</p>
            
            {metadatos?.resumen_ejecutivo && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded text-left">
                <h4 className="font-medium text-orange-800 mb-2">Resumen General:</h4>
                <div className="text-xs text-orange-700">
                  <p>Consumo total: {metadatos.resumen_ejecutivo.consumo_total?.litros || 0}L</p>
                  <p>Máquinas: {metadatos.resumen_ejecutivo.flota_analizada?.maquinas_totales || 0}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* HEADER CON METADATOS (estética del componente original) */}
      <div className="bg-gradient-to-r from-orange-50 to-pink-50 px-6 py-4 text-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiMapPin className="mr-3" size={24} />
            <div>
              <h2 className="text-xl font-bold">Consumo por Faena</h2>
              <p className="text-black-100 text-sm">
                {datosConsumo.length} faena{datosConsumo.length !== 1 ? "s" : ""} con actividad
              </p>
            </div>
          </div>
          
          {metadatos?.resumen_ejecutivo && (
            <div className="text-right text-sm">
              <div className="flex items-center">
                <span className="font-medium">Total:</span>
                <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded">
                  {Math.round(totales.litros_totales).toLocaleString("es-CL")}L
                </span>
              </div>
              <div className="flex items-center mt-1">
                <span className="font-medium">Precisión:</span>
                <span className="ml-2">
                  {metadatos.resumen_ejecutivo?.precision_datos?.porcentaje || 0}% confirmado
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TABLA DE DATOS (estética mejorada del componente original) */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Faena
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consumo Confirmado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consumo Simulado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Litros
              </th>
              
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Máquinas Activas
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {datosConsumo.map((faena, index) => {
              const faenaColors = getFaenaColorsSutil(faena.nombre_faena);
              return (
                <tr
                  key={`faena-${faena.id_faena}-${index}`}
                  className={`${faenaColors.light} ${faenaColors.border} ${faenaColors.hover} transition-all duration-200 group`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{faenaColors.icon}</span>
                        <div>
                          <div className={`text-sm font-medium ${faenaColors.accent}`}>
                            {faena.nombre_faena}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {faena.id_faena}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold" style={{ color: "#9A0000" }}>
                      {Math.round(faena.litros_confirmados).toLocaleString("es-CL")}L
                    </div>
                    <div className="text-xs text-gray-400">confirmado</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-600">
                      {Math.round(faena.litros_simulados).toLocaleString("es-CL")}L
                    </div>
                    <div className="text-xs text-gray-400">simulado</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {Math.round(faena.consumo_total).toLocaleString("es-CL")}L
                    </div>
                    <div className="text-xs text-gray-400">total</div>
                  </td>
                 
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {faena.maquinas_count} máquina{faena.maquinas_count !== 1 ? "s" : ""}
                    </div>
                    <div className="text-xs text-gray-400">
                      {faena.consumos_count} operaciones
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* FILA DE TOTALES (estética del componente original) */}
          {datosConsumo.length > 1 && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="px-6 py-3 font-bold text-gray-900">
                  TOTAL
                </td>
                <td
                  className="px-6 py-3 text-right font-bold"
                  style={{ color: "#9A0000" }}
                >
                  {Math.round(totales.litros_confirmados).toLocaleString("es-CL")}L
                </td>
                <td className="px-6 py-3 text-right font-bold text-gray-600">
                  {Math.round(totales.litros_simulados).toLocaleString("es-CL")}L
                </td>
                <td className="px-6 py-3 text-right font-bold text-gray-900">
                  {Math.round(totales.litros_totales).toLocaleString("es-CL")}L
                </td>
                
                <td className="px-6 py-3 text-right font-bold text-gray-900">
                  {totales.maquinas} total
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default ConsumoPorFaenaTable;