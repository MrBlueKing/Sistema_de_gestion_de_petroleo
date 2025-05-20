import React, { useState, useEffect } from "react";
import { FaGasPump, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import axios from "../../lib/axios";

// Componente de tarjeta para cada estanque
const EstanqueTarjeta = ({ estanque, seleccionado, onSelect, disabled }) => {
  // Cálculo del porcentaje de nivel actual para la barra de progreso
  const porcentaje = Math.min(
    Math.round((estanque.stock_actual / estanque.capacidad) * 100),
    100
  );

  // Determinar el color de la barra de progreso según el nivel
  const getColorBarra = (nivel) => {
    if (nivel < 20) return "bg-red-500";
    if (nivel < 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <button
      onClick={() => onSelect(estanque)}
      disabled={disabled}
      className={`w-full text-left border rounded-lg overflow-hidden transition-all duration-200 ${
        disabled
          ? "opacity-60 cursor-not-allowed bg-gray-100"
          : seleccionado
          ? "border-orange-500 bg-orange-50 shadow-md"
          : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
      }`}
    >
      <div className="p-3 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-800">{estanque.nombre}</h3>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              porcentaje < 20
                ? "bg-red-100 text-red-800"
                : porcentaje < 50
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {porcentaje}%
          </span>
        </div>
      </div>

      <div className="p-3">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">
            Capacidad: {estanque.capacidad.toLocaleString()} L
          </span>
          <span className="font-medium">
            {estanque.stock_actual.toLocaleString()} L disponibles
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getColorBarra(porcentaje)}`}
            style={{ width: `${porcentaje}%` }}
          ></div>
        </div>

        {porcentaje < 20 && (
          <div className="mt-2 text-xs text-red-600 flex items-center">
            <FaExclamationTriangle className="mr-1" />
            <span>Nivel crítico</span>
          </div>
        )}
      </div>
    </button>
  );
};

const SelectorEstanques = ({
  idFaena,
  onEstanqueSelect,
  estanqueSeleccionado,
  litrosRequeridos,
  disabled = false,
}) => {
  const [estanques, setEstanques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  // Cargar estanques al montar el componente o cuando cambia la faena
  useEffect(() => {
    if (!idFaena) {
      setError("No se ha especificado una faena");
      setLoading(false);
      return;
    }

    const cargarEstanques = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = JSON.parse(localStorage.getItem("authToken"))?.token;
        const response = await axios.get(`/api/estanques/${idFaena}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          // Agregar stock_actual a cada estanque (esto debería venir del backend)
          // Si ya viene en la respuesta, puedes omitir esta transformación
          const estanquesConStock = response.data.data.map((estanque) => ({
            ...estanque,
            stock_actual: estanque.stock_actual || 0, // Usar stock real si existe
          }));

          setEstanques(estanquesConStock);
        } else {
          throw new Error(
            response.data.message || "Error al cargar los estanques"
          );
        }
      } catch (error) {
        console.error("Error al cargar estanques:", error);
        setError(
          error.message || "No se pudieron cargar los estanques. Intente nuevamente."
        );
      } finally {
        setLoading(false);
      }
    };

    cargarEstanques();
  }, [idFaena]);

  // Filtrar estanques por disponibilidad según los litros requeridos
  const estanquesDisponibles = estanques.filter(
    (estanque) => estanque.stock_actual >= (litrosRequeridos || 0)
  );

  // Estanques a mostrar según el toggle
  const estanquesMostrados = mostrarTodos ? estanques : estanquesDisponibles;

  // Si no hay estanques, mostrar mensaje indicativo
  if (!loading && estanques.length === 0) {
    return (
      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-center">
        <div className="flex justify-center mb-2">
          <FaInfoCircle className="text-yellow-500 text-xl" />
        </div>
        <h4 className="font-medium text-yellow-800 mb-1">No hay estanques</h4>
        <p className="text-sm text-yellow-700">
          No se encontraron estanques registrados para esta faena.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="p-3 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
        <h3 className="font-medium text-gray-800 flex items-center">
          <FaGasPump className="text-orange-500 mr-2" />
          Seleccione Estanque
        </h3>
        {estanques.length > 0 && (
          <div className="text-xs text-gray-500">
            {estanques.length} estanque{estanques.length !== 1 ? "s" : ""} disponible
            {estanques.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Cargando estanques...</p>
        </div>
      ) : error ? (
        <div className="p-4 text-center">
          <div className="flex justify-center mb-2">
            <FaExclamationTriangle className="text-red-500 text-xl" />
          </div>
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <>
          {/* Toggle para mostrar todos los estanques */}
          {estanquesDisponibles.length < estanques.length && (
            <div className="px-3 py-2 bg-gray-50 border-b flex justify-end">
              <label className="inline-flex items-center cursor-pointer">
                <span className="text-xs text-gray-500 mr-2">
                  Mostrar todos los estanques
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={mostrarTodos}
                    onChange={() => setMostrarTodos(!mostrarTodos)}
                    disabled={disabled}
                  />
                  <div
                    className={`block w-9 h-5 rounded-full ${
                      mostrarTodos ? "bg-orange-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition ${
                      mostrarTodos ? "transform translate-x-4" : ""
                    }`}
                  ></div>
                </div>
              </label>
            </div>
          )}

          {/* Lista de estanques */}
          <div className="max-h-[300px] overflow-y-auto p-3 grid gap-3 grid-cols-1 md:grid-cols-2">
            {estanquesMostrados.length > 0 ? (
              estanquesMostrados.map((estanque) => (
                <EstanqueTarjeta
                  key={estanque.id_estanque}
                  estanque={estanque}
                  seleccionado={
                    estanqueSeleccionado?.id_estanque === estanque.id_estanque
                  }
                  onSelect={onEstanqueSelect}
                  disabled={
                    disabled ||
                    (litrosRequeridos &&
                      estanque.stock_actual < litrosRequeridos &&
                      !mostrarTodos)
                  }
                />
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 p-4 text-center bg-gray-50 rounded-lg border border-gray-200">
                <FaInfoCircle className="mx-auto mb-2 text-gray-400 text-xl" />
                <p className="text-gray-600">
                  No hay estanques con suficiente combustible para esta operación.
                </p>
                <button
                  onClick={() => setMostrarTodos(true)}
                  className="mt-2 text-xs text-orange-600 hover:text-orange-800 underline"
                  disabled={mostrarTodos || disabled}
                >
                  Ver todos los estanques disponibles
                </button>
              </div>
            )}
          </div>

          {/* Alerta si no hay estanque seleccionado */}
          {litrosRequeridos > 0 && estanqueSeleccionado && estanqueSeleccionado.stock_actual < litrosRequeridos && (
            <div className="p-3 border-t border-red-200 bg-red-50 flex items-start">
              <FaExclamationTriangle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Advertencia: Stock insuficiente</p>
                <p>
                  El estanque seleccionado no tiene suficiente combustible para
                  dispensar {litrosRequeridos.toLocaleString()} litros.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SelectorEstanques;