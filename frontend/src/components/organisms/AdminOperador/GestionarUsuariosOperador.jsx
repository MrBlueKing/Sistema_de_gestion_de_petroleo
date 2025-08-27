import React, { useState, useEffect } from 'react';
import {
    FaUsers,
    FaUserPlus,
    FaUserCog,
    FaUserTimes,
    FaPlus,
    FaSave,
    FaTimes,
    FaEdit,
    FaTrash,
    FaEye,
    FaCheck,
    FaExclamationTriangle,
    FaSpinner,
    FaBuilding,
    FaIdCard,
    FaEnvelope,
    FaPhone,
    FaCalendarAlt,
    FaShieldAlt,
    FaSearch,
    FaFilter,
    FaUserCheck,
    FaUserSlash
} from 'react-icons/fa';
import axios from '../../../lib/axios';

// Importar el layout base y sus componentes
import AdminLayoutBase, {
    MetricsSection,
    MetricCard,
    AdditionalSection,
    TableSection
} from './AdminLayoutBase';

// Importar componentes nuevos
import SuccessModal from '../../molecules/SuccessModalAdminOperador';
import PageControl from '../../molecules/PageControl';

// Configuración de paginación
const ITEMS_PER_PAGE = 10;

const GestionarUsuariosOperador = () => {
    // Estados principales
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [mostrarDetalle, setMostrarDetalle] = useState(false);
    const [usuarioDetalle, setUsuarioDetalle] = useState(null);

    // Estados para modal de éxito
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successUserData, setSuccessUserData] = useState(null);
    const [successType, setSuccessType] = useState('create'); // 'create' o 'update'

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Estados para filtros y búsqueda
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroFaena, setFiltroFaena] = useState('todas');
    const [filtroEstado, setFiltroEstado] = useState('todos');

    // Estados para datos
    const [usuarios, setUsuarios] = useState([]);
    const [faenas, setFaenas] = useState([]);
    const [estadisticas, setEstadisticas] = useState({
        total_usuarios: 0,
        usuarios_activos: 0,
        usuarios_inactivos: 0,
        operadores: 0,
        por_faena: {}
    });

    // Estados para el formulario
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        rut: '',
        email: '',
        telefono: '',
        rol: 'OperadorVehiculo', // 🔥 Rol fijo para operadores
        id_faena: '',
        password: '',
        confirmPassword: '',
        activo: true
    });

    // Estados para validación
    const [erroresValidacion, setErroresValidacion] = useState({});

    // ⚡ Cargar datos iniciales
    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    // 🔄 Auto-limpiar mensajes
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // 📊 Cargar datos iniciales desde backend
    const cargarDatosIniciales = async () => {
        try {
            setLoading(true);
            console.log('📊 Cargando datos iniciales...');

            // 🔥 Cargar datos en paralelo
            const [usuariosResponse, faenasResponse] = await Promise.all([
                axios.get('/api/adminOperador/usuarios', {
                    params: {
                        rol: 'OperadorVehiculo' // 🎯 Solo operadores de vehículo
                    }
                }),
                axios.get('/api/faenas')
            ]);

            console.log('✅ Usuarios cargados:', usuariosResponse.data);
            console.log('✅ Faenas cargadas:', faenasResponse.data);

            // Procesar usuarios
            if (usuariosResponse.data.status === 'success') {
                const usuarios = usuariosResponse.data.data.usuarios || [];

                // 🔥 FILTRO ADICIONAL: Solo mostrar OperadorVehiculo (ID 6)
                const operadoresVehiculo = usuarios.filter(u => u.rol === 'OperadorVehiculo' || u.id_rol === 6);

                setUsuarios(operadoresVehiculo);

                // Actualizar estadísticas
                const activos = operadoresVehiculo.filter(u => u.activo).length;
                const inactivos = operadoresVehiculo.filter(u => !u.activo).length;

                setEstadisticas({
                    total_usuarios: operadoresVehiculo.length,
                    usuarios_activos: activos,
                    usuarios_inactivos: inactivos,
                    operadores: operadoresVehiculo.length,
                    por_faena: {}
                });
            }

            // 🔥 CORREGIR: Procesar faenas según tu estructura real
            if (faenasResponse.data?.success && faenasResponse.data?.data) {
                const faenasData = faenasResponse.data.data || [];
                console.log('📋 Faenas procesadas:', faenasData);
                setFaenas(faenasData);
            } else {
                // Fallback si no hay datos
                console.warn('⚠️ No se encontraron faenas en la respuesta');
                console.log('🔍 Estructura completa de respuesta faenas:', faenasResponse);
                setFaenas([]);
            }

        } catch (error) {
            console.error('❌ Error al cargar datos:', error);
            console.log('🔍 Error details:', error.response?.data);
            setMessage({
                tipo: 'error',
                texto: 'Error al cargar los datos de usuarios'
            });
        } finally {
            setLoading(false);
        }
    };

    // 🔍 Filtrar usuarios
    const usuariosFiltrados = usuarios.filter(usuario => {
        const matchSearch = !searchTerm ||
            usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            usuario.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
            usuario.rut.includes(searchTerm) ||
            (usuario.email && usuario.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchFaena = filtroFaena === 'todas' || usuario.id_faena?.toString() === filtroFaena;
        const matchEstado = filtroEstado === 'todos' ||
            (filtroEstado === 'activos' && usuario.activo) ||
            (filtroEstado === 'inactivos' && !usuario.activo);

        return matchSearch && matchFaena && matchEstado;
    });

    // 📄 Paginación de usuarios
    const totalUsuarios = usuariosFiltrados.length;
    const totalPaginasCalculadas = Math.ceil(totalUsuarios / ITEMS_PER_PAGE);
    const usuariosPaginados = usuariosFiltrados.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Actualizar total de páginas cuando cambien los filtros
    useEffect(() => {
        setTotalPages(totalPaginasCalculadas);
        if (currentPage > totalPaginasCalculadas && totalPaginasCalculadas > 0) {
            setCurrentPage(1);
        }
    }, [totalPaginasCalculadas, currentPage]);

    // 📄 Función para cambiar de página
    const handlePageChange = (page) => {
        setCurrentPage(page);
        // Scroll hacia arriba al cambiar página
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 🎨 Función para obtener badge de estado
    const getEstadoBadge = (activo) => {
        return activo ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <FaUserCheck className="w-3 h-3 mr-1" />
                Activo
            </span>
        ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <FaUserSlash className="w-3 h-3 mr-1" />
                Inactivo
            </span>
        );
    };

    // 🎯 Función CORREGIDA para limpiar errores cuando el usuario escribe
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));

        // 🔥 LIMPIAR ERROR ESPECÍFICO cuando el usuario empiece a escribir
        if (erroresValidacion[name]) {
            setErroresValidacion(prev => {
                const nuevosErrores = { ...prev };
                delete nuevosErrores[name];
                return nuevosErrores;
            });
        }

        // También limpiar mensaje general si había error
        if (message?.tipo === 'error') {
            setMessage(null);
        }
    };

    // ✅ Validar formulario
    const validarFormulario = () => {
        const errores = {};

        // Validar nombre
        if (!formData.nombre.trim()) {
            errores.nombre = 'El nombre es requerido';
        }

        // Validar apellido
        if (!formData.apellido.trim()) {
            errores.apellido = 'El apellido es requerido';
        }

        // Validar RUT
        if (!formData.rut.trim()) {
            errores.rut = 'El RUT es requerido';
        } else if (!/^[0-9]+-[0-9kK]{1}$/.test(formData.rut.trim())) {
            errores.rut = 'Formato de RUT inválido (ej: 12345678-9)';
        }

        // Validar email (opcional)
        if (formData.email && formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
            errores.email = 'Email inválido';
        }

        // Validar faena
        if (!formData.id_faena) {
            errores.id_faena = 'Seleccione una faena';
        }

        // Validar contraseña (solo para usuarios nuevos)
        if (!modoEdicion) {
            if (!formData.password) {
                errores.password = 'La contraseña es requerida';
            } else if (formData.password.length < 6) {
                errores.password = 'La contraseña debe tener al menos 6 caracteres';
            }

            if (!formData.confirmPassword) {
                errores.confirmPassword = 'Confirme la contraseña';
            } else if (formData.password !== formData.confirmPassword) {
                errores.confirmPassword = 'Las contraseñas no coinciden';
            }
        } else if (formData.password) {
            // Si es edición y se proporcionó contraseña, validarla
            if (formData.password.length < 6) {
                errores.password = 'La contraseña debe tener al menos 6 caracteres';
            }
            if (formData.password !== formData.confirmPassword) {
                errores.confirmPassword = 'Las contraseñas no coinciden';
            }
        }

        setErroresValidacion(errores);
        return Object.keys(errores).length === 0;
    };

    // 💾 Función para guardar usuario - MEJORADA para manejar RUT duplicado
    const handleGuardarUsuario = async () => {
        try {
            // ✅ Validar formulario
            if (!validarFormulario()) {
                return;
            }

            setLoading(true);

            // Limpiar errores previos antes de enviar
            setErroresValidacion({});
            setMessage(null);

            console.log('💾 Guardando usuario:', { modoEdicion, formData });

            // 🔥 DATOS A ENVIAR - Solo lo necesario para OperadorVehiculo
            const datosEnvio = {
                nombre: formData.nombre.trim(),
                apellido: formData.apellido.trim(),
                rut: formData.rut.trim(),
                email: formData.email ? formData.email.trim() : null,
                rol: 'OperadorVehiculo', // 🎯 Siempre será OperadorVehiculo
                id_faena: parseInt(formData.id_faena),
                password: formData.password,
                activo: formData.activo
            };

            let response;
            if (modoEdicion) {
                // Actualizar usuario existente
                response = await axios.put(`/api/adminOperador/usuarios/${usuarioEditando.id}`, datosEnvio);
            } else {
                // Crear nuevo usuario
                response = await axios.post('/api/adminOperador/usuarios', datosEnvio);
            }

            console.log('✅ Respuesta del servidor:', response.data);

            if (response.data.status === 'success') {
                // 🎉 Mostrar modal de éxito en lugar de mensaje
                setSuccessUserData(response.data.data);
                setSuccessType(modoEdicion ? 'update' : 'create');
                setShowSuccessModal(true);

                // 🔄 Recargar datos y cerrar modal
                await cargarDatosIniciales();
                handleCerrarModal();
            } else {
                throw new Error(response.data.message || 'Error desconocido');
            }

        } catch (error) {
            console.log('❌ Error al guardar usuario:', error);

            // 🎯 MANEJO ESPECÍFICO DE ERROR 422 (Validación)
            if (error.response?.status === 422) {
                const erroresBackend = error.response.data?.errors || {};

                // 🔥 TRADUCIR ERRORES ESPECÍFICOS
                const erroresTraducidos = {};

                Object.keys(erroresBackend).forEach(campo => {
                    const mensajesError = erroresBackend[campo];

                    if (Array.isArray(mensajesError)) {
                        erroresTraducidos[campo] = mensajesError.map(mensaje => {
                            // Traducir mensajes específicos
                            switch (mensaje) {
                                case 'Este RUT ya está registrado':
                                case 'The rut has already been taken.':
                                    return 'Este RUT ya está registrado en el sistema';

                                case 'Este email ya está registrado':
                                case 'The email has already been taken.':
                                    return 'Este email ya está registrado en el sistema';

                                case 'El RUT es requerido':
                                case 'The rut field is required.':
                                    return 'El RUT es obligatorio';

                                case 'La contraseña es requerida':
                                case 'The password field is required.':
                                    return 'La contraseña es obligatoria';

                                case 'La contraseña debe tener al menos 6 caracteres':
                                case 'The password field must be at least 6 characters.':
                                    return 'La contraseña debe tener mínimo 6 caracteres';

                                default:
                                    return mensaje;
                            }
                        });
                    } else {
                        erroresTraducidos[campo] = [mensajesError];
                    }
                });

                // Mostrar errores específicos en cada campo
                setErroresValidacion(erroresTraducidos);

                // Mensaje general más amigable
                if (erroresTraducidos.rut && erroresTraducidos.rut.some(msg => msg.includes('ya está registrado'))) {
                    setMessage({
                        tipo: 'error',
                        texto: '⚠️ El RUT ingresado ya pertenece a otro usuario registrado'
                    });
                } else if (erroresTraducidos.email && erroresTraducidos.email.some(msg => msg.includes('ya está registrado'))) {
                    setMessage({
                        tipo: 'error',
                        texto: '⚠️ El email ingresado ya pertenece a otro usuario registrado'
                    });
                } else {
                    setMessage({
                        tipo: 'error',
                        texto: 'Por favor, corrija los errores señalados en el formulario'
                    });
                }

            } else if (error.response?.status === 500) {
                // Error del servidor
                setMessage({
                    tipo: 'error',
                    texto: 'Error interno del servidor. Intente nuevamente.'
                });

            } else {
                // Otros errores
                setMessage({
                    tipo: 'error',
                    texto: error.response?.data?.message || error.message || 'Error al guardar usuario'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // 🎨 Función para mostrar errores en los campos del formulario
    const mostrarErrorCampo = (campo) => {
        if (erroresValidacion[campo]) {
            const errores = Array.isArray(erroresValidacion[campo])
                ? erroresValidacion[campo]
                : [erroresValidacion[campo]];

            return (
                <div className="mt-1">
                    {errores.map((error, index) => (
                        <p key={index} className="text-sm text-red-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // 🎨 Componente para mostrar mensajes mejorado
    const MensajeAlerta = ({ message, onClose }) => {
        if (!message) return null;

        const esError = message.tipo === 'error';
        const esExito = message.tipo === 'success';

        return (
            <div className={`p-4 rounded-lg mb-6 flex items-start justify-between ${esExito
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                        {esExito ? (
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium">
                            {message.texto}
                        </p>
                    </div>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-opacity"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>
        );
    };

    // 🧹 Resetear datos del formulario
    const resetFormData = () => {
        setFormData({
            nombre: '',
            apellido: '',
            rut: '',
            email: '',
            telefono: '',
            rol: 'OperadorVehiculo',
            id_faena: '',
            password: '',
            confirmPassword: '',
            activo: true
        });
        setErroresValidacion({});
    };

    // 🔚 Cerrar modal/formulario
    const handleCerrarModal = () => {
        setMostrarFormulario(false);
        setModoEdicion(false);
        setUsuarioEditando(null);
        resetFormData();
    };

    // ✏️ Editar usuario
    const handleEditarUsuario = (usuario) => {
        console.log('✏️ Editando usuario:', usuario);

        setFormData({
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            rut: usuario.rut,
            email: usuario.email || '',
            telefono: usuario.telefono || '',
            rol: 'OperadorVehiculo',
            id_faena: usuario.id_faena?.toString() || '',
            password: '',
            confirmPassword: '',
            activo: usuario.activo
        });
        setModoEdicion(true);
        setUsuarioEditando(usuario);
        setMostrarFormulario(true);
        setMostrarDetalle(false);
        setErroresValidacion({});
    };

    // 👁️ Ver detalle del usuario - SIN RECARGAR LA LISTA
    const handleVerDetalle = (usuario) => {
        console.log('👁️ Viendo detalles de:', usuario);
        setUsuarioDetalle(usuario);
        setMostrarDetalle(true);
        // NO recargamos la lista aquí
    };

    // 🔄 Toggle estado del usuario
    const handleToggleEstadoUsuario = async (usuario) => {
        const accion = usuario.activo ? 'desactivar' : 'activar';

        if (!confirm(`¿Está seguro de que desea ${accion} a ${usuario.nombre} ${usuario.apellido}?`)) {
            return;
        }

        try {
            setLoading(true);
            console.log(`🔄 ${accion} usuario:`, usuario.id);

            const response = await axios.patch(`/api/adminOperador/usuarios/${usuario.id}/toggle-estado`);

            if (response.data.status === 'success') {
                setMessage({
                    tipo: 'success',
                    texto: response.data.message
                });

                // Actualizar el usuario en la lista local
                setUsuarios(prev => prev.map(u =>
                    u.id === usuario.id
                        ? { ...u, activo: !u.activo }
                        : u
                ));
            }
        } catch (error) {
            console.error('❌ Error al cambiar estado:', error);
            setMessage({
                tipo: 'error',
                texto: error.response?.data?.message || `Error al ${accion} usuario`
            });
        } finally {
            setLoading(false);
        }
    };

    // 🗑️ Eliminar usuario
    const handleEliminarUsuario = async (usuario) => {
        if (!confirm(`¿Está seguro de que desea ELIMINAR permanentemente a ${usuario.nombre} ${usuario.apellido}?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            setLoading(true);
            console.log('🗑️ Eliminando usuario:', usuario.id);

            const response = await axios.delete(`/api/adminOperador/usuarios/${usuario.id}`);

            if (response.data.status === 'success') {
                setMessage({
                    tipo: 'success',
                    texto: response.data.message
                });

                // Recargar datos
                await cargarDatosIniciales();
            }
        } catch (error) {
            console.error('❌ Error al eliminar usuario:', error);
            setMessage({
                tipo: 'error',
                texto: error.response?.data?.message || 'Error al eliminar usuario'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayoutBase>
            {/* 🎯 Header con título y botón de acción */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <FaUsers className="text-orange-600" />
                        Gestión de Usuarios Operadores
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Administra los usuarios operadores del sistema
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetFormData();
                        setMostrarFormulario(true);
                        setModoEdicion(false);
                        setUsuarioEditando(null);
                    }}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700 transition-colors"
                    disabled={loading}
                >
                    <FaUserPlus />
                    Nuevo Usuario
                </button>
            </div>

            {/* 🚨 Mensajes de estado */}
            <MensajeAlerta
                message={message}
                onClose={() => setMessage(null)}
            />

            {/* 📊 Métricas principales */}
            <MetricsSection>
                <MetricCard
                    title="Total Usuarios"
                    value={estadisticas.total_usuarios}
                    icon={FaUsers}
                    color="orange"
                />
                <MetricCard
                    title="Usuarios Activos"
                    value={estadisticas.usuarios_activos}
                    icon={FaUserCheck}
                    color="green"
                />
                <MetricCard
                    title="Usuarios Inactivos"
                    value={estadisticas.usuarios_inactivos}
                    icon={FaUserSlash}
                    color="red"
                />
                <MetricCard
                    title="Operadores"
                    value={estadisticas.operadores}
                    icon={FaUserCog}
                    color="purple"
                />
            </MetricsSection>

            {/* 🔍 Filtros y búsqueda */}
            <AdditionalSection title="Filtros y Búsqueda">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Búsqueda por texto */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Buscar Usuario
                        </label>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Nombre, RUT, email..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Filtro por faena */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filtrar por Faena
                        </label>
                        <select
                            value={filtroFaena}
                            onChange={(e) => setFiltroFaena(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                            <option value="todas">Todas las faenas</option>
                            {faenas.map(faena => (
                                <option key={faena.id_faena} value={faena.id_faena.toString()}>
                                    {faena.ubicacion}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro por estado */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filtrar por Estado
                        </label>
                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                            <option value="todos">Todos los estados</option>
                            <option value="activos">Solo activos</option>
                            <option value="inactivos">Solo inactivos</option>
                        </select>
                    </div>

                    {/* Botón limpiar filtros */}
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFiltroFaena('todas');
                                setFiltroEstado('todos');
                                setCurrentPage(1); // Resetear paginación
                            }}
                            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <FaFilter />
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            </AdditionalSection>

            {/* 📝 Formulario de usuario */}
            {mostrarFormulario && (
                <AdditionalSection
                    title={modoEdicion ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleGuardarUsuario();
                        }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    autoComplete="given-name"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${erroresValidacion.nombre
                                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-300'
                                        : 'border-gray-300'
                                        }`}
                                    placeholder="Ingrese el nombre"
                                />
                                {mostrarErrorCampo('nombre')}
                            </div>

                            {/* Apellido */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Apellido <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="apellido"
                                    value={formData.apellido}
                                    onChange={handleInputChange}
                                    autoComplete="family-name"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${erroresValidacion.apellido
                                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-300'
                                        : 'border-gray-300'
                                        }`}
                                    placeholder="Ingrese el apellido"
                                />
                                {mostrarErrorCampo('apellido')}
                            </div>

                            {/* RUT */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    RUT <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="rut"
                                    value={formData.rut}
                                    onChange={handleInputChange}
                                    autoComplete="username"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${erroresValidacion.rut
                                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-300'
                                        : 'border-gray-300'
                                        }`}
                                    placeholder="Ej: 12345678-9"
                                />
                                {mostrarErrorCampo('rut')}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email (opcional)
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    autoComplete="email"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${erroresValidacion.email
                                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-300'
                                        : 'border-gray-300'
                                        }`}
                                    placeholder="usuario@ejemplo.com"
                                />
                                {mostrarErrorCampo('email')}
                            </div>

                            {/* Faena */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Faena <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="id_faena"
                                    value={formData.id_faena}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${erroresValidacion.id_faena
                                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-300'
                                        : 'border-gray-300'
                                        }`}
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

                            {/* Contraseña */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {modoEdicion ? 'Nueva Contraseña (opcional)' : 'Contraseña'} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    autoComplete="new-password"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${erroresValidacion.password
                                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-300'
                                        : 'border-gray-300'
                                        }`}
                                    placeholder="Mínimo 6 caracteres"
                                />
                                {mostrarErrorCampo('password')}
                            </div>

                            {/* Confirmar contraseña */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirmar Contraseña <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    autoComplete="new-password"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${erroresValidacion.confirmPassword
                                        ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-300'
                                        : 'border-gray-300'
                                        }`}
                                    placeholder="Repita la contraseña"
                                />
                                {mostrarErrorCampo('confirmPassword')}
                            </div>

                            {/* Estado */}
                            <div className="md:col-span-2">
                                <div className="flex items-center">
                                    <input
                                        id="activo"
                                        name="activo"
                                        type="checkbox"
                                        checked={formData.activo}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
                                        Usuario activo (puede acceder al sistema)
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Botones del formulario */}
                        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleCerrarModal}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
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
                </AdditionalSection>
            )}

            {/* 📋 Tabla de usuarios */}
            <AdditionalSection
                title={`Lista de Usuarios (${totalUsuarios} ${totalUsuarios === 1 ? 'resultado' : 'resultados'}${totalPages > 1 ? ` - Página ${currentPage} de ${totalPages}` : ''})`}
            >
                {loading && !mostrarFormulario ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <FaSpinner className="animate-spin h-8 w-8 text-orange-600 mx-auto mb-4" />
                            <p className="text-gray-600">Cargando usuarios...</p>
                        </div>
                    </div>
                ) : usuariosPaginados.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Usuario
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            RUT
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Faena
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fecha Creación
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {usuariosPaginados.map((usuario) => (
                                        <tr key={usuario.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                            <FaUsers className="text-gray-600" />
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {usuario.nombre_completo || `${usuario.nombre} ${usuario.apellido}`}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Operador de Vehículo
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {usuario.rut}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {usuario.email || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {usuario.faena || 'Sin faena'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getEstadoBadge(usuario.activo)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {usuario.fecha_creacion}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    {/* Ver detalle */}
                                                    <button
                                                        onClick={() => handleVerDetalle(usuario)}
                                                        className="text-orange-600 hover:text-orange-900 p-2 rounded-lg hover:bg-orange-50 transition-colors"
                                                        title="Ver Detalles"
                                                    >
                                                        <FaEye />
                                                    </button>

                                                    {/* Editar */}
                                                    <button
                                                        onClick={() => handleEditarUsuario(usuario)}
                                                        className="text-yellow-600 hover:text-yellow-900 p-2 rounded-lg hover:bg-yellow-50 transition-colors"
                                                        title="Editar usuario"
                                                    >
                                                        <FaEdit />
                                                    </button>

                                                    {/* Toggle estado */}
                                                    <button
                                                        onClick={() => handleToggleEstadoUsuario(usuario)}
                                                        className={`p-2 rounded-lg transition-colors ${usuario.activo
                                                            ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                                                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                                            }`}
                                                        title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                                                        disabled={loading}
                                                    >
                                                        {usuario.activo ? <FaUserTimes /> : <FaUserCheck />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* 📄 Controles de paginación */}
                            {totalPages > 1 && (
                                <div className="mt-6">
                                    <PageControl
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                        colorScheme="orange" // 🎨 Esquema azul para fondo claro
                                    />
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || filtroFaena !== 'todas' || filtroEstado !== 'todos'
                                ? 'Prueba ajustando los filtros de búsqueda'
                                : 'No hay usuarios registrados en el sistema'
                            }
                        </p>
                    </div>
                )}
            </AdditionalSection>

            {/* 🎉 Modal de éxito */}
            <SuccessModal
                isVisible={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                userData={successUserData}
                type={successType}
                autoCloseTime={7000} // 7 segundos
            />

            {/* 👁️ Modal de detalle del usuario */}
            {mostrarDetalle && usuarioDetalle && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                            onClick={() => setMostrarDetalle(false)}
                        />
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                            <div className="bg-white px-6 py-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                        <FaEye className="text-orange-600" />
                                        Detalles del Usuario
                                    </h3>
                                    <button
                                        onClick={() => setMostrarDetalle(false)}
                                        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Header del usuario */}
                                    <div className="flex items-center space-x-4 pb-4 border-b border-gray-200">
                                        <div className="flex-shrink-0 h-16 w-16">
                                            <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
                                                <FaUsers className="text-orange-600 text-xl" />
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-semibold text-gray-900">
                                                {usuarioDetalle.nombre} {usuarioDetalle.apellido}
                                            </h4>
                                            <p className="text-gray-500 flex items-center gap-2">
                                                <FaIdCard />
                                                {usuarioDetalle.rut}
                                            </p>
                                            <div className="mt-1">
                                                {getEstadoBadge(usuarioDetalle.activo)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información detallada */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Información personal */}
                                        <div className="space-y-4">
                                            <h5 className="font-medium text-gray-900 flex items-center gap-2">
                                                <FaUsers />
                                                Información Personal
                                            </h5>

                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Email</p>
                                                <p className="text-sm text-gray-900 flex items-center gap-2">
                                                    <FaEnvelope className="text-gray-400" />
                                                    {usuarioDetalle.email || 'No proporcionado'}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Faena</p>
                                                <p className="text-sm text-gray-900 flex items-center gap-2">
                                                    <FaBuilding className="text-gray-400" />
                                                    {usuarioDetalle.faena || 'Sin faena'}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Rol</p>
                                                <p className="text-sm text-gray-900 flex items-center gap-2">
                                                    <FaShieldAlt className="text-gray-400" />
                                                    Operador de Vehículo
                                                </p>
                                            </div>
                                        </div>

                                        {/* Estadísticas */}
                                        <div className="space-y-4">
                                            <h5 className="font-medium text-gray-900 flex items-center gap-2">
                                                <FaCalendarAlt />
                                                Información del Sistema
                                            </h5>

                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Fecha de creación</p>
                                                <p className="text-sm text-gray-900">
                                                    {usuarioDetalle.fecha_creacion || 'No disponible'}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-500">ID Usuario</p>
                                                <p className="text-sm text-gray-900">
                                                    #{usuarioDetalle.id}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Estado del Usuario</p>
                                                <p className="text-sm text-gray-900">
                                                    {usuarioDetalle.activo ? 'Activo y operativo' : 'Inactivo - Sin acceso'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Botones del modal */}
                            <div className="bg-gray-50 px-6 py-3 flex items-center justify-end space-x-3">
                                <button
                                    onClick={() => handleEditarUsuario(usuarioDetalle)}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                                >
                                    <FaEdit />
                                    Editar Usuario
                                </button>
                                <button
                                    onClick={() => setMostrarDetalle(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayoutBase>
    );
};

export default GestionarUsuariosOperador;