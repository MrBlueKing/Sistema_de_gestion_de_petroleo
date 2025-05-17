// Modificar el App.jsx existente para integrar el nuevo ExportarPDF

import React, { useState, useMemo, useRef } from "react";
import DatosInput from "../../molecules/DatosInputs";
import TablaResumen from "../../molecules/TablaResumen";
import GraficoStock from "../../molecules/GraficoStocks";
import ExportarPDF from "../../molecules/ExportarPDF";

function App() {
  const [horometro, setHorometro] = useState([5, 11, 17, 25]);
  const [cargas, setCargas] = useState([10, 15, 18, 50]);
  const resumenRef = useRef();
  const chartRef = useRef();
  const [chartImage, setChartImage] = useState(null);

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
    const promedioHoras = totalHoras / 3;
    const consumoSimuladoDiario = promedioHoras / rendimiento;

    let simulacion = [];
    let stockInicial = cargas[3];
    for (let i = 5; i <= 8; i++) {
      const consumo = consumoSimuladoDiario;
      const stockFinal = Math.max(stockInicial - consumo, 0);
      simulacion.push({
        dia: i,
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

  const datosReal = horometro.map((h, index) => ({
    dia: index + 1,
    horas: calculos.horasTrabajadas[index] || 0,
    consumo: calculos.consumoReal[index] || 0,
    stockInicial: cargas[index] || 0,
  }));

  const datosSimulados = calculos.simulacion.map((s, i) => ({
    dia: horometro.length + i + 1,
    horas: Number(s.horas),
    consumo: Number(s.consumo),
    stockInicial: Number(s.stockInicial),
  }));

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-800">
      <h1 className="text-2xl font-bold text-center mb-6">
        🛠️ Simulación de Consumo
      </h1>

      <DatosInput
        horometro={horometro}
        cargas={cargas}
        setHorometro={setHorometro}
        setCargas={setCargas}
      />
      <div ref={resumenRef}>
        <TablaResumen {...calculos} horometro={horometro} cargas={cargas} />

        <div ref={chartRef}> {/* ⬅️ Esta parte será convertida en imagen */}
          <GraficoStock datosReal={datosReal} datosSimulados={datosSimulados} />
        </div>
      </div>

      {/* ⬇️ Agregamos todos los props necesarios para la exportación mejorada */}
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

export default App;