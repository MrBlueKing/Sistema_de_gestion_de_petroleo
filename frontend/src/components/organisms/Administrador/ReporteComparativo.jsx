import React, { useState, useEffect } from 'react';
import axios from '../../../lib/axios';
import reporteComparativoService from '../../../pdf/services/reporteComparativoService';
import {
  FaFilePdf, FaCalendarAlt, FaMapMarkerAlt, FaChartBar,
  FaSpinner, FaDownload, FaEye, FaSyncAlt, FaCheckSquare, FaSquare,
} from 'react-icons/fa';

// ─── constantes ───────────────────────────────────────────────────────────────
const MESES = [
  { v: 1,  l: 'Enero' },  { v: 2,  l: 'Febrero' }, { v: 3,  l: 'Marzo' },
  { v: 4,  l: 'Abril' },  { v: 5,  l: 'Mayo' },     { v: 6,  l: 'Junio' },
  { v: 7,  l: 'Julio' },  { v: 8,  l: 'Agosto' },   { v: 9,  l: 'Septiembre' },
  { v: 10, l: 'Octubre' },{ v: 11, l: 'Noviembre' },{ v: 12, l: 'Diciembre' },
];

const hoy     = new Date();
const MES_HOY = hoy.getMonth() + 1;
const ANIO    = hoy.getFullYear();
const ANIOS   = [ANIO - 2, ANIO - 1, ANIO];


const labelMes = (m, a) => `${MESES.find(x => x.v === m)?.l} ${a}`;

const fmt = (n, dec = 2) =>
  parseFloat(n || 0).toLocaleString('es-CL', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });

// ─── componentes pequeños ─────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <span
      className={`text-lg ${checked ? 'text-orange-500' : 'text-gray-300'}`}
      onClick={onChange}
    >
      {checked ? <FaCheckSquare /> : <FaSquare />}
    </span>
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

