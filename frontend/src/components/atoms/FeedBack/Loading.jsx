// Descripción: Componente de carga elegante con múltiples variantes y animaciones suaves
import React, { useEffect, useState } from "react";
import { FaSpinner, FaCog, FaHeart } from "react-icons/fa";

const Loading = ({ 
  isLoading, 
  message = "Cargando...", 
  variant = "modern", // "modern", "minimal", "pulse", "dots", "gear"
  size = "normal", // "small", "normal", "large"
  color = "orange", // "orange", "blue", "green", "purple", "gradient"
  overlay = true // Si mostrar overlay de fondo
}) => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    let timer;
    if (isLoading) {
      timer = setTimeout(() => setVisible(true), 200);
      
      // Simular progreso para algunas variantes
      if (variant === "progress") {
        const progressTimer = setInterval(() => {
          setProgress(prev => {
            const newProgress = prev + Math.random() * 15;
            return newProgress > 90 ? 90 : newProgress;
          });
        }, 300);
        
        return () => {
          clearTimeout(timer);
          clearInterval(progressTimer);
        };
      }
    } else {
      setVisible(false);
      setProgress(0);
    }
    
    return () => clearTimeout(timer);
  }, [isLoading, variant]);
  
  if (!isLoading && !visible) return null;
  
  // Configuración de colores
  const colorConfig = {
    orange: {
      primary: "text-orange-500",
      bg: "bg-orange-500",
      border: "border-orange-500",
      gradient: "from-orange-400 to-orange-600",
      ring: "ring-orange-500/20"
    },
    blue: {
      primary: "text-blue-500",
      bg: "bg-blue-500", 
      border: "border-blue-500",
      gradient: "from-blue-400 to-blue-600",
      ring: "ring-blue-500/20"
    },
    green: {
      primary: "text-green-500",
      bg: "bg-green-500",
      border: "border-green-500", 
      gradient: "from-green-400 to-green-600",
      ring: "ring-green-500/20"
    },
    purple: {
      primary: "text-purple-500",
      bg: "bg-purple-500",
      border: "border-purple-500",
      gradient: "from-purple-400 to-purple-600", 
      ring: "ring-purple-500/20"
    },
    gradient: {
      primary: "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600",
      bg: "bg-gradient-to-r from-purple-400 to-pink-600",
      border: "border-purple-500",
      gradient: "from-purple-400 via-pink-500 to-red-500",
      ring: "ring-purple-500/20"
    }
  };
  
  // Configuración de tamaños
  const sizeConfig = {
    small: {
      spinner: "text-2xl",
      container: "p-4",
      message: "text-sm"
    },
    normal: {
      spinner: "text-4xl",
      container: "p-6", 
      message: "text-base"
    },
    large: {
      spinner: "text-6xl",
      container: "p-8",
      message: "text-lg"
    }
  };
  
  const colors = colorConfig[color] || colorConfig.orange;
  const sizes = sizeConfig[size] || sizeConfig.normal;
  
  // Variantes de spinner
  const SpinnerVariants = {
    modern: () => (
      <div className="relative">
        {/* Anillo exterior con gradiente */}
        <div className={`absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r ${colors.gradient} opacity-20 animate-spin`}></div>
        <div className={`absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r ${colors.gradient} opacity-40`}
             style={{
               background: `conic-gradient(from 90deg, transparent, ${color === 'gradient' ? '#8b5cf6' : colors.bg.replace('bg-', '')})`,
               borderRadius: '50%',
               animation: 'spin 1s linear infinite'
             }}>
        </div>
        {/* Icono central */}
        <div className={`relative z-10 ${colors.primary} ${sizes.spinner} animate-pulse`}>
          <div className="w-full h-full rounded-full bg-white shadow-lg flex items-center justify-center">
            <FaSpinner className={`${colors.primary} animate-spin`} />
          </div>
        </div>
      </div>
    ),
    
    minimal: () => (
      <div className={`${colors.primary} ${sizes.spinner}`}>
        <FaSpinner className="animate-spin" />
      </div>
    ),
    
    pulse: () => (
      <div className="relative">
        {/* Ondas de pulso */}
        <div className={`absolute inset-0 ${colors.bg} rounded-full animate-ping opacity-75`}></div>
        <div className={`absolute inset-0 ${colors.bg} rounded-full animate-ping opacity-50 animation-delay-300`}></div>
        <div className={`relative ${colors.bg} rounded-full p-4 animate-pulse`}>
          <FaHeart className={`text-white ${sizes.spinner}`} />
        </div>
      </div>
    ),
    
    dots: () => (
      <div className="flex space-x-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`w-3 h-3 ${colors.bg} rounded-full animate-bounce`}
            style={{ animationDelay: `${i * 0.1}s` }}
          ></div>
        ))}
      </div>
    ),
    
    gear: () => (
      <div className="relative flex items-center justify-center">
        {/* Engranaje grande */}
        <FaCog className={`${colors.primary} text-5xl animate-spin`} style={{ animationDuration: '3s' }} />
        {/* Engranaje pequeño */}
        <FaCog 
          className={`${colors.primary} text-2xl animate-spin absolute top-0 right-0 transform translate-x-2 -translate-y-2`} 
          style={{ animationDuration: '2s', animationDirection: 'reverse' }} 
        />
      </div>
    ),
    
    progress: () => (
      <div className="w-64">
        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className={`${colors.bg} h-2 rounded-full transition-all duration-300 ease-out`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        {/* Spinner circular */}
        <div className="flex justify-center">
          <FaSpinner className={`${colors.primary} ${sizes.spinner} animate-spin`} />
        </div>
      </div>
    )
  };
  
  const CurrentSpinner = SpinnerVariants[variant] || SpinnerVariants.modern;
  
  // Contenedor base
  const Container = ({ children }) => {
    if (!overlay) {
      return (
        <div className={`flex flex-col items-center ${sizes.container}`}>
          {children}
        </div>
      );
    }
    
    return (
      <div className={`fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className={`bg-white/95 backdrop-blur-md ${sizes.container} rounded-2xl shadow-2xl border border-white/20 flex flex-col items-center transform transition-all duration-500 ${
          visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        } ${colors.ring} ring-8`}>
          {children}
        </div>
      </div>
    );
  };
  
  return (
    <Container>
      {/* Spinner */}
      <div className="mb-6">
        <CurrentSpinner />
      </div>
      
      {/* Mensaje */}
      <div className="text-center space-y-3">
        <p className={`text-gray-800 font-semibold ${sizes.message} ${colors.primary}`}>
          {message}
        </p>
        
        {/* Indicador de progreso para variante progress */}
        {variant === "progress" && (
          <p className="text-gray-500 text-sm">
            {Math.round(progress)}% completado
          </p>
        )}
        
        {/* Puntos animados decorativos */}
        {variant !== "dots" && variant !== "progress" && (
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 ${colors.bg} rounded-full animate-bounce`}
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
        )}
      </div>
      
      {/* Efecto de brillo opcional */}
      {variant === "modern" && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
      )}
    </Container>
  );
};

export default Loading;

/* 
=== EJEMPLOS DE USO ===

// Básico
<Loading isLoading={true} message="Cargando datos..." />

// Variante moderna con color azul
<Loading 
  isLoading={true} 
  message="Procesando información..." 
  variant="modern"
  color="blue"
  size="large"
/>

// Variante minimalista sin overlay
<Loading 
  isLoading={true} 
  message="Guardando..." 
  variant="minimal"
  color="green"
  overlay={false}
/>

// Variante con puntos
<Loading 
  isLoading={true} 
  message="Sincronizando..." 
  variant="dots"
  color="purple"
/>

// Variante con engranajes
<Loading 
  isLoading={true} 
  message="Procesando datos..." 
  variant="gear"
  color="orange"
/>

// Variante con barra de progreso
<Loading 
  isLoading={true} 
  message="Cargando archivos..." 
  variant="progress"
  color="gradient"
/>

=== ESTILOS CSS ADICIONALES (opcional) ===
Agregar al CSS global para animaciones personalizadas:

@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animation-delay-300 {
  animation-delay: 300ms;
}

*/