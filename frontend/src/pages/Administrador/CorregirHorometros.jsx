import React, { useEffect, useMemo, useState } from "react";
import { FaSearch, FaSync, FaTachometerAlt } from "react-icons/fa";
import UniversalHeader from "../../components/organisms/Todos/UniversalHeader";
import axios from "../../lib/axios";

// Corrección de horómetros y kilometraje de los consumos (solo Administrador).
// Las lecturas raras se detectan aquí: una que baja respecto a la anterior, o que
// sube más de 8 veces el avance normal de la máquina (y más de 50 unidades).

const hoy = () => new Date().toISOString().slice(0, 10);
const haceDias = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const fmt = (n, d = 1) => (n == null ? "—" : Number(n).toLocaleString("es-CL", { minimumFractionDigits: d, maximumFractionDigits: d }));
const unidad = (m) => (m.tipo === "Kilometraje" ? "km" : "h");
const decs = (m) => (m.tipo === "Kilometraje" ? 0 : 1);
const fechaCorta = (f) => `${f.slice(8, 10)}-${f.slice(5, 7)} ${f.slice(11, 16)}`;
// Acepta "21362,1", "21.362,1" o "21362.1"
const leerNumero = (txt) => {
  const t = String(txt || "").trim().replace(/\s/g, "");
  if (!t) return NaN;
  return Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
};

function analizar(m) {
  const rows = m.rows.map((r) => ({ ...r }));
  const ds = [];
  for (let i = 1; i < rows.length; i++) {
    const d = rows[i].m - rows[i - 1].m;
    if (rows[i].m != null && rows[i - 1].m != null && d > 0) ds.push(d);
  }
  ds.sort((a, b) => a - b);
  const med = ds.length ? ds[Math.floor(ds.length / 2)] : null;
  rows.forEach((r, i) => {
    const p = rows[i - 1];
    r.dif = p && p.m != null && r.m != null ? r.m - p.m : null;
    r.estado = r.dif == null ? "ok" : r.dif < 0 ? "baja" : med && r.dif > 8 * med && r.dif > 50 ? "salto" : "ok";
  });
  return { rows, med, bad: rows.filter((r) => r.estado !== "ok").length };
}

// Una lectura: probar con la coma corrida; solo si la anterior es confiable
function sugerir(rows, i, med) {
  const p = rows[i - 1]?.m, n = rows[i + 1]?.m, v = rows[i].m;
  if (p == null || v == null || rows[i - 1].estado !== "ok") return null;
  const tol = (med || 1) * 20;
  for (const f of [0.1, 0.01, 10, 0.001]) {
    const c = Math.round(v * f * 10) / 10;
    if (c >= p - tol && (n == null || c <= n) && c - p <= tol) return c;
  }
  return null;
}

// Tramo: un salto seguido de lecturas en esa misma escala hasta que vuelve a bajar (o hasta el final)
function tramo(rows, i, med) {
  if (rows[i].estado !== "salto" || !rows[i - 1] || rows[i - 1].estado !== "ok") return null;
  const j = rows.findIndex((r, k) => k > i && r.estado === "baja");
  const fin = j === -1 ? rows.length - 1 : j - 1;
  if (fin <= i) return null;
  const tol = (med || 1) * 20;
  for (const f of [0.1, 0.01]) {
    const ini = rows[i].m * f, ult = rows[fin].m * f;
    if (ini >= rows[i - 1].m - tol && (j === -1 || ult <= rows[j].m)) return { desde: i, hasta: fin, f, n: fin - i + 1 };
  }
  return null;
}

