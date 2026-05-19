import React, { useState, useEffect } from 'react';
import produccionService from '../../../services/produccionService';
import UniversalHeader from '../Todos/UniversalHeader';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from 'recharts';
import {
  FiCalendar,
  FiRefreshCw,
  FiTruck,
  FiBox,
  FiLayers,
  FiPackage,
  FiTrendingUp,
  FiBarChart2,
  FiAlertCircle,
  FiCheckCircle,
  FiClock
} from 'react-icons/fi';
import { FaIndustry, FaMountain } from 'react-icons/fa';

const COLORS = {
  emerald: '#059669',
  emeraldLight: '#34d399',
  blue: '#2563eb',
  blueLight: '#60a5fa',
  purple: '#7c3aed',
  purpleLight: '#a78bfa',
  amber: '#d97706',
  amberLight: '#fbbf24',
  red: '#dc2626',
  orange: '#ea580c',
  green: '#16a34a',
  gray: '#6b7280',
};

const PIE_COLORS = ['#059669', '#d97706', '#6b7280', '#dc2626'];

const TablaDetalle = ({ titulo, loading, error, datos, columnas }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Cargando {titulo.toLowerCase()}...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }
  if (!datos) return null;
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{titulo} <span className="text-gray-400 font-normal text-sm">({datos.length} registros)</span></h3>
      </div>
      {datos.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">Sin registros</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {columnas.map((col, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {datos.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {columnas.map((col, j) => (
                    <td key={j} className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const TABS = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'dumpadas', label: 'Dumpadas' },
  { key: 'mezclas', label: 'Mezclas' },
  { key: 'lotes', label: 'Lotes' },
  { key: 'camionadas', label: 'Camionadas' },
];

