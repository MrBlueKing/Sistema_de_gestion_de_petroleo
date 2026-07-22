import React, { useState, useEffect, useCallback } from "react";
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { FaTools, FaCheckCircle, FaExclamationTriangle, FaWrench } from "react-icons/fa";
import axios from "../../../lib/axios";

// Paleta categórica validada (orden fijo, no se reordena por dataset) —
// mismo orden en todos los gráficos para que una categoría no cambie de color entre vistas.
const PALETA = ["#2a78d6", "#008300", "#e87ba4", "#eda100", "#1baf7a", "#eb6834", "#4a3aa7", "#e34948"];
const AZUL_ACIERTO = "#2a78d6";
const GRIS_RESTO = "#e1e0d9";

const MESES_LABEL = {
  '01':'Ene','02':'Feb','03':'Mar','04':'Abr','05':'May','06':'Jun',
  '07':'Jul','08':'Ago','09':'Sep','10':'Oct','11':'Nov','12':'Dic',
};

const formatMes = (mesStr) => {
  const [anio, mes] = mesStr.split('-');
  return `${MESES_LABEL[mes] || mes} ${anio.slice(2)}`;
};

const TarjetaKpi = ({ icono: Icono, color, etiqueta, valor, sufijo }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
      <Icono className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900 leading-none">{valor}{sufijo}</p>
      <p className="text-xs text-gray-500 mt-1">{etiqueta}</p>
    </div>
  </div>
);

const DonutCard = ({ titulo, datos, total, sinDatosTexto }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
    <h3 className="text-sm font-semibold text-gray-700 mb-3">{titulo}</h3>
    {datos.length === 0 ? (
      <div className="h-56 flex items-center justify-center text-sm text-gray-400">{sinDatosTexto}</div>
    ) : (
      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datos}
              dataKey="total"
              nameKey="nombre"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={2}
            >
              {datos.map((entrada, i) => (
                <Cell key={entrada.nombre} fill={PALETA[i % PALETA.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} (${((value / total) * 100).toFixed(0)}%)`, name]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend verticalAlign="bottom" height={48} wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginBottom: 24 }}>
          <span className="text-2xl font-bold text-gray-800">{total}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Total</span>
        </div>
      </div>
    )}
  </div>
);

const AnilloAcierto = ({ titulo, porcentaje, descripcion }) => {
  const valor = porcentaje ?? 0;
  const datos = [
    { nombre: 'Cumplió', total: valor },
    { nombre: 'No cumplió', total: 100 - valor },
  ];
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{titulo}</h3>
      <p className="text-xs text-gray-400 mb-3">{descripcion}</p>
      {porcentaje === null ? (
        <div className="h-48 flex items-center justify-center text-sm text-gray-400">
          Sin actividades finalizadas todavía
        </div>
      ) : (
        <div className="h-48 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={datos}
                dataKey="total"
                innerRadius={58}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                <Cell fill={AZUL_ACIERTO} />
                <Cell fill={GRIS_RESTO} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-gray-800">{valor}%</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">de acierto</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function EstadisticasTallerPanel() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/estadisticas-taller/resumen');
      setDatos(response.data.data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (loading) {
    return <div className="container mx-auto px-4 py-6 max-w-6xl text-center text-gray-500">Cargando estadísticas...</div>;
  }

  if (error || !datos) {
    return <div className="container mx-auto px-4 py-6 max-w-6xl text-center text-red-600">{error || 'No se pudieron cargar las estadísticas'}</div>;
  }

  const { fallas, insumos } = datos;

  const porMesData = insumos.por_mes.map((m) => ({ mes: formatMes(m.mes), total: m.total }));

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gráficos y Estadísticas — Taller Mecánico</h2>
        <p className="text-sm text-gray-500 mt-1">Resumen de Fallas y de Neumáticos y Aceites.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TarjetaKpi icono={FaTools} color="bg-blue-600" etiqueta="Total de fallas" valor={fallas.total_fallas} />
        <TarjetaKpi icono={FaCheckCircle} color="bg-green-600" etiqueta="Fallas cerradas" valor={fallas.por_estado.cerrada} />
        <TarjetaKpi icono={FaExclamationTriangle} color="bg-amber-500" etiqueta="Abiertas / en reparación" valor={fallas.por_estado.abierta + fallas.por_estado.en_reparacion} />
        <TarjetaKpi icono={FaWrench} color="bg-violet-600" etiqueta="Cambios neumáticos/aceites" valor={insumos.total_registros} />
      </div>

      {/* Fallas: distribución + acierto */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">Programa de Gestión y Análisis de Fallas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DonutCard titulo="Fallas por categoría de máquina" datos={fallas.por_categoria} total={fallas.total_fallas} sinDatosTexto="Sin fallas registradas" />
          <DonutCard
            titulo="Actividades por tipo"
            datos={[
              { nombre: 'Interno', total: fallas.por_tipo.Interno },
              { nombre: 'Externo', total: fallas.por_tipo.Externo },
            ].filter((d) => d.total > 0)}
            total={fallas.total_actividades}
            sinDatosTexto="Sin actividades registradas"
          />
          <AnilloAcierto
            titulo="% de acierto en tiempo"
            porcentaje={fallas.porcentaje_acierto_tiempo}
            descripcion="Actividades finalizadas cuyo tiempo real fue igual o menor al estimado"
          />
          <AnilloAcierto
            titulo="% de acierto en fecha"
            porcentaje={fallas.porcentaje_acierto_fecha}
            descripcion="Actividades que arrancaron el día planificado o antes"
          />
        </div>
      </div>

      {/* Insumos */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">Neumáticos y Aceites</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DonutCard titulo="Cambios por categoría de máquina" datos={insumos.por_categoria} total={insumos.total_registros} sinDatosTexto="Sin registros" />
          <DonutCard titulo="Cambios por tipo de insumo" datos={insumos.por_tipo} total={insumos.total_registros} sinDatosTexto="Sin registros" />

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Cambios por mes</h3>
            {porMesData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-gray-400">Sin registros</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porMesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#898781' }} axisLine={{ stroke: '#c3c2b7' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#898781' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="total" name="Cambios" fill={PALETA[4]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
