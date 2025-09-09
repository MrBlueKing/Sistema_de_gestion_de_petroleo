import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import axios from "../../lib/axios";
import {
  FiLoader,
  FiTrendingUp,
  FiAlertCircle,
  FiInfo,
  FiBarChart,
  FiDollarSign,
  FiClock,
  FiChevronUp,
  FiChevronDown,
  FiFilter,
  FiX,
} from "react-icons/fi";

import UniversalTableFilter from "../../components/molecules/UniversalTableFilter";
import { getFaenaColors } from '../../context/faenaColor';


const ColumnaValorTotal = ({ maquina }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({
    top: true,
    right: true,
  });
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);
  const hideTimeoutRef = useRef(null); // 🆕 Para manejar el delay

  // 🆕 FUNCIÓN PARA TRADUCIR MESES A ESPAÑOL (CORREGIDA)
  const traducirMesEspanol = (mesIngles) => {
    const mesesEspanol = {
      January: "Enero",
      February: "Febrero",
      March: "Marzo",
      April: "Abril",
      May: "Mayo",
      June: "Junio",
      July: "Julio",
      August: "Agosto",
      September: "Septiembre",
      October: "Octubre",
      November: "Noviembre",
      December: "Diciembre",
    };

    if (!mesIngles) return mesIngles;

    // Si viene como "July 2025", separar y traducir
    const partes = mesIngles.split(" ");
    if (partes.length === 2) {
      const mesEnIngles = partes[0];
      const año = partes[1];
      const mesTraducido = mesesEspanol[mesEnIngles] || mesEnIngles;
      return `${mesTraducido} ${año}`;
    }

    // Si viene solo el mes en inglés
    return mesesEspanol[mesIngles] || mesIngles;
  };

  // Obtener datos de comparativa mensual del backend
  const comparativaMensual =
    maquina.comparativa_mensual?.comparativa_mensual || {};
  const resumenPeriodo = maquina.comparativa_mensual?.resumen_periodo || {};
  const meses = Object.entries(comparativaMensual);

  // Verificar si hay datos mensuales múltiples
  const tieneMultiplesMeses = meses.length > 1;

  // 🚀 DETECTAR TIPO DE MEDICIÓN
  const esKilometraje = maquina.tipo_medicion === "Kilometraje";
  const unidadCosto = esKilometraje ? "/km" : "/día";

  // 🆕 FUNCIÓN PARA CALCULAR POSICIÓN INTELIGENTE DEL TOOLTIP
  const calcularPosicionTooltip = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Márgenes de seguridad
    const margin = 16;

    // Calcular si hay espacio arriba
    const spaceAbove = triggerRect.top;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const tooltipHeight = tooltipRect.height || 320; // altura estimada

    // Calcular si hay espacio a la derecha
    const spaceRight = viewportWidth - triggerRect.right;
    const spaceLeft = triggerRect.left;
    const tooltipWidth = 320; // ancho fijo del tooltip

    // Determinar posición vertical
    const shouldShowAbove =
      spaceAbove > tooltipHeight + margin && spaceAbove > spaceBelow;

    // Determinar posición horizontal
    const shouldShowLeft =
      spaceRight < tooltipWidth + margin && spaceLeft > tooltipWidth + margin;

    setTooltipPosition({
      top: shouldShowAbove,
      right: !shouldShowLeft,
    });
  }, []);

  // 🆕 EFECTO PARA RECALCULAR POSICIÓN CUANDO SE MUESTRA EL TOOLTIP
  useEffect(() => {
    if (showTooltip) {
      // Pequeño delay para que el tooltip se renderice primero
      const timer = setTimeout(calcularPosicionTooltip, 10);
      return () => clearTimeout(timer);
    }
  }, [showTooltip, calcularPosicionTooltip]);

  // 🆕 LISTENER PARA RECALCULAR EN SCROLL/RESIZE
  useEffect(() => {
    if (showTooltip) {
      const handleReposition = () => calcularPosicionTooltip();
      window.addEventListener("scroll", handleReposition, { passive: true });
      window.addEventListener("resize", handleReposition, { passive: true });

      return () => {
        window.removeEventListener("scroll", handleReposition);
        window.removeEventListener("resize", handleReposition);
      };
    }
  }, [showTooltip, calcularPosicionTooltip]);

  const handleMouseEnter = () => {
    // 🔄 CANCELAR CUALQUIER TIMEOUT DE OCULTACIÓN PENDIENTE
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    // ⏰ DELAY DE 1 SEGUNDO DESDE QUE SE SALE COMPLETAMENTE
    hideTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 450);
  };

  // 🆕 HANDLER PARA CUANDO EL MOUSE ENTRA AL TOOLTIP
  const handleTooltipMouseEnter = () => {
    // Cancelar timeout si el mouse entra al tooltip
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  // 🆕 HANDLER PARA CUANDO EL MOUSE SALE DEL TOOLTIP
  const handleTooltipMouseLeave = () => {
    // Iniciar delay de ocultación cuando sale del tooltip
    hideTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 1000);
  };

  // 🆕 LIMPIAR TIMEOUT AL DESMONTAR COMPONENTE
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Si no hay múltiples meses, mostrar formato simple
  if (!tieneMultiplesMeses) {
    return (
      <div className="flex flex-col items-end">
        <div className="text-sm font-bold text-gray-900">
          ${Math.round(maquina.valor_total || 0).toLocaleString("es-CL")}
        </div>
        <div className="text-xs text-gray-500">
          ${Math.round(maquina.costo_por_dia || 0).toLocaleString("es-CL")}
          {unidadCosto}
        </div>
      </div>
    );
  }
  // 🚀 CORREGIDO: Calcular estadísticas según tipo de medición
  const costosArray = meses.map(([_, datos]) =>
    esKilometraje ? datos.costo_por_km || 0 : datos.costo_por_dia || 0
  );
  const costoMayor = Math.max(...costosArray);
  const costoMenor = Math.min(...costosArray);

  // 🚀 CORREGIDO: Usar el promedio correcto según tipo de medición
  const costoPromedio = esKilometraje
    ? resumenPeriodo.costo_por_km_promedio || 0
    : resumenPeriodo.costo_por_dia_promedio || 0;

  // Último mes para mostrar en la UI principal
  const ultimoMes = meses[meses.length - 1];
  const [claveUltimoMes, datosUltimoMes] = ultimoMes || [null, {}];

  // 🚀 CORREGIDO: Usar el costo correcto según tipo de medición
  const costoUltimoMes = esKilometraje
    ? datosUltimoMes.costo_por_km || 0
    : datosUltimoMes.costo_por_dia || 0;

  // 🆕 TRADUCIR NOMBRE DEL MES A ESPAÑOL (CORREGIDO)
  const nombreUltimoMes = datosUltimoMes.mes_nombre
    ? traducirMesEspanol(datosUltimoMes.mes_nombre).split(" ")[0]
    : "Último";

  // Determinar tendencia
  const primerCosto = costosArray[0];
  const ultimoCosto = costosArray[costosArray.length - 1];
  let tendencia = "estable";
  let iconoTendencia = "📊";

  if (ultimoCosto > primerCosto * 1.1) {
    tendencia = "ascendente";
    iconoTendencia = "📈";
  } else if (ultimoCosto < primerCosto * 0.9) {
    tendencia = "descendente";
    iconoTendencia = "📉";
  }

  // 🆕 CLASES DINÁMICAS PARA POSICIONAMIENTO
  const getTooltipClasses = () => {
    const baseClasses =
      "fixed w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4 transition-all duration-200 ease-out transform";
    const zIndexClass = "z-[99999]"; // Z-index ULTRA máximo

    // Animación de entrada
    const animationClass = showTooltip
      ? "opacity-100 scale-100"
      : "opacity-0 scale-95 pointer-events-none";

    return `${baseClasses} ${zIndexClass} ${animationClass}`;
  };

  // 🆕 CALCULAR POSICIÓN FIJA EN VIEWPORT
  const getTooltipStyle = () => {
    if (!triggerRef.current || !showTooltip) return {};

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 350; // altura estimada
    const margin = 16;

    let top, left;

    // Posicionamiento vertical
    if (tooltipPosition.top) {
      // Mostrar arriba
      top = triggerRect.top - tooltipHeight - 8;
    } else {
      // Mostrar abajo
      top = triggerRect.bottom + 8;
    }

    // Posicionamiento horizontal
    if (tooltipPosition.right) {
      // Alinear a la derecha del trigger
      left = triggerRect.right - tooltipWidth;
    } else {
      // Alinear a la izquierda del trigger
      left = triggerRect.left;
    }

    // Ajustes de seguridad para no salirse del viewport
    const maxLeft = window.innerWidth - tooltipWidth - margin;
    const maxTop = window.innerHeight - tooltipHeight - margin;

    left = Math.max(margin, Math.min(left, maxLeft));
    top = Math.max(margin, Math.min(top, maxTop));

    return {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 99999,
    };
  };

  return (
    <>
      {/* 🆕 TOOLTIP RENDERIZADO COMO PORTAL FIJO */}
      {showTooltip && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 99998 }}
        >
          <div
            ref={tooltipRef}
            className={getTooltipClasses()}
            style={{
              ...getTooltipStyle(),
              pointerEvents: "auto",
            }}
            onMouseEnter={handleTooltipMouseEnter} // 🆕 MANTENER VISIBLE AL ENTRAR AL TOOLTIP
            onMouseLeave={handleTooltipMouseLeave} // 🆕 DELAY AL SALIR DEL TOOLTIP
          >
            {/* Header del tooltip */}
            <div className="border-b border-gray-100 pb-2 mb-3">
              <h4 className="text-sm font-semibold text-gray-800 flex items-center">
                💰 Análisis de Costos Mensuales
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {meses.length} meses
                </span>
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                Costo por {esKilometraje ? "kilómetro" : "día"} y evolución
                temporal
              </p>
            </div>

            {/* Resumen estadístico */}
            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-500">Promedio</div>
                <div className="text-sm font-semibold text-gray-800">
                  ${costoPromedio.toLocaleString("es-CL")}
                </div>
              </div>
              <div className="bg-green-50 rounded p-2">
                <div className="text-xs text-green-600">Menor</div>
                <div className="text-sm font-semibold text-green-800">
                  ${costoMenor.toLocaleString("es-CL")}
                </div>
              </div>
              <div className="bg-red-50 rounded p-2">
                <div className="text-xs text-red-600">Mayor</div>
                <div className="text-sm font-semibold text-red-800">
                  ${costoMayor.toLocaleString("es-CL")}
                </div>
              </div>
            </div>

            {/* Lista de meses */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {meses.map(([claveMes, datos], index) => {
                const esUltimoMes = index === meses.length - 1;

                // 🚀 CORREGIDO: Usar el campo correcto según tipo de medición
                const costoMes = esKilometraje
                  ? datos.costo_por_km || 0
                  : datos.costo_por_dia || 0;
                const esMesMayor = costoMes === costoMayor;
                const esMesMenor = costoMes === costoMenor;

                return (
                  <div
                    key={claveMes}
                    className={`flex justify-between items-center p-2 rounded text-xs ${
                      esUltimoMes
                        ? "bg-blue-50 border border-blue-200"
                        : esMesMayor
                        ? "bg-red-50"
                        : esMesMenor
                        ? "bg-green-50"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-700">
                        {datos.mes_nombre || claveMes}
                      </span>
                      {esUltimoMes && (
                        <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs">
                          Actual
                        </span>
                      )}
                      {esMesMayor && !esUltimoMes && (
                        <span className="text-red-600">📈</span>
                      )}
                      {esMesMenor && !esUltimoMes && (
                        <span className="text-green-600">📉</span>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-gray-800">
                        ${costoMes.toLocaleString("es-CL")}
                        {unidadCosto}
                      </div>
                      {/* 🆕 MOSTRAR INFORMACIÓN ADICIONAL SEGÚN TIPO */}
                      {esKilometraje && datos.medicion_mes && (
                        <div className="text-xs text-gray-500">
                          {datos.medicion_mes.toLocaleString()} km
                        </div>
                      )}
                      {!esKilometraje && datos.dias_turno && (
                        <div className="text-xs text-gray-500">
                          {datos.dias_turno.toFixed(1)} días
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer con tendencia */}
            <div className="border-t border-gray-100 pt-2 mt-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Tendencia:</span>
                <span
                  className={`font-medium ${
                    tendencia === "ascendente"
                      ? "text-red-600"
                      : tendencia === "descendente"
                      ? "text-green-600"
                      : "text-gray-600"
                  }`}
                >
                  {tendencia === "ascendente"
                    ? "📈 Creciente"
                    : tendencia === "descendente"
                    ? "📉 Decreciente"
                    : "📊 Estable"}
                </span>
              </div>
              {/* 🆕 INFORMACIÓN ADICIONAL DEL TIPO DE MEDICIÓN */}
              <div className="text-xs text-gray-500 mt-1">
                {esKilometraje ? (
                  <span>💡 Costos calculados por kilómetro recorrido</span>
                ) : (
                  <span>💡 Costos calculados por día de operación</span>
                )}
              </div>
            </div>

            {/* 🆕 INDICADOR VISUAL DE POSICIÓN MEJORADO */}
            <div
              className="absolute w-3 h-3 bg-white border border-gray-200 transform rotate-45"
              style={{
                [tooltipPosition.top ? "bottom" : "top"]: "-6px",
                [tooltipPosition.right ? "right" : "left"]: "20px",
                boxShadow: tooltipPosition.top
                  ? "2px 2px 4px rgba(0,0,0,0.1)"
                  : "-2px -2px 4px rgba(0,0,0,0.1)",
                zIndex: 99999,
              }}
            />
          </div>
        </div>
      )}

      {/* Trigger del tooltip */}
      <div
        ref={triggerRef}
        className="flex flex-col items-end cursor-pointer group relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Valor principal */}
        <div className="text-sm font-bold text-gray-900">
          ${Math.round(maquina.valor_total || 0).toLocaleString("es-CL")}
        </div>

        {/* Costo por día/km con indicador de tendencia */}
        <div className="flex items-center space-x-1">
          <div className="text-xs text-blue-600 hover:text-blue-800 underline decoration-dotted">
            ${costoUltimoMes.toLocaleString("es-CL")}
            {unidadCosto}
          </div>
          <span className="text-orange-500 text-xs">{iconoTendencia}</span>
        </div>

        {/* Indicador de múltiples meses */}
        <div className="text-xs text-blue-500 flex items-center space-x-1">
          <span>{nombreUltimoMes}</span>
          <span className="text-gray-400">•</span>
          <span>{meses.length} meses</span>
        </div>
      </div>
    </>
  );
};

const ConsumoPorMaquinaPureTable = ({
  fechaDesde,
  fechaHasta,
  horaDesde,
  horaHasta,
  faenaSeleccionada,
  refreshKey,
}) => {
  const [datosConsumo, setDatosConsumo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resumenGeneral, setResumenGeneral] = useState(null);

  // Estados para ordenamiento
  const [ordenColumna, setOrdenColumna] = useState("litros_totales");
  const [direccionOrden, setDireccionOrden] = useState("desc");

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    maquina: "",
    categoria: "",
    faena: "",
    patente: "",
  });

  // 🔧 CORECCIÓN 1: Función para manejar ordenamiento con el nuevo componente
  const manejarCambioOrdenamiento = (columna, direccion) => {
    console.log("🔧 Ordenamiento:", { columna, direccion });
    if (direccion) {
      setOrdenColumna(columna);
      setDireccionOrden(direccion);
    } else {
      // Si direccion es null, limpiar ordenamiento
      setOrdenColumna("");
      setDireccionOrden("desc");
    }
  };

  // Función para formatear fecha con hora
  const formatearFechaHora = (fecha, hora) => {
    if (!fecha) return fecha;
    if (!hora) return fecha;

    const fechaFormateada = formatearFecha(fecha);
    return `${fechaFormateada} ${hora}:00`;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return fecha;

    if (fecha.includes("-") && fecha.split("-")[0].length === 2) {
      return fecha;
    }

    const partes = fecha.split("-");
    if (partes.length === 3) {
      const [año, mes, dia] = partes;
      return `${dia}-${mes}-${año}`;
    }

    return fecha;
  };

  // 🔧 CORECCIÓN 2: Función para ordenar los datos (corregir nombres de columnas)
  const ordenarDatos = (datos) => {
    if (!ordenColumna) return datos;

    return [...datos].sort((a, b) => {
      let valorA, valorB;

      switch (ordenColumna) {
        case "maquina": // ✅ CORRECTO: usar "maquina"
          valorA = a.nombre_maquina?.toLowerCase() || "";
          valorB = b.nombre_maquina?.toLowerCase() || "";
          break;
        case "categoria":
          valorA = a.categoria?.toLowerCase() || "";
          valorB = b.categoria?.toLowerCase() || "";
          break;
        case "faena":
          valorA = a.faena?.toLowerCase() || "";
          valorB = b.faena?.toLowerCase() || "";
          break;
        case "litros_totales":
          valorA = a.litros_totales || 0;
          valorB = b.litros_totales || 0;
          break;
        case "precio_promedio_litro":
          valorA = a.precio_promedio_litro || 0;
          valorB = b.precio_promedio_litro || 0;
          break;
        case "valor_total":
          valorA = a.valor_total || 0;
          valorB = b.valor_total || 0;
          break;
        case "rendimiento":
          valorA = a.rendimiento?.valor || 0;
          valorB = b.rendimiento?.valor || 0;
          break;
        case "porcentaje_confirmado":
          valorA = a.porcentaje_confirmado || 0;
          valorB = b.porcentaje_confirmado || 0;
          break;
        default:
          return 0;
      }

      if (typeof valorA === "string") {
        const resultado = valorA.localeCompare(valorB);
        return direccionOrden === "asc" ? resultado : -resultado;
      } else {
        const resultado = valorA - valorB;
        return direccionOrden === "asc" ? resultado : -resultado;
      }
    });
  };

  // 🆕 Función para filtrar datos (ACTUALIZADA para multiselect)
  const filtrarDatos = (datos) => {
    return datos.filter((maquina) => {
      // 🆕 MULTISELECT: Filtro de máquina
      const cumpleMaquina =
        !filtros.maquina ||
        (filtros.maquina.includes(",")
          ? filtros.maquina
              .split(",")
              .some((m) => m.trim() === maquina.nombre_maquina)
          : maquina.nombre_maquina === filtros.maquina);

      // 🆕 MULTISELECT: Filtro de categoría
      const cumpleCategoria =
        !filtros.categoria ||
        (filtros.categoria.includes(",")
          ? filtros.categoria
              .split(",")
              .some((c) => c.trim() === maquina.categoria)
          : maquina.categoria === filtros.categoria);

      // 🆕 MULTISELECT: Filtro de faena
      const cumpleFaena =
        !filtros.faena ||
        (filtros.faena.includes(",")
          ? filtros.faena.split(",").some((f) => f.trim() === maquina.faena)
          : maquina.faena === filtros.faena);

      // Filtro de patente (mantener como texto)
      const cumplePatente =
        !filtros.patente ||
        maquina.patente?.toLowerCase().includes(filtros.patente.toLowerCase());

      return cumpleMaquina && cumpleCategoria && cumpleFaena && cumplePatente;
    });
  };

  // Generar opciones únicas para los filtros select
  const opcionesFiltros = useMemo(() => {
    const maquinas = [
      ...new Set(datosConsumo.map((m) => m.nombre_maquina).filter(Boolean)),
    ].sort();
    const categorias = [
      ...new Set(datosConsumo.map((m) => m.categoria).filter(Boolean)),
    ].sort();
    const faenas = [
      ...new Set(datosConsumo.map((m) => m.faena).filter(Boolean)),
    ].sort();

    return { maquinas, categorias, faenas };
  }, [datosConsumo]);

  // Aplicar filtros y ordenamiento
  const datosProcesados = useMemo(() => {
    const datosFiltrados = filtrarDatos(datosConsumo);
    return ordenarDatos(datosFiltrados);
  }, [datosConsumo, filtros, ordenColumna, direccionOrden]);

  // 🔧 CORECCIÓN 3: Función para manejar cambios de filtro (corregir parámetros)
  const manejarCambioFiltro = (columna, valor) => {
    console.log("🔧 Filtro:", { columna, valor });
    setFiltros((prev) => ({
      ...prev,
      [columna]: valor,
    }));
  };

  // Función para limpiar todos los filtros
  const limpiarFiltros = () => {
    setFiltros({
      maquina: "",
      categoria: "",
      faena: "",
      patente: "",
    });
  };

  // Cargar datos del ConsumoCategoriasController
  const cargarDatosConsumoCategoria = async () => {
    try {
      setLoading(true);
      setError(null);

      const fechaInicioFormateada = formatearFechaHora(fechaDesde, horaDesde);
      const fechaFinFormateada = formatearFechaHora(fechaHasta, horaHasta);

      console.log("🕐 Enviando fechas con hora al backend:", {
        fecha_inicio: fechaInicioFormateada,
        fecha_fin: fechaFinFormateada,
        original_desde: fechaDesde,
        original_hasta: fechaHasta,
        hora_desde: horaDesde,
        hora_hasta: horaHasta,
      });

      const response = await axios.post("/api/consumo-categorias/calcular", {
        fecha_inicio: fechaInicioFormateada,
        fecha_fin: fechaFinFormateada,
        id_faena:
          faenaSeleccionada !== "todas" ? parseInt(faenaSeleccionada) : null,
        incluir_simulacion: true,
        usar_fechas_automaticas: false,
        incluir_sabados: true,
        incluir_domingos: false,
      });

      console.log("✅ Respuesta del backend:", response.data);

      if (!response.data?.success) {
        throw new Error("Error en respuesta del ConsumoCategoriasController");
      }

      // Extraer máquinas del análisis por categoría
      const maquinasData = [];

      if (response.data.analisis_por_categoria) {
        response.data.analisis_por_categoria.forEach((categoria) => {
          if (categoria.analisis_detallado) {
            categoria.analisis_detallado.forEach((maquinaAnalisis) => {
              const maquina = maquinaAnalisis.maquina;
              const resumen = maquinaAnalisis.resumen_ejecutivo;
              const costos = maquinaAnalisis.costos;
              const rendimiento = maquinaAnalisis.rendimiento;

              maquinasData.push({
                // Datos básicos de la máquina
                id_maquina: maquina.id,
                nombre_maquina: maquina.nombre,
                patente: maquina.patente,
                categoria: categoria.categoria.nombre,
                tipo_medicion: categoria.categoria.tipo_medicion,
                faena: maquina.faena?.nombre || "N/A",

                // Datos de consumo
                litros_confirmados: resumen.litros_confirmados || 0,
                litros_simulados: resumen.litros_simulados || 0,
                litros_totales: resumen.litros_totales || 0,
                porcentaje_confirmado: resumen.porcentaje_confirmado || 0,

                // Datos de costos
                precio_promedio_litro: costos.precio_promedio_litro || 0,
                valor_total: costos.valor_total || 0,
                costo_por_dia: costos.costo_por_dia || 0,

                // Datos de rendimiento - VERSIÓN CORREGIDA
                rendimiento: {
                  valor: rendimiento.rendimiento_valor || 0,
                  unidad:
                    rendimiento.tipo_medicion === "Horometro" ? "hr" : "km",
                  formateado: rendimiento.rendimiento_formateado || "N/A",
                  interpretacion: rendimiento.interpretacion || "No disponible",

                  // Información completa de medición
                  medicion_total: rendimiento.medicion_total || {
                    primera_medicion: null,
                    ultima_medicion: null,
                    total_registros: 0,
                    tipo_medicion: categoria.categoria.tipo_medicion,
                    unidad:
                      categoria.categoria.tipo_medicion === "Horometro"
                        ? "h"
                        : "km",
                  },
                },
                // Estadísticas
                estadisticas: maquinaAnalisis.estadisticas || null,
                periodos_confirmados:
                  maquinaAnalisis.periodos_confirmados || [],
                simulacion: maquinaAnalisis.simulacion || null,

                // 🆕 AGREGAR ESTA LÍNEA QUE FALTA:
                comparativa_mensual: costos.comparativa_mensual || {},

                // Metadata
                categoria_completa: categoria,
                analisis_completo: maquinaAnalisis,
              });
              console.log(
                "🔍 Datos comparativa mensual para",
                maquina.nombre,
                ":",
                maquinaAnalisis.comparativa_mensual
              );
            });
          }
        });
      }

      setDatosConsumo(maquinasData);
      setResumenGeneral(response.data.resumen_ejecutivo);

      console.log(
        "✅ Datos ConsumoCategoriasController cargados con horarios:",
        {
          maquinas: maquinasData.length,
          periodo: `${fechaInicioFormateada} - ${fechaFinFormateada}`,
          resumen: response.data.resumen_ejecutivo,
        }
      );
    } catch (err) {
      console.error("Error al cargar datos ConsumoCategoriasController:", err);
      setError("Error al cargar datos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fechaDesde && fechaHasta && horaDesde && horaHasta) {
      cargarDatosConsumoCategoria();
    }
  }, [
    fechaDesde,
    fechaHasta,
    horaDesde,
    horaHasta,
    faenaSeleccionada,
    refreshKey,
  ]);

  // Funciones auxiliares para colores
  const getColorPrecision = (precision) => {
    if (precision >= 80) return "text-green-600 bg-green-50";
    if (precision >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getColorRendimiento = (interpretacion) => {
    if (!interpretacion || interpretacion === "No disponible")
      return "text-gray-500";
    if (interpretacion.includes("eficiente") || interpretacion.includes("bajo"))
      return "text-green-600";
    if (
      interpretacion.includes("moderado") ||
      interpretacion.includes("normal")
    )
      return "text-yellow-600";
    return "text-red-600";
  };

  const getBadgeRendimiento = (interpretacion) => {
    if (!interpretacion || interpretacion === "No disponible")
      return "bg-gray-100 text-gray-600";
    if (interpretacion.includes("eficiente") || interpretacion.includes("bajo"))
      return "bg-green-100 text-green-800";
    if (
      interpretacion.includes("moderado") ||
      interpretacion.includes("normal")
    )
      return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Contadores para filtros activos
  const filtrosActivos = Object.values(filtros).filter((f) => f !== "").length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <FiLoader className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" />
        <p className="text-gray-600">
          Cargando análisis de consumo por máquina...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <FiAlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={cargarDatosConsumoCategoria}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (datosConsumo.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <FiInfo className="h-8 w-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">
          No hay datos de consumo disponibles para el período seleccionado.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm ">
      <div className="bg-gradient-to-r from-orange-50 to-pink-50 p-4 border-b z-[50]">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiDollarSign className="h-5 w-5 mr-2 text-purple-500" />
              Análisis por Máquina
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Ordenado por:{" "}
                {ordenColumna === "litros_totales"
                  ? "Consumo Total"
                  : ordenColumna === "maquina" // 🔧 CORREGIDO
                  ? "Máquina"
                  : ordenColumna === "categoria"
                  ? "Categoría"
                  : ordenColumna === "faena"
                  ? "Faena"
                  : ordenColumna === "precio_promedio_litro"
                  ? "Precio específico"
                  : ordenColumna === "valor_total"
                  ? "Valor Total"
                  : ordenColumna === "rendimiento"
                  ? "Rendimiento"
                  : ordenColumna === "porcentaje_confirmado"
                  ? "Precisión"
                  : ordenColumna}
                {direccionOrden === "desc" ? " ↓" : " ↑"}
              </span>
              {filtrosActivos > 0 && (
                <span className="ml-2 text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                  {filtrosActivos} filtro{filtrosActivos !== 1 ? "s" : ""}{" "}
                  activo{filtrosActivos !== 1 ? "s" : ""}
                </span>
              )}
            </h3>

            <p className="text-sm text-gray-600 mt-1 flex items-center">
              <FiClock className="h-4 w-4 mr-1 text-blue-500" />
              Filtrado con precisión horaria:{" "}
              {formatearFechaHora(fechaDesde, horaDesde)} hasta{" "}
              {formatearFechaHora(fechaHasta, horaHasta)}
            </p>
          </div>

          {/* Estadísticas del resumen ejecutivo */}
          {resumenGeneral && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-lg font-bold text-blue-600">
                  {resumenGeneral.consumo_total.litros}L
                </div>
                <div className="text-xs text-gray-500">Total Consumo</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-lg font-bold text-green-600">
                  {resumenGeneral.consumo_total.porcentaje_confirmado}%
                </div>
                <div className="text-xs text-gray-500">Confirmado</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-lg font-bold text-purple-600">
                  $
                  {Math.round(
                    resumenGeneral.costo_estimado.total
                  ).toLocaleString("es-CL")}
                </div>
                <div className="text-xs text-gray-500">Costo Total</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-lg font-bold text-orange-600">
                  ${resumenGeneral.costo_estimado.precio_promedio_litro}
                </div>
                <div className="text-xs text-gray-500">Precio Prom.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barra de filtros activos */}
      {filtrosActivos > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-blue-700">
              Filtros activos:
            </span>
            {/* 🆕 FILTROS MÚLTIPLES: Máquinas */}
            {filtros.maquina && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                Máquina{filtros.maquina.includes(",") ? "s" : ""}:{" "}
                {filtros.maquina.includes(",")
                  ? `${filtros.maquina.split(",").length} seleccionadas`
                  : filtros.maquina}
                <button
                  onClick={() => manejarCambioFiltro("maquina", "")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <FiX size={12} />
                </button>
              </span>
            )}
            {/* 🆕 FILTROS MÚLTIPLES: Categorías */}
            {filtros.categoria && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                Categoría{filtros.categoria.includes(",") ? "s" : ""}:{" "}
                {filtros.categoria.includes(",")
                  ? `${filtros.categoria.split(",").length} seleccionadas`
                  : filtros.categoria}
                <button
                  onClick={() => manejarCambioFiltro("categoria", "")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <FiX size={12} />
                </button>
              </span>
            )}
            {/* 🆕 FILTROS MÚLTIPLES: Faenas */}
            {filtros.faena && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                Faena{filtros.faena.includes(",") ? "s" : ""}:{" "}
                {filtros.faena.includes(",")
                  ? `${filtros.faena.split(",").length} seleccionadas`
                  : filtros.faena}
                <button
                  onClick={() => manejarCambioFiltro("faena", "")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <FiX size={12} />
                </button>
              </span>
            )}
            {filtros.patente && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white border border-blue-300">
                Patente: {filtros.patente}
                <button
                  onClick={() => manejarCambioFiltro("patente", "")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <FiX size={12} />
                </button>
              </span>
            )}
            <button
              onClick={limpiarFiltros}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Limpiar todos
            </button>
          </div>
        </div>
      )}

      {/* 🔧 TABLA MEJORADA CON ALTURA MÍNIMA Y TRANSICIONES */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* ✅ COLUMNA MÁQUINA - MULTISELECT */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <UniversalTableFilter
                  titulo="Máquina"
                  columna="maquina"
                  tipo="select"
                  esMultiple={true} // 🆕 MULTISELECT HABILITADO
                  opciones={opcionesFiltros.maquinas}
                  valorFiltro={filtros.maquina}
                  onFiltroChange={manejarCambioFiltro}
                  onOrdenamientoChange={manejarCambioOrdenamiento}
                  ordenColumna={ordenColumna}
                  direccionOrden={direccionOrden}
                  mostrarBusqueda={true}
                  placeholder="Buscar máquina..."
                  anchoMinimo="280px" // Un poco más ancho para multiselect
                />
              </th>

              {/* ✅ COLUMNA CATEGORÍA - MULTISELECT */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <UniversalTableFilter
                  titulo="Categoría"
                  columna="categoria"
                  tipo="select"
                  esMultiple={true} // 🆕 MULTISELECT HABILITADO
                  opciones={opcionesFiltros.categorias}
                  valorFiltro={filtros.categoria}
                  onFiltroChange={manejarCambioFiltro}
                  onOrdenamientoChange={manejarCambioOrdenamiento}
                  ordenColumna={ordenColumna}
                  direccionOrden={direccionOrden}
                  anchoMinimo="230px"
                />
              </th>

              {/* ✅ COLUMNA FAENA - MULTISELECT */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <UniversalTableFilter
                  titulo="Faena"
                  columna="faena"
                  tipo="select"
                  esMultiple={true} // 🆕 MULTISELECT HABILITADO
                  opciones={opcionesFiltros.faenas}
                  valorFiltro={filtros.faena}
                  onFiltroChange={manejarCambioFiltro}
                  onOrdenamientoChange={manejarCambioOrdenamiento}
                  ordenColumna={ordenColumna}
                  direccionOrden={direccionOrden}
                  anchoMinimo="210px"
                />
              </th>

              {/* 🔧 OTRAS COLUMNAS CONVERTIDAS A UniversalTableFilter */}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <UniversalTableFilter
                  titulo="Consumo Total"
                  columna="litros_totales"
                  onOrdenamientoChange={manejarCambioOrdenamiento}
                  ordenColumna={ordenColumna}
                  direccionOrden={direccionOrden}
                />
              </th>

              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <UniversalTableFilter
                  titulo="Precio Específico"
                  columna="precio_promedio_litro"
                  onOrdenamientoChange={manejarCambioOrdenamiento}
                  ordenColumna={ordenColumna}
                  direccionOrden={direccionOrden}
                />
              </th>

              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <UniversalTableFilter
                  titulo="Valor Total"
                  columna="valor_total"
                  onOrdenamientoChange={manejarCambioOrdenamiento}
                  ordenColumna={ordenColumna}
                  direccionOrden={direccionOrden}
                />
              </th>

              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <UniversalTableFilter
                  titulo="Rendimiento"
                  columna="rendimiento"
                  onOrdenamientoChange={manejarCambioOrdenamiento}
                  ordenColumna={ordenColumna}
                  direccionOrden={direccionOrden}
                />
              </th>

              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <UniversalTableFilter
                  titulo="Precisión"
                  columna="porcentaje_confirmado"
                  onOrdenamientoChange={manejarCambioOrdenamiento}
                  ordenColumna={ordenColumna}
                  direccionOrden={direccionOrden}
                />
              </th>
            </tr>
          </thead>
          {/* 🆕 TBODY CON ALTURA MÍNIMA Y TRANSICIONES SUAVES */}
          <tbody
            className="bg-white divide-y divide-gray-200 transition-all duration-300 ease-in-out"
            style={{
              minHeight: "800px", // 🎯 ALTURA MÍNIMA para evitar saltos
            }}
          >
            {/* Usar datos procesados (filtrados y ordenados) */}
            {datosProcesados.map((maquina, index) => {
              // 🆕 AGREGAR: Obtener colores sutiles de la faena
              const faenaColors = getFaenaColors(maquina.faena);
              return (
                <tr
                  key={`${maquina.id_maquina}-${index}`}
                  // 🎨 NUEVA LÍNEA: Aplicar colores sutiles
                  className={`${faenaColors.bg} ${faenaColors.border} ${faenaColors.hover} transition-all duration-200 ease-in-out transform group`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: "fadeInUp 0.4s ease-out forwards",
                  }}
                >
                  {/* Columna Máquina */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div
                        className="font-medium text-gray-900"
                        title={maquina.nombre_maquina}
                      >
                        {" "}
                        {/* 👈 title para mostrar completo en hover */}
                        {maquina.nombre_maquina.length > 20
                          ? `${maquina.nombre_maquina.substring(0, 20)}...`
                          : maquina.nombre_maquina}
                      </div>
                      <div className="text-sm text-gray-500">
                        {maquina.patente}
                      </div>
                      <div className="text-xs text-gray-500 text-left">
                        {maquina.categoria}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-2">
                      <div>
                        {maquina.tipo_medicion === "Horometro" ? (
                          <span className="px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Horómetro:{" "}
                            {maquina.rendimiento?.medicion_total
                              ?.ultima_medicion
                              ? Number(
                                  maquina.rendimiento.medicion_total
                                    .ultima_medicion
                                ).toLocaleString()
                              : "N/A"}{" "}
                            hrs
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full  bg-blue-100 text-blue-800">
                            Kilometraje:{" "}
                            {maquina.rendimiento?.medicion_total
                              ?.ultima_medicion
                              ? Number(
                                  maquina.rendimiento.medicion_total
                                    .ultima_medicion
                                ).toLocaleString()
                              : "N/A"}{" "}
                            km
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex flex-col space-y-1">
                      {(() => {
                        const faenaInfo =
                          maquina.analisis_completo?.maquina?.faena;

                        if (
                          !faenaInfo ||
                          !faenaInfo.faenas_detalle ||
                          faenaInfo.faenas_detalle.length === 0
                        ) {
                          return (
                            <span className="text-gray-500 text-sm">N/A</span>
                          );
                        }

                        if (faenaInfo.faenas_detalle.length === 1) {
                          // Una sola faena
                          const faena = faenaInfo.faenas_detalle[0];
                          const faenaColors = getFaenaColors(faena.nombre);

                          return (
                            <div className="flex items-center">
                              <span className="text-xs mr-1">
                                {faenaColors.emoji}
                              </span>
                              <span className="font-medium text-gray-800">
                                {faena.nombre}
                              </span>
                              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {faena.consumos} reg.
                              </span>
                            </div>
                          );
                        }

                        // Múltiples faenas
                        const totalConsumos = faenaInfo.faenas_detalle.reduce(
                          (sum, f) => sum + f.consumos,
                          0
                        );

                        return (
                          <div className="space-y-1">
                            <div className="flex items-center text-xs text-gray-600 border-b border-gray-200 pb-1">
                              <span className="font-medium">
                                {faenaInfo.total_faenas} faenas
                              </span>
                              <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {totalConsumos} reg.
                              </span>
                            </div>

                            {faenaInfo.faenas_detalle.map((faena, index) => {
                              const faenaColors = getFaenaColors(
                                faena.nombre
                              );
                              const porcentaje = (
                                (faena.consumos / totalConsumos) *
                                100
                              ).toFixed(1);

                              return (
                                <div
                                  key={index}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <div className="flex items-center">
                                    <span className="mr-1">
                                      {faenaColors.emoji}
                                    </span>
                                    <span className="font-medium text-gray-700">
                                      {faena.nombre}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <span className="text-gray-600">
                                      {faena.consumos}
                                    </span>
                                    <span className="text-gray-500">
                                      ({porcentaje}%)
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </td>
                  
                  
                  
{/*  // Columna Consumo Total - Reemplazar en ConsumoPorMaquinaPureTable.jsx*/}

<td className="px-6 py-4 whitespace-nowrap text-right">
  <div className="flex flex-col items-end space-y-1">
    {/* NUEVA SECCIÓN: Solo distribución por faenas (sin total principal) */}
    {(() => {
      const faenaInfo = maquina.analisis_completo?.maquina?.faena;
      
      // Si hay una sola faena, mostrar formato simple
      if (!faenaInfo || !faenaInfo.faenas_detalle || faenaInfo.faenas_detalle.length <= 1) {
        return (
          <div className="flex flex-col items-end">
            <div className="text-sm font-bold text-gray-900">
              {maquina.litros_totales.toLocaleString("es-CL", {
                maximumFractionDigits: 1,
              })}L
            </div>
            <div className="text-xs text-gray-500">
              {maquina.litros_confirmados > 0 && (
                <span className="text-green-600">
                  {maquina.litros_confirmados}L conf.
                </span>
              )}
              {maquina.litros_simulados > 0 && (
                <span className="text-blue-600 ml-1">
                  +{maquina.litros_simulados}L sim.
                </span>
              )}
            </div>
          </div>
        );
      }

      // Calcular litros confirmados EXACTOS por faena usando faena_id
      const litrosConfirmadosPorFaena = {};
      
      // Inicializar contadores para todas las faenas
      faenaInfo.faenas_detalle.forEach(faena => {
        litrosConfirmadosPorFaena[faena.id] = {
          nombre: faena.nombre,
          confirmados: 0,
          simulados: 0
        };
      });

      // Sumar litros confirmados REALES por faena
      const periodosConfirmados = maquina.analisis_completo?.periodos_confirmados || [];
      periodosConfirmados.forEach(periodo => {
        const faenaId = periodo.faena_id;
        const litros = periodo.consumo.litros;
        
        if (litrosConfirmadosPorFaena[faenaId]) {
          litrosConfirmadosPorFaena[faenaId].confirmados += litros;
        }
      });

      // Determinar faena de la última carga para asignar simulados
      let faenaUltimaCarga = null;
      const ultimaCargaInfo = maquina.analisis_completo?.ultima_carga_info;
      
      if (ultimaCargaInfo) {
        faenaUltimaCarga = ultimaCargaInfo.faena_id;
      } else if (periodosConfirmados.length > 0) {
        // Fallback: usar último período confirmado
        const ultimoPeriodo = periodosConfirmados[periodosConfirmados.length - 1];
        faenaUltimaCarga = ultimoPeriodo.faena_id;
      }

      // Asignar simulados a la faena de la última carga
      const litrosSimuladosTotal = maquina.litros_simulados;
      if (faenaUltimaCarga && litrosConfirmadosPorFaena[faenaUltimaCarga]) {
        litrosConfirmadosPorFaena[faenaUltimaCarga].simulados = litrosSimuladosTotal;
      }

      // Crear array para mostrar, solo faenas con datos
      const distribucionPorFaena = Object.entries(litrosConfirmadosPorFaena)
        .filter(([_, datos]) => datos.confirmados > 0 || datos.simulados > 0)
        .map(([faenaId, datos]) => ({
          id: parseInt(faenaId),
          nombre: datos.nombre,
          confirmados: datos.confirmados,
          simulados: datos.simulados,
          total: datos.confirmados + datos.simulados,
          esUltimaCarga: parseInt(faenaId) === faenaUltimaCarga
        }));

      if (distribucionPorFaena.length === 0) return null;

      const totalGeneral = maquina.litros_confirmados + maquina.litros_simulados;

      return (
        <div className="space-y-1">
          <div className="text-xs text-gray-600 font-medium">Por faena:</div>
          {distribucionPorFaena.map((faena) => {
            const faenaColors = getFaenaColors(faena.nombre);
            const porcentajeTotal = ((faena.total / totalGeneral) * 100).toFixed(1);
            
            return (
              <div key={faena.id} className="space-y-0.5">
                {/* Línea principal: Faena y total */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    <span style={{ fontSize: '8px' }}>{faenaColors.emoji}</span>
                    <span className="text-gray-700 font-medium">{faena.nombre}</span>
                    {faena.esUltimaCarga && faena.simulados > 0 && (
                      <span className="text-blue-500" title="Última carga registrada">⏱</span>
                    )}
                  </div>
                  <div className="text-gray-800 font-semibold">
                    {Math.round(faena.total)}L ({porcentajeTotal}%)
                  </div>
                </div>
                
                {/* Badges de confirmados/simulados */}
                <div className="flex justify-end">
                  <div className="flex space-x-1">
                    {faena.confirmados > 0 && (
                      <span className="text-green-700 bg-green-100 px-1.5 py-0.5 rounded text-xs">
                        {Math.round(faena.confirmados)}L conf.
                      </span>
                    )}
                    {faena.simulados > 0 && (
                      <span className="text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded text-xs">
                        {Math.round(faena.simulados)}L sim.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    })()}
  </div>
</td>


                  {/* Columna Precio Específico */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      ${maquina.precio_promedio_litro.toLocaleString("es-CL")}
                    </div>
                    <div className="text-xs text-gray-500">por litro</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <ColumnaValorTotal maquina={maquina} />
                  </td>
                  {/* Columna Rendimiento */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {maquina.rendimiento && maquina.rendimiento.valor > 0 ? (
                      <div className="flex flex-col items-end">
                        <div className="text-sm font-bold text-gray-900">
                          {maquina.rendimiento.formateado}
                        </div>
                        
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic">
                        Sin datos
                      </div>
                    )}
                  </td>
                  {/* Columna Precisión */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getColorPrecision(
                        maquina.porcentaje_confirmado
                      )}`}
                    >
                      {maquina.porcentaje_confirmado.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {maquina.porcentaje_confirmado >= 80
                        ? "Alta"
                        : maquina.porcentaje_confirmado >= 60
                        ? "Media"
                        : maquina.porcentaje_confirmado > 0
                        ? "Baja"
                        : "Solo simulación"}
                    </div>
                  </td>
                </tr>
              ); // 🆕 Cerrar el return
            })}
            {/* 🆕 FILAS VACÍAS PARA MANTENER ALTURA MÍNIMA */}
            {datosProcesados.length < 4 &&
              Array.from({ length: 4 - datosProcesados.length }).map(
                (_, index) => (
                  <tr
                    key={`empty-${index}`}
                    className="h-20" // Altura similar a las filas reales
                    style={{ opacity: 0 }} // Invisible pero mantiene el espacio
                  >
                    <td colSpan="4">&nbsp;</td>
                  </tr>
                )
              )}
          </tbody>
        </table>
      </div>
      {/* Footer con información actualizada */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
          <div className="text-sm text-gray-600">
            <div className="text-xs text-blue-600 mt-1 flex items-center">
              <FiClock className="h-3 w-3 mr-1" />
              Período: {formatearFechaHora(fechaDesde, horaDesde)} -{" "}
              {formatearFechaHora(fechaHasta, horaHasta)}
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>
              <strong>{datosProcesados.length}</strong> de{" "}
              <strong>{datosConsumo.length}</strong> máquina
              {datosConsumo.length !== 1 ? "s" : ""} mostrada
              {datosProcesados.length !== 1 ? "s" : ""}
            </span>
            {filtrosActivos > 0 && (
              <>
                <span>•</span>
                <span className="text-orange-600">
                  <strong>{filtrosActivos}</strong> filtro
                  {filtrosActivos !== 1 ? "s" : ""} activo
                  {filtrosActivos !== 1 ? "s" : ""}
                </span>
              </>
            )}
            <span>•</span>
            <span>
              <strong>
                {
                  datosProcesados.filter((m) => m.porcentaje_confirmado > 0)
                    .length
                }
              </strong>{" "}
              con datos confirmados
            </span>
            <span>•</span>
            <span>
              <strong>
                {datosProcesados.filter((m) => m.litros_simulados > 0).length}
              </strong>{" "}
              con simulación
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ConsumoPorMaquinaPureTable;
