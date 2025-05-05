import { useState } from "react";
import { FiSave, FiX, FiTruck, FiDroplet, FiActivity, FiInfo } from "react-icons/fi";
import { FaCalculator, FaFlask, FaGasPump, FaClock, FaRoad, FaInfoCircle } from "react-icons/fa";

// Componente profesional de calculadora para KPIs mineros
const KpiSimpleCalculator = ({ onCalculate }) => {
    // Estado para los valores de entrada organizados por categorías
    const [inputValues, setInputValues] = useState({
        // Datos de producción - inicialmente vacíos
        leyMineral: "",            // Ley mineral en porcentaje
        toneladasExtraidas: "",    // Toneladas extraídas
        numeroViajes: "",          // Número de viajes (camionadas)
        
        // Datos de operación - fijos desde la base de datos
        horasTrabajadas: 720,        // Horas trabajadas en el período
        rendimientoBase: 92,         // Rendimiento operacional base (porcentaje)
        
        // Datos de consumo - fijos desde la base de datos
        combustibleConsumido: 12500, // Litros de combustible consumidos
        kilometrosRecorridos: 25000, // Kilómetros recorridos
        precioCombustible: 1300      // Precio del combustible por litro (en pesos chilenos)
    });

    // Estado para notificación
    const [notification, setNotification] = useState({
        show: false,
        message: "",
        type: "success" // success, error, warning, info
    });

    // Manejador para cambios en campos de entrada
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputValues({
            ...inputValues,
            [name]: value === "" ? "" : parseFloat(value) || 0
        });
    };

    // Función para mostrar notificación
    const showNotification = (message, type = "success") => {
        setNotification({
            show: true,
            message,
            type
        });

        // Ocultar notificación después de 4 segundos
        setTimeout(() => {
            setNotification({
                ...notification,
                show: false
            });
        }, 4000);
    };

    // Función para validar los datos de entrada
    const validateInputs = () => {
        // Verificar si los campos están vacíos
        if (inputValues.leyMineral === "") {
            showNotification("Por favor ingrese la ley mineral", "error");
            return false;
        }
        if (inputValues.toneladasExtraidas === "") {
            showNotification("Por favor ingrese las toneladas extraídas", "error");
            return false;
        }
        if (inputValues.numeroViajes === "") {
            showNotification("Por favor ingrese el número de viajes", "error");
            return false;
        }
        
        // Verificar valores válidos
        if (parseFloat(inputValues.leyMineral) <= 0) {
            showNotification("La ley mineral debe ser mayor a 0", "error");
            return false;
        }
        if (parseFloat(inputValues.toneladasExtraidas) <= 0) {
            showNotification("Las toneladas extraídas deben ser mayores a 0", "error");
            return false;
        }
        if (parseFloat(inputValues.numeroViajes) <= 0) {
            showNotification("El número de viajes debe ser mayor a 0", "error");
            return false;
        }
        return true;
    };

    // Función para calcular los KPIs basados en los inputs
    const calculateKpis = () => {
        // Validar datos
        if (!validateInputs()) {
            return;
        }

        // Convertir a números para los cálculos
        const leyMineral = parseFloat(inputValues.leyMineral);
        const toneladasExtraidas = parseFloat(inputValues.toneladasExtraidas);
        const numeroViajes = parseFloat(inputValues.numeroViajes);

        // Cálculos básicos
        const costoPetroleoTon = (inputValues.combustibleConsumido * inputValues.precioCombustible / toneladasExtraidas).toFixed(2);
        const costoPetroleoHora = (inputValues.combustibleConsumido * inputValues.precioCombustible / inputValues.horasTrabajadas).toFixed(2);
        const costoPetroleoKm = (inputValues.combustibleConsumido * inputValues.precioCombustible / inputValues.kilometrosRecorridos).toFixed(2);

        // Factor de rendimiento basado en la ley mineral
        // Suponemos que una ley mayor a 1.5% es mejor y una menor es peor para el rendimiento
        const factorLey = leyMineral >= 1.5 ? 1.05 : 0.95;
        const rendimientoCalculado = (inputValues.rendimientoBase * factorLey).toFixed(0);

        // Calcular eficiencia de transporte (toneladas por viaje)
        const toneladasPorViaje = (toneladasExtraidas / numeroViajes).toFixed(2);
        
        // Calcular productividad (toneladas por hora)
        const productividadHora = (toneladasExtraidas / inputValues.horasTrabajadas).toFixed(2);

        // Calcular cambios porcentuales (simulados para este ejemplo)
        // En una implementación real, estos valores vendrían de comparar con periodos anteriores
        const changeProd = "+5%";
        const changeLey = leyMineral > 1.2 ? "+0.1%" : "-0.1%";
        const changeRend = factorLey > 1 ? "+2%" : "-2%";
        const changeCamionadas = "+12";
        const changeCostoTon = costoPetroleoTon > 15 ? "+3%" : "-3%";
        const changeCostoHora = costoPetroleoHora > 25 ? "+1%" : "-1%";
        const changeCostoKm = costoPetroleoKm > 0.5 ? "+0.5%" : "-0.5%";
        const changeTonViaje = toneladasPorViaje > 55 ? "+2%" : "-1%";
        const changeProdHora = productividadHora > 60 ? "+4%" : "-2%";

        // Valores positivos (para colorear indicadores)
        const isLeyPositive = leyMineral >= 1.2;
        const isRendPositive = factorLey >= 1;
        const isCostoTonPositive = costoPetroleoTon <= 15;
        const isCostoHoraPositive = costoPetroleoHora <= 25;
        const isCostoKmPositive = costoPetroleoKm <= 0.5;
        const isTonViajePositive = toneladasPorViaje >= 55;
        const isProdHoraPositive = productividadHora >= 60;

        // Crear array de KPIs actualizados
        const updatedKpis = [
            {
                title: "Producción Total",
                value: toneladasExtraidas.toLocaleString(),
                change: changeProd,
                unit: "ton",
                subtext: "Toneladas extraídas este mes",
                icon: "FiTruck",
                isPositive: true,
                color: "blue"
            },
            {
                title: "Ley Promedio",
                value: leyMineral.toFixed(2),
                change: changeLey,
                unit: "%",
                subtext: "Concentración de mineral promedio",
                icon: "FaFlask",
                isPositive: isLeyPositive,
                color: "amber"
            },
            {
                title: "Rendimiento Operacional",
                value: rendimientoCalculado,
                change: changeRend,
                unit: "%",
                subtext: "Eficiencia de equipos",
                icon: "FiActivity",
                isPositive: isRendPositive,
                color: "green"
            },
            {
                title: "Camionadas",
                value: numeroViajes.toString(),
                change: changeCamionadas,
                unit: "",
                subtext: "Número de viajes realizados",
                icon: "FiTruck",
                isPositive: true,
                color: "indigo"
            },
            {
                title: "Costo Petróleo / Ton",
                value: "$" + costoPetroleoTon,
                change: changeCostoTon,
                unit: "",
                subtext: "Costo por tonelada producida",
                icon: "FiDroplet",
                isPositive: isCostoTonPositive,
                color: "red"
            },
            {
                title: "Costo Petróleo / Hora",
                value: "$" + costoPetroleoHora,
                change: changeCostoHora,
                unit: "",
                subtext: "Costo por hora de operación",
                icon: "FiDroplet",
                isPositive: isCostoHoraPositive,
                color: "teal"
            },
            {
                title: "Costo Petróleo / Km",
                value: "$" + costoPetroleoKm,
                change: changeCostoKm,
                unit: "",
                subtext: "Costo por kilómetro recorrido",
                icon: "FiDroplet",
                isPositive: isCostoKmPositive,
                color: "purple"
            },
            {
                title: "Toneladas / Viaje",
                value: toneladasPorViaje,
                change: changeTonViaje,
                unit: "ton",
                subtext: "Eficiencia de transporte",
                icon: "FiTruck",
                isPositive: isTonViajePositive,
                color: "emerald"
            },
            {
                title: "Productividad",
                value: productividadHora,
                change: changeProdHora,
                unit: "ton/h",
                subtext: "Toneladas por hora trabajada",
                icon: "FiActivity",
                isPositive: isProdHoraPositive,
                color: "cyan"
            }
        ];

        // Propagar los KPIs actualizados al componente padre
        if (onCalculate) {
            onCalculate(updatedKpis);
        }

        // Mostrar notificación
        showNotification("KPIs calculados y actualizados correctamente");
    };

    // Función para limpiar formulario
    const limpiarFormulario = () => {
        setInputValues({
            ...inputValues,
            leyMineral: "",
            toneladasExtraidas: "",
            numeroViajes: ""
        });
        showNotification("Formulario limpiado", "info");
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <FaCalculator className="mr-2 text-blue-600" />
                    Calculadora de KPIs Mineros
                </h2>
                
                <div className="flex items-center gap-3">
                    <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        Panel de cálculo de gerencia
                    </div>
                    <button
                        onClick={limpiarFormulario}
                        className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1 px-3 py-1 rounded border border-gray-300 hover:bg-gray-100"
                    >
                        <FiX className="mr-1" />
                        Limpiar
                    </button>
                </div>
            </div>

            {/* Notificación */}
            {notification.show && (
                <div className={`mb-4 p-3 rounded-md flex items-center ${
                    notification.type === 'success' ? 'bg-green-100 text-green-800' : 
                    notification.type === 'error' ? 'bg-red-100 text-red-800' : 
                    notification.type === 'info' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                }`}>
                    {notification.type === 'success' ? <FiSave className="mr-2" /> : 
                     notification.type === 'error' ? <FiX className="mr-2" /> : 
                     notification.type === 'info' ? <FiInfo className="mr-2" /> :
                     <FiActivity className="mr-2" />}
                    {notification.message}
                </div>
            )}

            <div className="mb-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
                {/* Datos de producción - Sección principal que necesita el gerente */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-blue-200 pb-3">
                        <h3 className="text-lg font-semibold text-blue-700 flex items-center">
                            <FiTruck className="mr-2 text-blue-600" />
                            Datos de Producción
                        </h3>
                        <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
                            Requiere ingreso
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-4 rounded-md border border-blue-300 shadow-sm">
                            <label className="block text-md font-medium text-gray-800 mb-2">
                                Ley Mineral (%)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                name="leyMineral"
                                value={inputValues.leyMineral}
                                onChange={handleInputChange}
                                placeholder="Ej: 1.23"
                                className="w-full p-3 text-lg border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="text-sm text-gray-600 mt-2 block">Porcentaje de concentración del mineral</span>
                        </div>

                        <div className="bg-white p-4 rounded-md border border-blue-300 shadow-sm">
                            <label className="block text-md font-medium text-gray-800 mb-2">
                                Toneladas Extraídas
                            </label>
                            <input
                                type="number"
                                min="0"
                                name="toneladasExtraidas"
                                value={inputValues.toneladasExtraidas}
                                onChange={handleInputChange}
                                placeholder="Ej: 45200"
                                className="w-full p-3 text-lg border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="text-sm text-gray-600 mt-2 block">Toneladas totales extraídas en el período</span>
                        </div>

                        <div className="bg-white p-4 rounded-md border border-blue-300 shadow-sm">
                            <label className="block text-md font-medium text-gray-800 mb-2">
                                Número de Viajes
                            </label>
                            <input
                                type="number"
                                min="0"
                                name="numeroViajes"
                                value={inputValues.numeroViajes}
                                onChange={handleInputChange}
                                placeholder="Ej: 820"
                                className="w-full p-3 text-lg border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="text-sm text-gray-600 mt-2 block">Total de viajes de transporte realizados</span>
                        </div>
                    </div>
                </div>
            </div>
                
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                {/* Columna 1: Datos de operación - Desde la base de datos */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center border-b pb-2 mb-4">
                        <h3 className="text-md font-medium text-gray-700 flex items-center">
                            <FaClock className="mr-2 text-green-600" />
                            Datos de Operación
                        </h3>
                        <div className="flex items-center">
                            <FaInfoCircle className="text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">Datos de la base</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Horas Trabajadas
                            </label>
                            <input
                                type="number"
                                min="0"
                                name="horasTrabajadas"
                                value={inputValues.horasTrabajadas}
                                className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                                disabled
                            />
                            <span className="text-xs text-gray-500">Registro del período actual</span>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rendimiento Base (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                name="rendimientoBase"
                                value={inputValues.rendimientoBase}
                                className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                                disabled
                            />
                            <span className="text-xs text-gray-500">Valor estándar vigente</span>
                        </div>
                    </div>
                </div>

                {/* Columna 2: Datos de consumo - Desde la base de datos */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center border-b pb-2 mb-4">
                        <h3 className="text-md font-medium text-gray-700 flex items-center">
                            <FaGasPump className="mr-2 text-red-600" />
                            Datos de Consumo
                        </h3>
                        <div className="flex items-center">
                            <FaInfoCircle className="text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">Datos de la base</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Combustible (L)
                            </label>
                            <input
                                type="number"
                                min="0"
                                name="combustibleConsumido"
                                value={inputValues.combustibleConsumido}
                                className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                                disabled
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kilómetros
                            </label>
                            <input
                                type="number"
                                min="0"
                                name="kilometrosRecorridos"
                                value={inputValues.kilometrosRecorridos}
                                className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                                disabled
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio ($/L)
                            </label>
                            <input
                                type="number"
                                min="0"
                                name="precioCombustible"
                                value={inputValues.precioCombustible}
                                className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                                disabled
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Botones de acción */}
            <div className="mt-8 flex justify-end gap-4">
                <button
                    className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md transition-colors"
                    onClick={limpiarFormulario}
                >
                    <FiX className="mr-2" />
                    Cancelar
                </button>
                
                <button
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md transition-colors text-lg font-medium shadow-sm"
                    onClick={calculateKpis}
                >
                    <FaCalculator className="mr-2" />
                    Calcular KPIs
                </button>
            </div>
            
            <div className="mt-4 text-center text-sm text-gray-600">
                Los datos operacionales y de consumo se obtienen automáticamente de la base de datos
            </div>
        </div>
    );
};

export default KpiSimpleCalculator;