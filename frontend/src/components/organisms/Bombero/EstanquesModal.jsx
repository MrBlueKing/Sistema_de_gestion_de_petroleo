import React, { useState, useRef, useEffect } from "react";
import {
  FaTimes,
  FaCalculator,
  FaInfoCircle,
  FaRuler,
  FaCheck,
  FaGasPump,
  FaExclamationTriangle,
  FaArrowRight,
  FaQuestionCircle,
  FaWater,
  FaChartLine,
  FaClipboardCheck,
  FaOilCan,
  FaExclamationCircle,
} from "react-icons/fa";

// Componentes auxiliares
const InputNivel = ({
  value,
  onChange,
  label,
  placeholder,
  disabled,
  unidad = "cm",
}) => (
  <div className="mb-3">
    <label className="text-sm font-medium text-gray-700 block mb-1.5">
      {label}
    </label>
    <div className="relative group">
      <input
        type="number"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full border ${disabled ? "bg-gray-100" : "bg-white"
          } rounded-lg p-3 pr-14 text-base md:text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all shadow-sm ${!disabled && "group-hover:border-orange-300"
          } appearance-none`}
        style={{
          WebkitAppearance: "none",
          MozAppearance: "textfield",
        }}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <span className="text-gray-500 text-sm mr-1 font-medium">{unidad}</span>
        <FaRuler className="text-gray-400" />
      </div>
      <div className="absolute inset-0 border-2 border-transparent rounded-lg pointer-events-none transition-all group-hover:border-orange-200"></div>
    </div>
  </div>
);

// Componente para distribución de litros (más simple)
const InputLitros = ({ value, onChange, placeholder, disabled, error }) => (
  <div className="mb-3">
    <label className="text-sm font-medium text-gray-700 block mb-1.5">
      Litros a Ingresar
    </label>
    <div className="relative group">
      <input
        type="number"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        min="0"
        step="0.01"
        className={`w-full border ${disabled ? "bg-gray-100" : "bg-white"} ${error ? "border-red-500 focus:border-red-500" : "border-gray-300"
          } rounded-lg p-3 pr-14 text-base md:text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all shadow-sm ${!disabled && "group-hover:border-orange-300"
          } appearance-none`}
        style={{
          WebkitAppearance: "none",
          MozAppearance: "textfield",
        }}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <span className="text-gray-500 text-sm mr-1 font-medium">L</span>
        <FaGasPump className="text-gray-400" />
      </div>
      {error && (
        <div className="absolute inset-0 border-2 border-red-300 rounded-lg pointer-events-none"></div>
      )}
    </div>
    {error && (
      <p className="text-red-500 text-xs mt-1 flex items-center">
        <FaExclamationCircle className="mr-1" />
        {error}
      </p>
    )}
  </div>
);

// Componente de notificación/alerta optimizado
const InfoBox = ({ type, message }) => (
  <div
    className={`p-4 rounded-lg mb-4 flex items-start ${type === "info"
      ? "bg-blue-50 text-blue-800 border-l-4 border-blue-500"
      : type === "error"
        ? "bg-red-50 text-red-800 border-l-4 border-red-500"
        : type === "warning"
          ? "bg-amber-50 text-amber-800 border-l-4 border-amber-500"
          : "bg-green-50 text-green-800 border-l-4 border-green-500"
      }`}
  >
    <div className="flex-shrink-0 mr-3 mt-0.5">
      {type === "info" ? (
        <FaInfoCircle className="text-blue-600" size={20} />
      ) : type === "error" ? (
        <FaExclamationTriangle className="text-red-600" size={20} />
      ) : type === "warning" ? (
        <FaExclamationTriangle className="text-amber-600" size={20} />
      ) : (
        <FaCheck className="text-green-600" size={20} />
      )}
    </div>
    <div className="text-sm md:text-base">{message}</div>
  </div>
);

// Componente de tarjeta de estadísticas con diseño responsive
const StatCard = ({
  icon,
  title,
  value,
  colorClass,
  iconBgClass,
  unit = "litros",
}) => (
  <div
    className={`bg-white rounded-lg p-4 border shadow-sm hover:shadow transition-shadow ${colorClass}`}
  >
    <div className="flex items-center">
      <div className={`p-3 rounded-lg mr-4 ${iconBgClass}`}>{icon}</div>
      <div className="flex-1">
        <p className="text-xs sm:text-sm text-gray-600 font-medium">{title}</p>
        <p className="font-bold text-base sm:text-lg text-gray-800 mt-0.5 flex items-baseline">
          {value}
          <span className="text-xs text-gray-500 ml-1 font-medium">{unit}</span>
        </p>
      </div>
    </div>
  </div>
);

const EstanquesModal = ({
  isOpen,
  onClose,
  estanques = [],
  alturasEstanques = {},
  handleAlturaChange,
  calcularLitrosPetroleo,
  modalAlert = { show: false, message: "", type: "" },
  capacidadDisponible = 0,
  litrosRecibidos = 0,
  // Nuevas props para distribución
  distribucionLitros = {},
  onDistribucionChange,
  esTrasvasije = false // true para trasvasije (1 estanque), false para recepción (múltiples)
}) => {
  const activo = false;
  // 🔍 AGREGAR ESTO PARA DEPURAR:
  activo && console.log("🔍 EstanquesModal recibió:", {
    esTrasvasije,
    litrosRecibidos,
    distribucionLitros
  });

  const [loading, setLoading] = useState(false);
  const [resultadoCalculo, setResultadoCalculo] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const errorRef = useRef(null);
  const modalRef = useRef(null);

  // Estados para errores específicos de validación
  const [errorValidacion, setErrorValidacion] = useState({
    show: false,
    message: "",
    type: "error"
  });

  // Estado para controlar el paso actual (inicial o final)
  const [paso, setPaso] = useState("inicial"); // 'inicial' o 'final'

  // Estado para controlar la visualización de la ayuda
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  // Estado local para la distribución si no se proporciona desde el padre
  const [distribucionLocal, setDistribucionLocal] = useState({});

  // Estado para errores de validación de distribución
  const [erroresDistribucion, setErroresDistribucion] = useState({});

  // Estado para controlar qué estanques tienen la info expandida (solo móvil)
  const [estanquesExpandidos, setEstanquesExpandidos] = useState({});

  // Estado para controlar si se muestran los consejos de medición en móvil
  const [mostrarConsejos, setMostrarConsejos] = useState(false);


  // NUEVOS ESTADOS PARA NUMERALES(Cambio de contexto)
  const modoNumerales = true; // Siempre usar numerales
  const [numeralesEstanques, setNumeralesEstanques] = useState({});
  const [litrosCalculados, setLitrosCalculados] = useState({});

  const calcularLitrosDesdeNumerales = () => {
    const estanquesConNumerales = Object.entries(numeralesEstanques)
      .filter(([estanqueId, numeral]) => numeral && parseFloat(numeral) > 0)
      .map(([estanqueId, numeral]) => ({
        id_estanque: parseInt(estanqueId),
        numeral: parseFloat(numeral)
      }));

    if (estanquesConNumerales.length === 0) return {};

    // Ordenar por numeral de menor a mayor
    estanquesConNumerales.sort((a, b) => a.numeral - b.numeral);

    // Calcular litros por diferencias
    const nuevosLitrosCalculados = {};
    let numeralAnterior = 0;

    estanquesConNumerales.forEach((item) => {
      nuevosLitrosCalculados[item.id_estanque] = item.numeral - numeralAnterior;
      numeralAnterior = item.numeral;
    });

    return nuevosLitrosCalculados;
  };

  const handleNumeralChange = (estanqueId, valor) => {
    // Actualizar numerales
    const nuevosNumerales = {
      ...numeralesEstanques,
      [estanqueId]: valor
    };
    setNumeralesEstanques(nuevosNumerales);

    // USAR LOS NUEVOS NUMERALES INMEDIATAMENTE PARA EL CÁLCULO
    const estanquesConNumerales = Object.entries(nuevosNumerales)
      .filter(([_, numeral]) => numeral && parseFloat(numeral) > 0)
      .map(([id, numeral]) => ({
        id_estanque: parseInt(id),
        numeral: parseFloat(numeral)
      }))
      .sort((a, b) => a.numeral - b.numeral);

    const nuevosLitros = {};
    let numeralAnterior = 0;

    estanquesConNumerales.forEach(item => {
      nuevosLitros[item.id_estanque] = item.numeral - numeralAnterior;
      numeralAnterior = item.numeral;
    });

    setLitrosCalculados(nuevosLitros);

    // Actualizar distribución inmediatamente
    if (onDistribucionChange) {
      const distribucionParaBackend = {};
      estanques.forEach(estanque => {
        distribucionParaBackend[estanque.id_estanque] =
          nuevosLitros[estanque.id_estanque] || 0;
      });
      onDistribucionChange(distribucionParaBackend);
    }
  };

  // Función para manejar selección automática de estanque en trasvasijes
  // CORRECCIÓN EN EstanquesModal.jsx
  // Modificar la función de selección automática:

  const seleccionarEstanqueAutomatico = (estanqueId) => {
    if (!esTrasvasije) return;

    const litrosTotal = litrosRecibidos || 0;
    const estanqueSeleccionado = estanques.find(e => e.id_estanque === estanqueId);

    // Verificar capacidad
    const capacidadDisponible = estanqueSeleccionado.capacidad - estanqueSeleccionado.stock_actual;
    if (litrosTotal > capacidadDisponible) {
      alert(`❌ Capacidad insuficiente. Disponible: ${capacidadDisponible.toLocaleString('es-CL')} L`);
      return;
    }

    // 🆕 ASIGNACIÓN AUTOMÁTICA - Solo este estanque recibe TODOS los litros
    const nuevaDistribucion = {};
    estanques.forEach((estanque) => {
      nuevaDistribucion[estanque.id_estanque] =
        estanque.id_estanque === estanqueId ? litrosTotal.toString() : "0";
    });

    // Enviar al padre
    if (onDistribucionChange) {
      onDistribucionChange(nuevaDistribucion);
    }

    activo && console.log(`✅ Estanque seleccionado: ${estanqueSeleccionado.nombre} recibirá ${litrosTotal} L`);
  };

  // Función para toggle del estado expandido
  const toggleEstanqueExpandido = (estanqueId) => {
    setEstanquesExpandidos((prev) => ({
      ...prev,
      [estanqueId]: !prev[estanqueId],
    }));
  };

  // 🔧 FUNCIÓN MODIFICADA PARA MANEJAR DISTRIBUCIÓN
  const handleDistribucionChange = (estanqueId, valor) => {
    if (esTrasvasije) {
      // MODO TRASVASIJE: Solo un estanque puede tener valor
      const nuevaDistribucion = {};

      // Limpiar todos los estanques
      estanques.forEach(estanque => {
        nuevaDistribucion[estanque.id_estanque] = "";
      });

      // Si el valor es mayor a 0, asignar TODOS los litros a este estanque
      if (parseFloat(valor) > 0) {
        nuevaDistribucion[estanqueId] = litrosRecibidos.toString();
      }

      // Llamar al handler del padre
      if (onDistribucionChange) {
        onDistribucionChange(nuevaDistribucion);
      }
    } else {
      // MODO RECEPCIÓN: Mantener comportamiento original (múltiples estanques)
      const distribucionActual = getDistribucionActual();
      const nuevaDistribucion = {
        ...distribucionActual,
        [estanqueId]: valor
      };

      if (onDistribucionChange) {
        onDistribucionChange(nuevaDistribucion);
      }
    }
  };

  // 🔧 FUNCIÓN PARA RENDERIZAR CAMPOS DE DISTRIBUCIÓN
  const renderCampoDistribucion = (estanque) => {
    const distribucionActual = getDistribucionActual();
    const valorActual = distribucionActual[estanque.id_estanque] || "";

    if (esTrasvasije) {
      // MODO TRASVASIJE: Mostrar radio button
      const esSeleccionado = parseFloat(valorActual) > 0;

      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              name="estanque-destino-trasvasije"
              checked={esSeleccionado}
              onChange={() => {
                if (!esSeleccionado) {
                  // Al seleccionar este estanque, asignar todos los litros
                  handleDistribucionChange(estanque.id_estanque, litrosRecibidos.toString());
                }
              }}
              className="h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Seleccionar como destino único del trasvasije
            </label>
          </div>

          {esSeleccionado && (
            <div className="ml-7">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-700">Litros a trasvasijar:</span>
                  <span className="font-bold text-orange-800">
                    {parseFloat(litrosRecibidos).toLocaleString('es-CL')} L
                  </span>
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  💡 En trasvasije, todos los litros van a un solo estanque
                </p>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      // MODO RECEPCIÓN: Mantener input normal (comportamiento original)
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Litros a recibir en este estanque:
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max={litrosRecibidos}
            value={valorActual}
            onChange={(e) => handleDistribucionChange(estanque.id_estanque, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="0.00"
          />
        </div>
      );
    }
  };

  // 🔧 VALIDACIÓN ESPECÍFICA PARA TRASVASIJE
  const validarDistribucion = () => {
    const distribucionActual = getDistribucionActual();
    const estanquesConLitros = Object.values(distribucionActual).filter(
      val => parseFloat(val) > 0
    );

    if (esTrasvasije) {
      // En trasvasije debe haber exactamente 1 estanque seleccionado
      if (estanquesConLitros.length === 0) {
        return {
          valido: false,
          mensaje: "Debe seleccionar un estanque de destino para el trasvasije"
        };
      }

      if (estanquesConLitros.length > 1) {
        return {
          valido: false,
          mensaje: "En trasvasije solo puede seleccionar un estanque de destino"
        };
      }

      return { valido: true, mensaje: "" };
    } else {
      // Validación original para recepción (múltiples estanques permitidos)
      const totalDistribuido = estanquesConLitros.reduce((sum, val) => sum + parseFloat(val), 0);

      if (totalDistribuido === 0) {
        return {
          valido: false,
          mensaje: "Debe distribuir los litros en al menos un estanque"
        };
      }

      // if (Math.abs(totalDistribuido - litrosRecibidos) > 0.01) {
      //   return {
      //     valido: false,
      //     mensaje: `La distribución (${totalDistribuido.toLocaleString('es-CL')} L) debe coincidir con los litros documentados (${litrosRecibidos.toLocaleString('es-CL')} L)`
      //   };
      // }

      return { valido: true, mensaje: "" };
    }
  };

  // 🔧 TEXTOS ADAPTATIVOS
  const getTitulos = () => {
    if (esTrasvasije) {
      return {
        seccionDistribucion: "Selección de Estanque Destino",
        descripcionDistribucion: "Seleccione el estanque fijo que recibirá todo el combustible del trasvasije:",
        totalLabel: "Total a trasvasijar"
      };
    } else {
      return {
        seccionDistribucion: "Distribución de Combustible",
        descripcionDistribucion: "Distribuya los litros entre los estanques fijos disponibles:",
        totalLabel: "Total distribuido"
      };
    }
  };

  // Detectar si el dispositivo es móvil basado en el ancho de pantalla
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setResultadoCalculo(null);
      setPaso("inicial");
      setMostrarAyuda(false);
      setErroresDistribucion({});
      setEstanquesExpandidos({});
      setMostrarConsejos(false);
      setErrorValidacion({ show: false, message: "", type: "error" });

      // Inicializar distribución local vacía si no hay una externa
      if (!distribucionLitros || Object.keys(distribucionLitros).length === 0) {
        const distribucionInicial = {};
        estanques.forEach((estanque) => {
          distribucionInicial[estanque.id_estanque] = "";
        });
        setDistribucionLocal(distribucionInicial);
      }

      // Scroll al inicio cuando se abre el modal (para móviles)
      if (modalRef.current) {
        modalRef.current.scrollTop = 0;
      }
    }
  }, [isOpen, estanques, distribucionLitros]);

  // Desplazamiento automático al error cuando aparece
  useEffect(() => {
    if (
      (modalAlert && modalAlert.show && modalAlert.type === "error") ||
      (errorValidacion && errorValidacion.show)
    ) {
      if (errorRef.current) {
        if (isMobile) {
          errorRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else {
          errorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  }, [modalAlert, errorValidacion, isMobile]);

  // Función para obtener la distribución actual (externa o local)
  const getDistribucionActual = () => {
    return distribucionLitros && Object.keys(distribucionLitros).length > 0
      ? distribucionLitros
      : distribucionLocal;
  };

  // Función para obtener solo los estanques que tienen distribución de combustible
  const getEstanquesConDistribucion = () => {
    if (modoNumerales) {
      return estanques.filter(estanque => {
        return litrosCalculados[estanque.id_estanque] > 0;
      });
    } else {
      // Mantener lógica original
      const distribucion = getDistribucionActual();
      return estanques.filter(estanque => {
        const litrosAsignados = parseFloat(distribucion[estanque.id_estanque]) || 0;
        return litrosAsignados > 0;
      });
    }
  };

  // Función para actualizar la distribución
  const actualizarDistribucion = (estanqueId, valor) => {
    if (modoNumerales) return; // No permitir cambios manuales en modo numerales
    let nuevaDistribucion;

    if (esTrasvasije) {
      // MODO TRASVASIJE: Solo un estanque puede tener litros
      nuevaDistribucion = {};

      // Limpiar todos los estanques
      estanques.forEach((estanque) => {
        nuevaDistribucion[estanque.id_estanque] = "";
      });

      // Solo asignar valor al estanque actual si tiene valor
      if (valor && parseFloat(valor) > 0) {
        nuevaDistribucion[estanqueId] = valor;
      }
    } else {
      // MODO RECEPCIÓN: Comportamiento original (múltiples estanques)
      nuevaDistribucion = {
        ...getDistribucionActual(),
        [estanqueId]: valor,
      };
    }

    // Actualizar distribución
    if (onDistribucionChange) {
      onDistribucionChange(nuevaDistribucion);
    } else {
      setDistribucionLocal(nuevaDistribucion);
    }

    // Limpiar error específico del estanque
    if (erroresDistribucion[estanqueId]) {
      setErroresDistribucion((prev) => ({
        ...prev,
        [estanqueId]: null,
      }));
    }

    // Limpiar error de validación si existe
    if (errorValidacion.show) {
      setErrorValidacion({ show: false, message: "", type: "error" });
    }
  };

  // Función para calcular el total distribuido
  const getTotalDistribuido = () => {
    if (modoNumerales) {
      return Object.values(litrosCalculados).reduce((total, valor) => {
        return total + (parseFloat(valor) || 0);
      }, 0);
    } else {
      // Mantener lógica original
      const distribucion = getDistribucionActual();
      return Object.values(distribucion).reduce((total, valor) => {
        return total + (parseFloat(valor) || 0);
      }, 0);
    }
  };

  // Verificar si se han ingresado todos los niveles iniciales
  const nivelesInicialesCompletos = () => {
    const estanquesConDistribucion = getEstanquesConDistribucion();
    if (estanquesConDistribucion.length === 0) return false;

    return estanquesConDistribucion.every((estanque) => {
      const alturas = alturasEstanques[estanque.id_estanque] || {};
      return alturas.inicial && alturas.inicial !== "";
    });
  };

  // Verificar si se han ingresado todos los niveles finales (solo estanques con distribución)
  const nivelesFinalesCompletos = () => {
    const estanquesConDistribucion = getEstanquesConDistribucion();
    if (estanquesConDistribucion.length === 0) return false;

    return estanquesConDistribucion.every((estanque) => {
      const alturas = alturasEstanques[estanque.id_estanque] || {};
      return alturas.final && alturas.final !== "";
    });
  };

  // Función para validar y mostrar errores específicos con orden lógico
  const validarYAvanzar = () => {

    // AGREGAR ESTA VALIDACIÓN AL INICIO:
    if (modoNumerales) {
      // Validar numerales antes de continuar
      const estanquesConNumerales = Object.entries(numeralesEstanques)
        .filter(([_, numeral]) => numeral && parseFloat(numeral) > 0);

      if (estanquesConNumerales.length === 0) {
        setErrorValidacion({
          show: true,
          message: "Debe ingresar al menos un numeral de bomba para continuar.",
          type: "error"
        });
        return false;
      }

      // Verificar numerales únicos y crecientes
      const numerales = estanquesConNumerales.map(([_, numeral]) => parseFloat(numeral));
      const numeralesOrdenados = [...numerales].sort((a, b) => a - b);

      for (let i = 1; i < numeralesOrdenados.length; i++) {
        if (numeralesOrdenados[i] <= numeralesOrdenados[i - 1]) {
          setErrorValidacion({
            show: true,
            message: "Los numerales de bomba deben ser estrictamente crecientes y únicos.",
            type: "error"
          });
          return false;
        }
      }
    }
    const totalDistribuido = getTotalDistribuido();
    const nivelesCompletos = nivelesInicialesCompletos();

    // Limpiar errores previos
    setErrorValidacion({ show: false, message: "", type: "error" });

    // PASO 1: Validar distribución de combustible (lo más importante primero)
    if (totalDistribuido === 0) {
      setErrorValidacion({
        show: true,
        message: "Debe distribuir el combustible entre los estanques antes de continuar. Ingrese la cantidad de litros que recibirá cada estanque.",
        type: "error"
      });

      // Hacer scroll hacia arriba para mostrar el error
      if (modalRef.current) {
        modalRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
      return false;
    }

    // PASO 2: Validar que la distribución desde numerales coincida con los litros de la guía
    const diferencia = Math.abs(totalDistribuido - litrosRecibidos);
    if (diferencia > 0.01) {
      const esMayor = totalDistribuido > litrosRecibidos;
      const mensaje = esMayor
        ? `Los litros calculados desde numerales (${formatNumber(totalDistribuido)} L) superan los litros de la guía (${formatNumber(litrosRecibidos)} L). Verifique los numerales ingresados.`
        : `Los litros calculados desde numerales (${formatNumber(totalDistribuido)} L) son menores a los litros de la guía (${formatNumber(litrosRecibidos)} L). Verifique que todos los numerales estén correctos.`;

      setErrorValidacion({
        show: true,
        message: mensaje,
        type: "error"
      });

      if (modalRef.current) {
        modalRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
      return false;
    }

    // PASO 3: Validar niveles iniciales (después de que la distribución esté correcta)
    if (!nivelesCompletos) {
      const estanquesSinNivel = getEstanquesConDistribucion().filter((estanque) => {
        const alturas = alturasEstanques[estanque.id_estanque] || {};
        return !alturas.inicial || alturas.inicial === "";
      });

      const mensaje = estanquesSinNivel.length === 1
        ? `Debe ingresar el nivel inicial del estanque "${estanquesSinNivel[0].nombre}".`
        : `Debe completar los niveles iniciales de ${estanquesSinNivel.length} estanques: ${estanquesSinNivel.map(e => e.nombre).join(", ")}.`;

      setErrorValidacion({
        show: true,
        message: mensaje,
        type: "error"
      });

      // Hacer scroll hacia la sección de niveles (más abajo en la página)
      if (modalRef.current) {
        // Scroll hacia abajo para mostrar los campos de niveles
        const scrollPosition = isMobile ? 200 : 300;
        modalRef.current.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }
      return false;
    }

    // Si todo está correcto, avanzar al siguiente paso
    setPaso("final");
    if (isMobile && modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
    return true;
  };

  // Manejar el cálculo de diferencia
  const handleCalcular = async () => {
    if (!nivelesFinalesCompletos()) {
      const estanquesSinNivel = getEstanquesConDistribucion().filter((estanque) => {
        const alturas = alturasEstanques[estanque.id_estanque] || {};
        return !alturas.final || alturas.final === "";
      });

      const mensaje = estanquesSinNivel.length === 1
        ? `Debe ingresar el nivel final del estanque "${estanquesSinNivel[0].nombre}".`
        : `Debe completar los niveles finales de ${estanquesSinNivel.length} estanques: ${estanquesSinNivel.map(e => e.nombre).join(", ")}.`;

      setErrorValidacion({
        show: true,
        message: mensaje,
        type: "error"
      });

      // Hacer scroll hacia arriba para mostrar el error
      if (modalRef.current) {
        modalRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
      return;
    }

    setLoading(true);
    try {
      const resultado = await calcularLitrosPetroleo();

      if (resultado) {
        setResultadoCalculo(resultado);
        setErrorValidacion({ show: false, message: "", type: "error" });

        if (isMobile && modalRef.current) {
          setTimeout(() => {
            modalRef.current.scrollTop = 0;
          }, 300);
        }
      }
    } catch (error) {
      activo && console.log("Error al calcular los litros de petróleo:", error);
      setErrorValidacion({
        show: true,
        message: "Error al calcular los litros de petróleo. Por favor, verifique los datos ingresados.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(parseFloat(num))) {
      return "0,00";
    }
    return parseFloat(num).toLocaleString("es-CL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Calcular el stock solo de los estanques involucrados en la recepción
  const stockTotalSistema = (() => {
    const estanquesConNumerales = Object.entries(numeralesEstanques)
      .filter(([_, numeral]) => numeral && parseFloat(numeral) > 0)
      .map(([estanqueId]) => parseInt(estanqueId));

    if (estanquesConNumerales.length === 0) {
      return 0;
    }

    return estanques
      .filter(estanque => estanquesConNumerales.includes(estanque.id_estanque))
      .reduce((total, estanque) => {
        const stockActual = estanque.stock_actual !== undefined && estanque.stock_actual !== null
          ? parseFloat(estanque.stock_actual)
          : 0;
        return total + stockActual;
      }, 0);
  })();

  // Calcular el porcentaje de capacidad utilizada
  const getCapacidadPorcentaje = (estanque) => {
    if (!estanque || !estanque.capacidad) return 0;
    const stock = estanque.stock_actual || 0;
    return Math.min(100, Math.round((stock / estanque.capacidad) * 100));
  };

  // Determinar el paso actual basado en el estado
  const getCurrentStep = () => {
    if (resultadoCalculo) return 2; // Paso 3: Resultados
    if (paso === "final") return 1; // Paso 2: Niveles Finales
    return 0; // Paso 1: Niveles Iniciales
  };

  // Función para manejar el cierre del modal
  const handleModalClose = (passStockSistema = false) => {
    if (passStockSistema && typeof onClose === "function") {
      onClose(stockTotalSistema);
    } else if (typeof onClose === "function") {
      onClose();
    }
  };

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;

  const currentStep = getCurrentStep();
  const isResultadosStep = currentStep === 2;
  const totalDistribuido = getTotalDistribuido();
  // En la sección de distribución del render:
  const titulos = getTitulos();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-transparent bg-opacity-60 backdrop-blur-sm flex">
      <div className="w-full h-full flex flex-col">
        {/* ✅ MODAL MEJORADO PARA MÓVILES */}
        <div
          ref={modalRef}
          className={`
            bg-white shadow-2xl w-full flex flex-col
            ${isMobile
              ? 'h-full'
              : 'rounded-lg max-w-7xl mx-auto my-4 max-h-[95vh] min-h-[600px]'
            }
            animate-fadeInScale
          `}
        >
          {/* Encabezado del modal - ✅ MEJORADO PARA MÓVILES */}
          <div className="bg-orange-600 px-4 py-3 md:px-8 md:py-5 flex-shrink-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-white text-lg md:text-xl font-semibold tracking-tight truncate">
                  {isResultadosStep
                    ? "Panel de Control de Combustible"
                    : paso === "inicial"
                      ? "Registro de Niveles Iniciales y Distribución"
                      : "Registro de Niveles Finales"}
                </h2>
                {!isResultadosStep && (
                  <p className="text-orange-100 text-sm md:text-base opacity-90 mt-1">
                    {paso === "inicial"
                      ? "Ingrese los litros y Niveles iniciales de cada estanque"
                      : "Ingrese las Niveles finales después de la recepción"}
                  </p>
                )}
              </div>

              {/* Controles del header */}
              <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
                {/* Tooltip de ayuda - Solo en desktop y pasos de medición */}
                {!isResultadosStep && !isMobile && (
                  <div className="relative">
                    <button
                      onClick={() => setMostrarAyuda(!mostrarAyuda)}
                      onMouseEnter={() => setMostrarAyuda(true)}
                      className="text-white opacity-80 hover:opacity-100 focus:outline-none p-2 hover:bg-orange-700 rounded-lg transition-all"
                      aria-label="Ayuda"
                    >
                      <FaQuestionCircle size={16} />
                    </button>

                    {/* Tooltip flotante */}
                    {mostrarAyuda && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setMostrarAyuda(false)}
                        />
                        <div className="absolute right-0 top-12 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                          <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-3 border-b border-orange-200">
                            <h4 className="font-medium text-orange-800 flex items-center text-sm">
                              <FaInfoCircle className="text-orange-600 mr-2" />
                              Cómo medir el nivel de combustible
                            </h4>
                          </div>
                          <div className="p-4 max-h-64 overflow-y-auto">
                            <div className="text-sm text-gray-700 space-y-2">
                              <p className="font-medium text-gray-800">
                                Siga estos pasos para una medición precisa:
                              </p>
                              <ol className="list-decimal pl-4 space-y-1.5 text-xs">
                                <li>
                                  Localice la varilla calibrada del estanque
                                </li>
                                <li>Asegúrese de que esté completamente seca</li>
                                <li>
                                  Inserte verticalmente hasta tocar el fondo
                                </li>
                                <li>Retire y observe la marca del combustible</li>
                              </ol>
                              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs">
                                <div className="flex">
                                  <FaExclamationTriangle className="text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                                  <p>
                                    Una diferencia de milímetros puede
                                    representar diferencias de litros en estanques
                                    grandes.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Indicador de progreso */}
                <div className="flex items-center space-x-1 md:space-x-2">
                  {["1", "2", "3"].map((step, index) => {
                    const isActive = index <= currentStep;
                    const isCurrentStep = index === currentStep;

                    return (
                      <React.Fragment key={index}>
                        {index > 0 && (
                          <div
                            className={`h-0.5 w-2 md:w-4 rounded-full transition-colors ${isActive
                              ? "bg-orange-200"
                              : "bg-orange-800 opacity-30"
                              }`}
                          />
                        )}
                        <div className="relative group">
                          <div
                            className={`w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full text-xs font-medium transition-all ${isActive
                              ? "bg-white text-orange-600"
                              : "bg-orange-800 text-orange-300 opacity-50"
                              } ${isCurrentStep ? "ring-2 ring-orange-200" : ""}`}
                          >
                            {isActive ? (
                              index < currentStep ? (
                                <FaCheck className="w-3 h-3 md:w-3.5 md:h-3.5" />
                              ) : (
                                step
                              )
                            ) : (
                              step
                            )}
                          </div>
                          {!isMobile && (
                            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-transparent bg-opacity-75 text-white text-xs rounded px-2 py-1 pointer-events-none">
                              {["Inicial", "Final", "Resultados"][index]}
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Botón cerrar */}
                <button
                  onClick={() => handleModalClose(false)}
                  className="text-white opacity-80 hover:opacity-100 focus:outline-none p-2 hover:bg-orange-700 rounded-lg transition-all"
                  aria-label="Cerrar"
                >
                  <FaTimes size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* ✅ CONTENIDO DEL MODAL CON FLEX MEJORADO */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6 min-h-0">
            {/* Alertas - Mostrar tanto errores del padre como errores de validación */}
            <div ref={errorRef}>
              {modalAlert && modalAlert.show && (
                <InfoBox type={modalAlert.type} message={modalAlert.message} />
              )}

              {errorValidacion && errorValidacion.show && (
                <InfoBox type={errorValidacion.type} message={errorValidacion.message} />
              )}
            </div>

            {/* DISEÑO PARA RESULTADOS */}
            {isResultadosStep && resultadoCalculo ? (
              <div className="space-y-4">
                {/* Dashboard Principal */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div className="xl:col-span-3 space-y-4">
                    {/* Fila superior - Métricas clave */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Stock Estanques Involucrados */}
                      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-3 md:p-4 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">
                              Stock Estanques Seleccionados
                            </p>
                            <p className="text-lg md:text-2xl font-bold mt-1">
                              {formatNumber(stockTotalSistema)}
                            </p>
                            <p className="text-blue-200 text-xs">
                              {Object.entries(numeralesEstanques).filter(([_, num]) => num && parseFloat(num) > 0).length} estanque(s) involucrado(s)
                            </p>
                          </div>
                          <FaGasPump className="text-blue-200 text-xl md:text-2xl opacity-80" />
                        </div>
                      </div>

                      {/* Medición Inicial */}
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-3 md:p-4 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-100 text-xs font-medium uppercase tracking-wide">
                              Medición Inicial
                            </p>
                            <p className="text-lg md:text-2xl font-bold mt-1">
                              {formatNumber(resultadoCalculo.volInicial)}
                            </p>
                            <p className="text-orange-200 text-xs">
                              Antes recepción
                            </p>
                          </div>
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-orange-400 rounded-full flex items-center justify-center">
                            <span className="text-orange-900 font-bold text-xs md:text-sm">
                              1
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Litros Guía */}
                      <div className="bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl p-3 md:p-4 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-amber-100 text-xs font-medium uppercase tracking-wide">
                              Litros Según Guía
                            </p>
                            <p className="text-lg md:text-2xl font-bold mt-1">
                              {formatNumber(litrosRecibidos)}
                            </p>
                            <p className="text-amber-200 text-xs">Litros Guía</p>
                          </div>
                          <FaOilCan className="text-amber-200 text-xl md:text-2xl opacity-80" />
                        </div>
                      </div>

                      {/* Medición Final */}
                      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 md:p-4 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100 text-xs font-medium uppercase tracking-wide">
                              Medición Final
                            </p>
                            <p className="text-lg md:text-2xl font-bold mt-1">
                              {formatNumber(resultadoCalculo.volFinal)}
                            </p>
                            <p className="text-green-200 text-xs">
                              Después recepción
                            </p>
                          </div>
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-green-400 rounded-full flex items-center justify-center">
                            <span className="text-green-900 font-bold text-xs md:text-sm">
                              2
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Análisis detallado */}
                    <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-gray-200">
                      <div className="flex items-center mb-4">
                        <h3 className="text-base md:text-lg font-semibold text-gray-800 flex items-center">
                          <FaCalculator className="mr-2 text-orange-500" />
                          Detalles del Cálculo
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {/* Volúmenes medidos */}
                        <div>
                          <h4 className="font-medium text-gray-700 mb-3">
                            Volúmenes Inicial
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                              <span className="text-gray-600">
                                Volumen inicial:
                              </span>
                              <span className="font-semibold">
                                {formatNumber(resultadoCalculo.volInicial)} L
                              </span>
                            </div>
                            <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                              <span className="text-gray-600">
                                Litros según guía:
                              </span>
                              <span className="font-semibold">
                                {formatNumber(litrosRecibidos)} L
                              </span>
                            </div>
                            <div className="flex justify-between py-2 px-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                              <span className="text-blue-700 font-medium">
                                Volumen esperado:
                              </span>
                              <span className="font-bold text-blue-800">
                                {formatNumber(
                                  resultadoCalculo.volInicial + litrosRecibidos
                                )}{" "}
                                L
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Cálculos derivados */}
                        <div>
                          <h4 className="font-medium text-gray-700 mb-3">
                            Volúmenes Finales
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                              <span className="text-gray-600">
                                Volumen final:
                              </span>
                              <span className="font-semibold">
                                {formatNumber(resultadoCalculo.volFinal)} L
                              </span>
                            </div>
                            <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                              <span className="text-gray-600">
                                Litros ingresados (medido):
                              </span>
                              <span className="font-semibold">
                                {formatNumber(
                                  resultadoCalculo.volFinal -
                                  resultadoCalculo.volInicial
                                )}{" "}
                                L
                              </span>
                            </div>
                            <div className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                              <span className="text-gray-600">Diferencia:</span>
                              <span
                                className={`font-semibold flex items-center ${(() => {
                                  const litrosMedidos =
                                    resultadoCalculo.volFinal -
                                    resultadoCalculo.volInicial;
                                  const diferencia =
                                    litrosMedidos - litrosRecibidos;

                                  if (Math.abs(diferencia) <= 0.5) {
                                    return "text-gray-600";
                                  } else if (diferencia > 0) {
                                    return "text-green-600";
                                  } else {
                                    return "text-red-600";
                                  }
                                })()}`}
                              >
                                {(() => {
                                  const litrosMedidos =
                                    resultadoCalculo.volFinal -
                                    resultadoCalculo.volInicial;
                                  const diferencia =
                                    litrosMedidos - litrosRecibidos;
                                  const esExcedente = diferencia > 0;

                                  return (
                                    <>
                                      {Math.abs(diferencia) > 0.5 && (
                                        <span className="mr-1">
                                          {esExcedente ? "📈" : "📉"}
                                        </span>
                                      )}
                                      {formatNumber(Math.abs(diferencia))} L (
                                      {esExcedente ? "Excedente" : "Faltante"})
                                    </>
                                  );
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* 👇 NUEVA SECCIÓN: Distribución por Estanque - MOBILE FIRST */}
                      <div className="mt-6 bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                        <div className="flex items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <FaGasPump className="mr-2 text-orange-500" />
                            Distribución por Estanque
                          </h3>
                        </div>

                        {(() => {
                          const distribucion = getDistribucionActual();
                          const estanquesConDistribucion = estanques.filter(estanque => {
                            const litros = parseFloat(distribucion[estanque.id_estanque]) || 0;
                            return litros > 0;
                          });

                          if (estanquesConDistribucion.length === 0) {
                            return (
                              <div className="text-center py-8 text-gray-500">
                                <FaGasPump className="mx-auto text-3xl mb-3 opacity-30" />
                                <p>No hay estanques con distribución de combustible</p>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-4">
                              {estanquesConDistribucion.map((estanque, index) => {
                                const litrosAsignados = parseFloat(distribucion[estanque.id_estanque]) || 0;
                                const alturas = alturasEstanques[estanque.id_estanque] || {};
                                const alturaInicial = parseFloat(alturas.inicial) || 0;
                                const alturaFinal = parseFloat(alturas.final) || 0;
                                const diferenciaAltura = alturaFinal - alturaInicial;

                                // Colores simples y bonitos
                                const colores = [
                                  { bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500", text: "text-orange-700" },
                                  { bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500", text: "text-blue-700" },
                                  { bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500", text: "text-green-700" },
                                  { bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500", text: "text-purple-700" },
                                  { bg: "bg-pink-50", border: "border-pink-200", dot: "bg-pink-500", text: "text-pink-700" }
                                ];
                                const color = colores[index % colores.length];

                                return (
                                  <div key={estanque.id_estanque} className={`${color.bg} ${color.border} border rounded-lg p-4`}>

                                    {/* HEADER CON NOMBRE Y LITROS */}
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center">
                                        <div className={`w-3 h-3 ${color.dot} rounded-full mr-2`}></div>
                                        <h4 className="font-semibold text-gray-800">{estanque.nombre}</h4>
                                      </div>
                                    </div>

                                    {/* MEDICIONES EN UNA FILA - MOBILE FRIENDLY */}
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                      <div className="text-center">
                                        <div className="text-gray-600 text-xs mb-1">Inicial</div>
                                        <div className="font-semibold">{formatNumber(alturaInicial)} cm</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-gray-600 text-xs mb-1">Final</div>
                                        <div className="font-semibold">{formatNumber(alturaFinal)} cm</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-gray-600 text-xs mb-1">Asignado</div>
                                        <div className={`font-semibold flex items-center justify-center ${color.text}`}>
                                          <FaGasPump className="mr-1 text-xs" />
                                          {formatNumber(litrosAsignados)} L
                                        </div>
                                      </div>
                                    </div>
                                    {/* SECCIÓN DE DISTRIBUCIÓN */}
                                    <div className="mt-4 pt-4 border-t">
                                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                                        {esTrasvasije ? "Seleccionar como destino" : "Distribución"}
                                      </h4>

                                      {esTrasvasije ? (
                                        // MODO TRASVASIJE - Botón de selección
                                        <div className="space-y-2">
                                          <button
                                            onClick={() => seleccionarEstanqueAutomatico(estanque.id_estanque)}
                                            className={`
                w-full p-3 rounded-lg border-2 text-center font-medium transition-all
                ${(distribucionLitros[estanque.id_estanque] && parseFloat(distribucionLitros[estanque.id_estanque]) > 0)
                                                ? 'border-green-500 bg-green-50 text-green-700'
                                                : 'border-gray-300 hover:border-blue-400 text-gray-700'
                                              }
              `}
                                          >
                                            {(distribucionLitros[estanque.id_estanque] && parseFloat(distribucionLitros[estanque.id_estanque]) > 0)
                                              ? `✅ SELECCIONADO - ${parseFloat(distribucionLitros[estanque.id_estanque]).toLocaleString('es-CL')} L`
                                              : '👆 Tocar para seleccionar'
                                            }
                                          </button>

                                          {/* Mostrar capacidad disponible */}
                                          <div className="text-xs text-gray-500 text-center">
                                            Capacidad disponible: {(estanque.capacidad - estanque.stock_actual).toLocaleString('es-CL')} L
                                          </div>
                                        </div>
                                      ) : (
                                        // MODO RECEPCIÓN - Input manual (mantener original)
                                        <div>
                                          <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={distribucionLitros[estanque.id_estanque] || ""}
                                            onChange={(e) => {
                                              const nuevaDistribucion = {
                                                ...distribucionLitros,
                                                [estanque.id_estanque]: e.target.value
                                              };
                                              if (onDistribucionChange) {
                                                onDistribucionChange(nuevaDistribucion);
                                              }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            placeholder="Litros a distribuir..."
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Diseño original para pasos 1 y 2 */}
                {!resultadoCalculo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-5">
                    <div
                      className={`bg-white rounded-lg p-3 border shadow-sm hover:shadow transition-shadow border-orange-100`}
                    >
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 bg-orange-100`}>
                          <FaGasPump
                            className="text-orange-600"
                            size={isMobile ? 16 : 18}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 font-medium">
                            Stock Sistema
                          </p>
                          <p className="font-bold text-sm md:text-base text-gray-800 mt-0.5 flex items-baseline">
                            {formatNumber(stockTotalSistema)}
                            <span className="text-xs text-gray-500 ml-1 font-medium">
                              litros
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`bg-white rounded-lg p-3 border shadow-sm hover:shadow transition-shadow border-amber-100`}
                    >
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 bg-amber-100`}>
                          <FaOilCan
                            className="text-amber-600"
                            size={isMobile ? 16 : 18}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 font-medium">
                            Litros Guía
                          </p>
                          <p className="font-bold text-sm md:text-base text-gray-800 mt-0.5 flex items-baseline">
                            {formatNumber(litrosRecibidos)}
                            <span className="text-xs text-gray-500 ml-1 font-medium">
                              litros
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Panel de resumen de distribución - solo en paso inicial si hay distribución */}
                {paso === "inicial" && totalDistribuido > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-blue-800 font-semibold text-sm">
                          Distribución Total
                        </h3>
                        <p className="text-blue-600 text-xs">
                          Litros asignados a estanques
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-900 font-bold text-lg">
                          {formatNumber(totalDistribuido)} L
                        </p>
                        <p
                          className={`text-xs ${Math.abs(totalDistribuido - litrosRecibidos) <= 0.01
                            ? "text-green-600"
                            : "text-amber-600"
                            }`}
                        >
                          de {formatNumber(litrosRecibidos)} L
                        </p>
                      </div>
                    </div>
                    {Math.abs(totalDistribuido - litrosRecibidos) > 0.01 && (
                      <div className="mt-2 text-xs text-amber-700 bg-amber-100 rounded px-2 py-1">
                        ⚠️ La suma no coincide con los litros de la guía
                      </div>
                    )}
                  </div>
                )}

                {/* Sección de ingreso de alturas */}
                {!isResultadosStep && (
                  <>
                    {/* Ayuda móvil - Solo se muestra en móviles */}
                    {isMobile && (
                      <div className="mb-4">
                        <button
                          onClick={() => setMostrarConsejos(!mostrarConsejos)}
                          className="w-full bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center justify-between hover:bg-orange-100 transition-colors"
                        >
                          <div className="flex items-center">
                            <FaInfoCircle
                              className="text-orange-600 mr-2 flex-shrink-0"
                              size={16}
                            />
                            <span className="text-sm font-medium text-orange-800">
                              Consejos de medición
                            </span>
                          </div>
                          <FaArrowRight
                            className={`text-orange-600 transition-transform ${mostrarConsejos ? "rotate-90" : ""
                              }`}
                            size={12}
                          />
                        </button>

                        {mostrarConsejos && (
                          <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3 border-t-0 rounded-t-none">
                            <div className="text-sm text-orange-800">
                              <p className="font-medium mb-2">
                                Siga estos pasos para una medición precisa:
                              </p>
                              <ol className="list-decimal pl-4 space-y-1 text-xs">
                                <li>
                                  Localice la varilla calibrada del estanque
                                </li>
                                <li>Asegúrese de que esté completamente seca</li>
                                <li>
                                  Inserte verticalmente hasta tocar el fondo
                                </li>
                                <li>Retire y observe la marca del combustible</li>
                              </ol>
                              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-amber-800 text-xs">
                                <div className="flex">
                                  <FaExclamationTriangle
                                    className="text-amber-500 mt-0.5 mr-2 flex-shrink-0"
                                    size={12}
                                  />
                                  <p>
                                    Una diferencia de pocos milímetros puede
                                    representar ciertos litros.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Estanques para el paso actual */}
                    <div
                      className={`space-y-6 ${isMobile ? "" : "grid grid-cols-1 lg:grid-cols-3 gap-6"
                        }`}
                    >
                      {Array.isArray(estanques) &&
                        (paso === "inicial" ? estanques : getEstanquesConDistribucion()).map((estanque, index) => {
                          const alturas =
                            alturasEstanques[estanque.id_estanque] || {};
                          const capacidadPorcentaje =
                            getCapacidadPorcentaje(estanque);
                          const distribucion = getDistribucionActual();
                          const litrosAsignados =
                            distribucion[estanque.id_estanque] || "";

                          // Para mostrar en el paso 2, usar 0.00 si está vacío
                          const litrosParaMostrar = litrosAsignados || "0.00";
                          const errorDistribucion =
                            erroresDistribucion[estanque.id_estanque];

                          // Nueva paleta de colores con variaciones sutiles de naranja
                          const coloresEstanque = [
                            {
                              bg: "from-orange-500 to-orange-600",
                              solid: "bg-orange-500",
                              border: "border-orange-300",
                              text: "text-orange-50",
                              darkText: "text-orange-800",
                              light: "bg-orange-50",
                              hex: "#F67029",
                            },
                            {
                              bg: "from-orange-400 to-orange-500",
                              solid: "bg-orange-400",
                              border: "border-orange-300",
                              text: "text-orange-50",
                              darkText: "text-orange-700",
                              light: "bg-orange-50",
                              hex: "#FF8C42",
                            },
                            {
                              bg: "from-orange-600 to-orange-700",
                              solid: "bg-orange-600",
                              border: "border-orange-400",
                              text: "text-orange-50",
                              darkText: "text-orange-800",
                              light: "bg-orange-50",
                              hex: "#E55D26",
                            },
                            {
                              bg: "from-amber-500 to-amber-600",
                              solid: "bg-amber-500",
                              border: "border-amber-300",
                              text: "text-amber-50",
                              darkText: "text-amber-800",
                              light: "bg-amber-50",
                              hex: "#F59E0B",
                            },
                            {
                              bg: "from-yellow-500 to-orange-500",
                              solid: "bg-yellow-500",
                              border: "border-yellow-300",
                              text: "text-yellow-50",
                              darkText: "text-yellow-800",
                              light: "bg-yellow-50",
                              hex: "#F97316",
                            },
                            {
                              bg: "from-red-500 to-orange-600",
                              solid: "bg-red-500",
                              border: "border-red-300",
                              text: "text-red-50",
                              darkText: "text-red-800",
                              light: "bg-red-50",
                              hex: "#EF4444",
                            },
                          ];

                          const colorEstanque =
                            coloresEstanque[index % coloresEstanque.length];

                          return (
                            <div
                              key={estanque.id_estanque}
                              className={`bg-white border-2 ${colorEstanque.border
                                } rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl transform hover:scale-[1.01] duration-200 ${isMobile ? "mb-6" : "h-full flex flex-col"
                                }`}
                            >
                              {/* CABECERA ÚNICA CON COLOR DEL ESTANQUE */}
                              <div
                                className={`bg-gradient-to-r ${colorEstanque.bg
                                  } ${isMobile ? "p-3" : "p-4"
                                  } relative overflow-hidden`}
                              >
                                {/* Patrón sutil de fondo */}
                                <div className="absolute inset-0 opacity-5">
                                  <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-black transform -translate-x-16 -translate-y-16"></div>
                                  <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full bg-white transform translate-x-12 translate-y-12"></div>
                                </div>

                                <div className="relative z-10">
                                  <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center flex-1">
                                      <div className="flex-1 min-w-0">
                                        <h3
                                          className={`font-bold ${isMobile ? "text-lg" : "text-xl"
                                            } ${colorEstanque.text} truncate`}
                                        >
                                          {estanque.nombre}
                                        </h3>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Información del stock - siempre visible en móvil */}
                                  <div className="space-y-2">
                                    {/* Información del stock expandible/fija según el dispositivo */}
                                    {(!isMobile ||
                                      estanquesExpandidos[
                                      estanque.id_estanque
                                      ]) && (
                                        <div
                                          className={`flex justify-between ${colorEstanque.text
                                            } opacity-90 ${isMobile ? "text-xs" : "text-sm"
                                            }`}
                                        >
                                          <span>Stock Actual</span>
                                          <span className="font-semibold">
                                            {formatNumber(
                                              estanque.stock_actual || 0
                                            )}{" "}
                                            L / {formatNumber(
                                              estanque.capacidad || 0
                                            )}{"   "} ({capacidadPorcentaje}%)
                                          </span>
                                        </div>
                                      )}

                                    {/* Barra de progreso elegante - siempre visible */}
                                    <div className="w-full bg-orange-50 bg-opacity-25 rounded-full h-2.5 overflow-hidden border border-white border-opacity-20">
                                      <div
                                        className="h-2.5 bg-sky-300 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                                        style={{
                                          width: `${Math.min(
                                            100,
                                            capacidadPorcentaje
                                          )}%`,
                                          boxShadow: '0 0 8px rgba(255, 255, 255, 0.4)'
                                        }}
                                      >
                                        {/* Efecto de brillo muy sutil */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"></div>
                                      </div>
                                    </div>

                                    {/* Información condensada para móvil cuando está colapsado */}
                                    {isMobile &&
                                      !estanquesExpandidos[
                                      estanque.id_estanque
                                      ] && (
                                        <div
                                          className={`text-center ${colorEstanque.text} opacity-80 text-xs`}
                                        >
                                          <span className="font-semibold">
                                            {formatNumber(
                                              estanque.stock_actual || 0
                                            )}{" "}
                                            L / {formatNumber(
                                              estanque.capacidad || 0
                                            )}{"   "} ({capacidadPorcentaje}%)
                                          </span>
                                        </div>
                                      )}
                                  </div>
                                </div>
                              </div>

                              {/* CONTENIDO PRINCIPAL CON SECCIONES CLARAS */}
                              <div className={`p-6 ${!isMobile ? "flex-1" : ""}`}>
                                {/* SECCIÓN 1: DISTRIBUCIÓN DE COMBUSTIBLE (solo en paso inicial) */}
                                {paso === "inicial" && (
                                  <div className="mt-4 pt-4 border-t">
                                    {esTrasvasije ? (
                                      // MODO TRASVASIJE - Solo seleccionar, sin input de litros
                                      <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-gray-700">
                                          Seleccionar como estanque destino
                                        </h4>

                                        <button
                                          onClick={() => seleccionarEstanqueAutomatico(estanque.id_estanque)}
                                          className={`
            w-full p-4 rounded-lg border-2 text-center font-medium transition-all
            ${(distribucionLitros[estanque.id_estanque] && parseFloat(distribucionLitros[estanque.id_estanque]) > 0)
                                              ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                                              : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50 text-gray-700'
                                            }
          `}
                                        >
                                          <div className="flex items-center justify-center space-x-2">
                                            <div className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center
              ${(distribucionLitros[estanque.id_estanque] && parseFloat(distribucionLitros[estanque.id_estanque]) > 0)
                                                ? 'border-green-500 bg-green-500'
                                                : 'border-gray-400'
                                              }
            `}>
                                              {(distribucionLitros[estanque.id_estanque] && parseFloat(distribucionLitros[estanque.id_estanque]) > 0) && (
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                              )}
                                            </div>

                                            <span>
                                              {(distribucionLitros[estanque.id_estanque] && parseFloat(distribucionLitros[estanque.id_estanque]) > 0)
                                                ? `✅ SELECCIONADO - Recibirá ${parseFloat(distribucionLitros[estanque.id_estanque]).toLocaleString('es-CL')} L`
                                                : 'Seleccionar como destino del trasvasije'
                                              }
                                            </span>
                                          </div>
                                        </button>

                                        {/* Info de capacidad */}
                                        <div className="text-xs text-gray-500 text-center">
                                          💧 Capacidad disponible: {(estanque.capacidad - estanque.stock_actual).toLocaleString('es-CL')} L
                                        </div>

                                        {/* Mostrar info adicional si está seleccionado */}
                                        {(distribucionLitros[estanque.id_estanque] && parseFloat(distribucionLitros[estanque.id_estanque]) > 0) && (
                                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                                            <div className="flex items-center justify-between text-green-700">
                                              <span>Stock actual:</span>
                                              <span className="font-bold">{estanque.stock_actual.toLocaleString('es-CL')} L</span>
                                            </div>
                                            <div className="flex items-center justify-between text-green-700">
                                              <span>Después del trasvasije:</span>
                                              <span className="font-bold">
                                                {(parseFloat(estanque.stock_actual) + parseFloat(distribucionLitros[estanque.id_estanque] || 0)).toFixed(2)} L
                                                {activo && console.log(
                                                  "Capacidad total:", estanque.capacidad,
                                                  "Stock actual:", estanque.stock_actual,
                                                  "Distribución:", distribucionLitros[estanque.id_estanque]
                                                )}
                                              </span>

                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      // MODO RECEPCIÓN - Input manual con opción de numerales
                                      // MODO RECEPCIÓN - Solo numerales
                                      <div>
                                        <div className="flex items-center mb-3">
                                          <h4 className="text-sm font-medium text-gray-700">
                                            Numeral Final de Bomba
                                          </h4>
                                        </div>

                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                          <input
                                            type="number"
                                            value={numeralesEstanques[estanque.id_estanque] || ""}
                                            onChange={(e) => handleNumeralChange(estanque.id_estanque, e.target.value)}
                                            placeholder="Ej: 15420.50"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            step="0.01"
                                            min="0"
                                            disabled={loading}
                                          />

                                          {/* Mostrar litros calculados */}
                                          {litrosCalculados[estanque.id_estanque] > 0 && (
                                            <div className="mt-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                                              <span className="font-medium">Litros calculados: </span>
                                              {formatNumber(litrosCalculados[estanque.id_estanque])} L
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* SECCIÓN 2: MEDICIÓN DE ALTURA */}
                                <div>
                                  <div className="flex items-center mb-4">
                                    <div
                                      className={`${colorEstanque.solid} p-2 rounded-lg mr-3`}
                                    >
                                      <FaRuler className="text-white text-sm" />
                                    </div>
                                    <div>
                                      <h4
                                        className={`font-semibold ${colorEstanque.darkText} text-base`}
                                      >
                                        {paso === "inicial"
                                          ? "Nivel Inicial"
                                          : "Nivel Final"}
                                      </h4>
                                      <p className="text-gray-600 text-sm">
                                        {paso === "inicial"
                                          ? "Antes de la recepción"
                                          : "Después de la recepción"}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <InputNivel
                                      label=""
                                      value={
                                        paso === "inicial"
                                          ? alturas.inicial || ""
                                          : alturas.final || ""
                                      }
                                      onChange={(e) => {
                                        if (paso === "inicial") {
                                          handleAlturaChange(
                                            estanque.id_estanque,
                                            {
                                              inicial: e.target.value,
                                              final: alturas.final || "",
                                            }
                                          );
                                        } else {
                                          handleAlturaChange(
                                            estanque.id_estanque,
                                            {
                                              inicial: alturas.inicial || "",
                                              final: e.target.value,
                                            }
                                          );
                                        }
                                      }}
                                      placeholder="Ingrese Nivel en centímetros"
                                      disabled={loading}
                                    />
                                  </div>
                                </div>

                                {/* INFORMACIÓN ADICIONAL EN PASO FINAL */}
                                {paso === "final" && (
                                  <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center">
                                      <div
                                        className={`${colorEstanque.solid} p-2 rounded-lg mr-3`}
                                      >
                                        <FaGasPump className="text-white text-sm" />
                                      </div>
                                      <div>
                                        <h6 className="font-semibold text-gray-800 text-sm">
                                          Combustible Asignado Previamente
                                        </h6>
                                        <p
                                          className={`${colorEstanque.darkText} font-bold text-lg`}
                                        >
                                          {formatNumber(litrosParaMostrar)} L
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* ✅ PIE DEL MODAL MEJORADO PARA MÓVILES */}
          <div className={`
            border-t border-gray-200 bg-white flex-shrink-0
            ${isMobile
              ? 'px-4 py-4 space-y-3'
              : 'px-8 py-5 flex justify-between items-center'
            }
            shadow-lg
          `}>
            {isResultadosStep ? (
              // Botones para el paso de resultados
              <div className={`
                ${isMobile
                  ? 'flex flex-col space-y-3'
                  : 'flex justify-between items-center w-full'
                }
              `}>
                <button
                  onClick={() => {
                    setResultadoCalculo(null);
                    setPaso("final");
                    setErrorValidacion({ show: false, message: "", type: "error" });
                  }}
                  className={`
                    border border-gray-300 rounded-lg text-gray-700 bg-white 
                    hover:bg-gray-50 hover:text-gray-900 focus:outline-none 
                    focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 
                    transition-all font-medium shadow-sm
                    ${isMobile
                      ? 'w-full px-4 py-3 text-base order-2'
                      : 'px-4 py-2.5 text-sm'
                    }
                  `}
                >
                  <span className="flex items-center justify-center">
                    <FaArrowRight
                      className={`transform rotate-180 ${isMobile ? 'mr-3' : 'mr-2'}`}
                      size={isMobile ? 16 : 14}
                    />
                    <span className={isMobile ? 'block' : 'hidden sm:inline'}>Volver a Editar</span>
                    <span className={isMobile ? 'hidden' : 'sm:hidden'}>Volver</span>
                  </span>
                </button>
                <button
                  onClick={() => handleModalClose(true)}
                  className={`
                    rounded-lg text-white font-medium shadow-sm 
                    bg-green-600 hover:bg-green-700 focus:outline-none 
                    focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
                    transition-all
                    ${isMobile
                      ? 'w-full px-4 py-3 text-base order-1'
                      : 'px-5 py-2.5 text-sm'
                    }
                  `}
                >
                  <span className="flex items-center justify-center">
                    <FaCheck className={`${isMobile ? 'mr-3' : 'mr-2'}`} size={isMobile ? 16 : 14} />
                    <span>Confirmar</span>
                  </span>
                </button>
              </div>
            ) : paso === "inicial" ? (
              // Botones para el paso inicial
              <div className={`
                ${isMobile
                  ? 'flex flex-col space-y-3'
                  : 'flex justify-between items-center w-full'
                }
              `}>
                <button
                  onClick={() => handleModalClose(false)}
                  className={`
                    border border-gray-300 rounded-lg text-gray-700 bg-white 
                    hover:bg-gray-50 hover:text-gray-900 focus:outline-none 
                    focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 
                    transition-all font-medium shadow-sm
                    ${isMobile
                      ? 'w-full px-4 py-3 text-base order-2'
                      : 'px-4 py-2.5 text-sm'
                    }
                  `}
                >
                  <span className="flex items-center justify-center">
                    <span>Cancelar</span>
                  </span>
                </button>

                <button
                  onClick={validarYAvanzar}
                  disabled={loading}
                  className={`
                    rounded-lg text-white font-medium shadow-sm transition-all
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                    ${loading
                      ? "bg-orange-400 cursor-not-allowed opacity-70"
                      : "bg-orange-600 hover:bg-orange-700"
                    }
                    ${isMobile
                      ? 'w-full px-4 py-3 text-base order-1'
                      : 'px-5 py-2.5 text-sm'
                    }
                  `}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className={`animate-spin rounded-full border-2 border-white border-t-transparent ${isMobile ? 'mr-3 h-5 w-5' : 'mr-2 h-4 w-4'}`}></div>
                      <span className={isMobile ? 'block' : 'hidden sm:inline'}>Procesando...</span>
                      <span className={isMobile ? 'hidden' : 'sm:hidden'}>...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span>Continuar</span>
                      <FaArrowRight
                        className={`${isMobile ? 'ml-3' : 'ml-2'}`}
                        size={isMobile ? 16 : 14}
                      />
                    </span>
                  )}
                </button>
              </div>
            ) : (
              // Botones para el paso final
              <div className={`
                ${isMobile
                  ? 'flex flex-col space-y-3'
                  : 'flex justify-between items-center w-full'
                }
              `}>
                <button
                  onClick={() => {
                    setPaso("inicial");
                    setErrorValidacion({ show: false, message: "", type: "error" });
                  }}
                  className={`
                    border border-gray-300 rounded-lg text-gray-700 bg-white 
                    hover:bg-gray-50 hover:text-gray-900 focus:outline-none 
                    focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 
                    transition-all font-medium shadow-sm
                    ${isMobile
                      ? 'w-full px-4 py-3 text-base order-2'
                      : 'px-4 py-2.5 text-sm'
                    }
                  `}
                >
                  <span className="flex items-center justify-center">
                    <FaArrowRight
                      className={`transform rotate-180 ${isMobile ? 'mr-3' : 'mr-2'}`}
                      size={isMobile ? 16 : 14}
                    />
                    <span className={isMobile ? 'block' : 'hidden sm:inline'}>
                      Volver a Niveles Iniciales
                    </span>
                    <span className={isMobile ? 'hidden' : 'sm:hidden'}>Volver</span>
                  </span>
                </button>

                <button
                  onClick={handleCalcular}
                  disabled={loading}
                  className={`
                    rounded-lg text-white font-medium shadow-sm transition-all
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                    ${loading
                      ? "bg-orange-400 cursor-not-allowed opacity-70"
                      : "bg-orange-600 hover:bg-orange-700"
                    }
                    ${isMobile
                      ? 'w-full px-4 py-3 text-base order-1'
                      : 'px-5 py-2.5 text-sm'
                    }
                  `}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className={`animate-spin rounded-full border-2 border-white border-t-transparent ${isMobile ? 'mr-3 h-5 w-5' : 'mr-2 h-4 w-4'}`}></div>
                      <span className={isMobile ? 'block' : 'hidden sm:inline'}>Calculando...</span>
                      <span className={isMobile ? 'hidden' : 'sm:hidden'}>...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <FaCalculator
                        className={`${isMobile ? 'mr-3' : 'mr-2'}`}
                        size={isMobile ? 16 : 14}
                      />
                      <span className={isMobile ? 'block' : 'hidden sm:inline'}>
                        Calcular Diferencia
                      </span>
                      <span className={isMobile ? 'hidden' : 'sm:hidden'}>Calcular</span>
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstanquesModal;