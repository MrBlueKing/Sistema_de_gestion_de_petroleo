import React, { useState } from "react";
import Icon from "../atoms/Icon";
import InputField from "../atoms/InputField";
import PasswordField from "../atoms/PasswordField";
import Button from "../atoms/Button";
import icono from "../../assets/icono.png"; // Ruta del icono
import { FaUser } from "react-icons/fa";
import axios from 'axios'; // Importar Axios para hacer solicitudes HTTP
import { useNavigate } from 'react-router-dom'; // Usar useNavigate en lugar de useHistory

const LoginScreen = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rut, setRut] = useState(''); // Estado para el RUT
  const [password, setPassword] = useState(''); // Estado para la contraseña
  const [error, setError] = useState(''); // Estado para capturar el error si la autenticación falla
  const navigate = useNavigate(); // Usar useNavigate para la navegación

  // Función para manejar el envío del formulario
  const handleLogin = async (e) => {
    e.preventDefault();

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
      
      console.log('Login exitoso:', response.data);
      
      // Si el login es exitoso, redirigir al usuario a la página principal (por ejemplo)
      navigate('/dashboard'); // Usar navigate en lugar de history.push()

    } catch (error) {
      console.error('Error de login:', error);
      setError('Credenciales incorrectas o error en la autenticación');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <Icon src={icono} alt="3H COOPER" size="w-32 h-40" />
      </div>

      <p className="text-center text-gray-600 mb-6">Accede al sistema</p>

      {/* Mostrar error si ocurre */}
      {error && <div className="text-red-600 text-center mb-4">{error}</div>}

      {/* Formulario de login */}
      <form onSubmit={handleLogin}>
        {/* RUT field */}
        <InputField
          icon={<FaUser size={18} />}
          type="text"
          placeholder="RUT"
          value={rut} // Controlar el valor del campo
          onChange={(e) => setRut(e.target.value)} // Actualizar el estado
        />

        {/* Password field */}
        <PasswordField
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          value={password} // Controlar el valor de la contraseña
          onChange={(e) => setPassword(e.target.value)} // Actualizar el estado
        />

        {/* Login button */}
        <Button
          text="Ingresar"
          color="orange"
          rounded="full"
          className="w-full text-white font-bold py-3 px-4"
          type="submit" // Cambiar el tipo a "submit" para enviar el formulario
        />
      </form>
    </div>
  );
};

export default LoginScreen;
