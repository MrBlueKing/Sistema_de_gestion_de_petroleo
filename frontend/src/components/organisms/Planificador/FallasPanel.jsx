import React, { useState, useEffect, useCallback } from "react";
import { FaTools, FaPlus, FaFilter, FaTrash, FaUserCog, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Button from "../../atoms/Button/Button";
import fallaService from "../../../context/fallaService";
import { getAuthUser } from "../../../utils/session";
import FallaFormModal from "./FallaFormModal";
import FallaDetalleModal from "./FallaDetalleModal";
import ConfirmarEliminarFallaModal from "./ConfirmarEliminarFallaModal";
import MecanicosModal from "./MecanicosModal";

const PER_PAGE = 15;

const ESTADO_LABEL = {
  abierta: {
    texto: "Abierta",
    clase: "bg-yellow-100 text-yellow-800 border-yellow-200",
    fila: "bg-yellow-50 hover:bg-yellow-100",
  },
  en_reparacion: {
    texto: "En reparación",
    clase: "bg-blue-100 text-blue-800 border-blue-200",
    fila: "bg-blue-50 hover:bg-blue-100",
  },
  cerrada: {
    texto: "Cerrada",
    clase: "bg-green-100 text-green-800 border-green-200",
    fila: "bg-green-50 hover:bg-green-100",
  },
};

const FallasPanel = () => {
  const usuario = getAuthUser();
  const [fallas, setFallas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroMaquina, setFiltroMaquina] = useState("");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [maquinas, setMaquinas] = useState([]);
  const [page, setPage] = useState(1);
  const [paginacion, setPaginacion] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showMecanicosModal, setShowMecanicosModal] = useState(false);
  const [fallaSeleccionada, setFallaSeleccionada] = useState(null);
  const [fallaAEliminar, setFallaAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarFallas = useCallback(async () => {
    setLoading(true);
    setError(null);
    const filtros = { page, per_page: PER_PAGE };
    if (filtroEstado) filtros.estado = filtroEstado;
    if (filtroMaquina) filtros.id_maquina = filtroMaquina;
    if (filtroFechaDesde) filtros.fecha_desde = filtroFechaDesde;
    if (filtroFechaHasta) filtros.fecha_hasta = filtroFechaHasta;
    if (busqueda) filtros.busqueda = busqueda;

    const respuesta = await fallaService.listar(filtros);
    if (respuesta.status === "success") {
      setFallas(respuesta.data);
      setPaginacion(respuesta.pagination || null);
    } else {
      setError(respuesta.message);
    }
    setLoading(false);
  }, [page, filtroEstado, filtroMaquina, filtroFechaDesde, filtroFechaHasta, busqueda]);

  useEffect(() => {
    cargarFallas();
  }, [cargarFallas]);

  useEffect(() => {
    setPage(1);
  }, [filtroEstado, filtroMaquina, filtroFechaDesde, filtroFechaHasta, busqueda]);

  useEffect(() => {
    const cargarMaquinas = async () => {
      const respuesta = await fallaService.listarMaquinas();
      if (respuesta.status === "success") {
        setMaquinas(respuesta.data);
      }
    };
    cargarMaquinas();
  }, []);

  const handleFallaCreada = () => {
    setShowFormModal(false);
    cargarFallas();
  };

  const handleFallaActualizada = () => {
    cargarFallas();
  };

  const pedirEliminarFalla = (e, falla) => {
    e.stopPropagation();
    setFallaAEliminar(falla);
  };

  const confirmarEliminarFalla = async () => {
    setEliminando(true);
    const respuesta = await fallaService.eliminar(fallaAEliminar.id);
    setEliminando(false);

    if (respuesta.status === "success") {
      setFallaAEliminar(null);
      cargarFallas();
    } else {
      setError(respuesta.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaTools className="text-orange-500" />
              Programa de Gestión y Análisis de Fallas
            </h1>
            <p className="text-gray-500 text-sm">
              Hola {usuario?.nombre || "Planificador"}, registra y da seguimiento a las fallas de los equipos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              text="Gestionar personal"
              icon={<FaUserCog />}
              color="gray"
              onClick={() => setShowMecanicosModal(true)}
            />
            <Button
              text="Registrar falla"
              icon={<FaPlus />}
              color="orange"
              onClick={() => setShowFormModal(true)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 mb-4 flex flex-wrap items-center gap-3">
          <FaFilter className="text-gray-400" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="abierta">Abierta</option>
            <option value="en_reparacion">En reparación</option>
            <option value="cerrada">Cerrada</option>
          </select>

          <select
            value={filtroMaquina}
            onChange={(e) => setFiltroMaquina(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Todos los equipos</option>
            {maquinas.map((m) => (
              <option key={m.id_maquina} value={m.id_maquina}>{m.equipo}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <label>Desde</label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <label>Hasta</label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por descripción o equipo..."
            className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1 min-w-[200px]"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
            </div>
          ) : fallas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay fallas registradas{filtroEstado && " con este estado"}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Falla</th>
                    <th className="px-4 py-3 text-left">Equipo</th>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Descripción</th>
                    <th className="px-4 py-3 text-left">Actividades</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fallas.map((falla) => (
                    <tr
                      key={falla.id}
                      className={`cursor-pointer transition-colors ${ESTADO_LABEL[falla.estado]?.fila || "hover:bg-orange-50"}`}
                      onClick={() => setFallaSeleccionada(falla.id)}
                    >
                      <td className="px-4 py-3 font-semibold text-gray-800">#{falla.id}</td>
                      <td className="px-4 py-3">{falla.maquina?.nombre_maquina || "-"}</td>
                      <td className="px-4 py-3">{new Date(falla.fecha).toLocaleDateString("es-CL")}</td>
                      <td className="px-4 py-3 max-w-xs truncate">{falla.descripcion}</td>
                      <td className="px-4 py-3">{falla.actividades_count}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${ESTADO_LABEL[falla.estado]?.clase || ""}`}>
                          {ESTADO_LABEL[falla.estado]?.texto || falla.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => pedirEliminarFalla(e, falla)}
                          className="text-gray-400 hover:text-red-600"
                          title="Eliminar falla"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && paginacion && paginacion.total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
              <span>
                Mostrando {(paginacion.current_page - 1) * paginacion.per_page + 1}
                {"–"}
                {Math.min(paginacion.current_page * paginacion.per_page, paginacion.total)} de {paginacion.total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={paginacion.current_page <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <FaChevronLeft size={10} /> Anterior
                </button>
                <span className="text-gray-400">
                  Página {paginacion.current_page} de {paginacion.last_page}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(paginacion.last_page, p + 1))}
                  disabled={paginacion.current_page >= paginacion.last_page}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Siguiente <FaChevronRight size={10} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showMecanicosModal && (
        <MecanicosModal onClose={() => setShowMecanicosModal(false)} />
      )}

      {showFormModal && (
        <FallaFormModal
          onClose={() => setShowFormModal(false)}
          onCreada={handleFallaCreada}
        />
      )}

      {fallaSeleccionada && (
        <FallaDetalleModal
          idFalla={fallaSeleccionada}
          onClose={() => setFallaSeleccionada(null)}
          onActualizada={handleFallaActualizada}
        />
      )}

      <ConfirmarEliminarFallaModal
        isOpen={!!fallaAEliminar}
        falla={fallaAEliminar}
        loading={eliminando}
        onConfirmar={confirmarEliminarFalla}
        onCancelar={() => setFallaAEliminar(null)}
      />
    </div>
  );
};

export default FallasPanel;
