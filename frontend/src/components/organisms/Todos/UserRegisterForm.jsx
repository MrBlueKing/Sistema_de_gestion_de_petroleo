import React, { useState } from 'react';
import FormField from '../../molecules/FormField';
import { FaUser, FaLock, FaIdCard } from 'react-icons/fa';

const UserRegisterForm = () => {
  const [form, setForm] = useState({
    rut: '',
    firstName: '',
    lastName: '',
    role: '',
    location: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí podrías agregar una validación de RUT si es necesario
    console.log('Datos enviados:', form);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white rounded shadow">
      {/* Campo de RUT */}
      <FormField
        label="RUT"
        type="text"
        name="rut"
        placeholder="Ingresa tu RUT"
        value={form.rut}  // Asegurándonos de que el valor esté ligado al estado
        onChange={handleChange}
        icon={<FaIdCard />}
      />

      {/* Campo de nombre */}
      <FormField
        label="Nombre"
        type="text"
        name="firstName"
        placeholder="Ingresa tu nombre"
        value={form.firstName}
        onChange={handleChange}
        icon={<FaUser />}
      />

      {/* Campo de apellido */}
      <FormField
        label="Apellido"
        type="text"
        name="lastName"
        placeholder="Ingresa tu apellido"
        value={form.lastName}
        onChange={handleChange}
        icon={<FaUser />}
      />

      {/* Campo de rol */}
      <FormField
        label="Rol"
        type="text"
        name="role"
        placeholder="Selecciona tu rol"
        value={form.role}
        onChange={handleChange}
        options={[
          { label: 'Administrador', value: 'admin' },
          { label: 'Bombero', value: 'bombero' },
          { label: 'Gerente', value: 'gerente' },
        ]}
      />


      {/* Campo de ubicación */}
      <FormField
        label="Ubicación"
        type="text"
        name="location"
        placeholder="Selecciona tu ubicación"
        value={form.location}
        onChange={handleChange}
        options={[
          { label: 'Cabildo', value: 'cabildo' },
          { label: 'Catemu', value: 'catemu' },
          { label: 'Chincolco', value: 'chincolco' },
          { label: 'Tiltil', value: 'tiltil' },
        ]}
      />

      {/* Campo de contraseña */}
      <FormField
        label="Contraseña"
        type="password"
        name="password"
        placeholder="Contraseña segura"
        value={form.password}
        onChange={handleChange}
        icon={<FaLock />}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />

      {/* Botón de registro */}
      <button type="submit" className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md">
        Registrar
      </button>
    </form>
  );
};

export default UserRegisterForm;