function Grafico({ maquina, rows, foco, onPunto }) {
  const pts = rows.filter((r) => r.m != null);
  if (pts.length < 2) return null;
  const W = 900, H = 170, L = 64, R = 12, T = 12, B = 24;
  const t0 = new Date(pts[0].f).getTime(), t1 = new Date(pts[pts.length - 1].f).getTime();
  const vals = pts.map((p) => p.m), lo = Math.min(...vals), hi = Math.max(...vals);
  const sx = (t) => L + ((W - L - R) * (t - t0)) / Math.max(t1 - t0, 1);
  const sy = (v) => T + (H - T - B) * (1 - (v - lo) / Math.max(hi - lo, 1));
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]" role="img" aria-label={`Lecturas de ${maquina.nombre} en el tiempo`}>
        {[0, 1, 2, 3].map((k) => {
          const v = lo + ((hi - lo) * k) / 3, y = sy(v);
          return (
            <g key={k}>
              <line x1={L} x2={W - R} y1={y} y2={y} stroke="#e5e7eb" />
              <text x={L - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#9ca3af">{fmt(v, 0)}</text>
            </g>
          );
        })}
        <polyline fill="none" stroke="#2a78d6" strokeWidth="2" strokeLinejoin="round" points={pts.map((p) => `${sx(new Date(p.f).getTime())},${sy(p.m)}`).join(" ")} />
        {pts.map((p) => {
          const bad = p.estado !== "ok";
          return (
            <g key={p.id} onClick={() => onPunto(p)} className="cursor-pointer">
              <circle cx={sx(new Date(p.f).getTime())} cy={sy(p.m)} r={foco === p.id ? 7 : bad ? 5 : 3} fill={bad ? "#dc2626" : "#2a78d6"} stroke={foco === p.id ? "#111827" : "#fff"} strokeWidth="2" />
              {/* área de clic más grande que el punto */}
              <circle cx={sx(new Date(p.f).getTime())} cy={sy(p.m)} r="10" fill="transparent">
                <title>{`${fechaCorta(p.f)} · ${fmt(p.m, decs(maquina))} ${unidad(maquina)}${bad ? " · revisar" : ""} · clic para ver en la tabla`}</title>
              </circle>
            </g>
          );
        })}
        <text x={L} y={H - 6} fontSize="11" fill="#9ca3af">{pts[0].f.slice(8, 10)}-{pts[0].f.slice(5, 7)}</text>
        <text x={W - R} y={H - 6} fontSize="11" fill="#9ca3af" textAnchor="end">{pts[pts.length - 1].f.slice(8, 10)}-{pts[pts.length - 1].f.slice(5, 7)}</text>
      </svg>
    </div>
  );
}

