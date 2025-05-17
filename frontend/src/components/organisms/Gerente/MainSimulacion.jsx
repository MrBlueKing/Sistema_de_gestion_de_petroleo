import React, { useState, useMemo, useRef } from "react";
import DatosInput from "../../molecules/DatosInput";
import TablaResumen from "../../molecules/TablaResumen";
import GraficoStock from "../../molecules/GraficoStock";
import ExportarPDF from "../../molecules/ExportarPDF";

function Simular() {
  const [horometro, setHorometro] = useState([5, 11, 17, 25]);
  const [cargas, setCargas] = useState([10, 15, 18, 50]);

  const resumenRef = useRef(); // Para PDF
  const chartRef = useRef(); // Para exportar gráfico como imagen
  const [chartImage, setChartImage] = useState(null); // Imagen del gráfico

  // 📌 Cálculos clave
  const calculos = useMemo(() => {
    const horasTrabajadas = [null];
    for (let i = 1; i < horometro.length; i++) {
      horasTrabajadas.push(horometro[i] - horometro[i - 1]);
    }

    const consumoReal = [0];
    for (let i = 1; i < cargas.length; i++) {
      consumoReal.push(cargas[i - 1]);
    }

    const totalHoras = horasTrabajadas.slice(1).reduce((a, b) => a + b, 0);
    const totalConsumo = consumoReal.slice(1).reduce((a, b) => a + b, 0);
    const rendimiento = totalHoras / totalConsumo;
    const promedioHoras = totalHoras / (horometro.length - 1);
    const consumoSimuladoDiario = promedioHoras / rendimiento;

    let simulacion = [];
    let stockInicial = cargas[cargas.length - 1]; // último valor
    for (let i = 1; i <= 4; i++) {
      const consumo = consumoSimuladoDiario;
      const stockFinal = Math.max(stockInicial - consumo, 0);
      simulacion.push({
        dia: horometro.length + i,
        horas: promedioHoras,
        consumo: consumo.toFixed(2),
        stockInicial: stockInicial.toFixed(2),
        stockFinal: stockFinal.toFixed(2),
      });
      stockInicial = stockFinal;
    }

    return {
      horasTrabajadas,
      consumoReal,
      totalHoras,
      totalConsumo,
      rendimiento,
      promedioHoras,
      consumoSimuladoDiario,
      simulacion,
    };
  }, [horometro, cargas]);

  // 📊 Datos para gráfico
  const datosReal = horometro.map((h, index) => ({
    dia: index + 1,
    horas: calculos.horasTrabajadas[index] || 0,
    consumo: calculos.consumoReal[index] || 0,
    stockInicial: cargas[index] || 0,
  }));

  const datosSimulados = calculos.simulacion.map((s) => ({
    dia: s.dia,
    horas: Number(s.horas),
    consumo: Number(s.consumo),
    stockInicial: Number(s.stockInicial),
  }));

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-800">
      <h1 className="text-2xl font-bold text-center mb-6">
        🛠️ Simulación de Consumo de Stock
      </h1>

      {/* Inputs para horómetro y cargas */}
      <DatosInput
        horometro={horometro}
        cargas={cargas}
        setHorometro={setHorometro}
        setCargas={setCargas}
      />

      <div ref={resumenRef}>
        {/* Tabla de resumen */}
        <TablaResumen {...calculos} horometro={horometro} cargas={cargas} />

        {/* Gráfico */}
        <div ref={chartRef}>
          <GraficoStock datosReal={datosReal} datosSimulados={datosSimulados} />
        </div>
      </div>

      {/* Botón para exportar todo como PDF */}
      <ExportarPDF
        targetRef={resumenRef}
        chartRef={chartRef}
        chartImage={chartImage}
        setChartImage={setChartImage}
        datosReal={datosReal}
        datosSimulados={datosSimulados}
        calculos={calculos}
      />
    </div>
  );
}

export default Simular;
