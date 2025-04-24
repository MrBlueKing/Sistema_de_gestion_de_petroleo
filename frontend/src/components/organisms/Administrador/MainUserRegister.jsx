import React, { useState, useRef, useEffect } from "react";
import { FaIdCard, FaUser, FaMapMarkerAlt, FaLock } from "react-icons/fa";
import { IoReload } from "react-icons/io5";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import Label from "../../atoms/Typography/Label";
import Alert from "../../atoms/FeedBack/Alert";
import axios from "../../../lib/axios";


const UserRegister = () => {
  const [rut, setRut] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [focusedFields, setFocusedFields] = useState({
    rut: false,
    firstName: false,
    lastName: false,
    role: false,
    location: false,
    password: false
  });

  const alertRef = useRef(null);


  // Auto-desvanecer mensajes
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error && alertRef.current) {
      const offset = 100; // Puedes ajustar este valor para subir más o menos
      const top = alertRef.current.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: "smooth" });
  
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  

  const translateErrorMessages = (errors) => {
    const translations = {
      "The rut field is required.": "El campo RUT es obligatorio.",
      "The firstName field is required.": "El campo nombre es obligatorio.",
      "The lastName field is required.": "El campo apellido es obligatorio.",
      "The role field is required.": "El campo rol es obligatorio.",
      "The location field is required.": "El campo ubicación es obligatorio.",
      "The password field is required.": "El campo contraseña es obligatorio.",
      "The rut has already been taken.": "El RUT ya ha sido registrado.",
      "The password field must be at least 8 characters.": "La contraseña debe tener al menos 8 caracteres.",
      "The id_faena field is required.": "La ubicación es obligatoria.",
      "The selected id rol is invalid.": "El rol seleccionado no es válido.",
    };

    if (typeof errors === "string") {
      return translations[errors] || errors;
    }

    const translated = {};
    for (const key in errors) {
      translated[key] = errors[key].map((msg) => translations[msg] || msg);
    }

    return translated;
  };

  // Validación específica para RUT chileno
  const validateRut = (rut) => {
    // Eliminar cualquier carácter que no sea número o 'k'
    const cleanRut = rut.toLowerCase().replace(/[^0-9k]/g, "");
    
    // Verificar longitud: RUT chileno típicamente tiene entre 7 y 9 dígitos más dígito verificador
    if (cleanRut.length < 8 || cleanRut.length > 10) {
      return "El RUT debe tener entre 8 y 10 caracteres";
    }
    
    // Verificar que solo tenga un 'k' y que este al final (dígito verificador)
    const kCount = (cleanRut.match(/k/g) || []).length;
    if (kCount > 1 || (kCount === 1 && cleanRut.charAt(cleanRut.length - 1) !== 'k')) {
      return "El formato del RUT no es válido";
    }
    
    return null; // Si no hay errores
  };

  // Validación de seguridad para contraseña
  const validatePassword = (password) => {
    if (password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    
    // Verifica si tiene al menos una letra y un número
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return "La contraseña debe contener al menos una letra y un número";
    }
    
    return null; // Si no hay errores
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null); // Limpiar errores previos
    setSuccessMessage(""); // Limpiar mensajes de éxito previos

    const errors = {};

    // Validaciones de campos
    if (!rut) {
      errors.rut = "El campo RUT es obligatorio.";
    } else {
      const rutError = validateRut(rut);
      if (rutError) errors.rut = rutError;
    }
    
    if (!firstName) errors.firstName = "El campo nombre es obligatorio.";
    if (!lastName) errors.lastName = "El campo apellido es obligatorio.";
    if (!role) errors.role = "El campo rol es obligatorio.";
    if (!location) errors.location = "El campo ubicación es obligatorio.";
    
    if (!password) {
      errors.password = "El campo contraseña es obligatorio.";
    } else {
      const passwordError = validatePassword(password);
      if (passwordError) errors.password = passwordError;
    }

    if (Object.keys(errors).length > 0) {
      setError(errors);
      setIsLoading(false);
      return;
    }

    // Limpieza del RUT antes de enviar al servidor
    const cleanRut = rut.toLowerCase().replace(/[^0-9k]/g, "");

    const userData = {
      rut: cleanRut,
      nombre: firstName,
      apellido: lastName,
      id_rol: Number(role),
      id_faena: Number(location),
      password,
    };

    try {
      const response = await axios.post("http://localhost:8000/api/register", userData, {
        headers: { "Content-Type": "application/json" },
      });
      
      // Limpiar formulario solo en caso de éxito
      setRut("");
      setFirstName("");
      setLastName("");
      setRole("");
      setLocation("");
      setPassword("");
      
      // Mostrar mensaje de éxito
      setSuccessMessage(response.data.message || "Usuario registrado exitosamente.");
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(translateErrorMessages(err.response.data.errors));
      } else if (err.response?.data?.message) {
        setError({ global: translateErrorMessages(err.response.data.message) });
      } else {
        setError({ global: "Error de conexión con el servidor." });
      }      
    } finally {
      setIsLoading(false);
    }
  };

  // Modificar el input de RUT para aplicar formato en tiempo real
  const handleRutChange = (e) => {
    // Solo permitir números y 'k'
    let value = e.target.value.toLowerCase().replace(/[^0-9k]/g, "");
    
    // Limitar a máximo 10 caracteres
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    
    setRut(value);
  };

  const formFields = [
    {
      id: "rut",
      label: "RUT",
      value: rut,
      icon: <FaIdCard />,
      tooltip: "Sin puntos ni guion (ej: 12345678k)",
      required: true,
      customOnChange: handleRutChange
    },
    {
      id: "firstName",
      label: "Nombres",
      value: firstName,
      icon: <FaUser />,
      required: true
    },
    {
      id: "lastName",
      label: "Apellidos",
      value: lastName,
      icon: <FaUser />,
      required: true
    },
    {
      id: "role",
      label: "Rol del Usuario",
      value: role,
      icon: <FaUser />,
      options: [
        { label: "Administrador", value: 3 },
        { label: "Bombero", value: 1 },
        { label: "Gerente", value: 2 }
      ]
    },
    {
      id: "location",
      label: "Ubicación",
      value: location,
      icon: <FaMapMarkerAlt />,
      options: [
        { label: "Cabildo", value: 1 },
        { label: "Catemu", value: 2 },
        { label: "Chincolco", value: 3 },
        { label: "Tiltil", value: 4 }
      ]
    },
    {
      id: "password",
      label: "Contraseña",
      value: password,
      icon: <FaLock />,
      tooltip: "Mínimo 8 caracteres, incluir letras y números",
      required: true,
      type: "password"
    }
  ];

  // Renderizar mensajes de error específicos para cada campo
  const getFieldError = (fieldId) => {
    if (!error || typeof error !== 'object') return null;
    return error[fieldId];
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <main className="flex-1 w-full p-2 sm:p-3 md:p-4">
        <div className="bg-white shadow-lg  overflow-hidden max-w-4xl mx-auto w-full">
          {/* Encabezado naranja */}
          <div className="bg-orange-400 px-6 py-4 text-left">
            <h1 className="text-white text-2xl font-bold">Gestión de Usuarios</h1>
            <p className="text-white text-sm">
              Creación de nueva cuenta de usuario
            </p>
          </div>

          {/* Contenido del formulario */}
          <div className="p-6">
            <div ref={alertRef} className="mb-4">
              {error && error.global && (
                <Alert type="error" message={error.global} />
              )}
              {successMessage && (
                <Alert type="success" message={successMessage} />
              )}
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {formFields.map(
                ({ id, label, icon, value, tooltip, required, options, type, customOnChange }) => (
                  <div key={id} className="mb-1">
                    <Label
                      htmlFor={id}
                      label={label}
                      required={required}
                      tooltip={tooltip}
                      active={focusedFields[id]}
                      disabled={isLoading}
                    />
                    <InputField
                      id={id}
                      type={type || "text"}
                      placeholder={`Ingrese ${label.toLowerCase()}`}
                      value={value}
                      onChange={(e) => {
                        if (customOnChange) {
                          customOnChange(e);
                        } else {
                          const updater = {
                            rut: setRut,
                            firstName: setFirstName,
                            lastName: setLastName,
                            role: setRole,
                            location: setLocation,
                            password: setPassword
                          };
                          updater[id](e.target.value);
                        }
                      }}
                      icon={icon}
                      options={options}
                      disabled={isLoading}
                      showPassword={id === "password" ? showPassword : undefined}
                      setShowPassword={id === "password" ? setShowPassword : undefined}
                      onFocus={() =>
                        setFocusedFields({ ...focusedFields, [id]: true })
                      }
                      onBlur={() =>
                        setFocusedFields({ ...focusedFields, [id]: false })
                      }
                      className={`w-full ${getFieldError(id) ? 'border-red-500' : ''}`}
                    />
                    {getFieldError(id) && (
                      <div className="text-red-500 text-xs mt-1 text-left">{getFieldError(id)}</div>
                    )}
                  </div>
                )
              )}

              <div className="mt-6 pt-4 border-t border-gray-100">
                <Button
                  text={
                    isLoading ? (
                      <span className="flex justify-center items-center gap-2">
                        <IoReload className="animate-spin" />
                        Procesando...
                      </span>
                    ) : (
                      "Registrar Usuario"
                    )
                  }
                  color="orange"
                  rounded="md"
                  className="w-full text-white font-medium py-2.5 px-4"
                  type="submit"
                  disabled={isLoading}
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 text-center text-xs text-gray-500">
            Sistema de Gestión de Combustible • {new Date().getFullYear()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserRegister;