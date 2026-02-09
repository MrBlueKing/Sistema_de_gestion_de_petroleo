import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Home from "../components/templates/Home";
import authCentralizadoService from "../services/authCentralizado";
import { isSessionValid } from "../utils/session";

const HomePage = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Verificar si hay parámetros de autenticación centralizada
    const params = authCentralizadoService.checkUrlParams();

    if (params) {
      // Si viene con token, procesar login centralizado
      console.log('🔐 Detectado login centralizado, redirigiendo...');
      navigate('/auth/centralizado' + window.location.search);
      return;
    }

    // Si NO hay token en URL, verificar si hay sesión válida
    if (!isSessionValid()) {
      // NO hay sesión válida → Redirigir INMEDIATAMENTE al sistema centralizado
      console.log('🔒 Sin sesión válida, redirigiendo a sistema centralizado...');
      const centralizadoUrl = authCentralizadoService.getCentralSystemUrl();
      window.location.href = centralizadoUrl;
      return;
    }

    // Hay sesión válida, mostrar Home
    setChecking(false);
  }, [navigate]);

  // Mientras verifica, no mostrar nada (evita parpadeo)
  if (checking) {
    return null;
  }

  return (
    <div>
      <Home />
    </div>
  );
};

export default HomePage;
