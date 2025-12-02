import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FaGasPump,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaBuilding,
  FaTruck,
  FaLayerGroup,
  FaSpinner,
  FaBalanceScale,
} from "react-icons/fa";
import { RiOilFill } from "react-icons/ri";
import bomberoService from "../../context/bomberoService";

// Componente para separador de sección
const SeparadorSeccion = ({ icono, titulo, cantidad, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    green: "bg-green-50 text-green-700 border-green-200",
  };

  return (
    <div className={`px-3 py-2 text-xs font-medium border-t ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icono}
          <span>{titulo}</span>
        </div>
        <span className="text-xs">
          {cantidad} estanque{cantidad !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};

// Componente para tarjeta de estanque
const EstanqueTarjeta = ({
  estanque,
  seleccionado,
  onSelect,
  disabled,
  // Props para modo múltiple
  modoMultiple = false,
  litrosAsignados = 0,
  onCambiarLitros,
  maxLitros,
  // Props para estanques móviles (destino)
  esDestino = false,
  capacidadRequerida = 0
}) => {
  // Para estanques origen: verificar stock suficiente
  // Para estanques destino: verificar capacidad disponible
  const esValido = useMemo(() => {
    if (esDestino) {
      const capacidadDisponible = (estanque.capacidad || 0) - (estanque.stock_actual || 0);
      return capacidadRequerida <= capacidadDisponible;
    } else {
      const stockSuficiente = modoMultiple
        ? (estanque.stock_actual || 0) >= litrosAsignados
        : (estanque.stock_actual || 0) > 0;
      return stockSuficiente;
    }
  }, [esDestino, estanque, capacidadRequerida, modoMultiple, litrosAsignados]);

  const handleClick = () => {
    if (!disabled && !modoMultiple) {
      onSelect(estanque);
    }
  };

  const handleLitrosChange = (e) => {
    if (modoMultiple && onCambiarLitros) {
      const valor = parseFloat(e.target.value) || 0;
      onCambiarLitros(estanque.id_estanque, valor);
    }
  };

  // Calcular barra de progreso
  const porcentaje = useMemo(() => {
    const stockActual = estanque.stock_actual || 0;
    const capacidad = estanque.capacidad || 1000;
    return Math.min(Math.round((stockActual / capacidad) * 100), 100);
  }, [estanque]);

  // Función para obtener color de barra de progreso
  const getColorBarra = (nivel) => {
    if (nivel < 20) return "bg-red-500";
    if (nivel < 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div
      className={`
        border rounded-lg p-3 transition-all duration-200 cursor-pointer
        ${modoMultiple
          ? "bg-white border-gray-200 hover:border-orange-300"
          : seleccionado
            ? esDestino
              ? "border-green-500 bg-green-50 shadow-md"
              : "border-orange-500 bg-orange-50 shadow-md"
            : disabled || !esValido
              ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
              : "border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm"
        }
      `}
      onClick={!modoMultiple ? handleClick : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Información del estanque */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm truncate">
              {estanque.nombre}
            </h4>

            {/* Información básica */}
            <div className="text-xs text-gray-500 space-y-1">
              {esDestino ? (
                // Información para estanques destino (móviles)
                <>
                  <div className="flex justify-between">
                    <span>Capacidad total:</span>
                    <span>{(estanque.capacidad || 0).toLocaleString()} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stock:</span>
                    <span className={esValido ? "text-green-600" : "text-red-600"}>
                      {(estanque.stock_actual || 0).toLocaleString()}L
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Espacio disponible:</span>
                    <span>
                      {((estanque.capacidad || 0) - (estanque.stock_actual || 0)).toLocaleString()} L
                    </span>
                  </div>
                </>
              ) : (
                // Información para estanques origen (fijos)
                <>
                  {estanque.capacidad && (
                    <div className="flex justify-between">
                      <span>Capacidad Total:</span>
                      <span>{estanque.capacidad.toLocaleString()}L</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Stock:</span>
                    <span className={esValido ? "text-green-600" : "text-red-600"}>
                      {(estanque.stock_actual || 0).toLocaleString()}L
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Espacio disponible:</span>
                    <span>
                      {((estanque.capacidad || 0) - (estanque.stock_actual || 0)).toLocaleString()} L
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Barra de progreso visual */}
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">
                  {esDestino ? "Ocupación" : "Nivel"}
                </span>
                <span className={`font-medium ${porcentaje < 20 ? "text-red-600" :
                  porcentaje < 50 ? "text-yellow-600" :
                    "text-green-600"
                  }`}>
                  {porcentaje}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getColorBarra(porcentaje)}`}
                  style={{ width: `${porcentaje}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Modo simple: Indicador de selección */}
          {!modoMultiple && seleccionado && (
            <div className="flex-shrink-0">
              <FaCheckCircle className={esDestino ? "text-green-500" : "text-orange-500"} size={16} />
            </div>
          )}
        </div>
      </div>

      {/* Validaciones visuales */}
      {!esValido && (
        <div className="mt-2 flex items-center text-red-600 text-xs">
          <FaExclamationTriangle className="mr-1" size={10} />
          {esDestino ? "Capacidad insuficiente" : "Stock insuficiente"}
        </div>
      )}

      {seleccionado && !modoMultiple && (
        <div className="mt-2 flex items-center text-xs">
          <FaCheckCircle className={esDestino ? "text-green-600" : "text-blue-600"} size={10} />
          <span className={`ml-1 ${esDestino ? "text-green-600" : "text-blue-600"}`}>
            Seleccionado como {esDestino ? "destino" : "origen"}
          </span>
        </div>
      )}

      {/* Modo múltiple: Input para litros (solo para estanques origen) */}
      {modoMultiple && !esDestino && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-600">Litros a extraer:</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max={maxLitros || estanque.stock_actual || 0}
                step="0.1"
                value={litrosAsignados === 0 ? '' : litrosAsignados}
                onChange={handleLitrosChange}
                disabled={disabled}
                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="0"
              />
              <span className="text-xs text-gray-500">L</span>
            </div>
          </div>

          {/* Validación de stock en modo múltiple */}
          {litrosAsignados > 0 && (
            <div className="mt-2 flex items-center justify-end">
              {esValido ? (
                <div className="flex items-center text-green-600 text-xs">
                  <FaCheckCircle className="mr-1" size={10} />
                  Stock suficiente
                </div>
              ) : (
                <div className="flex items-center text-red-600 text-xs">
                  <FaExclamationTriangle className="mr-1" size={10} />
                  Stock insuficiente
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SelectorEstanque = ({
  idFaena,
  onEstanqueSelect,
  estanqueSeleccionado,
  litrosRequeridos,
  disabled = false,
  preloadedEstanques,
  tipoEstanque = 'todos',
  selectorId = 'default',
  // PROPS PARA MODO MÚLTIPLE
  modoMultiple = false,
  distribucionLitros = {},
  onDistribucionChange,
  mostrarToggle = false,
  onModoChange,
  showTitle = true,
  className = "",
}) => {
  const DEBUG = true;

  const [estanques, setEstanques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [cacheUsado, setCacheUsado] = useState(false);
  const [modoInternoMultiple, setModoInternoMultiple] = useState(modoMultiple);

  // Función de selección mejorada con logging para debug
  const handleSeleccionEstanque = useCallback((estanque) => {
    DEBUG && console.log(`🎯 Selector ${selectorId}: Estanque seleccionado`, estanque);
    if (!modoInternoMultiple) {
      onEstanqueSelect(estanque);
    }
  }, [selectorId, onEstanqueSelect, modoInternoMultiple]);

  // Función para manejar cambios en litros (modo múltiple)
  const handleCambiarLitros = useCallback((estanqueId, litros) => {
    if (onDistribucionChange) {
      const nuevaDistribucion = {
        ...distribucionLitros,
        [estanqueId]: litros,
      };
      onDistribucionChange(nuevaDistribucion);
    }
  }, [distribucionLitros, onDistribucionChange]);

  // Función para cambiar modo
  const handleCambiarModo = useCallback((nuevoModo) => {
    setModoInternoMultiple(nuevoModo);
    if (onModoChange) {
      onModoChange(nuevoModo);
    }
    if (nuevoModo && onEstanqueSelect) {
      onEstanqueSelect(null); // Limpiar selección al activar modo múltiple
    }
  }, [onModoChange, onEstanqueSelect]);

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
            estanquesConStock = estanquesConStock.filter(e => {
              // Si se pide 'fijo', incluir tanto 'fijo' como 'fijo_automatico'
              if (tipoEstanque === 'fijo') {
                return e.tipo_estanque === 'fijo' || e.tipo_estanque === 'fijo_automatico';
              }
              return e.tipo_estanque === tipoEstanque;
            });
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
  // AGRUPAR ESTANQUES POR TIPO
  const estanquesAgrupados = useMemo(() => {
    // Separar por tipo - INCLUYE fijo_automatico como fijos
    const fijos = estanques.filter(e =>
      e.tipo_estanque === 'fijo' ||
      e.tipo_estanque === 'fijo_automatico' ||
      !e.tipo_estanque
    );
    const moviles = estanques.filter(e => e.tipo_estanque === 'movil');

    // ✅ NUEVA FUNCIÓN DE ORDENAMIENTO
    const ordenarPorId = (a, b) => {
      return a.id_estanque - b.id_estanque; // Orden ascendente por ID
    };

    // ❌ COMENTAR O ELIMINAR LAS FUNCIONES ANTIGUAS
    /*
    const ordenarPorStock = (a, b) => {
      if (a.stock_actual > 0 && b.stock_actual === 0) return -1;
      if (a.stock_actual === 0 && b.stock_actual > 0) return 1;
      return b.stock_actual - a.stock_actual;
    };
    */

    // ✅ APLICAR EL NUEVO ORDENAMIENTO
    fijos.sort(ordenarPorId);
    moviles.sort(ordenarPorId);

    return { fijos, moviles };
  }, [estanques, tipoEstanque]);

  // Filtrar estanques por disponibilidad según los litros requeridos
  const filtrarPorDisponibilidad = useCallback((grupoEstanques, esParaDestino = false) => {
    if (modoInternoMultiple) {
      return grupoEstanques; // En modo múltiple, mostrar todos
    }

    return grupoEstanques.filter((estanque) => {
      if (esParaDestino) {
        // Para destino: verificar capacidad disponible
        const capacidadDisponible = (estanque.capacidad || 0) - (estanque.stock_actual || 0);
        return capacidadDisponible >= (litrosRequeridos || 0);
      } else {
        // Para origen: verificar stock suficiente
        return estanque.stock_actual >= (litrosRequeridos || 0);
      }
    });
  }, [litrosRequeridos, modoInternoMultiple]);

  const estanquesFijosDisponibles = filtrarPorDisponibilidad(estanquesAgrupados.fijos, false);
  const estanquesMovilesDisponibles = filtrarPorDisponibilidad(estanquesAgrupados.moviles, tipoEstanque === 'movil');

  // Estanques a mostrar según el toggle
  const estanquesFijosMostrados = mostrarTodos ? estanquesAgrupados.fijos : estanquesFijosDisponibles;
  const estanquesMovilesMostrados = mostrarTodos ? estanquesAgrupados.moviles : estanquesMovilesDisponibles;

  const totalEstanques = estanques.length;
  const totalDisponibles = estanquesFijosDisponibles.length + estanquesMovilesDisponibles.length;

  // Calcular valores para el modo múltiple
  const litrosTotalesRequeridos = litrosRequeridos || 0;
  const litrosDistribuidos = Object.values(distribucionLitros).reduce(
    (suma, litros) => suma + (parseFloat(litros) || 0),
    0
  );

  const tieneEstanquesSeleccionados = Object.values(distribucionLitros).some(
    (litros) => (parseFloat(litros) || 0) > 0
  );

  const distribucionCompleta = modoInternoMultiple &&
    Math.abs(litrosDistribuidos - litrosTotalesRequeridos) < 0.01;

  // Determinar si necesita modo múltiple automáticamente
  const stockMaximoIndividual = Math.max(
    ...estanques.map((e) => e.stock_actual || 0),
    0
  );

  const stockTotalDisponible = estanques.reduce(
    (total, estanque) => total + (estanque.stock_actual || 0),
    0
  );

  const necesitaMultiEstanque = litrosTotalesRequeridos > 0 &&
    stockMaximoIndividual < litrosTotalesRequeridos &&
    stockTotalDisponible >= litrosTotalesRequeridos;

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

  // Determinar si es para selección de destino (estanques móviles)
  const esSeleccionDestino = tipoEstanque === 'movil';

  // Si hay error, mostrar mensaje
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center">
        <div className="flex justify-center mb-2">
          <FaExclamationTriangle className="text-red-500 text-xl" />
        </div>
        <h4 className="font-medium text-red-800 mb-1">Error al cargar estanques</h4>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  // Si está cargando, mostrar spinner
  if (loading) {
    return (
      <div className="rounded-lg bg-white border border-gray-200 p-8 text-center">
        <FaSpinner className="animate-spin text-orange-500 text-2xl mx-auto mb-2" />
        <p className="text-gray-600 text-sm">Cargando estanques...</p>
      </div>
    );
  }

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
    <div className={`${className}`}>
      {/* Título del componente */}
      {showTitle && (
        <div className="mb-3">
          <h3 className="text-left text-gray-800 font-semibold text-sm sm:text-base flex items-center">
            <FaGasPump className="text-blue-600 mr-2" />
            {modoInternoMultiple ? "Seleccione múltiples estanques" : "Seleccione estanque"}
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {modoInternoMultiple
              ? "Configure múltiples estanques para completar el consumo requerido"
              : esSeleccionDestino
                ? "Elija el estanque móvil que recibirá el combustible"
                : "Elija el estanque del cual extraerá el combustible"}
          </p>
        </div>
      )}

      {/* Alerta de stock insuficiente */}
      {necesitaMultiEstanque && !modoInternoMultiple && !esSeleccionDestino && (
        <div className="mb-4 bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-3 rounded">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Stock insuficiente en estanques individuales</p>
              <p>
                Se requieren {litrosTotalesRequeridos.toLocaleString()}L.
                Ningún estanque individual tiene suficiente stock.
                {mostrarToggle && " Active el modo múltiple para completar el consumo."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle de modo simple/múltiple (solo para estanques origen) */}
      {mostrarToggle && !esSeleccionDestino && (
        <div className="mb-4 flex items-center justify-between bg-white p-3 rounded border">
          <div>
            <label className="text-sm font-medium text-gray-700">Modo de consumo</label>
            <p className="text-xs text-gray-500">
              {modoInternoMultiple
                ? "Consumo desde múltiples estanques"
                : "Consumo desde un solo estanque"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleCambiarModo(false)}
              disabled={necesitaMultiEstanque || disabled}
              className={`px-3 py-1 text-xs rounded transition-colors ${!modoInternoMultiple
                ? "bg-blue-600 text-white"
                : necesitaMultiEstanque || disabled
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
            >
              Simple
            </button>
            <button
              type="button"
              onClick={() => handleCambiarModo(true)}
              disabled={disabled}
              className={`px-3 py-1 text-xs rounded transition-colors flex items-center ${modoInternoMultiple
                ? "bg-blue-600 text-white"
                : disabled
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
            >
              <FaLayerGroup className="mr-1" />
              Múltiple
            </button>
          </div>
        </div>
      )}

      {/* Panel de información para modo múltiple */}
      {modoInternoMultiple && litrosTotalesRequeridos > 0 && !esSeleccionDestino && (
        <div className="mb-4 p-3 bg-gray-50 rounded border">
          <div className="flex justify-between items-center text-sm">
            <span>Litros requeridos:</span>
            <span className="font-medium">{litrosTotalesRequeridos.toLocaleString()}L</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Litros distribuidos:</span>
            <span
              className={`font-medium ${distribucionCompleta ? "text-green-600" : "text-orange-600"
                }`}
            >
              {litrosDistribuidos.toLocaleString()}L
            </span>
          </div>
          {tieneEstanquesSeleccionados && !distribucionCompleta && (
            <div className="flex justify-between items-center text-sm">
              <span>Restante:</span>
              <span className="font-medium text-red-600">
                {(litrosTotalesRequeridos - litrosDistribuidos).toFixed(2)}L
              </span>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {/* ENCABEZADO MEJORADO CON SEGMENTADOR */}
        <div className="p-3 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
          <h3 className="font-medium text-gray-800 flex items-center">
            <RiOilFill className="text-orange-500 mr-2" />
            {modoInternoMultiple ? "Distribuir por estanques" : "Seleccione Estanque"}
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
                {!modoInternoMultiple && totalDisponibles < totalEstanques && (
                  <span className="text-green-600 ml-1">
                    ({totalDisponibles} disponible{totalDisponibles !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Toggle "Mostrar todos" solo para modo simple */}
        {!modoInternoMultiple && totalDisponibles < totalEstanques && (
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">
                Mostrando solo estanques con {esSeleccionDestino ? "capacidad" : "stock"} suficiente
              </span>
              <label className="flex items-center cursor-pointer">
                <span className="text-xs text-gray-600 mr-2">Mostrar todos</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={mostrarTodos}
                    onChange={(e) => setMostrarTodos(e.target.checked)}
                  />
                  <div
                    className={`block w-8 h-4 rounded-full transition ${mostrarTodos ? "bg-orange-500" : "bg-gray-300"
                      }`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition ${mostrarTodos ? "transform translate-x-4" : ""
                      }`}
                  ></div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* LISTA DE ESTANQUES AGRUPADA POR TIPO */}
        <div className="max-h-[400px] overflow-y-auto">

          {/* SECCIÓN DE ESTANQUES FIJOS (incluye fijo y fijo_automatico) */}
          {(tipoEstanque === 'todos' || tipoEstanque === 'fijo' || tipoEstanque === 'fijo_automatico') && estanquesFijosMostrados.length > 0 && (
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
                      (!modoInternoMultiple &&
                        litrosRequeridos &&
                        estanque.stock_actual < litrosRequeridos &&
                        !mostrarTodos)
                    }
                    modoMultiple={modoInternoMultiple}
                    litrosAsignados={distribucionLitros[estanque.id_estanque] || 0}
                    onCambiarLitros={handleCambiarLitros}
                    maxLitros={estanque.stock_actual}
                    esDestino={false}
                    capacidadRequerida={0}
                  />
                ))}
              </div>
            </>
          )}

          {/* SECCIÓN DE ESTANQUES MÓVILES */}
          {(tipoEstanque === 'todos' || tipoEstanque === 'movil') && estanquesMovilesMostrados.length > 0 && (
            console.log('🚚 Mostrando estanques móviles:', estanquesMovilesMostrados),
            <>
              <SeparadorSeccion
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
                      (!modoInternoMultiple &&
                        litrosRequeridos &&
                        tipoEstanque === 'movil' &&
                        ((estanque.capacidad || 0) - (estanque.stock_actual || 0)) < litrosRequeridos &&
                        !mostrarTodos)
                    }
                    modoMultiple={false} // Los estanques móviles no usan modo múltiple
                    litrosAsignados={0}
                    onCambiarLitros={null}
                    maxLitros={0}
                    esDestino={tipoEstanque === 'movil'}
                    capacidadRequerida={litrosRequeridos || 0}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Mensaje cuando no hay estanques en la vista actual */}
        {estanquesFijosMostrados.length === 0 && estanquesMovilesMostrados.length === 0 && (
          <div className="p-8 text-center">
            <FaInfoCircle className="text-gray-400 text-2xl mx-auto mb-2" />
            <p className="text-gray-600 text-sm">
              {modoInternoMultiple
                ? "No hay estanques disponibles para distribución"
                : mostrarTodos
                  ? "No se encontraron estanques"
                  : `No hay estanques con ${esSeleccionDestino ? 'capacidad' : 'stock'} suficiente. Active 'Mostrar todos' para ver todos los estanques.`}
            </p>
          </div>
        )}
      </div>

      {/* Resumen de estado para modo múltiple */}
      {modoInternoMultiple && tieneEstanquesSeleccionados && !esSeleccionDestino && (
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <div className="text-sm">
            {distribucionCompleta ? (
              <div className="flex items-center text-green-600">
                <FaCheckCircle className="mr-2" />
                ✓ Distribución completa de {litrosTotalesRequeridos}L
              </div>
            ) : (
              <div className="flex items-center text-orange-600">
                <FaBalanceScale className="mr-2" />
                Faltan {(litrosTotalesRequeridos - litrosDistribuidos).toFixed(2)}L por distribuir
              </div>
            )}
          </div>
        </div>
      )}


    </div>
  );
};

export default SelectorEstanque;