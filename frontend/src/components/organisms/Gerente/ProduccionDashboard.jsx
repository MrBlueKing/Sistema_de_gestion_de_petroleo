import React, { useState, useEffect } from 'react';
import produccionService from '../../../services/produccionService';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from 'recharts';
import {
  FiTruck, FiBox, FiLayers, FiPackage, FiTrendingUp,
  FiBarChart2, FiAlertCircle, FiCheckCircle, FiClock, FiRefreshCw
} from 'react-icons/fi';
import { FaIndustry, FaMountain } from 'react-icons/fa';

const CHART_COLORS = {
  emerald: '#059669',
  emeraldLight: '#34d399',
  blue: '#2563eb',
  blueLight: '#60a5fa',
  purple: '#7c3aed',
  amber: '#d97706',
  orange: '#ea580c',
  green: '#16a34a',
  gray: '#6b7280',
  red: '#dc2626',
};

const PIE_COLORS = ['#059669', '#d97706', '#6b7280', '#dc2626'];

// Helpers de formato
const formatNumber = (num) => {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};
const formatInteger = (num) => {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('es-CL').format(num);
};

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

// Hook para cargar datos de producción
const useProduccionData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [datos, setDatos] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0]);

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

  useEffect(() => { cargarDatos(); }, []);

  return { loading, error, datos, fechaInicio, setFechaInicio, fechaFin, setFechaFin, cargarDatos };
};

// Preparar datos para gráficos
const usePreparedData = (datos) => {
  const produccionDiaria = (datos?.produccion_diaria || []).slice().reverse().map((dia) => ({
    ...dia,
    fecha: dia.fecha?.substring(5) || dia.fecha,
    tonelaje: Number(dia.tonelaje) || 0,
    cantidad: Number(dia.cantidad) || 0,
    ley_promedio: Number(dia.ley_promedio) || 0,
  }));

  const topFrentes = (datos?.top_frentes || []).map((f) => ({
    ...f,
    tonelaje: Number(f.tonelaje) || 0,
    cantidad: Number(f.cantidad) || 0,
    ley_promedio: Number(f.ley_promedio) || 0,
    nombre: f.nombre?.length > 18 ? f.nombre.substring(0, 18) + '...' : f.nombre,
  }));

  const estadosDumpadas = datos
    ? [
        { name: 'Completadas', value: Number(datos.dumpadas?.completadas) || 0 },
        { name: 'Pendientes', value: Number(datos.dumpadas?.pendientes) || 0 },
      ].filter((d) => d.value > 0)
    : [];

  const estadosMezclas = datos
    ? [
        { name: 'Activas', value: Number(datos.mezclas?.activas) || 0 },
        { name: 'Completadas', value: Number(datos.mezclas?.completadas) || 0 },
      ].filter((d) => d.value > 0)
    : [];

  const estadosLotes = datos
    ? [
        { name: 'Abiertos', value: Number(datos.lotes?.abiertos) || 0 },
        { name: 'Cerrados', value: Number(datos.lotes?.cerrados) || 0 },
      ].filter((d) => d.value > 0)
    : [];

  return { produccionDiaria, topFrentes, estadosDumpadas, estadosMezclas, estadosLotes };
};

// =============================================
// Componente: Filtros de Producción
// =============================================
const FiltrosProduccion = ({ fechaInicio, setFechaInicio, fechaFin, setFechaFin, onAplicar, onRefresh, loading }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
    <div className="flex flex-wrap items-end gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
        />
      </div>
      <button
        onClick={onAplicar}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300 text-sm"
      >
        Aplicar
      </button>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm"
      >
        <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Cargando...' : 'Actualizar'}
      </button>
    </div>
  </div>
);

// =============================================
// Componente: Loading de Producción
// =============================================
const ProduccionLoading = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3"></div>
      <p className="text-gray-600 text-sm">Cargando datos de producción...</p>
    </div>
  </div>
);

// =============================================
// Componente: Error de Producción
// =============================================
const ProduccionError = ({ error }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
    <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
    <div>
      <p className="text-red-700 font-medium">Error</p>
      <p className="text-red-600 text-sm">{error}</p>
    </div>
  </div>
);

// =============================================
// PESTAÑA 1: Producción KPIs
// =============================================
export const ProduccionKPIs = () => {
  const { loading, error, datos, fechaInicio, setFechaInicio, fechaFin, setFechaFin, cargarDatos } = useProduccionData();
  const { estadosDumpadas, estadosMezclas, estadosLotes } = usePreparedData(datos);

  return (
    <div className="mt-6 space-y-6">
      <FiltrosProduccion
        fechaInicio={fechaInicio} setFechaInicio={setFechaInicio}
        fechaFin={fechaFin} setFechaFin={setFechaFin}
        onAplicar={cargarDatos} onRefresh={cargarDatos} loading={loading}
      />

      {loading && <ProduccionLoading />}
      {error && <ProduccionError error={error} />}

      {!loading && datos && (
        <>
          {/* KPIs principales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <FaMountain className="w-5 h-5" />
                <span className="text-sm font-medium">Dumpadas</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatInteger(datos.dumpadas?.total)}</p>
              <p className="text-sm text-gray-500">{formatNumber(datos.dumpadas?.tonelaje_total)} t</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-green-600">
                  <FiCheckCircle className="w-3 h-3" /> {datos.dumpadas?.completadas} completadas
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <FiClock className="w-3 h-3" /> {datos.dumpadas?.pendientes} pendientes
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <FiLayers className="w-5 h-5" />
                <span className="text-sm font-medium">Mezclas</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatInteger(datos.mezclas?.total)}</p>
              <p className="text-sm text-gray-500">{formatNumber(datos.mezclas?.tonelaje_total)} t</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-orange-600">
                  <FiClock className="w-3 h-3" /> {datos.mezclas?.activas} activas
                </span>
                <span className="flex items-center gap-1 text-green-600">
                  <FiCheckCircle className="w-3 h-3" /> {datos.mezclas?.completadas} completadas
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <FiPackage className="w-5 h-5" />
                <span className="text-sm font-medium">Lotes</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatInteger(datos.lotes?.total)}</p>
              <p className="text-sm text-gray-500">{formatNumber(datos.lotes?.tonelaje_total)} t</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-purple-600">
                  <FiBox className="w-3 h-3" /> {datos.lotes?.abiertos} abiertos
                </span>
                <span className="flex items-center gap-1 text-green-600">
                  <FiCheckCircle className="w-3 h-3" /> {datos.lotes?.cerrados} cerrados
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <FiTruck className="w-5 h-5" />
                <span className="text-sm font-medium">Despachos</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatInteger(datos.despachos?.total)}</p>
              <p className="text-sm text-gray-500">{formatNumber(datos.despachos?.tonelaje_despachado)} t</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-amber-600">
                  <FiTruck className="w-3 h-3" /> {datos.despachos?.despachadas} despachadas
                </span>
                <span className="flex items-center gap-1 text-green-600">
                  <FiCheckCircle className="w-3 h-3" /> {datos.despachos?.recibidas} recibidas
                </span>
              </div>
            </div>
          </div>

          {/* Ley promedio + Barras de progreso */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 p-6">
              <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                <FiTrendingUp /> Ley Promedio del Período
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

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiBarChart2 /> Progreso Estados
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Dumpadas completadas', val: datos.dumpadas?.completadas, total: datos.dumpadas?.total, color: 'bg-emerald-500' },
                  { label: 'Mezclas completadas', val: datos.mezclas?.completadas, total: datos.mezclas?.total, color: 'bg-blue-500' },
                  { label: 'Lotes cerrados', val: datos.lotes?.cerrados, total: datos.lotes?.total, color: 'bg-purple-500' },
                ].map((item, i) => {
                  const pct = item.total > 0 ? Math.round((item.val / item.total) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{item.label}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center pt-2 border-t text-sm">
                  <span className="text-gray-600">Conexión Producción:</span>
                  <span className="font-medium text-green-600 flex items-center gap-1">
                    <FiCheckCircle className="w-4 h-4" /> Activo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// =============================================
// PESTAÑA 2: Producción Gráficos
// =============================================
export const ProduccionGraficos = () => {
  const { loading, error, datos, fechaInicio, setFechaInicio, fechaFin, setFechaFin, cargarDatos } = useProduccionData();
  const { produccionDiaria, topFrentes, estadosDumpadas, estadosMezclas, estadosLotes } = usePreparedData(datos);

  return (
    <div className="mt-6 space-y-6">
      <FiltrosProduccion
        fechaInicio={fechaInicio} setFechaInicio={setFechaInicio}
        fechaFin={fechaFin} setFechaFin={setFechaFin}
        onAplicar={cargarDatos} onRefresh={cargarDatos} loading={loading}
      />

      {loading && <ProduccionLoading />}
      {error && <ProduccionError error={error} />}

      {!loading && datos && (
        <>
          {/* Gráfico: Producción diaria - Tonelaje */}
          {produccionDiaria.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-emerald-50 px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FiBarChart2 className="text-emerald-600" /> Producción Diaria - Tonelaje
                </h3>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={produccionDiaria} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="tonelaje" name="Tonelaje (t)" fill={CHART_COLORS.emerald} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cantidad" name="Cantidad" fill={CHART_COLORS.blueLight} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Gráfico: Ley promedio diaria */}
          {produccionDiaria.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-teal-50 px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FiTrendingUp className="text-teal-600" /> Ley Cu Promedio Diaria (%)
                </h3>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={produccionDiaria} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLeyProd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.emerald} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS.emerald} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone" dataKey="ley_promedio" name="Ley Cu (%)"
                      stroke={CHART_COLORS.emerald} strokeWidth={2}
                      fill="url(#colorLeyProd)"
                      dot={{ r: 4, fill: CHART_COLORS.emerald }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Gráfico: Top Frentes + Distribución estados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {topFrentes.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-blue-50 px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FaMountain className="text-blue-600" /> Top Frentes por Tonelaje
                  </h3>
                </div>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={Math.max(280, topFrentes.length * 45)}>
                    <BarChart data={topFrentes} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="nombre" type="category" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="tonelaje" name="Tonelaje (t)" fill={CHART_COLORS.blue} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Distribución de estados */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-purple-50 px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FiLayers className="text-purple-600" /> Distribución por Estados
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { title: 'Dumpadas', data: estadosDumpadas, colors: PIE_COLORS },
                    { title: 'Mezclas', data: estadosMezclas, colors: [CHART_COLORS.orange, CHART_COLORS.green] },
                    { title: 'Lotes', data: estadosLotes, colors: [CHART_COLORS.purple, CHART_COLORS.green] },
                  ].map(({ title, data, colors }) =>
                    data.length > 0 ? (
                      <div key={title} className="text-center">
                        <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                              {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-3 text-xs mt-1">
                          {data.map((d, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i] }} />
                              {d.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// =============================================
// PESTAÑA 3: Producción Tablas
// =============================================
export const ProduccionTablas = () => {
  const { loading, error, datos, fechaInicio, setFechaInicio, fechaFin, setFechaFin, cargarDatos } = useProduccionData();
  const { produccionDiaria, topFrentes } = usePreparedData(datos);

  return (
    <div className="mt-6 space-y-6">
      <FiltrosProduccion
        fechaInicio={fechaInicio} setFechaInicio={setFechaInicio}
        fechaFin={fechaFin} setFechaFin={setFechaFin}
        onAplicar={cargarDatos} onRefresh={cargarDatos} loading={loading}
      />

      {loading && <ProduccionLoading />}
      {error && <ProduccionError error={error} />}

      {!loading && datos && (
        <>
          {/* Tabla: Producción diaria */}
          {produccionDiaria.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-emerald-50 px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FiBarChart2 /> Producción Últimos 7 Días
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
                    {produccionDiaria.map((dia, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dia.fecha}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{formatInteger(dia.cantidad)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{formatNumber(dia.tonelaje)} t</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{formatNumber(dia.ley_promedio)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabla: Top frentes */}
          {topFrentes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-blue-50 px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FaMountain /> Top Frentes de Trabajo
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
                    {topFrentes.map((frente, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{frente.nombre}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{formatInteger(frente.cantidad)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{formatNumber(frente.tonelaje)} t</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{formatNumber(frente.ley_promedio)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Resumen general */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaIndustry className="text-emerald-600" /> Resumen General del Período
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-700">{formatNumber(datos.dumpadas?.tonelaje_total)}</p>
                <p className="text-xs text-emerald-600">Tonelaje Dumpadas (t)</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{formatNumber(datos.mezclas?.tonelaje_total)}</p>
                <p className="text-xs text-blue-600">Tonelaje Mezclas (t)</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-700">{formatNumber(datos.lotes?.tonelaje_total)}</p>
                <p className="text-xs text-purple-600">Tonelaje Lotes (t)</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-700">{formatNumber(datos.despachos?.tonelaje_despachado)}</p>
                <p className="text-xs text-amber-600">Tonelaje Despachado (t)</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
