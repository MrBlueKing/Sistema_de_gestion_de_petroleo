import React, { useState, useEffect, useCallback } from "react";
import { FaTimes, FaCheckCircle, FaPen, FaTrash, FaPlus } from "react-icons/fa";
import Button from "../../atoms/Button/Button";
import fallaService from "../../../context/fallaService";
import mecanicoService from "../../../context/mecanicoService";
import ConfirmarEliminarFallaModal from "./ConfirmarEliminarFallaModal";

const ESTADO_LABEL = {
  abierta: "Abierta",
  en_reparacion: "En reparación",
  cerrada: "Cerrada",
};

const ACTIVIDAD_ESTADO = {
  pendiente: { texto: "Pendiente", clase: "bg-gray-100 text-gray-600" },
  en_curso: { texto: "En curso", clase: "bg-blue-100 text-blue-700" },
  finalizada: { texto: "Finalizada", clase: "bg-green-100 text-green-700" },
};

const TIPO_LABEL = { I: "Interno", E: "Externo" };

const hoyISO = () => new Date().toISOString().slice(0, 10);

const nuevaActividadVacia = (orden) => ({
  descripcion: "",
  tipo: "I",
  tiempo_estimado: "",
  orden,
  fecha_inicio_planificada: "",
  id_mecanico: "",
});

const formatearFecha = (fecha) => {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleDateString("es-CL");
};

