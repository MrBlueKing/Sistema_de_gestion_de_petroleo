import React, { useState, useEffect, useCallback, memo } from "react";
import { FaCalculator, FaHistory, FaInfoCircle, FaCalendarAlt } from "react-icons/fa";
import { FiCheckCircle, FiInfo, FiAlertCircle, FiLoader, FiTruck, FiDroplet, FiChevronUp, FiChevronDown } from "react-icons/fi";
import { gerenteService } from "../../context/apiService";
import axios from '../../lib/axios';
import PropTypes from 'prop-types';

/**
 * Componente para cálculo de KPIs de producción y consumo.
 * 
 * Este componente permite ingresar datos de producción (toneladas extraídas y camionadas)
 * y calcula automáticamente KPIs relacionados con costos de petróleo y rendimientos,
 * utilizando datos de consumo obtenidos de la API.
 */
const SimpleKpiCalculator = ({
  onCalculate,
  periodo = "mensual"
}) => {
  // Estados UI
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [infoMensaje, setInfoMensaje] = useState(null);
  const [historialVisible, setHistorialVisible] = useState(false);
  const [mostrarDesgloseMaquinas, setMostrarDesgloseMaquinas] = useState(false);
  const [mostrarUltimosConsumos, setMostrarUltimosConsumos] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
  const [mostrarTodasMaquinas, setMostrarTodasMaquinas] = useState(false);

  // Estados de datos
  const [faenasDisponibles, setFaenasDisponibles] = useState([]);
  const [cargandoFaenas, setCargandoFaenas] = useState(false);
  const [faenaSeleccionada, setFaenaSeleccionada] = useState("");
  const [mesAnterior, setMesAnterior] = useState('');
  const [historialActualizaciones, setHistorialActualizaciones] = useState([]);
  const [datosPetroleoMesAnterior, setDatosPetroleoMesAnterior] = useState(null);
  const [cargandoDatosPetroleo, setCargandoDatosPetroleo] = useState(false);

  // Datos de entrada del formulario
  const [valores, setValores] = useState({
    toneladas: "",
    camionadas: ""
  });

  // Calcular rendimiento de forma memoizada
  const rendimientoCalculado = useCallback(() => {
    const toneladas = parseFloat(valores.toneladas) || 0;
    const camionadas = parseFloat(valores.camionadas) || 0;

    if (camionadas > 0 && toneladas > 0) {
      return (toneladas / camionadas).toFixed(2);
    }
    return 0;
  }, [valores.toneladas, valores.camionadas]);

  // Efectos

  // Cargar faenas disponibles al iniciar
  useEffect(() => {
    cargarFaenasDisponibles();
  }, []);

  // Cargar datos de petróleo cuando cambia la faena seleccionada
  useEffect(() => {
    if (faenaSeleccionada) {
      cargarDatosPetroleo();
    } else {
      setDatosPetroleoMesAnterior(null);
    }
  }, [faenaSeleccionada]);

  // Funciones

  /**
   * Función auxiliar para obtener el nombre del mes anterior
   */
  const obtenerNombreMesAnterior = () => {
    return mesAnterior;
  };

  /**
   * Carga los datos de consumo de petróleo para la faena seleccionada
   */
  const cargarDatosPetroleo = async () => {
    if (!faenaSeleccionada) return;

    try {
      setCargandoDatosPetroleo(true);
      setError(null);

      const response = await axios.get('/api/kpis-getCostoPetroleoSinUltimosConsumos', {
        params: {
          faena: faenaSeleccionada !== 'todas' ? faenaSeleccionada : null
        }
      });

      if (response.data?.status === 'success') {
        const datos = response.data.data;

        // Verificar si hay datos de consumo
        if (!datos.anterior || parseFloat(datos.anterior.costo_total) <= 0) {
          // No hay datos de consumo, pero permitimos continuar con advertencia
          setDatosPetroleoMesAnterior({
            costo_total: 0,
            costo_total_horometro: 0,
            costo_total_kilometraje: 0,
            medicion_horometro: 0,
            medicion_kilometraje: 0,
            desglose_por_maquina: [],
            ultimos_consumos: []
          });

          setInfoMensaje(`Advertencia: No hay datos de consumo para ${getNombreFaena(faenaSeleccionada)} en ${obtenerNombreMesAnterior()}. No se podrán ingresar datos.`);
          return;
        }

        // Continuar con el proceso normal si hay datos
        setDatosPetroleoMesAnterior(datos.anterior);

        // Verificar si hay datos suficientes
        if (datos.faena_filtrada &&
          (parseFloat(datos.anterior.costo_total) <= 0 ||
            !datos.anterior.desglose_por_maquina?.length)) {
          setInfoMensaje(`Advertencia: Datos de consumo limitados para la faena seleccionada en ${obtenerNombreMesAnterior()}.`);
        } else {
          setInfoMensaje(null);
        }
      } else {
        setError('Respuesta incorrecta del servidor al obtener datos de consumo');
        setDatosPetroleoMesAnterior(null);
      }
    } catch (err) {
      console.error('Error al cargar datos de petróleo:', err);
      setError(`Error al obtener datos de consumo: ${err.message || 'Error de conexión'}`);
      setDatosPetroleoMesAnterior(null);
    } finally {
      setCargandoDatosPetroleo(false);
    }
  };

  /**
   * Carga las faenas disponibles para ingresar datos
   */
  const cargarFaenasDisponibles = async () => {
    try {
      setCargandoFaenas(true);
      setError(null);

      const resultado = await gerenteService.getFaenasDisponibles();

      console.log("Resultado faenas:", resultado);

      if (resultado.status === 'success') {
        setFaenasDisponibles(resultado.data);

        const mes = resultado.mesActual
          ? new Date(`${resultado.mesActual}-01`)
          : new Date(new Date().setMonth(new Date().getMonth() - 1));

        setMesAnterior(mes.toLocaleString('default', { month: 'long', year: 'numeric' }));

        if (resultado.data.length === 0) {
          setInfoMensaje(`Todas las faenas ya tienen datos registrados para ${mes.toLocaleString('default', { month: 'long', year: 'numeric' })}.`);
        }
      } else {
        setError(resultado.message || 'No se pudieron cargar las faenas disponibles');
        setFaenasDisponibles([]);
      }
    } catch (err) {
      console.error('Error al cargar faenas disponibles:', err);
      setError('Error de conexión al cargar faenas disponibles');
    } finally {
      setCargandoFaenas(false);
    }
  };

  // Manejadores de eventos

  /**
   * Maneja cambios en los campos de entrada
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Validar que sea un número positivo o vacío
    if (value === "" || (parseFloat(value) >= 0 && !isNaN(value))) {
      setValores(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  /**
   * Limpia el formulario
   */
  const resetForm = () => {
    setValores({
      toneladas: "",
      camionadas: ""
    });
  };

  /**
   * Calcula los KPIs usando los valores ingresados y los datos de petróleo
   */
  const calcularKPIsCompletos = (valoresIngresados, datosPetroleo) => {
    // Validación de parámetros
    if (!valoresIngresados || !datosPetroleo) {
      return {
        error: "Datos insuficientes para calcular KPIs"
      };
    }

    // Inicializar objeto de resultados con valores básicos
    const resultados = {
      toneladas: parseFloat(valoresIngresados.toneladas) || 0,
      camionadas: parseFloat(valoresIngresados.camionadas) || 0,
      rendimiento: 0,
      costo_total: 0,
      costo_total_horometro: 0,
      costo_total_kilometraje: 0,
      costo_por_tonelada: 0,
      costo_por_hora: 0,
      costo_por_km: 0,
      medicion_horometro: 0,
      medicion_kilometraje: 0,
      horas_trabajadas: 0
    };

    // Extraer valores desde datos de petróleo
    const costoTotal = parseFloat(datosPetroleo.costo_total) || 0;
    const costoTotalHorometro = parseFloat(datosPetroleo.costo_total_horometro) || 0;
    const costoTotalKilometraje = parseFloat(datosPetroleo.costo_total_kilometraje) || 0;
    const medicionHorometro = parseFloat(datosPetroleo.medicion_horometro) || 0;
    const medicionKilometraje = parseFloat(datosPetroleo.medicion_kilometraje) || 0;
    const toneladas = parseFloat(valoresIngresados.toneladas) || 0;
    const camionadas = parseFloat(valoresIngresados.camionadas) || 0;

    // Calcular rendimiento
    if (camionadas > 0 && toneladas > 0) {
      resultados.rendimiento = toneladas / camionadas;
    }

    // Asignar datos de medición
    resultados.costo_total = costoTotal;
    resultados.costo_total_horometro = costoTotalHorometro;
    resultados.costo_total_kilometraje = costoTotalKilometraje;
    resultados.medicion_horometro = medicionHorometro;
    resultados.medicion_kilometraje = medicionKilometraje;
    resultados.horas_trabajadas = medicionHorometro;  // Las horas trabajadas son las medidas por el horómetro

    // Calcular KPIs
    // 1. Costo por tonelada: costo total / toneladas
    if (toneladas > 0 && costoTotal > 0) {
      resultados.costo_por_tonelada = costoTotal / toneladas;
    }

    // 2. Costo por hora: preferimos usar costo específico por tipo de máquina si está disponible
    if (medicionHorometro > 0) {
      if (costoTotalHorometro > 0) {
        resultados.costo_por_hora = costoTotalHorometro / medicionHorometro;
      } else if (costoTotal > 0) {
        // Fallback al cálculo general si no hay datos específicos
        resultados.costo_por_hora = costoTotal / medicionHorometro;
      }
    }

    // 3. Costo por km: también preferimos usar costo específico si está disponible
    if (medicionKilometraje > 0) {
      if (costoTotalKilometraje > 0) {
        resultados.costo_por_km = costoTotalKilometraje / medicionKilometraje;
      } else if (costoTotal > 0) {
        // Fallback al cálculo general
        resultados.costo_por_km = costoTotal / medicionKilometraje;
      }
    }

    return resultados;
  };

  /**
   * Envía los datos al servidor
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!faenaSeleccionada) {
      setError("Debe seleccionar una faena antes de continuar");
      return;
    }

    if (!valores.toneladas) {
      setError("Debe ingresar al menos las toneladas extraídas");
      return;
    }

    try {
      setLoading(true);
      setSuccess(null);
      setError(null);

      // Validaciones adicionales
      if (parseFloat(valores.toneladas) <= 0) {
        setError("El valor de toneladas debe ser mayor a 0");
        return;
      }

      if (!datosPetroleoMesAnterior || parseFloat(datosPetroleoMesAnterior.costo_total) <= 0) {
        setError("No hay datos de consumo de petróleo disponibles para la faena seleccionada");
        return;
      }

      // Calcular KPIs combinando datos ingresados con datos de petróleo
      const datosCompletos = calcularKPIsCompletos(valores, datosPetroleoMesAnterior);

      if (datosCompletos.error) {
        setError(datosCompletos.error);
        return;
      }

      // Preparar datos para enviar al API
      const datos = {
        valores_entrada: {
          toneladas_extraidas: parseFloat(valores.toneladas) || 0,
          camionadas: parseFloat(valores.camionadas) || 0,
          rendimiento: datosCompletos.rendimiento || 0,
          horas_trabajadas: datosCompletos.medicion_horometro || 0, // Enviamos las horas medidas por horómetro
          // Valores calculados de costos
          petroleo_toneladas: datosCompletos.costo_por_tonelada || 0,
          petroleo_horas: datosCompletos.costo_por_hora || 0,
          petroleo_kilometros: datosCompletos.costo_por_km || 0
        },
        periodo: periodo,
        faena: faenaSeleccionada
      };

      // Enviar datos al servidor
      const resultadoAPI = await gerenteService.calcularKpis(datos);

      if (resultadoAPI?.status === 'success') {
        setSuccess("Datos registrados correctamente");

        // Notificar al componente padre
        if (onCalculate && typeof onCalculate === 'function') {
          onCalculate({
            status: 'success',
            data: datosCompletos
          });
        }

        // Actualizar historial local
        const nuevaEntrada = {
          fecha: new Date().toISOString(),
          faena: faenaSeleccionada,
          toneladas: parseFloat(valores.toneladas) || 0,
          camionadas: parseFloat(valores.camionadas) || 0,
          rendimiento: datosCompletos.rendimiento || 0,
          horas_trabajadas: datosCompletos.medicion_horometro || 0
        };

        setHistorialActualizaciones([
          nuevaEntrada,
          ...historialActualizaciones.slice(0, 4)  // Mantener solo las últimas 5 entradas
        ]);

        // Limpiar formulario y recargar faenas disponibles
        resetForm();
        cargarFaenasDisponibles();
      } else {
        setError(resultadoAPI?.message || "Error al registrar datos. Intente nuevamente.");
      }
    } catch (err) {
      console.error("Error al registrar datos:", err);
      setError("Error de conexión al guardar datos. Verifique su conexión a internet.");
    } finally {
      setLoading(false);
    }
  };

  // Funciones auxiliares UI

  /**
   * Obtiene el nombre de la faena a partir de su ID
   */
  const getNombreFaena = (id) => {
    const faenaEncontrada = faenasDisponibles.find(f => f.id_faena.toString() === id.toString());
    return faenaEncontrada
      ? faenaEncontrada.nombre
      : (id === '1' ? 'Cabildo' :
        id === '2' ? 'Catemu' :
          id === '3' ? 'Chincolco' :
            id === '4' ? 'Tiltil' : id);
  };

  /**
   * Formatea el tipo de máquina para mostrar en tabla
   */
  const getTipoMaquinaString = (maquina) => {
    const tipo = maquina?.tipo_medicion?.toLowerCase();
    if (tipo === 'horometro') {
      return 'Horómetro';
    } else if (tipo === 'kilometraje') {
      return 'Kilometraje';
    } else {
      return maquina?.tipo_medicion || 'Desconocido';
    }
  };

  /**
   * Calcula el porcentaje del costo total por tipo de máquina
   */
  const calcularPorcentajeTipo = (costoTipo, costoTotal) => {
    if (!costoTotal || costoTotal <= 0) return 0;
    return ((costoTipo / costoTotal) * 100).toFixed(2);
  };

  // Obtener valores calculados para previsualización
  const costoPorTonelada = parseFloat(valores.toneladas) > 0 && parseFloat(datosPetroleoMesAnterior?.costo_total) > 0
    ? (parseFloat(datosPetroleoMesAnterior.costo_total) / parseFloat(valores.toneladas))
    : 0;

  const costoPorHora = parseFloat(datosPetroleoMesAnterior?.medicion_horometro) > 0 && parseFloat(datosPetroleoMesAnterior?.costo_total_horometro) > 0
    ? (parseFloat(datosPetroleoMesAnterior.costo_total_horometro) / parseFloat(datosPetroleoMesAnterior.medicion_horometro))
    : 0;

  const costoPorKm = parseFloat(datosPetroleoMesAnterior?.medicion_kilometraje) > 0 && parseFloat(datosPetroleoMesAnterior?.costo_total_kilometraje) > 0
    ? (parseFloat(datosPetroleoMesAnterior.costo_total_kilometraje) / parseFloat(datosPetroleoMesAnterior.medicion_kilometraje))
    : 0;

  return (
    <>
      {/* Filtros específicos para la calculadora */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-white border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <FaCalculator className="mr-2 text-orange-500" />
              Panel de Control - Ingreso de Datos
            </h2>

            {historialActualizaciones.length > 0 && (
              <button
                onClick={() => setHistorialVisible(!historialVisible)}
                className="text-sm text-gray-600 flex items-center hover:text-orange-500 transition-colors"
              >
                <FaHistory className="mr-1" />
                {historialVisible ? 'Ocultar historial' : 'Mostrar historial'}
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Faena para Ingreso de Datos:
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              value={faenaSeleccionada}
              onChange={(e) => setFaenaSeleccionada(e.target.value)}
              disabled={cargandoFaenas}
            >
              <option value="">Seleccione una faena</option>
              {faenasDisponibles.map(f => (
                <option key={f.id_faena} value={f.id_faena}>
                  {f.nombre}
                </option>
              ))}
            </select>

            <div className="mt-2 p-2 bg-orange-100 border border-orange-300 rounded-md flex items-center text-orange-800">
              <FaCalendarAlt className="mr-2 text-orange-600" />
              <span className="font-medium">Periodo: <span className="text-orange-900">{mesAnterior}</span></span>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Solo se muestran faenas que no tienen datos registrados para el mes anterior.
            </p>
          </div>
        </div>
      </div>

      {/* Mensajes informativos */}
      {infoMensaje && (
        <div className="mb-6 p-3 bg-amber-50 rounded-md border border-amber-200 text-amber-800 text-sm flex items-start">
          <FaInfoCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <div>{infoMensaje}</div>
        </div>
      )}

      {/* Mensajes de éxito y error */}
      {success && (
        <div className="mb-6 p-3 bg-green-100 text-green-700 rounded-md flex items-center">
          <FiCheckCircle className="mr-2 flex-shrink-0" />
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
          <FiAlertCircle className="mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Historial de actualizaciones */}
      {historialVisible && historialActualizaciones.length > 0 && (
        <div className="mb-6 bg-gray-50 rounded-md border border-gray-200 p-4">
          <h4 className="font-medium mb-3 text-gray-700 flex items-center">
            <FiInfo className="mr-2" /> Últimas actualizaciones
          </h4>
          <div className="text-sm max-h-40 overflow-y-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2">Fecha</th>
                  <th className="text-left py-2 px-2">Faena</th>
                  <th className="text-right py-2 px-2">Toneladas</th>
                  <th className="text-right py-2 px-2">Camionadas</th>
                  <th className="text-right py-2 px-2">Rendimiento</th>
                </tr>
              </thead>
              <tbody>
                {historialActualizaciones.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-white">
                    <td className="py-2 px-2">{new Date(item.fecha).toLocaleString()}</td>
                    <td className="py-2 px-2">{getNombreFaena(item.faena)}</td>
                    <td className="py-2 px-2 text-right">{item.toneladas?.toLocaleString() || '-'}</td>
                    <td className="py-2 px-2 text-right">{item.camionadas?.toLocaleString() || '-'}</td>
                    <td className="py-2 px-2 text-right">{typeof item.rendimiento === 'number' ? item.rendimiento.toFixed(2) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Datos de petróleo y consumo por tipo de máquina */}
      {!cargandoDatosPetroleo && datosPetroleoMesAnterior && (
        <div className="mb-6 bg-white rounded-md border border-gray-200 p-4">
          <h4 className="font-medium mb-3 text-gray-700">Datos de Consumo para Faena</h4>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="text-xs text-gray-500">Costo total petróleo:</div>
              <div className="font-medium text-lg">${parseFloat(datosPetroleoMesAnterior.costo_total).toLocaleString('es-CL')}</div>
            </div>

            {parseFloat(datosPetroleoMesAnterior.medicion_horometro) > 0 && (
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="text-xs text-gray-500">Horas trabajadas:</div>
                <div className="font-medium text-lg">{parseFloat(datosPetroleoMesAnterior.medicion_horometro).toLocaleString('es-CL')} hrs</div>
              </div>
            )}

            {parseFloat(datosPetroleoMesAnterior.medicion_kilometraje) > 0 && (
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="text-xs text-gray-500">Kilómetros recorridos:</div>
                <div className="font-medium text-lg">{parseFloat(datosPetroleoMesAnterior.medicion_kilometraje).toLocaleString('es-CL')} km</div>
              </div>
            )}
          </div>

          {/* Resumen por tipo de máquina */}
          <div className="mb-3">
            <h5 className="font-medium text-sm text-gray-700 mb-1">Costos por tipo de máquina:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {parseFloat(datosPetroleoMesAnterior.costo_total_horometro) > 0 && (
                <div className="bg-white p-2 rounded border border-blue-100">
                  <div className="flex justify-between">
                    <span className="font-medium">Horómetro:</span>
                    <span>${parseFloat(datosPetroleoMesAnterior.costo_total_horometro).toLocaleString('es-CL')}</span>
                  </div>
                  <div className="text-xs text-gray-600 flex justify-between mt-1">
                    <span>Horas trabajadas: {parseFloat(datosPetroleoMesAnterior.medicion_horometro).toLocaleString('es-CL')}</span>
                    <span>{calcularPorcentajeTipo(parseFloat(datosPetroleoMesAnterior.costo_total_horometro), parseFloat(datosPetroleoMesAnterior.costo_total))}% del total</span>
                  </div>
                </div>
              )}

              {parseFloat(datosPetroleoMesAnterior.costo_total_kilometraje) > 0 && (
                <div className="bg-white p-2 rounded border border-green-100">
                  <div className="flex justify-between">
                    <span className="font-medium">Kilometraje:</span>
                    <span>${parseFloat(datosPetroleoMesAnterior.costo_total_kilometraje).toLocaleString('es-CL')}</span>
                  </div>
                  <div className="text-xs text-gray-600 flex justify-between mt-1">
                    <span>KM recorridos: {parseFloat(datosPetroleoMesAnterior.medicion_kilometraje).toLocaleString('es-CL')}</span>
                    <span>{calcularPorcentajeTipo(parseFloat(datosPetroleoMesAnterior.costo_total_kilometraje), parseFloat(datosPetroleoMesAnterior.costo_total))}% del total</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botón para mostrar/ocultar desglose de máquinas */}
          {datosPetroleoMesAnterior.desglose_por_maquina && datosPetroleoMesAnterior.desglose_por_maquina.length > 0 && (
            <div className="mt-3">
              <button
                className="text-blue-600 font-medium flex items-center text-sm"
                onClick={() => setMostrarDesgloseMaquinas(!mostrarDesgloseMaquinas)}
              >
                {mostrarDesgloseMaquinas ? "Ocultar desglose por máquina" : "Ver desglose por máquina"}
                {mostrarDesgloseMaquinas ? <FiChevronUp className="ml-2" /> : <FiChevronDown className="ml-2" />}
                <span className="text-xs ml-2 text-gray-500">
                  ({datosPetroleoMesAnterior.desglose_por_maquina.length} máquinas)
                </span>
              </button>

              {mostrarDesgloseMaquinas && (
                <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-100 border-b text-sm">
                        <th className="text-left py-1 px-2">Máquina</th>
                        <th className="text-center py-1 px-2">Tipo</th>
                        <th className="text-right py-1 px-2">Litros</th>
                        <th className="text-right py-1 px-2">Costo</th>
                        <th className="text-right py-1 px-2">Medición</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {datosPetroleoMesAnterior.desglose_por_maquina.map((maquina, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-1 px-2">{maquina.nombre_maquina}</td>
                          <td className="py-1 px-2 text-center">{getTipoMaquinaString(maquina)}</td>
                          <td className="py-1 px-2 text-right">{parseFloat(maquina.total_litros).toLocaleString('es-CL')}</td>
                          <td className="py-1 px-2 text-right">${parseFloat(maquina.costo_total_maquina).toLocaleString('es-CL')}</td>
                          <td className="py-1 px-2 text-right">
                            {maquina.diferencia_medicion > 0 ?
                              `${parseFloat(maquina.diferencia_medicion).toLocaleString('es-CL')} ${maquina.tipo_medicion?.toLowerCase() === 'kilometraje' ? 'km' : 'hrs'}` :
                              '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {cargandoDatosPetroleo && (
        <div className="mb-6 flex items-center justify-center p-4 text-gray-600 bg-gray-50 rounded-md">
          <FiLoader className="animate-spin mr-2" />
          <span>Cargando datos de consumo...</span>
        </div>
      )}

      {/* Formulario principal */}
      <form onSubmit={handleSubmit} className="mb-6 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Ingreso de Datos de Producción</h3>

        {/* Campos para toneladas y camionadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="inputToneladas" className="block text-sm font-medium text-gray-700 mb-1">
              Toneladas Extraídas <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-md shadow-sm">
              <input
                id="inputToneladas"
                type="number"
                name="toneladas"
                value={valores.toneladas}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Ingrese toneladas extraídas"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">ton</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Toneladas totales extraídas en {mesAnterior}
            </p>
          </div>

          <div>
            <label htmlFor="inputCamionadas" className="block text-sm font-medium text-gray-700 mb-1">
              Número de Camionadas
            </label>
            <input
              id="inputCamionadas"
              type="number"
              name="camionadas"
              value={valores.camionadas}
              onChange={handleInputChange}
              min="0"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm"
              placeholder="Ingrese cantidad de camionadas"
            />
            <p className="mt-1 text-xs text-gray-500">
              Número total de viajes realizados
            </p>
          </div>
        </div>

        {/* Vista previa de cálculos si hay datos suficientes */}
        {valores.toneladas && parseFloat(valores.toneladas) > 0 && datosPetroleoMesAnterior && (
          <div className="mb-6 p-4 bg-green-50 rounded-md border border-green-200">
            <h5 className="font-medium text-green-800 mb-3">Vista previa de KPIs calculados</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center p-3 bg-white rounded-md border border-green-100 shadow-sm">
                <div className="text-green-600 mr-3">
                  <FiTruck size={24} />
                </div>
                <div>
                  <div className="font-medium">Rendimiento</div>
                  <div className="text-lg text-green-700">{valores.camionadas ? rendimientoCalculado() : '0'} ton/viaje</div>
                </div>
              </div>

              {costoPorTonelada > 0 && (
                <div className="flex items-center p-3 bg-white rounded-md border border-green-100 shadow-sm">
                  <div className="text-green-600 mr-3">
                    <FiDroplet size={24} />
                  </div>
                  <div>
                    <div className="font-medium">Costo por tonelada</div>
                    <div className="text-lg text-green-700">${costoPorTonelada.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</div>
                  </div>
                </div>
              )}

              {costoPorHora > 0 && (
                <div className="flex items-center p-3 bg-white rounded-md border border-green-100 shadow-sm">
                  <div className="text-green-600 mr-3">
                    <FiDroplet size={24} />
                  </div>
                  <div>
                    <div className="font-medium">Costo por hora</div>
                    <div className="text-lg text-green-700">${costoPorHora.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors focus:outline-none"
            disabled={loading}
          >
            Limpiar
          </button>

          <button
            type="submit"
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors flex items-center focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={loading || !faenaSeleccionada || !valores.toneladas || cargandoDatosPetroleo}
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block h-4 w-4 mr-2 border-t-2 border-white rounded-full"></span>
                Procesando...
              </>
            ) : (
              <>
                <FaCalculator className="mr-2" />
                Registrar Datos
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
};

// Definir PropTypes para validación de props
SimpleKpiCalculator.propTypes = {
  onCalculate: PropTypes.func,
  periodo: PropTypes.string
};

// Memorizar el componente para evitar renderizados innecesarios
export default memo(SimpleKpiCalculator);