import React, { useState, useRef, useEffect } from "react";
import { FaIdCard, FaUser, FaMapMarkerAlt, FaLock } from "react-icons/fa";
import { IoReload } from "react-icons/io5";
import Header from "../../organisms/Administrador/Header";
import InputField from "../../atoms/Inputs/InputField";
import Button from "../../atoms/Button/Button";
import Label from "../../atoms/Typography/Label";
import Alert from "../../atoms/FeedBack/Alert";
import { UserContext } from "../../../context/userContext";


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

  const isValidRutFormat = (rut) => /^[0-9kK]+$/.test(rut);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError({});
    setSuccessMessage("");

    const errors = {};

    if (!rut) {
      errors.rut = "El campo RUT es obligatorio.";
    } else if (!isValidRutFormat(rut)) {
      errors.rut = "El RUT no debe contener puntos, guiones ni espacios.";
    }
    if (!firstName) errors.firstName = "El campo nombre es obligatorio.";
    if (!lastName) errors.lastName = "El campo apellido es obligatorio.";
    if (!role) errors.role = "El campo rol es obligatorio.";
    if (!location) errors.location = "El campo ubicación es obligatorio.";
    if (!password) errors.password = "El campo contraseña es obligatorio.";

    if (Object.keys(errors).length > 0) {
      setError(errors);
      setIsLoading(false);
      return;
    }

    const userData = {
      rut,
      nombre: firstName,
      apellido: lastName,
      id_rol: Number(role),
      id_faena: Number(location),
      password,
    };

    try {
      const response = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Usuario registrado exitosamente.");
        setRut("");
        setFirstName("");
        setLastName("");
        setRole("");
        setLocation("");
        setPassword("");
      } else {
        setError(translateErrorMessages(data.errors || {}));
      }
    } catch (error) {
      setError({ global: "Error de conexión con el servidor." });
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formFields = [
    {
      id: "rut",
      label: "RUT",
      value: rut,
      icon: <FaIdCard />,
      tooltip: "Sin puntos ni guion",
      required: true
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
      tooltip: "Mínimo 8 caracteres",
      required: true,
      type: "password"
    }
  ];

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
              {error && <Alert type="error" message={error} />}
              {successMessage && <Alert type="success" message={successMessage} />}
            </div>
  
            <form onSubmit={handleRegister} className="space-y-4">
              {formFields.map(
                ({ id, label, icon, value, tooltip, required, options, type }) => (
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
                        const updater = {
                          rut: setRut,
                          firstName: setFirstName,
                          lastName: setLastName,
                          role: setRole,
                          location: setLocation,
                          password: setPassword
                        };
                        updater[id](e.target.value);
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
                      className="w-full"
                    />
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
