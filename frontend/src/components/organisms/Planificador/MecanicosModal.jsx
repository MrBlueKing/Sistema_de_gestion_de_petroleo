import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FaTimes, FaPlus } from "react-icons/fa";
import Button from "../../atoms/Button/Button";
import SearchableDropdown from "../../molecules/SearchableDropdown";
import axios from "../../../lib/axios";
import mecanicoService from "../../../context/mecanicoService";

const MecanicosModal = ({ onClose, onCambio }) => {
  const [mecanicos, setMecanicos] = useState([]);
  const [personalBodega, setPersonalBodega] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [actualizandoId, setActualizandoId] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [respuestaMecanicos, respuestaBodega] = await Promise.all([
        mecanicoService.listar(),
        axios.get("/api/personal-bodega"),
      ]);

      if (respuestaMecanicos.status === "success") {
        setMecanicos(respuestaMecanicos.data);
      } else {
        setError(respuestaMecanicos.message);
      }

      const personas = (respuestaBodega.data?.data || []).filter(
        (item) => item.Cargo !== "Maquinaria" && item.Rut && item.Nombre
      );
      setPersonalBodega(personas);
    } catch (err) {
      setError("No se pudo cargar el personal desde bodega: " + (err.message || "error desconocido"));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const rutsYaAgregados = useMemo(
    () => new Set(mecanicos.filter((m) => m.rut).map((m) => m.rut.trim().toLowerCase())),
    [mecanicos]
  );

  const opcionesCandidatos = useMemo(() => {
    return personalBodega
      .filter((p) => !rutsYaAgregados.has(p.Rut.trim().toLowerCase()))
      .map((p) => ({
        label: `${p.Rut} - ${p.Nombre}${p.Cargo ? ` (${p.Cargo})` : ""}`,
        value: { rut: p.Rut, nombre: p.Nombre, cargo: p.Cargo || "" },
      }));
  }, [personalBodega, rutsYaAgregados]);

  const handleSeleccionarCandidato = (label) => {
    if (!label) {
      setCandidatoSeleccionado(null);
      return;
    }
    const opcion = opcionesCandidatos.find((o) => o.label === label);
    setCandidatoSeleccionado(opcion ? opcion.value : null);
  };

  const agregarMecanico = async () => {
    if (!candidatoSeleccionado) return;

    setError(null);
    setGuardando(true);
    const respuesta = await mecanicoService.crear({
      nombre: candidatoSeleccionado.nombre,
      rut: candidatoSeleccionado.rut,
    });
    setGuardando(false);

    if (respuesta.status === "success") {
      setCandidatoSeleccionado(null);
      await cargar();
      onCambio?.();
    } else {
      setError(respuesta.message);
    }
  };

  const alternarActivo = async (mecanico) => {
    setError(null);
    setActualizandoId(mecanico.id);
    const respuesta = await mecanicoService.actualizar(mecanico.id, { activo: !mecanico.activo });
    setActualizandoId(null);

    if (respuesta.status === "success") {
      await cargar();
      onCambio?.();
    } else {
      setError(respuesta.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Gestionar personal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar persona
            </label>
            <div className="space-y-2">
              <SearchableDropdown
                options={opcionesCandidatos}
                selected={candidatoSeleccionado ? `${candidatoSeleccionado.rut} - ${candidatoSeleccionado.nombre}` : null}
                onSelect={handleSeleccionarCandidato}
                placeholder="Busca por RUT o nombre..."
                disabled={loading}
                maxHeight="55vh"
              />
              <Button
                text="Agregar"
                icon={<FaPlus />}
                color="orange"
                onClick={agregarMecanico}
                disabled={!candidatoSeleccionado}
                loading={guardando}
                className="w-full"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              La lista se obtiene del personal de bodega y ya excluye a quienes están agregados.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : mecanicos.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-4">Aún no hay personas registradas.</p>
          ) : (
            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
              {mecanicos.map((mecanico) => (
                <li key={mecanico.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className={`text-sm ${mecanico.activo ? "text-gray-800" : "text-gray-400 line-through"}`}>
                    {mecanico.nombre}
                  </span>
                  <button
                    type="button"
                    onClick={() => alternarActivo(mecanico)}
                    disabled={actualizandoId === mecanico.id}
                    className={`text-xs font-semibold px-3 py-1 rounded-full border disabled:opacity-50 ${
                      mecanico.activo
                        ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                        : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    {mecanico.activo ? "Activo" : "Inactivo"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MecanicosModal;
