import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Icon from "../../atoms/Icons/Icon3h";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import LoadingOverlay from "../../atoms/FeedBack/Loading";
import ErrorMessage from "../../atoms/FeedBack/ErrorMessage";
import icono from "../../../assets/icono.png";
import { FaUser, FaLock } from "react-icons/fa";

const LoginScreen = () => {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const storeSession = ({ token, user }) => {
    const expiration = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
    const sessionData = {
      token,
      user,
      expiration,
      role: user.rol || 'desconocido', // Asegúrate de que el rol esté bien almacenado
    };
    localStorage.setItem('authToken', JSON.stringify(sessionData));
  };

  const redirectByRole = (rol) => {
    switch (rol) {
      case 'admin':
        navigate('/administrador');
        break;
      case 'bombero':
        navigate('/bombero');
        break;
      case 'gerente':
        navigate('/gerente');
        break;
      default:
        navigate('/'); // fallback si el rol no es conocido
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });

      const response = await axios.post('http://localhost:8000/api/login', { rut, password }, { withCredentials: true });
      console.log("Login response:", response.data);
      if (response.status === 200 && response.data.token && response.data.user) {
        storeSession({
          token: response.data.token,
          user: response.data.user,
        });
        const userRole = response.data.user.rol || 'desconocido'; // Asegúrate de que el rol esté en la respuesta
        redirectByRole(userRole);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('RUT o contraseña incorrectos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative bg-white rounded-lg shadow-md p-8">
      <LoadingOverlay isLoading={isLoading} message="Iniciando sesión..." />

      <div className="flex justify-center mb-6">
        <Icon src={icono} alt="3H COOPER" size="w-32 h-40" />
      </div>

      <p className="text-center text-gray-600 mb-6">Accede al sistema</p>

      <ErrorMessage message={error} />

      <form onSubmit={handleLogin}>
        <InputField
          type="text"
          placeholder="RUT"
          value={rut}
          onChange={(e) => setRut(e.target.value)}
          icon={<FaUser />}
          disabled={isLoading}
        />
        <InputField
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<FaLock />}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          disabled={isLoading}
        />
        <Button
          text={isLoading ? "Cargando..." : "Ingresar"}
          color="orange"
          rounded="full"
          className="w-full text-white font-bold py-3 px-4"
          type="submit"
          disabled={isLoading}
        />
      </form>
    </div>
  );
};

export default LoginScreen;
