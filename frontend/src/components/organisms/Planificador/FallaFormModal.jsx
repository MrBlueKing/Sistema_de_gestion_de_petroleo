import React, { useState, useEffect, useRef, useMemo } from "react";
import { FaTimes, FaPlus, FaTrash } from "react-icons/fa";
import Button from "../../atoms/Button/Button";
import fallaService from "../../../context/fallaService";
import mecanicoService from "../../../context/mecanicoService";

const nuevaActividad = (orden) => ({
  descripcion: "",
  tipo: "I",
  tiempo_estimado: "",
  orden,
  fecha_inicio_planificada: "",
  id_mecanico: "",
});

const FallaFormModal = ({ onClose, onCreada }) => {
  const [maquinas, setMaquinas] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [idMaquina, setIdMaquina] = useState("");
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState(null);
  const [busquedaEquipo, setBusquedaEquipo] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [mostrarListaEquipos, setMostrarListaEquipos] = useState(false);
  const [horometro, setHorometro] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [descripcion, setDescripcion] = useState("");
  const [actividades, setActividades] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const equipoRef = useRef(null);

  useEffect(() => {
    const cargarMaquinas = async () => {
      const respuesta = await fallaService.listarMaquinas();
      if (respuesta.status === "success") {
        setMaquinas(respuesta.data);
      }
    };
    cargarMaquinas();
  }, []);

  useEffect(() => {
    const cargarMecanicos = async () => {
      const respuesta = await mecanicoService.listar({ activo: 1 });
      if (respuesta.status === "success") {
        setMecanicos(respuesta.data);
      }
    };
    cargarMecanicos();
  }, []);

  useEffect(() => {
    const cerrarSiEsFuera = (e) => {
      if (equipoRef.current && !equipoRef.current.contains(e.target)) {
        setMostrarListaEquipos(false);
      }
    };
    document.addEventListener("mousedown", cerrarSiEsFuera);
    return () => document.removeEventListener("mousedown", cerrarSiEsFuera);
  }, []);

  const categorias = useMemo(() => {
    return Array.from(new Set(maquinas.map((m) => m.categoria).filter(Boolean))).sort();
  }, [maquinas]);

  const maquinasFiltradas = useMemo(() => {
    const texto = busquedaEquipo.trim().toLowerCase();
    return maquinas.filter((m) => {
      const coincideTexto =
        !texto || m.equipo?.toLowerCase().includes(texto) || m.patente?.toLowerCase().includes(texto);
      const coincideCategoria = !categoriaFiltro || m.categoria === categoriaFiltro;
      return coincideTexto && coincideCategoria;
    });
  }, [maquinas, busquedaEquipo, categoriaFiltro]);

  const seleccionarMaquina = (maquina) => {
    setIdMaquina(maquina.id_maquina);
    setMaquinaSeleccionada(maquina);
    setBusquedaEquipo("");
    setMostrarListaEquipos(false);
    // El horómetro siempre se sincroniza con el equipo recién elegido,
    // aunque ya hubiera un valor cargado de una selección anterior.
    setHorometro(maquina.medicion_actual != null ? String(maquina.medicion_actual) : "");
  };

  const abrirBusquedaEquipo = () => {
    setBusquedaEquipo("");
    setMostrarListaEquipos(true);
  };

  const limpiarEquipoSeleccionado = (e) => {
    e.stopPropagation();
    setIdMaquina("");
    setMaquinaSeleccionada(null);
    setHorometro("");
  };

  const actualizarActividad = (index, campo, valor) => {
    setActividades((prev) =>
      prev.map((actividad, i) => (i === index ? { ...actividad, [campo]: valor } : actividad))
    );
  };

  const agregarActividad = () => {
    setActividades((prev) => [...prev, nuevaActividad(prev.length + 1)]);
  };

  const quitarActividad = (index) => {
    setActividades((prev) => prev.filter((_, i) => i !== index));
  };

  const tiempoTotal = actividades.reduce((suma, act) => suma + (parseFloat(act.tiempo_estimado) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!idMaquina || !horometro || !descripcion) {
      setError("Completa equipo, horómetro y descripción de la falla.");
      return;
    }

    if (actividades.some((a) => !a.descripcion || a.tiempo_estimado === "" || !a.fecha_inicio_planificada)) {
      setError("Completa descripción, tiempo estimado y fecha planificada de todas las actividades.");
      return;
    }

    setGuardando(true);
    const respuesta = await fallaService.crear({
      id_maquina: idMaquina,
      horometro,
      fecha,
      descripcion,
      actividades: actividades.map((a) => ({ ...a, id_mecanico: a.id_mecanico || null })),
    });
    setGuardando(false);

    if (respuesta.status === "success") {
      onCreada();
    } else {
      setError(respuesta.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Registrar falla</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative" ref={equipoRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>

              {maquinaSeleccionada && !mostrarListaEquipos ? (
                <button
                  type="button"
                  onClick={abrirBusquedaEquipo}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 flex items-center justify-between text-left bg-white"
                >
                  <span className="truncate">
                    {maquinaSeleccionada.equipo}
                    {maquinaSeleccionada.patente ? ` (${maquinaSeleccionada.patente})` : ""}
                  </span>
                  <FaTimes
                    onClick={limpiarEquipoSeleccionado}
                    className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
                  />
                </button>
              ) : (
                <input
                  type="text"
                  value={busquedaEquipo}
                  onChange={(e) => setBusquedaEquipo(e.target.value)}
                  onFocus={() => setMostrarListaEquipos(true)}
                  placeholder="Busca por nombre o patente..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  autoComplete="off"
                />
              )}

              {mostrarListaEquipos && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto">
                  <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                    <select
                      value={categoriaFiltro}
                      onChange={(e) => setCategoriaFiltro(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                    >
                      <option value="">Todas las categorías</option>
                      {categorias.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {maquinasFiltradas.length === 0 ? (
                    <p className="p-3 text-sm text-gray-500">No se encontraron equipos.</p>
                  ) : (
                    maquinasFiltradas.map((m) => (
                      <button
                        type="button"
                        key={m.id_maquina}
                        onClick={() => seleccionarMaquina(m)}
                        className="w-full text-left px-3 py-2 hover:bg-orange-50 text-sm border-b border-gray-50 last:border-0"
                      >
                        <div className="font-medium text-gray-800">{m.equipo}</div>
                        <div className="text-xs text-gray-500">
                          {m.patente || "sin patente"} · {m.categoria}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horómetro</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={horometro}
                onChange={(e) => setHorometro(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              {maquinaSeleccionada?.medicion_actual != null && (
                <p className="text-xs text-gray-500 mt-1">
                  Último horómetro registrado: {maquinaSeleccionada.medicion_actual} h
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de registro</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de la falla</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Describe brevemente la falla presentada"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">Plan de reparación</h3>
              <Button type="button" text="Agregar actividad" icon={<FaPlus />} color="blue" onClick={agregarActividad} />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">Descripción / diagnóstico</th>
                    <th className="px-3 py-2 text-left w-28">Tipo</th>
                    <th className="px-3 py-2 text-left w-28">T. trabajo estimado (días)</th>
                    <th className="px-3 py-2 text-left w-20" title="Dos actividades pueden compartir el mismo número de orden si se realizan en paralelo">
                      Orden
                    </th>
                    <th className="px-3 py-2 text-left w-40">Planificado</th>
                    <th className="px-3 py-2 text-left w-40">Persona encargada</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {actividades.map((actividad, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={actividad.descripcion}
                          onChange={(e) => actualizarActividad(index, "descripcion", e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1"
                          placeholder="Ej: Cambio de motor"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={actividad.tipo}
                          onChange={(e) => actualizarActividad(index, "tipo", e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1"
                        >
                          <option value="I">Interno</option>
                          <option value="E">Externo</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={actividad.tiempo_estimado}
                          onChange={(e) => actualizarActividad(index, "tiempo_estimado", e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          value={actividad.orden}
                          onChange={(e) => actualizarActividad(index, "orden", e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={actividad.fecha_inicio_planificada}
                          onChange={(e) => actualizarActividad(index, "fecha_inicio_planificada", e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={actividad.id_mecanico}
                          onChange={(e) => actualizarActividad(index, "id_mecanico", e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1"
                        >
                          <option value="">Sin asignar</option>
                          {mecanicos.map((m) => (
                            <option key={m.id} value={m.id}>{m.nombre}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button type="button" onClick={() => quitarActividad(index)} className="text-red-400 hover:text-red-600">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mt-2">
              <p className="text-xs text-gray-500">
                💡 El orden indica la secuencia de ejecución. Si dos actividades se realizan en paralelo, pueden compartir el mismo número.
              </p>
              <p className="text-right text-sm text-gray-600">
                Tiempo de trabajo total estimado: <span className="font-semibold">{tiempoTotal.toFixed(2)} días</span>
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button type="button" text="Cancelar" color="gray" onClick={onClose} />
            <Button type="submit" text="Registrar falla" color="orange" loading={guardando} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default FallaFormModal;
