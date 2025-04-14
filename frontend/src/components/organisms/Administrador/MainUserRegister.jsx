import { FaUser, FaLock, FaIdCard, FaMapMarkerAlt } from "react-icons/fa";
import { useState } from "react";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import Label from "../../atoms/Typography/Label";

export default function Main() {
  const [rut, setRut] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // Para mostrar errores si algo falla

  // Estados para controlar el foco de los campos en LABEL
  const [rutFocused, setRutFocused] = useState(false);
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [roleFocused, setRoleFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Función para manejar el registro del usuario
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const userData = {
      rut,
      nombre: firstName,
      apellido: lastName,
      id_rol: Number(role),     
      id_faena: Number(location), 
      password,
    };

    try {
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // Si la respuesta es exitosa
        console.log("Usuario registrado:", data);
        // Aquí puedes redirigir o mostrar un mensaje de éxito
      } else {
        // Si hay errores en el backend, se los mostramos
        setError(data.errors || 'Error desconocido');
      }
    } catch (error) {
      console.error("Error al registrar el usuario:", error);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Registro de Usuario</h1>
          <p className="text-gray-600">Complete el formulario para crear su cuenta</p>
        </div>
        <div className="bg-white shadow-2xl rounded-lg overflow-hidden p-8 space-y-6">
          <form onSubmit={handleRegister}>
            {/* Campo RUT */}
            <Label 
              label="Ingrese RUT" 
              htmlFor="rut" 
              required={true}
              tooltip="Ingrese RUT sin puntos ni guion (Ej: 123456789)"
              active={rutFocused}
              disabled={isLoading}
            />
            <InputField
              id="rut"
              type="text"
              placeholder="RUT"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              icon={<FaIdCard />}
              disabled={isLoading}
              onFocus={() => setRutFocused(true)}
              onBlur={() => setRutFocused(false)}
            />

            {/* Campo Nombre */}
            <Label 
              label="Ingrese Nombres" 
              htmlFor="firstName"
              required={true}
              active={firstNameFocused}
              disabled={isLoading}
            />
            <InputField
              id="firstName"
              type="text"
              placeholder="Nombres"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              icon={<FaUser />}
              disabled={isLoading}
              onFocus={() => setFirstNameFocused(true)}
              onBlur={() => setFirstNameFocused(false)}
            />

            {/* Campo Apellido */}
            <Label 
              label="Ingrese Apellidos" 
              htmlFor="lastName"
              required={true}
              active={lastNameFocused}
              disabled={isLoading}
            />
            <InputField
              id="lastName"
              type="text"
              placeholder="Apellidos"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              icon={<FaUser />}
              disabled={isLoading}
              onFocus={() => setLastNameFocused(true)}
              onBlur={() => setLastNameFocused(false)}
            />

            {/* Campo Rol */}
            <Label 
              label="Ingrese rol del nuevo usuario" 
              htmlFor="role"
              active={roleFocused}
              disabled={isLoading}
            />
            <InputField
              id="role"
              type="text"
              placeholder="Rol"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              icon={<FaUser />}
              options={[
                { label: 'Administrador', value: 3 },
                { label: 'Bombero', value: 1 },
                { label: 'Gerente', value: 2 },
              ]}
              disabled={isLoading}
              onFocus={() => setRoleFocused(true)}
              onBlur={() => setRoleFocused(false)}
            />

            {/* Campo Ubicación */}
            <Label 
              label="Ingrese ubicación del nuevo usuario" 
              htmlFor="location"
              active={locationFocused}
              disabled={isLoading}
            />
            <InputField
              id="location"
              type="text"
              placeholder="Ubicación"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              icon={<FaMapMarkerAlt />}
              options={[
                { label: 'Cabildo', value: 1 },
                { label: 'Catemu', value: 2},
                { label: 'Chincolco', value: 3 },
                { label: 'Tiltil', value: 4 },
              ]}
              disabled={isLoading}
              onFocus={() => setLocationFocused(true)}
              onBlur={() => setLocationFocused(false)}
            />

            {/* Campo Contraseña */}
            <Label 
              label="Ingrese contraseña del nuevo usuario" 
              htmlFor="password"
              required={true} 
              tooltip="Mínimo 8 caracteres"
              active={passwordFocused}
              disabled={isLoading}
            />
            <InputField
              id="password"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<FaLock />}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              disabled={isLoading}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />

            {/* Error */}
            {error && (
              <div className="text-red-500 text-sm mt-2">
                {typeof error === 'string' ? error : (
                  <ul>
                    {Object.entries(error).map(([key, value]) => (
                      <li key={key}>{key}: {Array.isArray(value) ? value.join(', ') : value}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}


            {/* Botón de enviar */}
            <Button
              text={isLoading ? "Cargando..." : "Registrar"}
              color="orange"
              rounded="full"
              className="w-full text-white font-bold py-3 px-4 mt-4"
              type="submit"
              disabled={isLoading}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
