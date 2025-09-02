// ChartColorsContext.jsx - ACTUALIZADO
import React, { createContext, useContext, useState, useCallback } from "react";

const ChartColorsContext = createContext();

export const ChartColorsProvider = ({ children }) => {
  const [categoryColorMapping, setCategoryColorMapping] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 🆕 NUEVO: Estados para coordinar la carga secuencial
  const [loadingCoordination, setLoadingCoordination] = useState({
    mainChartLoading: false,
    mainChartLoaded: false,
    compactChartCanLoad: false,
    allChartsLoaded: false
  });

  // Función existente mejorada
  const resetColorMapping = useCallback(() => {
    console.log('🔄 ChartColors: Reseteando mapeo de colores');
    setCategoryColorMapping({});
    setIsInitialized(false);
    
    // 🆕 NUEVO: Resetear coordinación
    setLoadingCoordination({
      mainChartLoading: false,
      mainChartLoaded: false,
      compactChartCanLoad: false,
      allChartsLoaded: false
    });
  }, []);

  // 🆕 NUEVO: Función para indicar que el gráfico principal empezó a cargar
  const setMainChartLoading = useCallback((loading) => {
    console.log(`🎯 ChartColors: Gráfico principal ${loading ? 'iniciando' : 'terminando'} carga`);
    setLoadingCoordination(prev => ({
      ...prev,
      mainChartLoading: loading,
      // Si termina de cargar, habilitar el gráfico compacto
      compactChartCanLoad: prev.mainChartLoaded && !loading,
    }));
  }, []);

  // 🆕 NUEVO: Función cuando el gráfico principal termina de cargar con datos
  const handleMainChartLoad = useCallback((categorias) => {
    console.log('✅ ChartColors: Gráfico principal cargado con datos:', categorias?.length);
    
    // Crear mapeo de colores
    const newMapping = {};
    if (Array.isArray(categorias)) {
      categorias.forEach((categoria) => {
        const name = categoria.name || categoria.nombre;
        if (name && categoria.color) {
          newMapping[name] = categoria.color;
        }
      });
    }

    setCategoryColorMapping(newMapping);
    setIsInitialized(true);
    
    // 🔑 CRÍTICO: Habilitar carga del gráfico compacto
    setLoadingCoordination(prev => ({
      ...prev,
      mainChartLoaded: true,
      compactChartCanLoad: true,
      mainChartLoading: false
    }));

    console.log('🎨 ChartColors: Colores mapeados:', newMapping);
  }, []);

  // 🆕 NUEVO: Función cuando el gráfico compacto termina
  const handleCompactChartLoad = useCallback(() => {
    console.log('✅ ChartColors: Gráfico compacto cargado');
    setLoadingCoordination(prev => ({
      ...prev,
      allChartsLoaded: true
    }));
  }, []);

  // Función existente mejorada
  const getColorForCategory = useCallback((categoryName) => {
    const color = categoryColorMapping[categoryName];
    if (color) {
      console.log(`🎨 ChartColors: Color para "${categoryName}": ${color}`);
    } else {
      console.log(`⚠️ ChartColors: Sin color para "${categoryName}"`);
    }
    return color;
  }, [categoryColorMapping]);

  const value = {
    // Estados existentes
    categoryColorMapping,
    isInitialized,
    hasValidColorMapping: Object.keys(categoryColorMapping).length > 0,
    categoryCount: Object.keys(categoryColorMapping).length,

    // 🆕 NUEVOS estados de coordinación
    loadingCoordination,
    mainChartLoaded: loadingCoordination.mainChartLoaded,
    compactChartCanLoad: loadingCoordination.compactChartCanLoad,
    allChartsLoaded: loadingCoordination.allChartsLoaded,

    // Funciones existentes
    getColorForCategory,
    resetColorMapping,

    // 🆕 NUEVAS funciones de coordinación
    setMainChartLoading,
    handleMainChartLoad,
    handleCompactChartLoad,
  };

  return (
    <ChartColorsContext.Provider value={value}>
      {children}
    </ChartColorsContext.Provider>
  );
};

export const useChartColors = () => {
  const context = useContext(ChartColorsContext);
  if (context === undefined) {
    throw new Error('useChartColors must be used within a ChartColorsProvider');
  }
  return context;
};