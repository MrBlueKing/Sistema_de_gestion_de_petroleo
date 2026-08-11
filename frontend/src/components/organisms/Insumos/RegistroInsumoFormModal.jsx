import React, { useState, useEffect, useRef, useMemo } from "react";
import { FaTimes } from "react-icons/fa";
import Button from "../../atoms/Button/Button";
import axios from "../../../lib/axios";
import fallaService from "../../../context/fallaService";
import catalogoInsumoService from "../../../context/catalogoInsumoService";
import registroInsumoService from "../../../context/registroInsumoService";
import mecanicoService from "../../../context/mecanicoService";

const RegistroInsumoFormModal = ({ onClose, onCreado }) => {
  const [maquinas, setMaquinas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [idResponsable, setIdResponsable] = useState("");
  const [idMaquina, setIdMaquina] = useState("");
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState(null);
  const [busquedaEquipo, setBusquedaEquipo] = useState("");
  const [mostrarListaEquipos, setMostrarListaEquipos] = useState(false);
  const [tipo, setTipo] = useState("");
  const [idCatalogoInsumo, setIdCatalogoInsumo] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const equipoRef = useRef(null);

  useEffect(() => {
    const cargar = async () => {
      const [respMaquinas, respCategorias, respCatalogo] = await Promise.all([
        fallaService.listarMaquinas(),
        axios.get("/api/categorias"),
        catalogoInsumoService.listar({ activo: true, per_page: 1000 }),
      ]);
      if (respMaquinas.status === "success") setMaquinas(respMaquinas.data);
      setCategorias(respCategorias.data.data || []);
      if (respCatalogo.status === "success") setCatalogo(respCatalogo.data);
    };
    cargar();
  }, []);

  useEffect(() => {
    const cargarResponsables = async () => {
      const respuesta = await mecanicoService.listar({ activo: 1 });
      if (respuesta.status === "success") {
        setResponsables(respuesta.data);
      }
    };
    cargarResponsables();
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

  const maquinasFiltradas = useMemo(() => {
    const texto = busquedaEquipo.trim().toLowerCase();
    if (!texto) return maquinas;
    return maquinas.filter(
      (m) => m.equipo?.toLowerCase().includes(texto) || m.patente?.toLowerCase().includes(texto)
    );
  }, [maquinas, busquedaEquipo]);

  const idCategoriaMaquina = useMemo(() => {
    if (!maquinaSeleccionada) return null;
    const cat = categorias.find((c) => c.nombre_categoria === maquinaSeleccionada.categoria);
    return cat ? cat.id_categoria : null;
  }, [maquinaSeleccionada, categorias]);

  const opcionesCategoria = useMemo(() => {
    if (!idCategoriaMaquina) return [];
    return catalogo.filter((o) => o.id_categoria === idCategoriaMaquina);
  }, [catalogo, idCategoriaMaquina]);

  const tiposDisponibles = useMemo(() => {
    return Array.from(new Set(opcionesCategoria.map((o) => o.tipo)));
  }, [opcionesCategoria]);

  const detallesDisponibles = useMemo(() => {
    return opcionesCategoria.filter((o) => o.tipo === tipo);
  }, [opcionesCategoria, tipo]);

  const seleccionarMaquina = (maquina) => {
    setIdMaquina(maquina.id_maquina);
    setMaquinaSeleccionada(maquina);
    setBusquedaEquipo("");
    setMostrarListaEquipos(false);
    setTipo("");
    setIdCatalogoInsumo("");
  };

  const limpiarEquipoSeleccionado = (e) => {
    e.stopPropagation();
    setIdMaquina("");
    setMaquinaSeleccionada(null);
    setTipo("");
    setIdCatalogoInsumo("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!idMaquina || !idCatalogoInsumo || !fecha) {
      setError("Completa equipo, tipo, detalle y fecha.");
      return;
    }

    setGuardando(true);
    const respuesta = await registroInsumoService.crear({
      id_maquina: idMaquina,
      id_catalogo_insumo: idCatalogoInsumo,
      fecha,
      observaciones: observaciones || null,
      id_responsable: idResponsable || null,
    });
    setGuardando(false);

    if (respuesta.status === "success") {
      onCreado();
    } else {
      setError(respuesta.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Registrar cambio</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
          )}

          <div className="relative" ref={equipoRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
            {maquinaSeleccionada && !mostrarListaEquipos ? (
              <button
                type="button"
                onClick={() => setMostrarListaEquipos(true)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 flex items-center justify-between text-left bg-white"
              >
                <span className="truncate">
                  {maquinaSeleccionada.equipo}
                  {maquinaSeleccionada.patente ? ` (${maquinaSeleccionada.patente})` : ""}
                </span>
                <FaTimes onClick={limpiarEquipoSeleccionado} className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2" />
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
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
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
                      <div className="text-xs text-gray-500">{m.patente || "sin patente"} · {m.categoria}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {maquinaSeleccionada && !idCategoriaMaquina && (
            <p className="text-xs text-amber-600">
              No se encontró la categoría de este equipo, no se puede filtrar el catálogo.
            </p>
          )}

          {maquinaSeleccionada && idCategoriaMaquina && opcionesCategoria.length === 0 && (
            <p className="text-xs text-amber-600">
              Todavía no hay opciones cargadas en el catálogo para la categoría "{maquinaSeleccionada.categoria}".
              Pídele a un planificador que las agregue en la pestaña "Catálogo".
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value);
                  setIdCatalogoInsumo("");
                }}
                disabled={tiposDisponibles.length === 0}
                className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
              >
                <option value="">Elegir...</option>
                {tiposDisponibles.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detalle</label>
              <select
                value={idCatalogoInsumo}
                onChange={(e) => setIdCatalogoInsumo(e.target.value)}
                disabled={!tipo}
                className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
              >
                <option value="">Elegir...</option>
                {detallesDisponibles.map((o) => (
                  <option key={o.id} value={o.id}>{o.detalle}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Persona encargada (opcional)</label>
            <select
              value={idResponsable}
              onChange={(e) => setIdResponsable(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Sin asignar</option>
              {responsables.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Si la persona no aparece, agrégala desde "Gestionar personal" en esta pestaña.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones (opcional)</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button type="button" text="Cancelar" color="gray" onClick={onClose} />
            <Button type="submit" text="Registrar" color="orange" loading={guardando} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistroInsumoFormModal;