const GestionProduccion = () => {
  const [tab, setTab] = useState('resumen');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [datos, setDatos] = useState(null);

  // Estado para tabs de detalle
  const [tabData, setTabData] = useState({});
  const [tabLoading, setTabLoading] = useState({});
  const [tabError, setTabError] = useState({});

  // Filtros
  const [fechaInicio, setFechaInicio] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (tab !== 'resumen' && !tabData[tab]) {
      cargarTabData(tab);
    }
  }, [tab]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await produccionService.getResumenGerencial({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });

      if (response.success) {
        setDatos(response.data);
      } else {
        setError(response.message || 'Error al cargar datos');
      }
    } catch (err) {
      console.error('Error cargando datos de producción:', err);
      setError('Error de conexión con el sistema de producción. Verifique que el servidor esté activo en el puerto 8002.');
    } finally {
      setLoading(false);
    }
  };

  const cargarTabData = async (tabKey) => {
    setTabLoading((prev) => ({ ...prev, [tabKey]: true }));
    setTabError((prev) => ({ ...prev, [tabKey]: null }));
    try {
      let response;
      if (tabKey === 'dumpadas') response = await produccionService.getDumpadas({ per_page: 50 });
      else if (tabKey === 'mezclas') response = await produccionService.getMezclas({ per_page: 50 });
      else if (tabKey === 'lotes') response = await produccionService.getLotes({ per_page: 50 });
      else if (tabKey === 'camionadas') response = await produccionService.getCamionadas({ per_page: 50 });

      const items = response?.data?.data ?? response?.data ?? response ?? [];
      setTabData((prev) => ({ ...prev, [tabKey]: Array.isArray(items) ? items : [] }));
    } catch (err) {
      console.error(`Error cargando ${tabKey}:`, err);
      setTabError((prev) => ({ ...prev, [tabKey]: `Error al cargar ${tabKey}` }));
    } finally {
      setTabLoading((prev) => ({ ...prev, [tabKey]: false }));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (tab === 'resumen') {
      await cargarDatos();
    } else {
      await cargarTabData(tab);
    }
    setRefreshing(false);
  };

  const handleAplicarFiltros = () => {
    cargarDatos();
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatInteger = (num) => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('es-CL').format(num);
  };

  // Preparar datos para gráficos
  const produccionDiariaData = (datos?.produccion_diaria || [])
    .slice()
    .reverse()
    .map((dia) => ({
      ...dia,
      fecha: dia.fecha?.substring(5) || dia.fecha, // MM-DD
      tonelaje: Number(dia.tonelaje) || 0,
      cantidad: Number(dia.cantidad) || 0,
      ley_promedio: Number(dia.ley_promedio) || 0,
    }));

  const topFrentesData = (datos?.top_frentes || []).map((f) => ({
    ...f,
    tonelaje: Number(f.tonelaje) || 0,
    cantidad: Number(f.cantidad) || 0,
    ley_promedio: Number(f.ley_promedio) || 0,
    nombre: f.nombre?.length > 18 ? f.nombre.substring(0, 18) + '…' : f.nombre,
  }));

  const estadosDumpadasData = datos
    ? [
        { name: 'Completadas', value: Number(datos.dumpadas?.completadas) || 0 },
        { name: 'Pendientes', value: Number(datos.dumpadas?.pendientes) || 0 },
      ].filter((d) => d.value > 0)
    : [];

  const estadosMezclasData = datos
    ? [
        { name: 'Activas', value: Number(datos.mezclas?.activas) || 0 },
        { name: 'Completadas', value: Number(datos.mezclas?.completadas) || 0 },
      ].filter((d) => d.value > 0)
    : [];

  const estadosLotesData = datos
    ? [
        { name: 'Abiertos', value: Number(datos.lotes?.abiertos) || 0 },
        { name: 'Cerrados', value: Number(datos.lotes?.cerrados) || 0 },
      ].filter((d) => d.value > 0)
    : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-800 mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }}>
            {entry.name}: {formatNumber(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50">
        <UniversalHeader type="gerente" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos de producción...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <UniversalHeader type="gerente" />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 mt-12">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <FaIndustry className="text-emerald-600" />
                Dashboard de Producción
              </h1>
              <p className="text-gray-600 mt-1">
                Datos del Sistema de Producción Minera
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>

          {/* Filtros (solo en resumen) */}
          {tab === 'resumen' && (
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <button
                onClick={handleAplicarFiltros}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
              >
                Aplicar Filtros
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  tab === t.key
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error resumen */}
        {tab === 'resumen' && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {tab === 'resumen' && datos && (
          <>
            {/* KPIs principales */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Dumpadas */}
              <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <FaMountain className="w-5 h-5" />
                  <span className="text-sm font-medium">Dumpadas</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatInteger(datos.dumpadas?.total)}</p>
                <p className="text-sm text-gray-500">{formatNumber(datos.dumpadas?.tonelaje_total)} t</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-green-600">
                    <FiCheckCircle className="w-3 h-3" />
                    {datos.dumpadas?.completadas} completadas
                  </span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <FiClock className="w-3 h-3" />
                    {datos.dumpadas?.pendientes} pendientes
                  </span>
                </div>
              </div>

              {/* Mezclas */}
              <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <FiLayers className="w-5 h-5" />
                  <span className="text-sm font-medium">Mezclas</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatInteger(datos.mezclas?.total)}</p>
                <p className="text-sm text-gray-500">{formatNumber(datos.mezclas?.tonelaje_total)} t</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-orange-600">
                    <FiClock className="w-3 h-3" />
                    {datos.mezclas?.activas} activas
                  </span>
                  <span className="flex items-center gap-1 text-green-600">
                    <FiCheckCircle className="w-3 h-3" />
                    {datos.mezclas?.completadas} completadas
                  </span>
                </div>
              </div>

              {/* Lotes */}
              <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <FiPackage className="w-5 h-5" />
                  <span className="text-sm font-medium">Lotes</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatInteger(datos.lotes?.total)}</p>
                <p className="text-sm text-gray-500">{formatNumber(datos.lotes?.tonelaje_total)} t</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-purple-600">
                    <FiBox className="w-3 h-3" />
                    {datos.lotes?.abiertos} abiertos
                  </span>
                  <span className="flex items-center gap-1 text-green-600">
                    <FiCheckCircle className="w-3 h-3" />
                    {datos.lotes?.cerrados} cerrados
                  </span>
                </div>
              </div>

              {/* Despachos */}
              <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <FiTruck className="w-5 h-5" />
                  <span className="text-sm font-medium">Despachos</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatInteger(datos.despachos?.total)}</p>
                <p className="text-sm text-gray-500">{formatNumber(datos.despachos?.tonelaje_despachado)} t</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-amber-600">
                    <FiTruck className="w-3 h-3" />
                    {datos.despachos?.despachadas} despachadas
                  </span>
                  <span className="flex items-center gap-1 text-green-600">
                    <FiCheckCircle className="w-3 h-3" />
                    {datos.despachos?.recibidas} recibidas
                  </span>
                </div>
              </div>
            </div>

            {/* Ley promedio + Estado conexión */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 p-6">
                <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                  <FiTrendingUp />
                  Ley Promedio del Período
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-700">{formatNumber(datos.dumpadas?.ley_promedio)}%</p>
                    <p className="text-sm text-emerald-600">Cu Total (Dumpadas)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-700">{formatNumber(datos.mezclas?.ley_promedio)}%</p>
                    <p className="text-sm text-blue-600">Cu Estimada (Mezclas)</p>
                  </div>
                </div>
              </div>

              {/* Estado de módulos */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiBarChart2 />
                  Resumen Estados
                </h3>
                <div className="space-y-3">
                  {estadosDumpadasData.length > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Dumpadas completadas</span>
                        <span>{datos.dumpadas?.total > 0 ? Math.round((datos.dumpadas.completadas / datos.dumpadas.total) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${datos.dumpadas?.total > 0 ? (datos.dumpadas.completadas / datos.dumpadas.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {estadosMezclasData.length > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Mezclas completadas</span>
                        <span>{datos.mezclas?.total > 0 ? Math.round((datos.mezclas.completadas / datos.mezclas.total) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${datos.mezclas?.total > 0 ? (datos.mezclas.completadas / datos.mezclas.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {estadosLotesData.length > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Lotes cerrados</span>
                        <span>{datos.lotes?.total > 0 ? Math.round((datos.lotes.cerrados / datos.lotes.total) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${datos.lotes?.total > 0 ? (datos.lotes.cerrados / datos.lotes.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t text-sm">
                    <span className="text-gray-600">Conexión Producción:</span>
                    <span className="font-medium text-green-600 flex items-center gap-1">
                      <FiCheckCircle className="w-4 h-4" />
                      Activo
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico: Producción diaria - Tonelaje */}
            {produccionDiariaData.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-emerald-50 px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FiBarChart2 className="text-emerald-600" />
                    Producción Diaria - Tonelaje
                  </h3>
                </div>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={produccionDiariaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="tonelaje" name="Tonelaje (t)" fill={COLORS.emerald} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cantidad" name="Cantidad" fill={COLORS.blueLight} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Gráfico: Ley promedio diaria */}
            {produccionDiariaData.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-teal-50 px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FiTrendingUp className="text-teal-600" />
                    Ley Cu Promedio Diaria (%)
                  </h3>
                </div>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={produccionDiariaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorLey" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="ley_promedio"
                        name="Ley Cu (%)"
                        stroke={COLORS.emerald}
                        strokeWidth={2}
                        fill="url(#colorLey)"
                        dot={{ r: 4, fill: COLORS.emerald }}
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Gráfico: Top Frentes + Distribución estados */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Frentes */}
              {topFrentesData.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="bg-blue-50 px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <FaMountain className="text-blue-600" />
                      Top Frentes por Tonelaje
                    </h3>
                  </div>
                  <div className="p-4">
                    <ResponsiveContainer width="100%" height={Math.max(280, topFrentesData.length * 45)}>
                      <BarChart data={topFrentesData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="nombre" type="category" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="tonelaje" name="Tonelaje (t)" fill={COLORS.blue} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Distribución de estados */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-purple-50 px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FiLayers className="text-purple-600" />
                    Distribución por Estados
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Pie Dumpadas */}
                    {estadosDumpadasData.length > 0 && (
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700 mb-2">Dumpadas</p>
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie
                              data={estadosDumpadasData}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={60}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {estadosDumpadasData.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-3 text-xs mt-1">
                          {estadosDumpadasData.map((d, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                              {d.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pie Mezclas */}
                    {estadosMezclasData.length > 0 && (
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700 mb-2">Mezclas</p>
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie
                              data={estadosMezclasData}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={60}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {estadosMezclasData.map((_, i) => (
                                <Cell key={i} fill={[COLORS.orange, COLORS.green][i]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-3 text-xs mt-1">
                          {estadosMezclasData.map((d, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: [COLORS.orange, COLORS.green][i] }} />
                              {d.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pie Lotes */}
                    {estadosLotesData.length > 0 && (
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700 mb-2">Lotes</p>
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie
                              data={estadosLotesData}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={60}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {estadosLotesData.map((_, i) => (
                                <Cell key={i} fill={[COLORS.purple, COLORS.green][i]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-3 text-xs mt-1">
                          {estadosLotesData.map((d, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: [COLORS.purple, COLORS.green][i] }} />
                              {d.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla: Producción diaria (detalle) */}
            {produccionDiariaData.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-emerald-50 px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FiBarChart2 />
                    Detalle Producción Últimos 7 Días
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tonelaje</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ley Promedio</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {produccionDiariaData.map((dia, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {dia.fecha}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                            {formatInteger(dia.cantidad)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                            {formatNumber(dia.tonelaje)} t
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                            {formatNumber(dia.ley_promedio)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tabla: Top frentes (detalle) */}
            {topFrentesData.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-blue-50 px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FaMountain />
                    Detalle Top Frentes de Trabajo
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frente</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Dumpadas</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tonelaje</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ley Promedio</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {topFrentesData.map((frente, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {frente.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                            {formatInteger(frente.cantidad)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                            {formatNumber(frente.tonelaje)} t
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                            {formatNumber(frente.ley_promedio)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Vista Dumpadas */}
        {tab === 'dumpadas' && (
          <TablaDetalle
            titulo="Dumpadas"
            loading={tabLoading.dumpadas}
            error={tabError.dumpadas}
            datos={tabData.dumpadas}
            columnas={[
              { label: 'ID', render: (r) => r.id },
              { label: 'Frente', render: (r) => r.frenteTrabajo?.nombre ?? r.id_frente_trabajo ?? '-' },
              { label: 'Fecha', render: (r) => r.fecha ?? '-' },
              { label: 'Tonelaje', render: (r) => r.ton ?? '-' },
              { label: 'Ley (%)', render: (r) => r.ley ?? '-' },
              { label: 'Estado', render: (r) => r.estado ?? '-' },
              { label: 'Jornada', render: (r) => r.jornada ?? '-' },
            ]}
          />
        )}

        {/* Vista Mezclas */}
        {tab === 'mezclas' && (
          <TablaDetalle
            titulo="Mezclas"
            loading={tabLoading.mezclas}
            error={tabError.mezclas}
            datos={tabData.mezclas}
            columnas={[
              { label: 'Código', render: (r) => r.codigo ?? r.id },
              { label: 'Fecha', render: (r) => r.fecha ?? '-' },
              { label: 'Planta', render: (r) => r.planta?.nombre ?? '-' },
              { label: 'Total ton', render: (r) => r.total_ton ?? '-' },
              { label: 'Ton disponibles', render: (r) => r.toneladas_disponibles ?? '-' },
              { label: 'Ley dump (%)', render: (r) => r.ley_prom_dump ?? '-' },
              { label: 'Estado', render: (r) => r.estado ?? '-' },
            ]}
          />
        )}

        {/* Vista Lotes */}
        {tab === 'lotes' && (
          <TablaDetalle
            titulo="Lotes"
            loading={tabLoading.lotes}
            error={tabError.lotes}
            datos={tabData.lotes}
            columnas={[
              { label: 'N° Lote', render: (r) => r.numero_lote ?? r.id },
              { label: 'Planta', render: (r) => r.planta_nombre ?? r.planta?.nombre ?? '-' },
              { label: 'Empresa', render: (r) => r.empresa_nombre ?? r.empresa?.nombre ?? '-' },
              { label: 'Fecha creación', render: (r) => r.fecha_creacion ?? '-' },
              { label: 'Peso total (t)', render: (r) => r.peso_total ?? '-' },
              { label: 'Camionadas', render: (r) => r.numero_camionadas ?? '-' },
              { label: 'Estado', render: (r) => r.estado ?? '-' },
            ]}
          />
        )}

        {/* Vista Camionadas */}
        {tab === 'camionadas' && (
          <TablaDetalle
            titulo="Camionadas"
            loading={tabLoading.camionadas}
            error={tabError.camionadas}
            datos={tabData.camionadas}
            columnas={[
              { label: 'N° Camionada', render: (r) => r.numero_camionada ?? r.id },
              { label: 'Patente', render: (r) => r.patente ?? '-' },
              { label: 'Fecha despacho', render: (r) => r.fecha_despacho ?? '-' },
              { label: 'Lote', render: (r) => r.lote?.numero_lote ?? r.lote_id ?? '-' },
              { label: 'Peso (t)', render: (r) => r.peso ?? '-' },
              { label: 'Peso real (t)', render: (r) => r.peso_real ?? '-' },
              { label: 'Estado', render: (r) => r.estado ?? '-' },
            ]}
          />
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 py-4">
          <p>&copy; {new Date().getFullYear()} Minera 3H - Sistema de Gestión Integral</p>
          <p className="mt-1">Datos obtenidos del Sistema de Producción (Puerto 8002)</p>
        </footer>
      </div>
    </div>
  );
};

export default GestionProduccion;
