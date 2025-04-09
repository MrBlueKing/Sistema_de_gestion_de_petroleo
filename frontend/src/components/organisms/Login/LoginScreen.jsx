import React, { useState } from "react";
import Icon from "../../atoms/Icon3h";
import InputField from "../../atoms/InputField";
import Button from "../../atoms/Button";
import LoadingOverlay from "../../atoms/Loading"; 
import icono from "../../../assets/icono.png";
import { FaUser, FaLock } from "react-icons/fa";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ErrorMessage from "../../atoms/ErrorMessage";

const LoginScreen = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setIsLoading(true); // Start loading

    try {
      // Realizar la solicitud POST a la API de Laravel
      await axios.get('http://localhost:8000/sanctum/csrf-cookie', {
        withCredentials: true,
      });
      
      const response = await axios.post('http://localhost:8000/api/login', {
        rut,
        password,
      }, {
        withCredentials: true,
      });
      // si el login es exitoso, guarda el token en localStorage
      if (response.status === 200) {
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token); // Guarda el token
          localStorage.setItem('tokenTimestamp', Date.now().toString());  // Guardar el tiempo en milisegundos
          navigate('/menuprincipalbombero'); // Redirige después de un login exitoso
        }
      }
      // If login is successful, redirect user
      navigate('/menuprincipalbombero');
    } catch (error) {
      console.error('Error de login:', error);
      setError('Las credenciales ingresadas son incorrectas.'); // Set error message
    } finally {
      setIsLoading(false); // Stop loading regardless of outcome
    }
  };

  return (
    <div className="relative bg-white rounded-lg shadow-md p-8">
      {/* Loading Overlay */}
      <LoadingOverlay isLoading={isLoading} message="Iniciando sesión..." />
      
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <Icon src={icono} alt="3H COOPER" size="w-32 h-40" />
      </div>

      <p className="text-center text-gray-600 mb-6">Accede al sistema</p>

      {/* Error message */}
      <ErrorMessage message={error} />

      {/* Login form */}
      <form onSubmit={handleLogin}>
        {/* RUT field */}
        <InputField
          type="text"
          placeholder="RUT"
          value={rut}
          onChange={(e) => setRut(e.target.value)}
          icon={<FaUser />}
          disabled={isLoading} // Disable inputs during loading
        />

        {/* Password field */}
        <InputField
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          icon={<FaLock />}
          disabled={isLoading} // Disable inputs during loading
        />

        {/* Login button */}
        <Button
          text={isLoading ? "Cargando..." : "Ingresar"}
          color="orange"
          rounded="full"
          className="w-full text-white font-bold py-3 px-4"
          type="submit"
          disabled={isLoading} // Disable button during loading
        />
      </form>
    </div>
  );
};

export default LoginScreen;