const CorregirHorometros = () => {
  const [desde, setDesde] = useState(haceDias(60));
  const [hasta, setHasta] = useState(hoy());
  const [maquinas, setMaquinas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [soloRaras, setSoloRaras] = useState(true);
  const [sel, setSel] = useState(null);
  const [editId, setEditId] = useState(null);
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [foco, setFoco] = useState(null); // lectura elegida en el gráfico
  const [historial, setHistorial] = useState([]);

  const cargar = async (mantener = sel) => {
    setCargando(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/admin/horometros", { params: { desde, hasta } });
      const lista = (data.data?.maquinas || []).map((m) => ({ ...m, a: analizar(m) }));
      lista.sort((x, y) => y.a.bad - x.a.bad || x.nombre.localeCompare(y.nombre));
      setMaquinas(lista);
      setSel(lista.some((m) => m.id === mantener) ? mantener : lista.find((m) => m.a.bad)?.id ?? lista[0]?.id ?? null);
    } catch (e) {
      setError(e.response?.data?.message || "No se pudieron cargar las lecturas.");
    } finally {
      setCargando(false);
    }
  };

  // Recargar al cambiar el rango de fechas
  useEffect(() => { cargar(); }, [desde, hasta]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sel) { setHistorial([]); return; }
    axios.get(`/api/admin/horometros/${sel}/historial`).then(({ data }) => setHistorial(data.data || [])).catch(() => setHistorial([]));
  }, [sel, maquinas]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return maquinas.filter((m) =>
      (!q || `${m.nombre} ${m.patente || ""}`.toLowerCase().includes(q)) &&
      (!filtroTipo || m.tipo === filtroTipo) &&
      (!soloRaras || m.a.bad > 0 || m.id === sel));
  }, [maquinas, busqueda, filtroTipo, soloRaras, sel]);

  const maquina = maquinas.find((m) => m.id === sel);

  const abrirEditor = (r, i) => {
    setEditId(r.id);
    setAviso(null);
    setMotivo("");
    const s = r.estado !== "ok" ? sugerir(maquina.a.rows, i, maquina.a.med) : null;
    setValor(s != null ? String(s).replace(".", ",") : "");
  };

  const guardar = async (cambios) => {
    setGuardando(true);
    setAviso(null);
    try {
      await axios.post("/api/admin/horometros/corregir", { motivo: motivo.trim() || null, cambios });
      setEditId(null);
      setAviso({ ok: true, txt: cambios.length > 1 ? `Se corrigieron ${cambios.length} lecturas.` : "Lectura corregida." });
      await cargar(sel);
    } catch (e) {
      setAviso({ ok: false, txt: e.response?.data?.message || "No se pudo guardar la corrección." });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalHeader />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-wrap gap-4 justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3"><FaTachometerAlt className="text-blue-600" /> Horómetros y km</h1>
            <p className="text-gray-600 mt-1 max-w-3xl">Elige una máquina para ver sus lecturas en orden. Las que bajan o saltan mucho más de lo normal quedan en rojo. Cada corrección queda registrada con quién la hizo y cuándo.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3 text-sm">
            <label className="grid gap-1 text-gray-600">Desde<input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} className="border rounded-lg px-3 py-2" /></label>
            <label className="grid gap-1 text-gray-600">Hasta<input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} className="border rounded-lg px-3 py-2" /></label>
            <button type="button" onClick={() => cargar()} className="border rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"><FaSync className={cargando ? "animate-spin" : ""} /> Actualizar</button>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4 items-start">
          {/* Lista de máquinas */}
          <aside className="bg-white rounded-lg shadow-md p-4 space-y-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar máquina o patente…" className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="border rounded-lg px-2 py-2">
                <option value="">Horómetro y km</option>
                <option value="Horometro">Horómetro</option>
                <option value="Kilometraje">Kilometraje</option>
              </select>
              <select value={soloRaras ? "raras" : ""} onChange={(e) => setSoloRaras(e.target.value === "raras")} className="border rounded-lg px-2 py-2">
                <option value="raras">Con lecturas raras</option>
                <option value="">Todas</option>
              </select>
            </div>
            <div className="max-h-[620px] overflow-y-auto -mx-1 px-1 space-y-1">
              {cargando && !maquinas.length && <p className="text-sm text-gray-400 p-2 animate-pulse">Cargando…</p>}
              {!cargando && !visibles.length && <p className="text-sm text-gray-500 p-2">No hay máquinas con ese filtro.</p>}
              {visibles.map((m) => (
                <button key={m.id} type="button" onClick={() => { setSel(m.id); setEditId(null); setAviso(null); setFoco(null); }}
                  className={`w-full text-left rounded-lg px-3 py-2 border ${m.id === sel ? "bg-blue-50 border-blue-500" : "border-transparent hover:bg-gray-50"}`}>
                  <div className="flex justify-between gap-2 items-center">
                    <span className="font-semibold text-sm text-gray-800">{m.nombre}</span>
                    {m.a.bad
                      ? <span className="text-xs font-semibold rounded-full px-2 py-0.5 bg-red-100 text-red-700 whitespace-nowrap">{m.a.bad} rara{m.a.bad > 1 ? "s" : ""}</span>
                      : <span className="text-xs font-semibold rounded-full px-2 py-0.5 bg-green-100 text-green-700">ok</span>}
                  </div>
                  <div className="text-xs text-gray-500">{m.cat} · {m.tipo === "Kilometraje" ? "km" : "horómetro"}{m.patente ? ` · ${m.patente}` : ""} · {m.rows.length} cargas</div>
                </button>
              ))}
            </div>
          </aside>

          {/* Detalle de la máquina */}
          <main className="bg-white rounded-lg shadow-md p-4 space-y-4 min-w-0">
            {!maquina ? (
              <p className="text-gray-500">{cargando ? "Cargando…" : "No hay consumos con horómetro o km en el rango elegido."}</p>
            ) : (
              <>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{maquina.nombre}</h2>
                    <p className="text-sm text-gray-600">{maquina.cat} · se mide en {maquina.tipo === "Kilometraje" ? "kilómetros" : "horas"}{maquina.patente ? ` · patente ${maquina.patente}` : ""}</p>
                  </div>
                  <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                    <div>Última lectura<div className="font-mono text-lg text-gray-900">{fmt([...maquina.a.rows].reverse().find((r) => r.m != null)?.m, decs(maquina))} {unidad(maquina)}</div></div>
                    <div>Avance normal entre cargas<div className="font-mono text-lg text-gray-900">{fmt(maquina.a.med, decs(maquina))} {unidad(maquina)}</div></div>
                    <div>Lecturas raras<div className={`font-mono text-lg ${maquina.a.bad ? "text-red-600" : "text-green-600"}`}>{maquina.a.bad}</div></div>
                  </div>
                </div>

                {aviso && <div className={`rounded-lg px-4 py-2 text-sm ${aviso.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{aviso.txt}</div>}

                <Grafico maquina={maquina} rows={maquina.a.rows} foco={foco} onPunto={(p) => {
                  // Clic en un punto: ir a esa lectura en la tabla; si es rara, abrir el editor
                  setFoco(p.id);
                  const i = maquina.a.rows.findIndex((x) => x.id === p.id);
                  if (p.estado !== "ok") abrirEditor(maquina.a.rows[i], i); else setEditId(null);
                  requestAnimationFrame(() => document.getElementById(`lectura-${p.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
                }} />

                <div className="overflow-auto max-h-[480px] border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0 text-gray-600 text-xs">
                      <tr>
                        <th className="text-left px-3 py-2">Fecha</th><th className="text-left px-3 py-2">Faena</th>
                        <th className="text-right px-3 py-2">Litros</th><th className="text-right px-3 py-2">Lectura ({unidad(maquina)})</th>
                        <th className="text-right px-3 py-2">Avance vs anterior</th><th className="text-left px-3 py-2">Estado</th><th className="text-left px-3 py-2">Observación</th><th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {maquina.a.rows.map((r, i) => {
                        const rara = r.estado !== "ok", dd = decs(maquina), u = unidad(maquina);
                        const tr = editId === r.id ? tramo(maquina.a.rows, i, maquina.a.med) : null;
                        const sug = editId === r.id && rara ? sugerir(maquina.a.rows, i, maquina.a.med) : null;
                        return (
                          <React.Fragment key={r.id}>
                            <tr id={`lectura-${r.id}`} className={`border-t ${rara ? "bg-red-50" : r.original != null ? "bg-green-50" : ""} ${foco === r.id ? "outline outline-2 -outline-offset-2 outline-blue-600" : ""}`}>
                              <td className="px-3 py-1.5 font-mono whitespace-nowrap">{fechaCorta(r.f)}</td>
                              <td className="px-3 py-1.5">{r.fa}</td>
                              <td className="px-3 py-1.5 text-right font-mono">{fmt(r.l, 0)}</td>
                              <td className="px-3 py-1.5 text-right font-mono whitespace-nowrap">
                                {r.original != null && <s className="text-gray-400 mr-2">{fmt(r.original, dd)}</s>}{fmt(r.m, dd)}
                              </td>
                              <td className={`px-3 py-1.5 text-right font-mono ${rara ? "text-red-600" : ""}`}>{r.dif == null ? "—" : `${r.dif > 0 ? "+" : ""}${fmt(r.dif, dd)}`}</td>
                              <td className="px-3 py-1.5 whitespace-nowrap">
                                {r.estado === "baja" && <span className="text-xs font-semibold rounded-full px-2 py-0.5 bg-red-100 text-red-700">▼ baja</span>}
                                {r.estado === "salto" && <span className="text-xs font-semibold rounded-full px-2 py-0.5 bg-red-100 text-red-700">▲ salto grande</span>}
                                {!rara && r.original != null && <span className="text-xs font-semibold rounded-full px-2 py-0.5 bg-green-100 text-green-700">✓ corregida</span>}
                              </td>
                              <td className="px-3 py-1.5 text-gray-600 max-w-[260px] truncate" title={r.obs || ""}>{r.obs || <span className="text-gray-300">—</span>}</td>
                              <td className="px-3 py-1.5 text-right">
                                <button type="button" onClick={() => (editId === r.id ? setEditId(null) : abrirEditor(r, i))} className="text-blue-600 font-semibold text-xs border rounded-md px-2 py-1 hover:bg-blue-50">Corregir</button>
                              </td>
                            </tr>
                            {editId === r.id && (
                              <tr><td colSpan={8} className="p-3">
                                <div className="border border-blue-500 bg-blue-50 rounded-lg p-4 space-y-3">
                                  <h3 className="font-semibold text-gray-800">Corregir lectura del {fechaCorta(r.f)}</h3>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600">
                                    <label className="grid gap-1">Lectura anterior<input disabled value={`${fmt(maquina.a.rows[i - 1]?.m, dd)} ${u}`} className="border rounded-md px-2 py-1.5 font-mono bg-gray-100" /></label>
                                    <label className="grid gap-1">Lectura actual<input disabled value={`${fmt(r.m, dd)} ${u}`} className="border rounded-md px-2 py-1.5 font-mono bg-gray-100" /></label>
                                    <label className="grid gap-1">Lectura corregida ({u})<input autoFocus inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder={`ej. ${fmt(maquina.a.rows[i - 1]?.m, dd)}`} className="border rounded-md px-2 py-1.5 font-mono bg-white" /></label>
                                    <label className="grid gap-1">Lectura siguiente<input disabled value={`${fmt(maquina.a.rows[i + 1]?.m, dd)} ${u}`} className="border rounded-md px-2 py-1.5 font-mono bg-gray-100" /></label>
                                  </div>
                                  {r.obs && <p className="text-sm text-gray-700">Observación del usuario al registrar: <span className="italic">“{r.obs}”</span></p>}
                                  {sug != null && <p className="text-sm text-gray-700">Parece que falta o sobra un dígito o la coma. Sugerencia: <b className="font-mono">{fmt(sug, dd)} {u}</b>, que queda entre la anterior y la siguiente.</p>}
                                  <label className="grid gap-1 text-xs text-gray-600">Motivo (opcional)
                                    <textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="ej. Se tipeó sin la coma" className="border rounded-md px-2 py-1.5 text-sm bg-white" />
                                  </label>
                                  {tr && (
                                    <div className="text-sm text-gray-700 border-t border-blue-200 pt-3 flex flex-wrap items-center gap-3 justify-between">
                                      <span><b>Las {tr.n} lecturas siguientes también quedaron con la escala cambiada</b> (del {fechaCorta(maquina.a.rows[tr.desde].f).slice(0, 5)} al {fechaCorta(maquina.a.rows[tr.hasta].f).slice(0, 5)}). Dividiendo por {tr.f === 0.1 ? "10" : "100"}: {fmt(maquina.a.rows[tr.desde].m, dd)} → {fmt(maquina.a.rows[tr.desde].m * tr.f, dd)} … {fmt(maquina.a.rows[tr.hasta].m, dd)} → {fmt(maquina.a.rows[tr.hasta].m * tr.f, dd)} {u}.</span>
                                      <button type="button" disabled={guardando}
                                        onClick={() => guardar(maquina.a.rows.slice(tr.desde, tr.hasta + 1).map((x) => ({ id_consumo: x.id, medicion: Math.round(x.m * tr.f * 1000) / 1000 })))}
                                        className="border border-blue-600 text-blue-700 font-semibold rounded-md px-3 py-1.5 disabled:opacity-40">Corregir las {tr.n} juntas</button>
                                    </div>
                                  )}
                                  <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setEditId(null)} className="border rounded-md px-3 py-1.5 text-sm">Cancelar</button>
                                    <button type="button" disabled={Number.isNaN(leerNumero(valor)) || guardando}
                                      onClick={() => guardar([{ id_consumo: r.id, medicion: leerNumero(valor) }])}
                                      className="bg-blue-600 text-white font-semibold rounded-md px-4 py-1.5 text-sm disabled:opacity-40">{guardando ? "Guardando…" : "Guardar corrección"}</button>
                                  </div>
                                </div>
                              </td></tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Correcciones de esta máquina</h3>
                  {historial.length ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                      {historial.map((h, k) => (
                        <li key={k}><b>{h.cuando}</b> · {h.quien}: {h.lecturas > 1 ? `${h.lecturas} lecturas del ${h.desde} al ${h.hasta}` : `lectura del ${h.desde}`}, {fmt(h.antes, decs(maquina))} → <b>{fmt(h.despues, decs(maquina))}</b> {unidad(maquina)}{h.lecturas > 1 ? " (primera)" : ""}{h.motivo ? ` — “${h.motivo}”` : ""}</li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-gray-500">Todavía no hay correcciones para esta máquina.</p>}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CorregirHorometros;
