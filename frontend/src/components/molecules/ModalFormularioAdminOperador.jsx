import React from 'react';
import {
    FaSave,
    FaTimes,
    FaSpinner,
    FaUserPlus,
    FaUserEdit,
    FaIdCard,
    FaEnvelope,
    FaBuilding,
    FaLock
} from 'react-icons/fa';

const ModalFormularioAdminOperador = ({
    // Props de control del modal
    isOpen,
    onClose,
    
    // Props del formulario
    modoEdicion,
    formData,
    erroresValidacion,
    faenas,
    loading,
    
    // Handlers
    handleInputChange,
    handleGuardarUsuario,
    mostrarErrorCampo
}) => {
    // Si el modal no está abierto, no renderizar nada
    if (!isOpen) return null;

    // Prevenir el cierre del modal al hacer clic dentro del contenido
    const handleModalContentClick = (e) => {
        e.stopPropagation();
    };

    return (
        <div 
            className="fixed inset-0 z-50 overflow-y-auto"
            onClick={onClose}
        >
            {/* Overlay oscuro con animación */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300" />
            
            {/* Contenedor del modal */}
            <div className="flex min-h-screen items-center justify-center p-4">
                <div 
                    className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-100"
                    onClick={handleModalContentClick}
                >
                    {/* Header del modal */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg">
                        <div className="flex items-center space-x-3">
                            {modoEdicion ? (
                                <FaUserEdit className="text-2xl text-orange-600" />
                            ) : (
                                <FaUserPlus className="text-2xl text-orange-600" />
                            )}
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {modoEdicion ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {modoEdicion 
                                        ? 'Modifica los datos del usuario operador'
                                        : 'Completa la información del nuevo usuario operador'
                                    }
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white rounded-full"
                            disabled={loading}
                        >
                            <FaTimes className="text-xl" />
                        </button>
                    </div>

                    {/* Contenido del modal - Formulario */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleGuardarUsuario();
                        }}
                        className="p-6"
                    >
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Nombre */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaUserPlus className="inline mr-2 text-orange-600" />
                                        Nombre <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleInputChange}
                                        autoComplete="given-name"
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                                            erroresValidacion.nombre
                                                ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-300'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                        placeholder="Ingrese el nombre"
                                        disabled={loading}
                                    />
                                    {mostrarErrorCampo('nombre')}
                                </div>

                                {/* Apellido */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaUserPlus className="inline mr-2 text-orange-600" />
                                        Apellido <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="apellido"
                                        value={formData.apellido}
                                        onChange={handleInputChange}
                                        autoComplete="family-name"
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                                            erroresValidacion.apellido
                                                ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-300'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                        placeholder="Ingrese el apellido"
                                        disabled={loading}
                                    />
                                    {mostrarErrorCampo('apellido')}
                                </div>
                            </div>

                            {/* RUT */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FaIdCard className="inline mr-2 text-orange-600" />
                                    RUT <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="rut"
                                    value={formData.rut}
                                    onChange={handleInputChange}
                                    autoComplete="username"
                                    onKeyDown={(e) => {
                                        if (e.key === "-") e.preventDefault();
                                    }}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                                        erroresValidacion.rut
                                            ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-300'
                                            : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                    placeholder="Ej: 12345678K"
                                    disabled={loading}
                                />
                                {mostrarErrorCampo('rut')}
                                <small className="text-gray-500 text-sm mt-1 block">
                                    Ingrese el RUT sin puntos ni guion. Ej: 12345678K
                                </small>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaEnvelope className="inline mr-2 text-orange-600" />
                                        Email (opcional)
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        autoComplete="email"
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                                            erroresValidacion.email
                                                ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-300'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                        placeholder="usuario@ejemplo.com"
                                        disabled={loading}
                                    />
                                    {mostrarErrorCampo('email')}
                                </div>

                                {/* Faena */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaBuilding className="inline mr-2 text-orange-600" />
                                        Faena <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="id_faena"
                                        value={formData.id_faena}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                                            erroresValidacion.id_faena
                                                ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-300'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                        disabled={loading}
                                    >
                                        <option value="">Seleccione una faena</option>
                                        {faenas.map(faena => (
                                            <option key={faena.id_faena} value={faena.id_faena}>
                                                {faena.ubicacion}
                                            </option>
                                        ))}
                                    </select>
                                    {mostrarErrorCampo('id_faena')}
                                </div>
                            </div>

                            {/* Contraseñas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Contraseña */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaLock className="inline mr-2 text-orange-600" />
                                        {modoEdicion ? 'Nueva Contraseña (opcional)' : 'Contraseña'} 
                                        {!modoEdicion && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        autoComplete={modoEdicion ? "new-password" : "current-password"}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                                            erroresValidacion.password
                                                ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-300'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                        placeholder={modoEdicion ? "Dejar vacío para mantener actual" : "Mínimo 6 caracteres"}
                                        disabled={loading}
                                    />
                                    {mostrarErrorCampo('password')}
                                </div>

                                {/* Confirmar Contraseña */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaLock className="inline mr-2 text-orange-600" />
                                        {modoEdicion ? 'Confirmar Nueva Contraseña' : 'Confirmar Contraseña'}
                                        {(!modoEdicion || formData.password) && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        autoComplete="new-password"
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                                            erroresValidacion.confirmPassword
                                                ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-300'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                        placeholder="Repita la contraseña"
                                        disabled={loading}
                                    />
                                    {mostrarErrorCampo('confirmPassword')}
                                </div>
                            </div>

                            {/* Estado del Usuario */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <input
                                        id="activo"
                                        name="activo"
                                        type="checkbox"
                                        checked={formData.activo}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                        disabled={loading}
                                    />
                                    <label htmlFor="activo" className="ml-3 block text-sm text-gray-900">
                                        <span className="font-medium">Usuario activo</span>
                                        <span className="text-gray-500 block text-xs">
                                            El usuario podrá acceder al sistema cuando esté activo
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Footer con botones */}
                        <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200 font-medium shadow-lg"
                            >
                                {loading ? (
                                    <>
                                        <FaSpinner className="animate-spin" />
                                        {modoEdicion ? 'Actualizando...' : 'Creando...'}
                                    </>
                                ) : (
                                    <>
                                        <FaSave />
                                        {modoEdicion ? 'Actualizar Usuario' : 'Crear Usuario'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ModalFormularioAdminOperador;