import React, { useState, useEffect, useCallback } from "react";
import { FaGasPump, FaExclamationTriangle, FaInfoCircle, FaTruck, FaBuilding } from "react-icons/fa";
import bomberoService from "../../context/bomberoService";

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

  // Verificar si es móvil
  const esMovil = estanque.tipo_estanque === 'movil';

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
          <div className="flex items-center">
            <h3 className="font-medium text-gray-800">{estanque.nombre}</h3>
            {/* Icono de tipo de estanque */}
            {esMovil && (
              <FaTruck className="ml-2 text-amber-600" size={12} title="Estanque Móvil" />
            )}
          </div>
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

        {/* Badge de tipo si es móvil */}
        {esMovil && (
          <div className="mb-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              <FaTruck className="mr-1" size={8} />
              Móvil
            </span>
          </div>
        )}

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

// Componente para separador de sección
const SeparadorSeccion = ({ icono, titulo, cantidad, color = "blue" }) => {
  const colores = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    green: "bg-green-50 border-green-200 text-green-800"
  };

  return (
    <div className={`px-3 py-2 border-t border-b ${colores[color]} flex items-center justify-between`}>
      <div className="flex items-center space-x-2">
        {icono}
        <span className="font-medium text-sm">{titulo}</span>
      </div>
      <span className="text-xs font-medium">
        {cantidad} estanque{cantidad !== 1 ? 's' : ''}
      </span>
    </div>
  );
};

const SelectorEstanques = ({
  idFaena,
  onEstanqueSelect,
  estanqueSeleccionado,
  litrosRequeridos,
  disabled = false,
  preloadedEstanques,
  tipoEstanque = 'todos',
  selectorId = 'default',
}) => {
  const [estanques, setEstanques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [cacheUsado, setCacheUsado] = useState(false);

  // Función de selección mejorada con logging para debug
  const handleSeleccionEstanque = useCallback((estanque) => {
    console.log(`🎯 Selector ${selectorId}: Estanque seleccionado`, estanque);
    onEstanqueSelect(estanque);
  }, [selectorId, onEstanqueSelect]);

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
        setCacheUsado(false);

        // Usar bomberoService con cache first
        const estanquesData = await bomberoService.getEstanques(idFaena);

        if (estanquesData && estanquesData.length > 0) {
          // Procesar estanques
          let estanquesConStock = estanquesData.map((estanque) => ({
            ...estanque,
            stock_actual: estanque.stock_actual || 0,
            capacidad: parseFloat(estanque.capacidad) || 0,
            // Asegurar que tengan el campo tipo_estanque
            tipo_estanque: estanque.tipo_estanque || 'fijo'
          }));

          // Filtrar por tipo si se especifica
          if (tipoEstanque !== 'todos') {
            estanquesConStock = estanquesConStock.filter(e => e.tipo_estanque === tipoEstanque);
          }

          setEstanques(estanquesConStock);
          setCacheUsado(true);
        } else {
          setEstanques([]);
        }
      } catch (error) {
        setError(
          error.message || "No se pudieron cargar los estanques. Intente nuevamente."
        );
      } finally {
        setLoading(false);
      }
    };

    cargarEstanques();
  }, [idFaena, tipoEstanque, selectorId]);

  // AGRUPAR ESTANQUES POR TIPO
  const estanquesAgrupados = React.useMemo(() => {
    // Separar por tipo
    const fijos = estanques.filter(e => e.tipo_estanque === 'fijo' || !e.tipo_estanque);
    const moviles = estanques.filter(e => e.tipo_estanque === 'movil');

    // Ordenar cada grupo por stock disponible (mayor primero)
    const ordenarPorStock = (a, b) => {
      if (a.stock_actual > 0 && b.stock_actual === 0) return -1;
      if (a.stock_actual === 0 && b.stock_actual > 0) return 1;
      return b.stock_actual - a.stock_actual;
    };

    fijos.sort(ordenarPorStock);
    moviles.sort(ordenarPorStock);

    return { fijos, moviles };
  }, [estanques]);

  // Filtrar estanques por disponibilidad según los litros requeridos
  const filtrarPorDisponibilidad = (grupoEstanques) => {
    return grupoEstanques.filter(
      (estanque) => estanque.stock_actual >= (litrosRequeridos || 0)
    );
  };

  const estanquesFijosDisponibles = filtrarPorDisponibilidad(estanquesAgrupados.fijos);
  const estanquesMovilesDisponibles = filtrarPorDisponibilidad(estanquesAgrupados.moviles);

  // Estanques a mostrar según el toggle
  const estanquesFijosMostrados = mostrarTodos ? estanquesAgrupados.fijos : estanquesFijosDisponibles;
  const estanquesMovilesMostrados = mostrarTodos ? estanquesAgrupados.moviles : estanquesMovilesDisponibles;

  const totalEstanques = estanques.length;
  const totalDisponibles = estanquesFijosDisponibles.length + estanquesMovilesDisponibles.length;

  // Obtener texto descriptivo del tipo de estanque
  const getTextoTipo = useCallback(() => {
    switch (tipoEstanque) {
      case 'fijo':
        return 'fijos';
      case 'movil':
        return 'móviles';
      default:
        return '';
    }
  }, [tipoEstanque]);

  // Si no hay estanques, mostrar mensaje indicativo
  if (!loading && totalEstanques === 0) {
    const tipoTexto = getTextoTipo();
    return (
      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-center">
        <div className="flex justify-center mb-2">
          <FaInfoCircle className="text-yellow-500 text-xl" />
        </div>
        <h4 className="font-medium text-yellow-800 mb-1">No hay estanques {tipoTexto}</h4>
        <p className="text-sm text-yellow-700">
          No se encontraron estanques {tipoTexto} registrados para esta faena.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* ENCABEZADO MEJORADO CON SEGMENTADOR */}
      <div className="p-3 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
        <h3 className="font-medium text-gray-800 flex items-center">
          <FaGasPump className="text-orange-500 mr-2" />
          Seleccione Estanque
          {tipoEstanque !== 'todos' && (
            <span className="ml-2 text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
              {tipoEstanque === 'fijo' ? 'Solo Fijos' : 'Solo Móviles'}
            </span>
          )}
        </h3>
        <div className="flex items-center space-x-3 text-sm">
          {/* Segmentador por tipo de estanque */}
          {totalEstanques > 0 && tipoEstanque === 'todos' && (
            <div className="flex items-center space-x-2">
              {estanquesAgrupados.fijos.length > 0 && (
                <div className="flex items-center">
                  <FaBuilding className="text-blue-600 mr-1" size={12} />
                  <span className="text-blue-600 text-xs font-medium">
                    {estanquesAgrupados.fijos.length} Fijo{estanquesAgrupados.fijos.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {estanquesAgrupados.moviles.length > 0 && (
                <div className="flex items-center">
                  <FaTruck className="text-amber-600 mr-1" size={12} />
                  <span className="text-amber-600 text-xs font-medium">
                    {estanquesAgrupados.moviles.length} Móvil{estanquesAgrupados.moviles.length !== 1 ? 'es' : ''}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Separador visual */}
          {totalEstanques > 0 && (
            <div className="h-4 w-px bg-gray-300"></div>
          )}
          
          {/* Info total */}
          {totalEstanques > 0 && (
            <div className="text-xs text-gray-500">
              {totalEstanques} estanque{totalEstanques !== 1 ? "s" : ""} total
              {totalDisponibles < totalEstanques && (
                <span className="text-green-600 ml-1">
                  ({totalDisponibles} disponible{totalDisponibles !== 1 ? "s" : ""})
                </span>
              )}
            </div>
          )}
          
          {/* Indicador de cache usado */}
          {cacheUsado && preloadedEstanques && preloadedEstanques.loaded && (
            <div className="text-xs text-green-600 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Precargado
            </div>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">
            {preloadedEstanques && preloadedEstanques.loaded 
              ? "Cargando desde cache..." 
              : "Cargando estanques..."
            }
          </p>
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
          {totalDisponibles < totalEstanques && (
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

          {/* LISTA DE ESTANQUES AGRUPADA POR TIPO */}
          <div className="max-h-[400px] overflow-y-auto">
            
            {/* SECCIÓN DE ESTANQUES FIJOS */}
            {(tipoEstanque === 'todos' || tipoEstanque === 'fijo') && estanquesFijosMostrados.length > 0 && (
              <>
                <SeparadorSeccion 
                  icono={<FaBuilding className="text-blue-600" size={14} />}
                  titulo="Estanques Fijos"
                  cantidad={estanquesFijosMostrados.length}
                  color="blue"
                />
                <div className="p-3 grid gap-3 grid-cols-1 md:grid-cols-2">
                  {estanquesFijosMostrados.map((estanque) => (
                    <EstanqueTarjeta
                      key={`${selectorId}-fijo-${estanque.id_estanque}`}
                      estanque={estanque}
                      seleccionado={
                        estanqueSeleccionado?.id_estanque === estanque.id_estanque
                      }
                      onSelect={handleSeleccionEstanque}
                      disabled={
                        disabled ||
                        (litrosRequeridos &&
                          estanque.stock_actual < litrosRequeridos &&
                          !mostrarTodos)
                      }
                    />
                  ))}
                </div>
              </>
            )}

            {/* SECCIÓN DE ESTANQUES MÓVILES */}
            {(tipoEstanque === 'todos' || tipoEstanque === 'movil') && estanquesMovilesMostrados.length > 0 && (
              <>
                <SeparadorSeccion 
                  icono={<FaTruck className="text-amber-600" size={14} />}
                  titulo="Estanques Móviles"
                  cantidad={estanquesMovilesMostrados.length}
                  color="amber"
                />
                <div className="p-3 grid gap-3 grid-cols-1 md:grid-cols-2">
                  {estanquesMovilesMostrados.map((estanque) => (
                    <EstanqueTarjeta
                      key={`${selectorId}-movil-${estanque.id_estanque}`}
                      estanque={estanque}
                      seleccionado={
                        estanqueSeleccionado?.id_estanque === estanque.id_estanque
                      }
                      onSelect={handleSeleccionEstanque}
                      disabled={
                        disabled ||
                        (litrosRequeridos &&
                          estanque.stock_actual < litrosRequeridos &&
                          !mostrarTodos)
                      }
                    />
                  ))}
                </div>
              </>
            )}

            {/* Mensaje cuando no hay estanques para mostrar */}
            {estanquesFijosMostrados.length === 0 && estanquesMovilesMostrados.length === 0 && (
              <div className="p-4 text-center bg-gray-50 border-t">
                <FaInfoCircle className="mx-auto mb-2 text-gray-400 text-xl" />
                <p className="text-gray-600">
                  No hay estanques con suficiente combustible para esta operación.
                </p>
                {!mostrarTodos && (
                  <button
                    onClick={() => setMostrarTodos(true)}
                    className="mt-2 text-xs text-orange-600 hover:text-orange-800 underline"
                    disabled={disabled}
                  >
                    Ver todos los estanques disponibles
                  </button>
                )}
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