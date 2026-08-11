import React, { useState, useRef, useEffect, useMemo } from "react";
import { FaTimes } from "react-icons/fa";
import Button from "../../atoms/Button/Button";
import catalogoInsumoService from "../../../context/catalogoInsumoService";

const TIPOS = ["Aceite", "Neumático"];

const BuscadorDesplegable = ({ items, getId, getLabel, value, onChange, placeholder, vacioTexto }) => {
  const [busqueda, setBusqueda] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);
  const ref = useRef(null);

  const seleccionado = useMemo(
    () => items.find((item) => String(getId(item)) === String(value)) || null,
    [items, value, getId]
  );

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return items;
    return items.filter((item) => getLabel(item).toLowerCase().includes(texto));
  }, [items, busqueda, getLabel]);

  useEffect(() => {
    const cerrarSiEsFuera = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setMostrarLista(false);
      }
    };
    document.addEventListener("mousedown", cerrarSiEsFuera);
    return () => document.removeEventListener("mousedown", cerrarSiEsFuera);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {seleccionado && !mostrarLista ? (
        <button
          type="button"
          onClick={() => setMostrarLista(true)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 flex items-center justify-between text-left bg-white"
        >
          <span className="truncate">{getLabel(seleccionado)}</span>
          <FaTimes
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
          />
        </button>
      ) : (
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onFocus={() => setMostrarLista(true)}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          autoComplete="off"
        />
      )}

      {mostrarLista && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-y-auto">
          {vacioTexto && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setBusqueda("");
                setMostrarLista(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-500 border-b border-gray-50"
            >
              {vacioTexto}
            </button>
          )}
          {filtrados.length === 0 ? (
            <p className="p-3 text-sm text-gray-500">Sin resultados.</p>
          ) : (
            filtrados.map((item) => (
              <button
                type="button"
                key={getId(item)}
                onClick={() => {
                  onChange(getId(item));
                  setBusqueda("");
                  setMostrarLista(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-50 last:border-0"
              >
                {getLabel(item)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const CatalogoInsumoFormModal = ({ opcion, categorias, responsables, onClose, onGuardado }) => {
  const editando = Boolean(opcion);

  const [idCategoria, setIdCategoria] = useState(opcion?.id_categoria ?? "");
  const [tipo, setTipo] = useState(opcion?.tipo ?? "");
  const [detalle, setDetalle] = useState(opcion?.detalle ?? "");
  const [idResponsable, setIdResponsable] = useState(opcion?.id_responsable ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!editando && !idCategoria) {
      setError("Elige una categoría.");
      return;
    }
    if (!tipo || !detalle) {
      setError("Completa tipo y detalle.");
      return;
    }

    setGuardando(true);
    const respuesta = editando
      ? await catalogoInsumoService.actualizar(opcion.id, {
          tipo,
          detalle,
          id_responsable: idResponsable || null,
        })
      : await catalogoInsumoService.crear({
          id_categoria: idCategoria,
          tipo,
          detalle,
          id_responsable: idResponsable || null,
        });
    setGuardando(false);

    if (respuesta.status === "success") {
      onGuardado();
    } else {
      setError(respuesta.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {editando ? "Editar opción del catálogo" : "Agregar opción al catálogo"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            {editando ? (
              <p className="border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-gray-600">
                {opcion.categoria?.nombre_categoria || "-"}
              </p>
            ) : (
              <BuscadorDesplegable
                items={categorias}
                getId={(c) => c.id_categoria}
                getLabel={(c) => c.nombre_categoria}
                value={idCategoria}
                onChange={setIdCategoria}
                placeholder="Busca una categoría..."
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Elegir...</option>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detalle</label>
              <input
                type="text"
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                placeholder="Ej: 15W40"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsable (opcional)</label>
            <BuscadorDesplegable
              items={responsables}
              getId={(r) => r.id}
              getLabel={(r) => r.nombre}
              value={idResponsable}
              onChange={setIdResponsable}
              placeholder="Busca un responsable..."
              vacioTexto="Sin asignar"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button type="button" text="Cancelar" color="gray" onClick={onClose} />
            <Button type="submit" text="Guardar" color="blue" loading={guardando} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default CatalogoInsumoFormModal;
