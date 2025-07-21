import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle, FiTruck, FiDroplet, FiBarChart2 } from 'react-icons/fi';
import axios from '../../../lib/axios';
import Header from '../Gerente/Header';
import UniversalHeader from '../Todos/UniversalHeader';
// Importar tu componente de filtros existente
import FiltrosComponent from '../../molecules/FiltrosComponent';

const VerificacionIngresos = () => {
  const [ingresos, setIngresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [faenaSeleccionada, setFaenaSeleccionada] = useState('todas');
  const [faenas, setFaenas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [mostrarResumen, setMostrarResumen] = useState(false);

  // Cargar faenas disponibles
  useEffect(() => {
    cargarFaenas();
  }, []);

  // Cargar ingresos cuando cambien los filtros
  useEffect(() => {
    if (fechaDesde && fechaHasta) {
      cargarIngresos();
      cargarResumen();
    }
  }, [fechaDesde, fechaHasta, faenaSeleccionada]);

  const cargarFaenas = async () => {
    try {
      const response = await axios.get('/api/faenas');
      // Verificar la estructura de la respuesta
      const faenasData = response.data.data || response.data;

      if (Array.isArray(faenasData)) {
        const faenasFormateadas = faenasData.map(faena => ({
          value: faena.id_faena.toString(),
          label: faena.ubicacion || faena.nombre || `Faena ${faena.id_faena}`
        }));
        setFaenas(faenasFormateadas);
      } else {
        console.error('Formato de respuesta inesperado:', response.data);
        setFaenas([]);
      }
    } catch (error) {
      console.error('Error al cargar faenas:', error);
      setFaenas([]); // Establecer array vacío en caso de error
    }
  };

  const cargarIngresos = async () => {
    setLoading(true);
    try {
      const params = {
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        id_faena: faenaSeleccionada
      };

      const response = await axios.get('/api/verificacion-ingresos', { params });
      const ingresosData = response.data.data || response.data || [];
      setIngresos(Array.isArray(ingresosData) ? ingresosData : []);
    } catch (error) {
      console.error('Error al cargar ingresos:', error);
      setIngresos([]); // Establecer array vacío en caso de error
      if (error.response?.status === 404) {
        console.log('La ruta de verificación de ingresos no existe aún');
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarResumen = async () => {
    try {
      const params = {
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        id_faena: faenaSeleccionada
      };

      const response = await axios.get('/api/verificacion-ingresos/resumen', { params });
      setResumen(response.data.data || response.data || null);
    } catch (error) {
      console.error('Error al cargar resumen:', error);
      setResumen(null);
    }
  };

  const getErrorClass = (error) => {
    if (Math.abs(error) < 0.01) return 'text-green-600';
    if (Math.abs(error) <= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getErrorIcon = (error) => {
    if (Math.abs(error) < 0.01) return <FiCheckCircle className="inline mr-1" />;
    return <FiAlertCircle className="inline mr-1" />;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  return (

    <div className="min-h-screen bg-gray-50">

      <UniversalHeader type="gerente" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Verificación de Ingresos de Petróleo
          </h1>
          <p className="text-gray-600">
            Visualización de errores iniciales y finales en los ingresos de combustible
          </p>
        </div>

        {/* Botón para mostrar/ocultar resumen */}
        {resumen && (
          <div className="mb-4">
            <button
              onClick={() => setMostrarResumen(!mostrarResumen)}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <FiBarChart2 className="mr-2" />
              {mostrarResumen ? 'Ocultar' : 'Mostrar'} Resumen del Período
            </button>
          </div>
        )}

        {/* Panel de Resumen */}
        {mostrarResumen && resumen && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen del Período</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Ingresos</p>
                <p className="text-2xl font-bold text-gray-800">{resumen.total_ingresos}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Litros Documentados</p>
                <p className="text-2xl font-bold text-gray-800">{formatNumber(resumen.total_litros_documentados)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Litros Recibidos</p>
                <p className="text-2xl font-bold text-gray-800">{formatNumber(resumen.total_litros_recibidos)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Error Final Acumulado</p>
                <p className={`text-2xl font-bold ${getErrorClass(resumen.error_final_acumulado)}`}>
                  {formatNumber(resumen.error_final_acumulado)} L
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Filtros */}
        <FiltrosComponent
          fechaDesde={fechaDesde}
          setFechaDesde={setFechaDesde}
          fechaHasta={fechaHasta}
          setFechaHasta={setFechaHasta}
          faenaSeleccionada={faenaSeleccionada}
          setFaenaSeleccionada={setFaenaSeleccionada}
          faenas={faenas}
        />

        {/* Listado de Ingresos */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {!ingresos || ingresos.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-500">
                No se encontraron ingresos para los filtros seleccionados
              </div>
            ) : (
              ingresos.map((ingreso) => (
                <div key={ingreso.id_ingreso} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                  {/* Cabecera del ingreso */}
                  <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <div className="flex flex-wrap justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <FiTruck className="text-blue-500 text-xl" />
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            Guía N° {ingreso.numero_guia}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {ingreso.fecha_ingreso} {ingreso.hora_ingreso} • {ingreso.faena} • {ingreso.usuario}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 mt-2 sm:mt-0">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Litros Documentados</p>
                          <p className="font-semibold text-gray-800">{formatNumber(ingreso.litros_documentados)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Litros Recibidos</p>
                          <p className="font-semibold text-gray-800">{formatNumber(ingreso.litros_recibidos)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Estado</p>
                          <p className={`font-semibold ${ingreso.recibo_conforme ? 'text-green-600' : 'text-red-600'}`}>
                            {ingreso.recibo_conforme ? 'Conforme' : 'Con Observaciones'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resumen de Errores */}
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Error Inicial Total</h4>
                        <p className={`text-2xl font-bold ${getErrorClass(ingreso.error_inicial_total)}`}>
                          {getErrorIcon(ingreso.error_inicial_total)}
                          {ingreso.error_inicial_total > 0 ? '+' : ''}{formatNumber(ingreso.error_inicial_total)} L
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Diferencia entre stock sistema y medición inicial
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Error Final</h4>
                        <p className={`text-2xl font-bold ${getErrorClass(ingreso.error_final)}`}>
                          {getErrorIcon(ingreso.error_final)}
                          {ingreso.error_final > 0 ? '+' : ''}{formatNumber(ingreso.error_final)} L
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Diferencia entre litros recibidos y documentados
                        </p>
                      </div>
                    </div>

                    {/* Observaciones si las hay */}
                    {ingreso.observacion && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Observación:</strong> {ingreso.observacion}
                        </p>
                      </div>
                    )}

                    {/* Detalle por Estanque */}
                    {ingreso.errores_por_estanque.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <FiDroplet className="mr-2 text-blue-500" />
                          Detalle por Estanque
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Estanque
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Stock Sistema
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Medición Inicial
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Error Inicial
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Medición Final
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Litros Agregados
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Altura (cm)
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {ingreso.errores_por_estanque.map((estanque, index) => (
                                <tr key={`${estanque.id_estanque}-${index}`}>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {estanque.nombre_estanque}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                    {formatNumber(estanque.stock_sistema)} L
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                    {formatNumber(estanque.stock_medicion_inicial)} L
                                  </td>
                                  <td className={`px-4 py-3 text-sm font-medium text-center ${getErrorClass(estanque.error_inicial)}`}>
                                    {estanque.error_inicial > 0 ? '+' : ''}{formatNumber(estanque.error_inicial)} L
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                    {formatNumber(estanque.stock_medicion_final)} L
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                    {formatNumber(estanque.litros_agregados)} L
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                    {estanque.altura_inicial} → {estanque.altura_final}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificacionIngresos;