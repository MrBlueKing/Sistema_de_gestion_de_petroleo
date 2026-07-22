import React, { useState, useEffect, useCallback } from "react";
import { FaPlus, FaPen, FaTrash, FaFilter, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Button from "../../atoms/Button/Button";
import axios from "../../../lib/axios";
import catalogoInsumoService from "../../../context/catalogoInsumoService";
import mecanicoService from "../../../context/mecanicoService";

const PER_PAGE = 20;
const TIPOS = ["Aceite", "Neumático"];

const nuevaOpcionVacia = () => ({ id_categoria: "", tipo: "", detalle: "", id_responsable: "" });

const CatalogoInsumosPanel = () => {
  const [categorias, setCategorias] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [opciones, setOpciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [paginacion, setPaginacion] = useState(null);
  const [agregando, setAgregando] = useState(false);
  const [nuevaOpcion, setNuevaOpcion] = useState(nuevaOpcionVacia());
  const [guardandoNueva, setGuardandoNueva] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [draftEdicion, setDraftEdicion] = useState({});
  const [confirmarEliminarId, setConfirmarEliminarId] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filtros = { page, per_page: PER_PAGE };
      if (filtroCategoria) filtros.id_categoria = filtroCategoria;
      if (filtroTipo) filtros.tipo = filtroTipo;
      if (filtroActivo) filtros.activo = filtroActivo;
      if (busqueda) filtros.busqueda = busqueda;

      const [respCategorias, respOpciones] = await Promise.all([
        axios.get("/api/categorias"),
        catalogoInsumoService.listar(filtros),
      ]);
      setCategorias(respCategorias.data.data || []);
      if (respOpciones.status === "success") {
        setOpciones(respOpciones.data);
        setPaginacion(respOpciones.pagination || null);
      } else {
        setError(respOpciones.message);
      }
    } catch (e) {
      setError("No se pudo cargar el catálogo.");
    }
    setLoading(false);
  }, [page, filtroCategoria, filtroTipo, filtroActivo, busqueda]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    setPage(1);
  }, [filtroCategoria, filtroTipo, filtroActivo, busqueda]);

  useEffect(() => {
    const cargarResponsables = async () => {
      const respuesta = await mecanicoService.listar({ activo: 1 });
      if (respuesta.status === "success") {
        setResponsables(respuesta.data);
      }
    };
    cargarResponsables();
  }, []);

  const abrirNuevaOpcion = () => {
    setNuevaOpcion(nuevaOpcionVacia());
    setAgregando(true);
  };

  const guardarNuevaOpcion = async () => {
    if (!nuevaOpcion.id_categoria || !nuevaOpcion.tipo || !nuevaOpcion.detalle) {
      setError("Completa categoría, tipo y detalle.");
      return;
    }
    setError(null);
    setGuardandoNueva(true);
    const respuesta = await catalogoInsumoService.crear({
      ...nuevaOpcion,
      id_responsable: nuevaOpcion.id_responsable || null,
    });
    setGuardandoNueva(false);

    if (respuesta.status === "success") {
      setAgregando(false);
      await cargar();
    } else {
      setError(respuesta.message);
    }
  };

  const iniciarEdicion = (opcion) => {
    setDraftEdicion({
      tipo: opcion.tipo,
      detalle: opcion.detalle,
      id_responsable: opcion.id_responsable ?? "",
    });
    setEditandoId(opcion.id);
  };

  const guardarEdicion = async (id) => {
    if (!draftEdicion.tipo || !draftEdicion.detalle) {
      setError("Completa tipo y detalle.");
      return;
    }
    setError(null);
    const respuesta = await catalogoInsumoService.actualizar(id, {
      ...draftEdicion,
      id_responsable: draftEdicion.id_responsable || null,
    });
    if (respuesta.status === "success") {
      setEditandoId(null);
      await cargar();
    } else {
      setError(respuesta.message);
    }
  };

  const alternarActivo = async (opcion) => {
    setError(null);
    const respuesta = await catalogoInsumoService.actualizar(opcion.id, { activo: !opcion.activo });
    if (respuesta.status === "success") {
      await cargar();
    } else {
      setError(respuesta.message);
    }
  };

  const eliminarOpcion = async (id) => {
    setError(null);
    const respuesta = await catalogoInsumoService.eliminar(id);
    if (respuesta.status === "success") {
      setConfirmarEliminarId(null);
      await cargar();
    } else {
      setError(respuesta.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Catálogo de Neumáticos y Aceites</h2>
          <p className="text-sm text-gray-500">
            Opciones disponibles por categoría de máquina, para elegir al registrar un cambio.
          </p>
        </div>
        {!agregando && (
          <Button type="button" text="Agregar opción" icon={<FaPlus />} color="blue" onClick={abrirNuevaOpcion} />
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap items-center gap-3">
        <FaFilter className="text-gray-400" />
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>
          ))}
        </select>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={filtroActivo}
          onChange={(e) => setFiltroActivo(e.target.value)}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        >
          <option value="">Activos e inactivos</option>
          <option value="1">Solo activos</option>
          <option value="0">Solo inactivos</option>
        </select>

        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por detalle o responsable..."
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm flex-1 min-w-[200px]"
        />
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Categoría</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left">Detalle</th>
              <th className="px-3 py-2 text-left">Responsable</th>
              <th className="px-3 py-2 text-left">Activo</th>
              <th className="px-3 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agregando && (
              <tr className="bg-blue-50/40">
                <td className="px-3 py-2">
                  <select
                    value={nuevaOpcion.id_categoria}
                    onChange={(e) => setNuevaOpcion((prev) => ({ ...prev, id_categoria: e.target.value }))}
                    className="border border-gray-300 rounded-md px-2 py-1 w-full"
                  >
                    <option value="">Elegir...</option>
                    {categorias.map((c) => (
                      <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={nuevaOpcion.tipo}
                    onChange={(e) => setNuevaOpcion((prev) => ({ ...prev, tipo: e.target.value }))}
                    className="border border-gray-300 rounded-md px-2 py-1 w-full"
                  >
                    <option value="">Elegir...</option>
                    {TIPOS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={nuevaOpcion.detalle}
                    onChange={(e) => setNuevaOpcion((prev) => ({ ...prev, detalle: e.target.value }))}
                    placeholder="Ej: 15W40"
                    className="border border-gray-300 rounded-md px-2 py-1 w-full"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={nuevaOpcion.id_responsable}
                    onChange={(e) => setNuevaOpcion((prev) => ({ ...prev, id_responsable: e.target.value }))}
                    className="border border-gray-300 rounded-md px-2 py-1 w-full"
                  >
                    <option value="">Sin asignar</option>
                    {responsables.map((r) => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-gray-400">-</td>
                <td className="px-3 py-2">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={guardarNuevaOpcion}
                      disabled={guardandoNueva}
                      className="text-blue-600 text-xs font-semibold hover:underline disabled:opacity-50"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgregando(false)}
                      className="text-gray-400 text-xs hover:underline"
                    >
                      Cancelar
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {!loading && opciones.length === 0 && !agregando && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                  No hay opciones registradas todavía.
                </td>
              </tr>
            )}

            {opciones.map((opcion) => {
              const editando = editandoId === opcion.id;

              if (editando) {
                return (
                  <tr key={opcion.id} className="bg-blue-50/40">
                    <td className="px-3 py-2 text-gray-600">{opcion.categoria?.nombre_categoria}</td>
                    <td className="px-3 py-2">
                      <select
                        value={draftEdicion.tipo}
                        onChange={(e) => setDraftEdicion((prev) => ({ ...prev, tipo: e.target.value }))}
                        className="border border-gray-300 rounded-md px-2 py-1 w-full"
                      >
                        {TIPOS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={draftEdicion.detalle}
                        onChange={(e) => setDraftEdicion((prev) => ({ ...prev, detalle: e.target.value }))}
                        className="border border-gray-300 rounded-md px-2 py-1 w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={draftEdicion.id_responsable ?? ""}
                        onChange={(e) => setDraftEdicion((prev) => ({ ...prev, id_responsable: e.target.value }))}
                        className="border border-gray-300 rounded-md px-2 py-1 w-full"
                      >
                        <option value="">Sin asignar</option>
                        {responsables.map((r) => (
                          <option key={r.id} value={r.id}>{r.nombre}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-gray-400">-</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => guardarEdicion(opcion.id)}
                          className="text-blue-600 text-xs font-semibold hover:underline"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditandoId(null)}
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
                <tr key={opcion.id} className={!opcion.activo ? "opacity-50" : ""}>
                  <td className="px-3 py-2">{opcion.categoria?.nombre_categoria || "-"}</td>
                  <td className="px-3 py-2">{opcion.tipo}</td>
                  <td className="px-3 py-2">{opcion.detalle}</td>
                  <td className="px-3 py-2">{opcion.responsable?.nombre || "Sin asignar"}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => alternarActivo(opcion)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        opcion.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                      title="Click para activar/desactivar"
                    >
                      {opcion.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    {confirmarEliminarId === opcion.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">¿Eliminar?</span>
                        <button
                          type="button"
                          onClick={() => eliminarOpcion(opcion.id)}
                          className="text-red-600 text-xs font-semibold hover:underline"
                        >
                          Sí
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmarEliminarId(null)}
                          className="text-gray-400 text-xs hover:underline"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => iniciarEdicion(opcion)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Editar"
                        >
                          <FaPen size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmarEliminarId(opcion.id)}
                          className="text-gray-400 hover:text-red-500"
                          title="Eliminar"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && paginacion && paginacion.total > 0 && (
        <div className="flex items-center justify-between px-1 text-sm text-gray-500">
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
  );
};

export default CatalogoInsumosPanel;