const PeriodoSelector = ({ label, value, onChange, color = 'orange' }) => (
  <div className={`border-2 ${color === 'blue' ? 'border-blue-400' : 'border-orange-400'} rounded-xl p-4`}>
    <p className={`text-sm font-bold mb-3 ${color === 'blue' ? 'text-blue-700' : 'text-orange-700'}`}>
      <FaCalendarAlt className="inline mr-2" />{label}
    </p>
    <div className="flex gap-2">
      <select
        value={value.mes}
        onChange={e => onChange({ ...value, mes: parseInt(e.target.value) })}
        className="flex-1 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
      >
        {MESES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
      </select>
      <select
        value={value.anio}
        onChange={e => onChange({ ...value, anio: parseInt(e.target.value) })}
        className="w-24 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
      >
        {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
      </select>
    </div>
  </div>
);

// ─── componente principal ─────────────────────────────────────────────────────
export default function ReporteComparativo() {
  const [faenas,    setFaenas]    = useState([]);
  const [periodoA,  setPeriodoA]  = useState({ mes: MES_HOY === 1 ? 12 : MES_HOY - 1, anio: MES_HOY === 1 ? ANIO - 1 : ANIO });
  const [periodoB,  setPeriodoB]  = useState({ mes: MES_HOY, anio: ANIO });
  const [usarB,     setUsarB]     = useState(false);
  const [faenasSel, setFaenasSel] = useState(['todas']);
  const [secciones, setSecciones] = useState({
    consumoPorFaena: true,
    rendimiento:     true,
  });

  const [datosA,    setDatosA]    = useState(null);
  const [datosB,    setDatosB]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [generating,setGenerating]= useState(false);
  const [error,     setError]     = useState(null);
  const [preview,   setPreview]   = useState(false);

  // Cargar faenas
  useEffect(() => {
    axios.get('/api/faenas')
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : r.data?.data || [];
        setFaenas(data);
      })
      .catch(() => {
        // fallback hardcodeado
        setFaenas([
          { id_faena: 1, ubicacion: 'Cabildo' },
          { id_faena: 2, ubicacion: 'Catemu' },
          { id_faena: 3, ubicacion: 'Chincolco' },
          { id_faena: 4, ubicacion: 'Tiltil' },
        ]);
      });
  }, []);

  const toggleFaena = (id) => {
    if (id === 'todas') { setFaenasSel(['todas']); return; }
    setFaenasSel(prev => {
      const sinTodas = prev.filter(f => f !== 'todas');
      if (sinTodas.includes(id)) {
        const next = sinTodas.filter(f => f !== id);
        return next.length ? next : ['todas'];
      }
      return [...sinTodas, id];
    });
  };

  const fetchPeriodo = async (periodo, faenasIds) => {
    const inicio = `${periodo.anio}-${String(periodo.mes).padStart(2, '0')}-01`;
    const ultimo = new Date(periodo.anio, periodo.mes, 0).getDate();
    const fin    = `${periodo.anio}-${String(periodo.mes).padStart(2, '0')}-${ultimo}`;

    const r = await axios.get('/api/informes-kpi/consumo-maquinas', {
      params: { faena: 'todas', fecha_inicio: inicio, fecha_fin: fin }
    });

    const todasMaquinas = r.data?.data?.consumo_por_maquina || [];
    const todasFaenas   = r.data?.data?.consumo_por_faena   || [];

    // Filtrar por faenas seleccionadas si no es "todas"
    if (faenasIds.includes('todas')) {
      return { maquinas: todasMaquinas, faenas: todasFaenas };
    }

    const maquinasFiltradas = todasMaquinas.filter(m =>
      faenasIds.includes(String(m.id_faena))
    );
    const faenasFiltradas = todasFaenas.filter(f =>
      faenasIds.includes(String(f.id_faena))
    );
    return { maquinas: maquinasFiltradas, faenas: faenasFiltradas };
  };

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    setPreview(false);
    try {
      const a = await fetchPeriodo(periodoA, faenasSel);
      setDatosA(a);
      if (usarB) {
        const b = await fetchPeriodo(periodoB, faenasSel);
        setDatosB(b);
      } else {
        setDatosB(null);
      }
      console.log('Datos cargados:', a);
      setPreview(true);
    } catch (e) {
      console.error('Error cargando datos reporte:', e);
      const msg = e?.response?.data?.message || e?.userMessage || e?.message || 'Error desconocido';
      setError(`Error al cargar datos: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const generarPDF = async () => {
    if (!datosA) return;
    setGenerating(true);
    try {
      const faenasNombres = faenasSel.includes('todas')
        ? 'Todas las faenas'
        : faenasSel.map(id => faenas.find(f => String(f.id_faena) === String(id))?.ubicacion || id).join(', ');

      await reporteComparativoService.generar({
        periodoA,
        periodoB:      usarB ? periodoB : null,
        datosA,
        datosB:        usarB ? datosB   : null,
        faenas:        faenasSel.includes('todas') ? faenas.map(f => f.ubicacion) : faenasSel.map(id => faenas.find(f => String(f.id_faena) === String(id))?.ubicacion || id),
        faenasNombres,
        secciones,
      });
    } catch (e) {
      setError('Error al generar el PDF. Intenta nuevamente.');
    } finally {
      setGenerating(false);
    }
  };

  // ── stats rápidas para preview ──────────────────────────────────────────────
  const totalLitros    = (datos) => datos?.maquinas?.reduce((s, m) => s + parseFloat(m.litros_consumidos || 0), 0) || 0;
  const totalConsumos  = (datos) => datos?.faenas?.reduce((s, f) => s + parseInt(f.total_maquinas || 0), 0) || 0;
  const conRendimiento = (datos) => datos?.maquinas?.filter(m => parseFloat(m.rendimiento?.valor || 0) > 0).length || 0;

  return (
    <div className="bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100 min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl shadow-lg">
            <FaFilePdf className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Generador de Reportes PDF</h1>
            <p className="text-gray-300 text-sm">Consumo, rendimiento y comparativas por faena y período</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── CONFIGURACIÓN ── */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaChartBar className="text-orange-500" /> Configurar Reporte
          </h2>

          {/* Periodos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <PeriodoSelector
              label={usarB ? 'Periodo A (base)' : 'Período a reportar'}
              value={periodoA}
              onChange={setPeriodoA}
              color="orange"
            />
            <div>
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usarB}
                  onChange={e => setUsarB(e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">Comparar con un segundo período</span>
              </label>
              {usarB && (
                <PeriodoSelector
                  label="Periodo B (comparar)"
                  value={periodoB}
                  onChange={setPeriodoB}
                  color="blue"
                />
              )}
            </div>
          </div>

          {/* Faenas */}
          <div className="mb-5">
            <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <FaMapMarkerAlt className="text-orange-500" /> Faenas a incluir
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleFaena('todas')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  faenasSel.includes('todas')
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400'
                }`}
              >
                Todas las faenas
              </button>
              {faenas.map(f => (
                <button
                  key={f.id_faena}
                  onClick={() => toggleFaena(String(f.id_faena))}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    faenasSel.includes(String(f.id_faena))
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400'
                  }`}
                >
                  {f.ubicacion}
                </button>
              ))}
            </div>
          </div>

          {/* Secciones */}
          <div className="mb-5">
            <p className="text-sm font-bold text-gray-700 mb-2">Secciones del reporte</p>
            <div className="flex flex-wrap gap-4">
              <Toggle
                checked={true}
                onChange={() => {}}
                label="Resumen ejecutivo (siempre incluido)"
              />
              <Toggle
                checked={secciones.consumoPorFaena}
                onChange={() => setSecciones(s => ({ ...s, consumoPorFaena: !s.consumoPorFaena }))}
                label="Consumo por faena (con barras)"
              />
              <Toggle
                checked={secciones.rendimiento}
                onChange={() => setSecciones(s => ({ ...s, rendimiento: !s.rendimiento }))}
                label="Rendimiento por máquina"
              />
            </div>
          </div>

          {/* Botón cargar */}
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaEye />}
            {loading ? 'Cargando datos…' : 'Cargar vista previa'}
          </button>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* ── PREVIEW ── */}
        {preview && datosA && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaEye className="text-orange-500" /> Vista Previa
              </h2>
              <button
                onClick={generarPDF}
                disabled={generating}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg transition-all disabled:opacity-50"
              >
                {generating ? <FaSpinner className="animate-spin" /> : <FaDownload />}
                {generating ? 'Generando PDF…' : 'Descargar PDF'}
              </button>
            </div>

            {/* Cards resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: `Total Litros ${labelMes(periodoA.mes, periodoA.anio)}`, val: `${fmt(totalLitros(datosA))} L`, color: 'orange' },
                ...(datosB ? [{ label: `Total Litros ${labelMes(periodoB.mes, periodoB.anio)}`, val: `${fmt(totalLitros(datosB))} L`, color: 'blue' }] : []),
                { label: 'N° Consumos A', val: totalConsumos(datosA).toString(), color: 'green' },
                { label: 'Equipos con Rendimiento A', val: `${conRendimiento(datosA)} / ${datosA.maquinas?.length ?? 0}`, color: 'purple' },
              ].map((c, i) => (
                <div key={i} className={`rounded-xl p-4 border-l-4 bg-gray-50 ${
                  c.color === 'orange' ? 'border-orange-500' :
                  c.color === 'blue'   ? 'border-blue-500' :
                  c.color === 'green'  ? 'border-green-500' : 'border-purple-500'
                }`}>
                  <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                  <p className={`text-xl font-bold ${
                    c.color === 'orange' ? 'text-orange-600' :
                    c.color === 'blue'   ? 'text-blue-600' :
                    c.color === 'green'  ? 'text-green-600' : 'text-purple-600'
                  }`}>{c.val}</p>
                </div>
              ))}
            </div>

            {/* Tabla top máquinas */}
            <div className="overflow-x-auto">
              <p className="text-sm font-bold text-gray-600 mb-2">Top máquinas por consumo (Período A)</p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="text-left px-3 py-2 rounded-tl-lg">Máquina</th>
                    <th className="text-left px-3 py-2">Faena</th>
                    <th className="text-right px-3 py-2">Litros A</th>
                    {datosB && <th className="text-right px-3 py-2">Litros B</th>}
                    <th className="text-right px-3 py-2">Rendimiento A</th>
                    {datosB && <th className="text-right px-3 py-2">Rendimiento B</th>}
                    <th className="text-left px-3 py-2 rounded-tr-lg">Interpretación</th>
                  </tr>
                </thead>
                <tbody>
                  {(datosA.maquinas || [])
                    .slice()
                    .sort((a, b) => parseFloat(b.litros_consumidos) - parseFloat(a.litros_consumidos))
                    .slice(0, 15)
                    .map((m, i) => {
                      const mB = datosB?.maquinas?.find(x => x.id_maquina === m.id_maquina);
                      const unidad = m.tipo_medicion === 'Kilometraje' ? 'L/km' : 'L/h';
                      const rendA  = parseFloat(m.rendimiento?.valor || 0);
                      const rendB  = parseFloat(mB?.rendimiento?.valor || 0);
                      return (
                        <tr key={m.id_maquina} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 font-medium text-gray-800">{m.nombre_maquina}</td>
                          <td className="px-3 py-2 text-xs text-gray-500">{m.nombre_faena || '—'}</td>
                          <td className="px-3 py-2 text-right font-medium text-orange-600">{fmt(m.litros_consumidos)} L</td>
                          {datosB && <td className="px-3 py-2 text-right font-medium text-blue-600">{mB ? `${fmt(mB.litros_consumidos)} L` : '—'}</td>}
                          <td className="px-3 py-2 text-right">
                            {rendA > 0
                              ? <span className={`font-bold ${rendA < 5 ? 'text-green-600' : rendA < 10 ? 'text-orange-500' : 'text-red-600'}`}>
                                  {fmt(rendA)} {unidad}
                                </span>
                              : <span className="text-gray-400 text-xs">Sin datos</span>}
                          </td>
                          {datosB && (
                            <td className="px-3 py-2 text-right">
                              {rendB > 0
                                ? <span className="font-bold text-blue-600">{fmt(rendB)} {unidad}</span>
                                : <span className="text-gray-400 text-xs">Sin datos</span>}
                            </td>
                          )}
                          <td className="px-3 py-2 text-xs text-gray-500">{m.rendimiento?.interpretacion || '—'}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {(datosA.maquinas?.length ?? 0) > 15 && (
                <p className="text-xs text-gray-400 mt-2 text-right">
                  Mostrando 15 de {datosA.maquinas?.length} equipos. El PDF incluye todos los equipos.
                </p>
              )}
            </div>

            {/* Botón generar abajo */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={generarPDF}
                disabled={generating}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 text-base"
              >
                {generating ? <FaSpinner className="animate-spin" /> : <FaFilePdf />}
                {generating ? 'Generando PDF…' : 'Generar y Descargar PDF'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
