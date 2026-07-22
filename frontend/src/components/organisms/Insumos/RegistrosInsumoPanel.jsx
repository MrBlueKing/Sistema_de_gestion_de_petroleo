import React, { useState, useEffect, useCallback } from "react";
import { FaPlus, FaTrash, FaUserCog } from "react-icons/fa";
import Button from "../../atoms/Button/Button";
import registroInsumoService from "../../../context/registroInsumoService";
import RegistroInsumoFormModal from "./RegistroInsumoFormModal";
import MecanicosModal from "../Planificador/MecanicosModal";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const formatearFecha = (fecha) => {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleDateString("es-CL");
};

const RegistrosInsumoPanel = () => {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarMecanicos, setMostrarMecanicos] = useState(false);
  const [confirmarEliminarId, setConfirmarEliminarId] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    const respuesta = await registroInsumoService.listar({ mes, anio });
    if (respuesta.status === "success") {
      setRegistros(respuesta.data);
    } else {
      setError(respuesta.message);
    }
    setLoading(false);
  }, [mes, anio]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const eliminarRegistro = async (id) => {
    setError(null);
    const respuesta = await registroInsumoService.eliminar(id);
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
          <h2 className="text-xl font-bold text-gray-900">Registro de cambios</h2>
          <p className="text-sm text-gray-500">Neumáticos y aceites por equipo.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" text="Gestionar personal" icon={<FaUserCog />} color="gray" onClick={() => setMostrarMecanicos(true)} />
          <Button type="button" text="Registrar cambio" icon={<FaPlus />} color="orange" onClick={() => setMostrarFormulario(true)} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      <div className="flex items-center gap-2">
        <select
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        >
          {MESES.map((nombre, index) => (
            <option key={nombre} value={index + 1}>{nombre}</option>
          ))}
        </select>
        <input
          type="number"
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm w-24"
        />
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Equipo</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left">Detalle</th>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Observaciones</th>
              <th className="px-3 py-2 text-left">Persona encargada</th>
              <th className="px-3 py-2 text-left">Registrado por</th>
              <th className="px-3 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!loading && registros.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                  No hay registros para {MESES[mes - 1]} {anio}.
                </td>
              </tr>
            )}
            {registros.map((registro) => (
              <tr key={registro.id}>
                <td className="px-3 py-2">{registro.maquina?.nombre_maquina || "-"}</td>
                <td className="px-3 py-2">{registro.catalogo_insumo?.tipo}</td>
                <td className="px-3 py-2">{registro.catalogo_insumo?.detalle}</td>
                <td className="px-3 py-2">{formatearFecha(registro.fecha)}</td>
                <td className="px-3 py-2 text-gray-500">{registro.observaciones || "-"}</td>
                <td className="px-3 py-2 text-gray-500">{registro.responsable?.nombre || "Sin asignar"}</td>
                <td className="px-3 py-2 text-gray-500">{registro.usuario?.nombre || "-"}</td>
                <td className="px-3 py-2">
                  {confirmarEliminarId === registro.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">¿Eliminar?</span>
                      <button type="button" onClick={() => eliminarRegistro(registro.id)} className="text-red-600 text-xs font-semibold hover:underline">Sí</button>
                      <button type="button" onClick={() => setConfirmarEliminarId(null)} className="text-gray-400 text-xs hover:underline">No</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirmarEliminarId(registro.id)} className="text-gray-400 hover:text-red-500" title="Eliminar">
                      <FaTrash size={12} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarFormulario && (
        <RegistroInsumoFormModal
          onClose={() => setMostrarFormulario(false)}
          onCreado={() => {
            setMostrarFormulario(false);
            cargar();
          }}
        />
      )}

      {mostrarMecanicos && (
        <MecanicosModal onClose={() => setMostrarMecanicos(false)} />
      )}
    </div>
  );
};

export default RegistrosInsumoPanel;