const FallaDetalleModal = ({ idFalla, onClose, onActualizada }) => {
  const [falla, setFalla] = useState(null);
  const [mecanicos, setMecanicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draftFechas, setDraftFechas] = useState({});
  const [modoEdicion, setModoEdicion] = useState({});
  const [guardandoActividad, setGuardandoActividad] = useState(null);
  const [observacionesFinales, setObservacionesFinales] = useState("");
  const [cerrando, setCerrando] = useState(false);
  const [pidiendoEliminar, setPidiendoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [editandoPlan, setEditandoPlan] = useState({});
  const [draftPlan, setDraftPlan] = useState({});
  const [agregando, setAgregando] = useState(false);
  const [nuevaActividad, setNuevaActividad] = useState(nuevaActividadVacia(1));
  const [guardandoNueva, setGuardandoNueva] = useState(false);
  const [confirmarEliminarActividad, setConfirmarEliminarActividad] = useState(null);
  const [borrandoActividad, setBorrandoActividad] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const respuesta = await fallaService.obtener(idFalla);
    if (respuesta.status === "success") {
      setFalla(respuesta.data);
      setObservacionesFinales(respuesta.data.observaciones_finales || "");
      const draft = {};
      respuesta.data.actividades.forEach((a) => {
        draft[a.id] = {
          inicio: a.fecha_inicio_real ? a.fecha_inicio_real.slice(0, 10) : hoyISO(),
          fin: a.fecha_fin_real ? a.fecha_fin_real.slice(0, 10) : hoyISO(),
          tiempoReal: a.tiempo_real ?? "",
        };
      });
      setDraftFechas(draft);
    } else {
      setError(respuesta.message);
    }
    setLoading(false);
  }, [idFalla]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    const cargarMecanicos = async () => {
      const respuesta = await mecanicoService.listar({ activo: 1 });
      if (respuesta.status === "success") {
        setMecanicos(respuesta.data);
      }
    };
    cargarMecanicos();
  }, []);

  const actualizarDraft = (idActividad, campo, valor) => {
    setDraftFechas((prev) => ({
      ...prev,
      [idActividad]: { ...prev[idActividad], [campo]: valor },
    }));
  };

  const iniciarActividad = async (idActividad) => {
    const fechaInicio = draftFechas[idActividad]?.inicio;
    if (!fechaInicio) {
      setError("Selecciona una fecha de inicio antes de continuar.");
      return;
    }

    setError(null);
    setGuardandoActividad(idActividad);
    const respuesta = await fallaService.actualizarActividad(idFalla, idActividad, {
      fecha_inicio_real: fechaInicio,
    });
    setGuardandoActividad(null);

    if (respuesta.status === "success") {
      await cargar();
      onActualizada();
    } else {
      setError(respuesta.message);
    }
  };

  const finalizarActividad = async (idActividad) => {
    const { fin: fechaFin, tiempoReal } = draftFechas[idActividad] || {};
    if (!fechaFin || tiempoReal === "" || tiempoReal === undefined) {
      setError("Completa la fecha de fin y el tiempo real antes de continuar.");
      return;
    }

    setError(null);
    setGuardandoActividad(idActividad);
    const respuesta = await fallaService.actualizarActividad(idFalla, idActividad, {
      fecha_fin_real: fechaFin,
      tiempo_real: tiempoReal,
    });
    setGuardandoActividad(null);

    if (respuesta.status === "success") {
      await cargar();
      onActualizada();
    } else {
      setError(respuesta.message);
    }
  };

  const guardarCorreccion = async (idActividad) => {
    setGuardandoActividad(idActividad);
    const { fin, tiempoReal } = draftFechas[idActividad] || {};
    const respuesta = await fallaService.actualizarActividad(idFalla, idActividad, {
      fecha_fin_real: fin || null,
      tiempo_real: tiempoReal === "" ? null : tiempoReal,
    });
    setGuardandoActividad(null);

    if (respuesta.status === "success") {
      setModoEdicion((prev) => ({ ...prev, [idActividad]: false }));
      await cargar();
      onActualizada();
    } else {
      setError(respuesta.message);
    }
  };

  const iniciarEdicionPlan = (actividad) => {
    setDraftPlan((prev) => ({
      ...prev,
      [actividad.id]: {
        descripcion: actividad.descripcion,
        tipo: actividad.tipo,
        tiempo_estimado: actividad.tiempo_estimado,
        orden: actividad.orden,
        fecha_inicio_planificada: actividad.fecha_inicio_planificada
          ? actividad.fecha_inicio_planificada.slice(0, 10)
          : "",
        id_mecanico: actividad.id_mecanico ?? "",
      },
    }));
    setEditandoPlan((prev) => ({ ...prev, [actividad.id]: true }));
  };

  const actualizarDraftPlan = (idActividad, campo, valor) => {
    setDraftPlan((prev) => ({
      ...prev,
      [idActividad]: { ...prev[idActividad], [campo]: valor },
    }));
  };

  const cancelarEdicionPlan = (idActividad) => {
    setEditandoPlan((prev) => ({ ...prev, [idActividad]: false }));
  };

  const guardarPlan = async (idActividad) => {
    const plan = draftPlan[idActividad];
    if (!plan?.descripcion || plan?.tiempo_estimado === "" || !plan?.fecha_inicio_planificada) {
      setError("Completa descripción, tiempo estimado y fecha planificada de la actividad.");
      return;
    }

    setError(null);
    setGuardandoActividad(idActividad);
    const respuesta = await fallaService.actualizarActividad(idFalla, idActividad, {
      ...plan,
      id_mecanico: plan.id_mecanico || null,
    });
    setGuardandoActividad(null);

    if (respuesta.status === "success") {
      setEditandoPlan((prev) => ({ ...prev, [idActividad]: false }));
      await cargar();
      onActualizada();
    } else {
      setError(respuesta.message);
    }
  };

  const abrirNuevaActividad = () => {
    setNuevaActividad(nuevaActividadVacia((falla?.actividades?.length || 0) + 1));
    setAgregando(true);
  };

  const actualizarNuevaActividad = (campo, valor) => {
    setNuevaActividad((prev) => ({ ...prev, [campo]: valor }));
  };

  const cancelarNuevaActividad = () => {
    setAgregando(false);
  };

  const guardarNuevaActividad = async () => {
    if (!nuevaActividad.descripcion || nuevaActividad.tiempo_estimado === "" || !nuevaActividad.fecha_inicio_planificada) {
      setError("Completa descripción, tiempo estimado y fecha planificada de la actividad.");
      return;
    }

    setError(null);
    setGuardandoNueva(true);
    const respuesta = await fallaService.agregarActividad(idFalla, {
      ...nuevaActividad,
      id_mecanico: nuevaActividad.id_mecanico || null,
    });
    setGuardandoNueva(false);

    if (respuesta.status === "success") {
      setAgregando(false);
      await cargar();
      onActualizada();
    } else {
      setError(respuesta.message);
    }
  };

  const eliminarActividad = async (idActividad) => {
    setError(null);
    setBorrandoActividad(true);
    const respuesta = await fallaService.eliminarActividad(idFalla, idActividad);
    setBorrandoActividad(false);

    if (respuesta.status === "success") {
      setConfirmarEliminarActividad(null);
      await cargar();
      onActualizada();
    } else {
      setError(respuesta.message);
    }
  };

  const cerrarFalla = async () => {
    setCerrando(true);
    const respuesta = await fallaService.cerrar(idFalla, observacionesFinales);
    setCerrando(false);

    if (respuesta.status === "success") {
      await cargar();
      onActualizada();
    } else {
      setError(respuesta.message);
    }
  };

  const confirmarEliminarFalla = async () => {
    setEliminando(true);
    const respuesta = await fallaService.eliminar(idFalla);
    setEliminando(false);

    if (respuesta.status === "success") {
      onActualizada();
      onClose();
    } else {
      setPidiendoEliminar(false);
      setError(respuesta.message);
    }
  };

  const hayActividades = (falla?.actividades?.length || 0) > 0;
  const puedeCerrarFalla = hayActividades && falla.actividades.every((a) => a.fecha_inicio_real && a.fecha_fin_real);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Falla #{idFalla}
            {falla && <span className="ml-2 text-sm font-normal text-gray-500">{ESTADO_LABEL[falla.estado]}</span>}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
          </div>
        ) : !falla ? (
          <div className="p-6 text-red-600">{error || "No se pudo cargar la falla"}</div>
        ) : (
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Equipo</p>
                <p className="font-semibold">{falla.maquina?.nombre_maquina || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Horómetro</p>
                <p className="font-semibold">{falla.horometro}</p>
              </div>
              <div>
                <p className="text-gray-500">Fecha</p>
                <p className="font-semibold">{formatearFecha(falla.fecha)}</p>
              </div>
              <div>
                <p className="text-gray-500">Registrado por</p>
                <p className="font-semibold">{falla.usuario?.nombre || "-"}</p>
              </div>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Descripción de la falla</p>
              <p className="text-gray-800">{falla.descripcion}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">Plan de reparación y seguimiento</h3>
                {!agregando && falla.estado !== "cerrada" && (
                  <Button type="button" text="Agregar actividad" icon={<FaPlus />} color="blue" onClick={abrirNuevaActividad} />
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left">Descripción</th>
                      <th className="px-3 py-2 text-left">Tipo</th>
                      <th className="px-3 py-2 text-left">Orden</th>
                      <th className="px-3 py-2 text-left">T. trabajo estimado (días)</th>
                      <th className="px-3 py-2 text-left">Planificado</th>
                      <th className="px-3 py-2 text-left">Persona encargada</th>
                      <th className="px-3 py-2 text-left">Inicio real</th>
                      <th className="px-3 py-2 text-left">T. trabajo real (días)</th>
                      <th className="px-3 py-2 text-left">Fin real</th>
                      <th className="px-3 py-2 text-left">Dif. fecha</th>
                      <th className="px-3 py-2 text-left">Dif. tiempo trabajo</th>
                      <th className="px-3 py-2 text-left">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {falla.actividades.length === 0 && !agregando && (
                      <tr>
                        <td colSpan={12} className="px-3 py-4 text-center text-gray-500">
                          Aún no hay plan de reparación registrado. Puedes agregarlo cuando quieras.
                        </td>
                      </tr>
                    )}

                    {falla.actividades.map((actividad) => {
                      const pendiente = !actividad.fecha_inicio_real;
                      const enCurso = actividad.fecha_inicio_real && !actividad.fecha_fin_real;
                      const finalizada = actividad.fecha_inicio_real && actividad.fecha_fin_real;
                      const editando = modoEdicion[actividad.id];
                      const editandoElPlan = editandoPlan[actividad.id];
                      const draft = draftFechas[actividad.id] || {};
                      const draftPlanActividad = draftPlan[actividad.id] || {};
                      const estadoActual = finalizada ? "finalizada" : enCurso ? "en_curso" : "pendiente";
                      const guardando = guardandoActividad === actividad.id;

                      if (editandoElPlan) {
                        return (
                          <tr key={actividad.id} className="bg-blue-50/40">
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={draftPlanActividad.descripcion || ""}
                                onChange={(e) => actualizarDraftPlan(actividad.id, "descripcion", e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-2 py-1"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={draftPlanActividad.tipo || "I"}
                                onChange={(e) => actualizarDraftPlan(actividad.id, "tipo", e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-2 py-1"
                              >
                                <option value="I">Interno</option>
                                <option value="E">Externo</option>
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="1"
                                value={draftPlanActividad.orden || ""}
                                onChange={(e) => actualizarDraftPlan(actividad.id, "orden", e.target.value)}
                                className="w-16 border border-gray-300 rounded-md px-2 py-1"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={draftPlanActividad.tiempo_estimado ?? ""}
                                onChange={(e) => actualizarDraftPlan(actividad.id, "tiempo_estimado", e.target.value)}
                                placeholder="días"
                                className="w-20 border border-gray-300 rounded-md px-2 py-1"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="date"
                                value={draftPlanActividad.fecha_inicio_planificada || ""}
                                onChange={(e) => actualizarDraftPlan(actividad.id, "fecha_inicio_planificada", e.target.value)}
                                className="w-36 border border-gray-300 rounded-md px-2 py-1"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={draftPlanActividad.id_mecanico ?? ""}
                                onChange={(e) => actualizarDraftPlan(actividad.id, "id_mecanico", e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-2 py-1"
                              >
                                <option value="">Sin asignar</option>
                                {mecanicos.map((m) => (
                                  <option key={m.id} value={m.id}>{m.nombre}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2 text-gray-400" colSpan={5}>-</td>
                            <td className="px-3 py-2">
                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => guardarPlan(actividad.id)}
                                  disabled={guardando}
                                  className="text-blue-600 text-xs font-semibold hover:underline disabled:opacity-50"
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => cancelarEdicionPlan(actividad.id)}
                                  className="text-gray-400 text-xs hover:underline"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={actividad.id}>
                          <td className="px-3 py-2">
                            <div>{actividad.descripcion}</div>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${ACTIVIDAD_ESTADO[estadoActual].clase}`}>
                              {ACTIVIDAD_ESTADO[estadoActual].texto}
                            </span>
                          </td>
                          <td className="px-3 py-2">{TIPO_LABEL[actividad.tipo] || actividad.tipo}</td>
                          <td className="px-3 py-2">{actividad.orden}</td>
                          <td className="px-3 py-2">{actividad.tiempo_estimado} días</td>
                          <td className="px-3 py-2">{formatearFecha(actividad.fecha_inicio_planificada)}</td>
                          <td className="px-3 py-2">{actividad.mecanico?.nombre || "Sin asignar"}</td>

                          <td className="px-3 py-2">
                            {pendiente ? (
                              <input
                                type="date"
                                value={draft.inicio || ""}
                                onChange={(e) => actualizarDraft(actividad.id, "inicio", e.target.value)}
                                className="border border-gray-300 rounded-md px-2 py-1 w-36"
                              />
                            ) : (
                              formatearFecha(actividad.fecha_inicio_real)
                            )}
                          </td>

                          <td className="px-3 py-2">
                            {enCurso || editando ? (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={draft.tiempoReal ?? ""}
                                onChange={(e) => actualizarDraft(actividad.id, "tiempoReal", e.target.value)}
                                className="border border-gray-300 rounded-md px-2 py-1 w-20"
                                placeholder="días"
                              />
                            ) : finalizada ? (
                              `${actividad.tiempo_real} días`
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="px-3 py-2">
                            {enCurso || editando ? (
                              <input
                                type="date"
                                value={draft.fin || ""}
                                onChange={(e) => actualizarDraft(actividad.id, "fin", e.target.value)}
                                className="border border-gray-300 rounded-md px-2 py-1 w-36"
                              />
                            ) : finalizada ? (
                              formatearFecha(actividad.fecha_fin_real)
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="px-3 py-2">{finalizada && !editando ? `${actividad.dif_fecha_dias} días` : "-"}</td>
                          <td className="px-3 py-2">{finalizada && !editando ? `${actividad.dif_tiempo} días` : "-"}</td>

                          <td className="px-3 py-2">
                            {falla.estado === "cerrada" ? (
                              <span className="text-gray-400 text-xs">-</span>
                            ) : confirmarEliminarActividad === actividad.id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">¿Eliminar?</span>
                                <button
                                  type="button"
                                  onClick={() => eliminarActividad(actividad.id)}
                                  disabled={borrandoActividad}
                                  className="text-red-600 text-xs font-semibold hover:underline disabled:opacity-50"
                                >
                                  Sí
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmarEliminarActividad(null)}
                                  className="text-gray-400 text-xs hover:underline"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                {pendiente && (
                                  <>
                                    <button
                                      onClick={() => iniciarActividad(actividad.id)}
                                      disabled={guardando}
                                      className="text-blue-600 text-xs font-semibold hover:underline disabled:opacity-50"
                                    >
                                      Iniciar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => iniciarEdicionPlan(actividad)}
                                      className="text-gray-400 hover:text-gray-600"
                                      title="Editar plan"
                                    >
                                      <FaPen size={12} />
                                    </button>
                                  </>
                                )}
                                {enCurso && !editando && (
                                  <button
                                    onClick={() => finalizarActividad(actividad.id)}
                                    disabled={guardando}
                                    className="text-green-600 text-xs font-semibold hover:underline disabled:opacity-50"
                                  >
                                    Finalizar
                                  </button>
                                )}
                                {finalizada && !editando && (
                                  <button
                                    onClick={() => setModoEdicion((prev) => ({ ...prev, [actividad.id]: true }))}
                                    className="text-gray-400 hover:text-gray-600"
                                    title="Corregir fecha fin y tiempo real"
                                  >
                                    <FaPen size={12} />
                                  </button>
                                )}
                                {editando && (
                                  <>
                                    <button
                                      onClick={() => guardarCorreccion(actividad.id)}
                                      disabled={guardando}
                                      className="text-blue-600 text-xs font-semibold hover:underline disabled:opacity-50"
                                    >
                                      Guardar
                                    </button>
                                    <button
                                      onClick={() => setModoEdicion((prev) => ({ ...prev, [actividad.id]: false }))}
                                      className="text-gray-400 text-xs hover:underline"
                                    >
                                      Cancelar
                                    </button>
                                  </>
                                )}
                                {!editando && (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmarEliminarActividad(actividad.id)}
                                    className="text-gray-400 hover:text-red-500"
                                    title="Eliminar actividad"
                                  >
                                    <FaTrash size={12} />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {agregando && (
                      <tr className="bg-blue-50/40">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={nuevaActividad.descripcion}
                            onChange={(e) => actualizarNuevaActividad("descripcion", e.target.value)}
                            placeholder="Ej: Cambio de motor"
                            className="w-full border border-gray-300 rounded-md px-2 py-1"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={nuevaActividad.tipo}
                            onChange={(e) => actualizarNuevaActividad("tipo", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-2 py-1"
                          >
                            <option value="I">Interno</option>
                            <option value="E">Externo</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            value={nuevaActividad.orden}
                            onChange={(e) => actualizarNuevaActividad("orden", e.target.value)}
                            className="w-16 border border-gray-300 rounded-md px-2 py-1"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={nuevaActividad.tiempo_estimado}
                            onChange={(e) => actualizarNuevaActividad("tiempo_estimado", e.target.value)}
                            className="w-20 border border-gray-300 rounded-md px-2 py-1"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            value={nuevaActividad.fecha_inicio_planificada}
                            onChange={(e) => actualizarNuevaActividad("fecha_inicio_planificada", e.target.value)}
                            className="w-36 border border-gray-300 rounded-md px-2 py-1"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={nuevaActividad.id_mecanico}
                            onChange={(e) => actualizarNuevaActividad("id_mecanico", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-2 py-1"
                          >
                            <option value="">Sin asignar</option>
                            {mecanicos.map((m) => (
                              <option key={m.id} value={m.id}>{m.nombre}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-gray-400" colSpan={5}>-</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={guardarNuevaActividad}
                              disabled={guardandoNueva}
                              className="text-blue-600 text-xs font-semibold hover:underline disabled:opacity-50"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={cancelarNuevaActividad}
                              className="text-gray-400 text-xs hover:underline"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Tiempo de trabajo total estimado</p>
                <p className="font-bold text-gray-800">{falla.resumen.tiempo_total_estimado} días</p>
              </div>
              <div>
                <p className="text-gray-500">Tiempo de trabajo total real</p>
                <p className="font-bold text-gray-800">{falla.resumen.tiempo_total_real} días</p>
              </div>
              <div>
                <p className="text-gray-500">Dif. tiempo de trabajo</p>
                <p className={`font-bold ${falla.resumen.dif_tiempo_total > 0 ? "text-red-600" : "text-green-600"}`}>
                  {falla.resumen.dif_tiempo_total > 0 ? "+" : ""}
                  {falla.resumen.dif_tiempo_total} días
                </p>
              </div>
              <div>
                <p className="text-gray-500">Dif. fecha término</p>
                <p className={`font-bold ${falla.resumen.dif_fecha_total > 0 ? "text-red-600" : "text-green-600"}`}>
                  {falla.resumen.dif_fecha_total === null
                    ? "Pendiente"
                    : `${falla.resumen.dif_fecha_total > 0 ? "+" : ""}${falla.resumen.dif_fecha_total} días`}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones finales</label>
              <textarea
                value={observacionesFinales}
                onChange={(e) => setObservacionesFinales(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                disabled={falla.estado === "cerrada"}
                placeholder="Antecedentes adicionales, causas del retraso, comentarios técnicos..."
              />
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setPidiendoEliminar(true)}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700"
              >
                <FaTrash size={12} />
                Eliminar falla
              </button>

              {falla.estado !== "cerrada" && (
                <div className="flex flex-col items-end gap-1">
                  <Button
                    text="Cerrar falla"
                    icon={<FaCheckCircle />}
                    color="green"
                    onClick={cerrarFalla}
                    loading={cerrando}
                    disabled={!puedeCerrarFalla}
                  />
                  {!puedeCerrarFalla && (
                    <p className="text-xs text-gray-500">
                      {!hayActividades
                        ? "Agrega al menos una actividad al plan para poder cerrar."
                        : "Finaliza todas las actividades antes de cerrar."}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmarEliminarFallaModal
        isOpen={pidiendoEliminar}
        falla={falla}
        loading={eliminando}
        onConfirmar={confirmarEliminarFalla}
        onCancelar={() => setPidiendoEliminar(false)}
      />
    </div>
  );
};

export default FallaDetalleModal;
