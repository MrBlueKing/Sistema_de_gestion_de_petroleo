import React, { useState, useEffect, useMemo } from "react";
import axios from '../../lib/axios';
import { FiLoader, FiAlertCircle, FiInfo, FiTrendingUp } from "react-icons/fi";

const IngresosPorFaenaTable = ({ 
  fechaDesde, 
  fechaHasta, 
  faenaSeleccionada,
  refreshKey 
}) => {
  const [datosIngresos, setDatosIngresos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar datos de ingresos por faena
  const cargarDatosIngresosFaena = async () => {
    try {
      setLoading(true);
      setError(null);

      // Llamar al endpoint de ingresos de petróleo
      const response = await axios.get('/api/ingresos-petroleo', {
        params: {
          fecha_inicio: fechaDesde,
          fecha_fin: fechaHasta + ' 23:59:59',
          faena: faenaSeleccionada !== 'todas' ? faenaSeleccionada : null
        }
      });

      if (!response.data?.success) {
        throw new Error('Error en respuesta del endpoint de ingresos');
      }

      // Procesar datos por faena
      const faenasMap = new Map();
      const ingresos = response.data.data || [];
      
      ingresos.forEach(ingreso => {
        const faenaNombre = ingreso.faena?.ubicacion || ingreso.nombre_faena || 'Sin Faena';
        const faenaId = ingreso.faena?.id_faena || ingreso.id_faena || 0;
        
        if (!faenasMap.has(faenaNombre)) {
          faenasMap.set(faenaNombre, {
            id_faena: faenaId,
            nombre_faena: faenaNombre,
            litros_documentados: 0,
            litros_recibidos: 0,
            valor_total: 0,
            total_ingresos: 0,
            suma_precio_litros: 0,
            diferencia_total: 0
          });
        }
        
        const faenaData = faenasMap.get(faenaNombre);
        
        // Acumular datos
        faenaData.litros_documentados += parseFloat(ingreso.litros_documentados || 0);
        faenaData.litros_recibidos += parseFloat(ingreso.litros_recibidos || 0);
        faenaData.valor_total += parseFloat(ingreso.precio_total || 0);
        faenaData.total_ingresos += 1;
        faenaData.diferencia_total += parseFloat(ingreso.diferencia || 0);
        
        // Para precio promedio ponderado
        if (ingreso.precio && ingreso.litros_recibidos) {
          faenaData.suma_precio_litros += (parseFloat(ingreso.precio) * parseFloat(ingreso.litros_recibidos));
        }
      });

      // Convertir Map a Array y calcular promedios
      const faenasArray = Array.from(faenasMap.values()).map(faena => ({
        ...faena,
        precio_promedio: faena.litros_recibidos > 0 
          ? Math.round(faena.suma_precio_litros / faena.litros_recibidos)
          : 0,
        porcentaje_diferencia: faena.litros_documentados > 0
          ? ((faena.diferencia_total / faena.litros_documentados) * 100).toFixed(1)
          : 0,
        // Remover campo auxiliar
        suma_precio_litros: undefined
      }));

      // Ordenar por litros recibidos descendente
      faenasArray.sort((a, b) => b.litros_recibidos - a.litros_recibidos);

      setDatosIngresos(faenasArray);

    } catch (err) {
      console.error('Error al cargar datos de ingresos por faena:', err);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar datos si hay faena seleccionada
  const datosFiltrados = useMemo(() => {
    if (!faenaSeleccionada || faenaSeleccionada === 'todas') {
      return datosIngresos;
    }
    return datosIngresos.filter(faena => 
      faena.id_faena === parseInt(faenaSeleccionada)
    );
  }, [datosIngresos, faenaSeleccionada]);

  // Effect para cargar datos
  useEffect(() => {
    if (fechaDesde && fechaHasta) {
      cargarDatosIngresosFaena();
    }
  }, [fechaDesde, fechaHasta, refreshKey]);

  // Estados de carga y error
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <FiLoader className="animate-spin h-6 w-6 mr-2" style={{color: '#F67029'}} />
          <span className="text-gray-600">Cargando ingresos por faena...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border-l-4" style={{borderColor: '#AB201A'}}>
        <div className="flex items-center" style={{color: '#AB201A'}}>
          <FiAlertCircle className="h-4 w-4 mr-2" />
          <div>
            <h4 className="font-medium text-sm">Error al cargar datos</h4>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!datosFiltrados || datosFiltrados.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-md font-medium text-gray-800 mb-4 flex items-center">
          <FiTrendingUp className="h-4 w-4 mr-2" style={{color: '#F67029'}} />
          Ingresos por Faena
        </h3>
        <div className="text-center text-gray-500 py-4">
          <FiInfo className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  // Calcular totales
  const totales = datosFiltrados.reduce((acc, faena) => ({
    litros_documentados: acc.litros_documentados + faena.litros_documentados,
    litros_recibidos: acc.litros_recibidos + faena.litros_recibidos,
    valor: acc.valor + faena.valor_total,
    ingresos: acc.ingresos + faena.total_ingresos,
    diferencia: acc.diferencia + faena.diferencia_total
  }), { litros_documentados: 0, litros_recibidos: 0, valor: 0, ingresos: 0, diferencia: 0 });

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b" style={{background: 'linear-gradient(135deg, #FFF5F2 0%, #FEF2F2 100%)'}}>
        <h3 className="text-md font-medium text-gray-800 flex items-center justify-between">
          <div className="flex items-center">
            <FiTrendingUp className="h-4 w-4 mr-2" style={{color: '#F67029'}} />
            Ingresos por Faena
          </div>
          <div className="text-xs text-gray-600">
            {datosFiltrados.length} faena{datosFiltrados.length !== 1 ? 's' : ''} • {totales.ingresos} ingresos
          </div>
        </h3>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Faena
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Litros Recibidos
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio Prom.
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Diferencia
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ingresos
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {datosFiltrados.map((faena, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="font-medium text-gray-900">
                      {faena.nombre_faena}
                    </div>
                    <div className="text-xs text-gray-500">
                      {faena.litros_documentados > 0 && (
                        <span>
                          {Math.round(faena.litros_documentados).toLocaleString('es-CL')}L documentados
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-bold text-gray-900">
                    {Math.round(faena.litros_recibidos).toLocaleString("es-CL")}L
                  </div>
                  <div className="text-xs text-gray-500">
                    {totales.litros_recibidos > 0 ? 
                      ((faena.litros_recibidos / totales.litros_recibidos) * 100).toFixed(1) + '%' 
                      : '0%'
                    }
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-bold" style={{color: '#AB201A'}}>
                    ${Math.round(faena.valor_total).toLocaleString("es-CL")}
                  </div>
                  <div className="text-xs text-gray-500">
                    {faena.litros_recibidos > 0 ? 
                      `$${Math.round(faena.valor_total / faena.litros_recibidos)}/L efectivo`
                      : 'N/A'
                    }
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium" style={{color: '#F67029'}}>
                    ${faena.precio_promedio.toLocaleString("es-CL")}
                  </div>
                  <div className="text-xs text-gray-500">ponderado</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm font-medium ${faena.diferencia_total === 0 ? 'text-gray-500' : faena.diferencia_total > 0 ? '' : ''}`}
                       style={faena.diferencia_total === 0 ? {} : faena.diferencia_total > 0 ? {color: '#9A0000'} : {color: '#AB201A'}}>
                    {faena.diferencia_total > 0 ? '+' : ''}{Math.round(faena.diferencia_total).toLocaleString("es-CL")}L
                  </div>
                  <div className="text-xs text-gray-500">
                    {faena.porcentaje_diferencia !== '0.0' ? `${faena.porcentaje_diferencia}%` : 'Sin diferencia'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {faena.total_ingresos}
                  </div>
                  <div className="text-xs text-gray-500">entregas</div>
                </td>
              </tr>
            ))}
          </tbody>
          
          {/* Fila de totales */}
          {datosFiltrados.length > 1 && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="px-6 py-3 font-bold text-gray-900">
                  TOTAL ({datosFiltrados.length} faenas)
                </td>
                <td className="px-6 py-3 text-right font-bold text-gray-900">
                  {Math.round(totales.litros_recibidos).toLocaleString("es-CL")}L
                </td>
                <td className="px-6 py-3 text-right font-bold" style={{color: '#AB201A'}}>
                  ${Math.round(totales.valor).toLocaleString("es-CL")}
                </td>
                <td className="px-6 py-3 text-right font-bold" style={{color: '#F67029'}}>
                  ${totales.litros_recibidos > 0 ? Math.round(totales.valor / totales.litros_recibidos).toLocaleString("es-CL") : 0}
                </td>
                <td className="px-6 py-3 text-right font-bold">
                  <span style={{color: totales.diferencia === 0 ? '#6B7280' : totales.diferencia > 0 ? '#9A0000' : '#AB201A'}}>
                    {totales.diferencia > 0 ? '+' : ''}{Math.round(totales.diferencia).toLocaleString("es-CL")}L
                  </span>
                </td>
                <td className="px-6 py-3 text-right font-bold text-gray-900">
                  {totales.ingresos}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 border-t">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>🎯 Fuente: Endpoint ingresos-petroleo</span>
          <span>📊 Agregación por faena con diferencias documentadas vs recibidas</span>
        </div>
      </div>
    </div>
  );
};

export default IngresosPorFaenaTable;