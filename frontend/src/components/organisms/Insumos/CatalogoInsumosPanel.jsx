import React, { useState, useEffect, useCallback } from "react";
import { FaPlus, FaPen, FaTrash, FaFilter, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Button from "../../atoms/Button/Button";
import axios from "../../../lib/axios";
import catalogoInsumoService from "../../../context/catalogoInsumoService";
import mecanicoService from "../../../context/mecanicoService";
import CatalogoInsumoFormModal from "./CatalogoInsumoFormModal";

const PER_PAGE = 20;
const TIPOS = ["Aceite", "Neumático"];

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
  const [mostrarModal, setMostrarModal] = useState(false);
  const [opcionEditar, setOpcionEditar] = useState(null);
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
    setOpcionEditar(null);
    setMostrarModal(true);
  };

  const iniciarEdicion = (opcion) => {
    setOpcionEditar(opcion);
    setMostrarModal(true);
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
        <Button type="button" text="Agregar opción" icon={<FaPlus />} color="blue" onClick={abrirNuevaOpcion} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
          <FaFilter className="text-gray-400" /> Buscar / filtrar en el catálogo
        </p>
        <div className="flex flex-wrap items-center gap-3">
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
            {!loading && opciones.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                  No hay opciones registradas todavía.
                </td>
              </tr>
            )}

            {opciones.map((opcion) => (
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
            ))}
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

      {mostrarModal && (
        <CatalogoInsumoFormModal
          opcion={opcionEditar}
          categorias={categorias}
          responsables={responsables}
          onClose={() => setMostrarModal(false)}
          onGuardado={() => {
            setMostrarModal(false);
            cargar();
          }}
        />
      )}
    </div>
  );
};

export default CatalogoInsumosPanel;
