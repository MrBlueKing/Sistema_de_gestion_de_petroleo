import React, { useState, useCallback, useMemo, useContext, useEffect } from "react";
import { UserContext } from "../../context/userContext";
import TipoSolicitante from "../../components/templates/Bombero/BomberoTipoSolicitante";
import Solicitante from "../../components/templates/Bombero/BomberoSolicitante";
import Maquinaria from "../../components/templates/Bombero/BomberoMaquinaria";
import Patente from "../../components/templates/Bombero/BomberoPatente";
import Consumo from "../../components/templates/Bombero/BomberoConsumo";
import bomberoService from "../../context/bomberoService";

const BomberoNavigation = () => {
  // Obtener contexto del usuario
  const { user } = useContext(UserContext);
  
  // Estados para el flujo de navegación
  const [currentStep, setCurrentStep] = useState(1);
  
  // Estados para almacenar los datos ingresados en cada paso
  const [tipoSolicitante, setTipoSolicitante] = useState("");
  const [solicitante, setSolicitante] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [patenteSeleccionada, setPatenteSeleccionada] = useState("");

  // Estado para controlar si se debe limpiar el cache
  const [shouldClearCache, setShouldClearCache] = useState(false);

  // Memoizar la información del usuario para evitar re-renders
  const userInfo = useMemo(() => ({
    id: user?.id,
    faena: user?.id_faena,
    nombre: user?.nombre,
    apellido: user?.apellido
  }), [user?.id, user?.id_faena, user?.nombre, user?.apellido]);

  // Precargar datos cuando el componente se monta
  useEffect(() => {
    const preloadData = async () => {
      if (userInfo.faena) {
        try {
          console.log('🚀 Precargando datos para mejorar UX...');
          // Precargar ambos tipos de personal
          await bomberoService.preloadPersonalData(['interno', 'externo'], userInfo.faena);
          console.log('✅ Precarga completada');
        } catch (error) {
          console.warn('⚠️ Error en precarga:', error);
        }
      }
    };

    preloadData();
  }, [userInfo.faena]);

  // Función optimizada para reiniciar todo el flujo
  const resetFlow = useCallback(() => {
    console.log('🔄 Reiniciando flujo de bombero');
    setCurrentStep(1);
    setTipoSolicitante("");
    setSolicitante(null);
    setCategoriaSeleccionada("");
    setPatenteSeleccionada("");
    setShouldClearCache(true);
    
    // Limpiar cache después de un breve delay para asegurar que los componentes se hayan desmontado
    setTimeout(() => {
      bomberoService.clearCache();
      setShouldClearCache(false);
    }, 100);
  }, []);

  // Manejar paso siguiente con optimizaciones
  const handleNext = useCallback((value) => {
    console.log(`📍 Avanzando del paso ${currentStep} al ${currentStep + 1}`);
    
    if (currentStep === 1) {
      setTipoSolicitante(value);
      console.log('✅ Tipo solicitante guardado:', value);
    } else if (currentStep === 2) {
      setSolicitante(value);
      console.log('✅ Solicitante guardado:', {
        id: value?.id,
        rut: value?.rut,
        faena: value?.id_faena || userInfo.faena
      });
    } else if (currentStep === 3) {
      setCategoriaSeleccionada(value);
      console.log('✅ Categoría guardada:', value);
    } else if (currentStep === 4) {
      setPatenteSeleccionada(value);
      console.log('✅ Patente guardada:', value);
    }
    
    setCurrentStep(prev => prev + 1);
  }, [currentStep, userInfo.faena]);

  // Manejar paso anterior
  const handlePrevious = useCallback(() => {
    console.log(`📍 Retrocediendo del paso ${currentStep} al ${currentStep - 1}`);
    setCurrentStep(prev => prev - 1);
  }, [currentStep]);

  // Manejar finalización exitosa del flujo
  const handleFlowComplete = useCallback(() => {
    console.log('🎉 Flujo completado exitosamente');
    // Opcional: mostrar mensaje de éxito
    // Opcional: redirigir a otra página
    // resetFlow(); // Si quieres reiniciar automáticamente
  }, []);

  // Memoizar las props que se pasan a cada componente para evitar re-renders
  const tipoSolicitanteProps = useMemo(() => ({
    onNext: handleNext,
    selectedTipo: tipoSolicitante
  }), [handleNext, tipoSolicitante]);

  const solicitanteProps = useMemo(() => ({
    tipoSolicitante,
    solicitante,
    onNext: handleNext,
    onPrevious: handlePrevious,
    userFaena: userInfo.faena,
    shouldClearCache
  }), [tipoSolicitante, solicitante, handleNext, handlePrevious, userInfo.faena, shouldClearCache]);

  const maquinariaProps = useMemo(() => ({
    tipoSolicitante,
    categoriaSeleccionada,
    onNext: handleNext,
    onPrevious: handlePrevious,
    userFaena: userInfo.faena
  }), [tipoSolicitante, categoriaSeleccionada, handleNext, handlePrevious, userInfo.faena]);

  const patenteProps = useMemo(() => ({
    tipoSolicitante,
    categoriaSeleccionada,
    patenteSeleccionada,
    solicitante,
    onNext: handleNext,
    onPrevious: handlePrevious,
    userFaena: userInfo.faena
  }), [tipoSolicitante, categoriaSeleccionada, patenteSeleccionada, solicitante, handleNext, handlePrevious, userInfo.faena]);

  const consumoProps = useMemo(() => ({
    tipoSolicitante,
    solicitante,
    categoriaSeleccionada,
    patenteSeleccionada,
    onPrevious: handlePrevious,
    onComplete: handleFlowComplete,
    resetFlow,
    userInfo,
    idFaena: userInfo.faena
  }), [
    tipoSolicitante, 
    solicitante, 
    categoriaSeleccionada, 
    patenteSeleccionada, 
    handlePrevious, 
    handleFlowComplete, 
    resetFlow, 
    userInfo
  ]);

  // Renderizar el paso correspondiente con memoización
  const renderStep = useMemo(() => {
    switch (currentStep) {
      case 1:
        return <TipoSolicitante {...tipoSolicitanteProps} />;
      case 2:
        return <Solicitante {...solicitanteProps} />;
      case 3:
        return <Maquinaria {...maquinariaProps} />;
      case 4:
        return <Patente {...patenteProps} />;
      case 5:
        return <Consumo {...consumoProps} />;
      default:
        return <TipoSolicitante {...tipoSolicitanteProps} />;
    }
  }, [
    currentStep, 
    tipoSolicitanteProps, 
    solicitanteProps, 
    maquinariaProps, 
    patenteProps, 
    consumoProps
  ]);

  // Indicador de progreso opcional
  const progressIndicator = useMemo(() => {
    const steps = [
      { number: 1, title: 'Tipo', completed: currentStep > 1 },
      { number: 2, title: 'Solicitante', completed: currentStep > 2 },
      { number: 3, title: 'Maquinaria', completed: currentStep > 3 },
      { number: 4, title: 'Patente', completed: currentStep > 4 },
      { number: 5, title: 'Consumo', completed: currentStep > 5 },
    ];

    return (
      <div className="mb-6 px-4">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${currentStep === step.number 
                  ? 'bg-blue-600 text-white' 
                  : step.completed 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }
              `}>
                {step.completed ? '✓' : step.number}
              </div>
              <span className={`ml-2 text-sm ${
                currentStep === step.number ? 'font-bold text-blue-600' : 'text-gray-600'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  step.completed ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }, [currentStep]);

  // Debug info (solo en desarrollo)
  const debugInfo = useMemo(() => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs max-w-sm">
        <h4 className="font-bold mb-2">Debug Info:</h4>
        <div>Paso: {currentStep}/5</div>
        <div>Tipo: {tipoSolicitante || 'No seleccionado'}</div>
        <div>Solicitante: {solicitante?.id || 'No seleccionado'}</div>
        <div>Categoría: {typeof categoriaSeleccionada === 'object' ? categoriaSeleccionada?.nombre || 'Objeto seleccionado' : categoriaSeleccionada || 'No seleccionada'}</div>
        <div>Patente: {typeof patenteSeleccionada === 'object' ? patenteSeleccionada?.patente || 'Objeto seleccionado' : patenteSeleccionada || 'No seleccionada'}</div>
        <div>User Faena: {userInfo.faena || 'No disponible'}</div>
        <div className="text-xs">Cache Stats: {bomberoService.getCacheStats ? JSON.stringify(bomberoService.getCacheStats(), null, 2) : 'N/A'}</div>
        <button 
          onClick={resetFlow}
          className="mt-2 px-2 py-1 bg-red-600 text-white rounded text-xs"
        >
          Reset Flow
        </button>
      </div>
    );
  }, [currentStep, tipoSolicitante, solicitante, categoriaSeleccionada, patenteSeleccionada, userInfo.faena, resetFlow]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Indicador de progreso */}
      {progressIndicator}
      
      {/* Contenido principal */}
      <div className="container mx-auto">
        {renderStep}
      </div>
      
      {/* Debug info */}
      {debugInfo}
    </div>
  );
};

export default React.memo(BomberoNavigation);