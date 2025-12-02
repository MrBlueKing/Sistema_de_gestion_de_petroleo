import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaPlus, FaTimes, FaSave, FaTrash, FaUser, FaBuilding } from "react-icons/fa";
import UniversalHeader from "../../components/organisms/Todos/UniversalHeader";
import axios from "../../lib/axios";

const GestionarFaenasBomberos = () => {
  const [bomberos, setBomberos] = useState([]);
  const [faenas, setFaenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBombero, setSelectedBombero] = useState(null);
  const [bomberoFaenas, setBomberoFaenas] = useState([]);
  const [saving, setSaving] = useState(false);

  const FAENAS_INFO = {
    1: { nombre: "Cabildo", ubicacion: "Región de Valparaíso", color: "blue" },
    2: { nombre: "Catemu", ubicacion: "Región de Valparaíso", color: "green" },
    3: { nombre: "Chincolco", ubicacion: "Región de Valparaíso", color: "purple" },
    4: { nombre: "Tiltil", ubicacion: "Región Metropolitana", color: "orange" },
    8: { nombre: "Rungue", ubicacion: "Región Metropolitana", color: "red" },
  };

  // Cargar bomberos y faenas
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar todas las faenas usando el endpoint correcto
      const faenasResponse = await axios.get('/api/faenas');
      console.log('📍 Faenas response:', faenasResponse.data);

      // El endpoint /api/faenas devuelve { success: true, data: [...] }
      if (faenasResponse.data.success) {
        setFaenas(faenasResponse.data.data);
      } else {
        setFaenas(faenasResponse.data);
      }

      // Cargar todos los usuarios (con parámetro ?all=1 para obtener todos)
      const usersResponse = await axios.get('/api/usuarios/recientes?all=1');
      console.log('👥 Usuarios response:', usersResponse.data);

      // Filtrar solo bomberos (rol bombero tiene id_rol = 1)
      const bomberosData = usersResponse.data.filter(u => {
        console.log('🔍 Usuario:', u.nombre, 'Rol ID:', u.id_rol);
        return u.id_rol === 1;
      });

      console.log('🚒 Bomberos filtrados:', bomberosData);
      setBomberos(bomberosData);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos. Por favor, recargue la página.');
    } finally {
      setLoading(false);
    }
  };

  const cargarFaenasBombero = async (userId) => {
    try {
      const bombero = bomberos.find(b => b.id === userId);

      // Obtener faenas asignadas desde la tabla pivote
      const response = await axios.get(`/api/user-faenas?user_id=${userId}`);

      if (response.data.success) {
        const faenasAsignadas = response.data.faenas.map(f => f.id_faena);

        // SIEMPRE incluir la faena principal si no está ya en la lista
        if (bombero?.id_faena && !faenasAsignadas.includes(bombero.id_faena)) {
          faenasAsignadas.push(bombero.id_faena);
        }

        setBomberoFaenas(faenasAsignadas);
      }
    } catch (error) {
      console.error('Error al cargar faenas del bombero:', error);
      // Si no tiene faenas asignadas, usar solo la faena principal
      const bombero = bomberos.find(b => b.id === userId);
      if (bombero?.id_faena) {
        setBomberoFaenas([bombero.id_faena]);
      }
    }
  };

  const handleSelectBombero = (bombero) => {
    setSelectedBombero(bombero);
    cargarFaenasBombero(bombero.id);
  };

  const toggleFaena = (faenaId) => {
    if (bomberoFaenas.includes(faenaId)) {
      setBomberoFaenas(bomberoFaenas.filter(id => id !== faenaId));
    } else {
      setBomberoFaenas([...bomberoFaenas, faenaId]);
    }
  };

  const guardarCambios = async () => {
    if (!selectedBombero) return;

    setSaving(true);
    try {
      // Obtener faenas actuales del bombero
      const currentResponse = await axios.get(`/api/user-faenas?user_id=${selectedBombero.id}`);
      const currentFaenas = currentResponse.data.success
        ? currentResponse.data.faenas.map(f => f.id_faena)
        : [selectedBombero.id_faena];

      // Faenas a agregar
      const faenasToAdd = bomberoFaenas.filter(id => !currentFaenas.includes(id));

      // Faenas a remover
      const faenasToRemove = currentFaenas.filter(id => !bomberoFaenas.includes(id) && id !== selectedBombero.id_faena);

      // Asignar nuevas faenas
      for (const faenaId of faenasToAdd) {
        await axios.post('/api/user-faenas/asignar', {
          user_id: selectedBombero.id,
          faena_id: faenaId
        });
      }

      // Remover faenas
      for (const faenaId of faenasToRemove) {
        await axios.delete('/api/user-faenas/remover', {
          data: {
            user_id: selectedBombero.id,
            faena_id: faenaId
          }
        });
      }

      alert('✅ Cambios guardados exitosamente');
      setSelectedBombero(null);
      setBomberoFaenas([]);

    } catch (error) {
      console.error('Error al guardar cambios:', error);
      alert('❌ Error al guardar cambios: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <UniversalHeader type="admin" />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Gestión de Faenas de Bomberos
                </h1>
                <p className="text-gray-600">
                  Asigna múltiples faenas a los encargados de abastecimiento
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <FaMapMarkerAlt className="text-white text-2xl" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Bomberos */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FaUser className="mr-2 text-blue-600" />
                Encargados de Abastecimiento
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : bomberos.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No hay bomberos registrados</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {bomberos.map((bombero) => (
                    <button
                      key={bombero.id}
                      onClick={() => handleSelectBombero(bombero)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedBombero?.id === bombero.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">
                            {bombero.nombre} {bombero.apellido}
                          </p>
                          <p className="text-sm text-gray-500">
                            RUT: {bombero.rut}
                          </p>
                          <p className="text-xs text-orange-600 font-medium mt-1">
                            Faena principal: {FAENAS_INFO[bombero.id_faena]?.nombre || `Faena ${bombero.id_faena}`}
                          </p>
                        </div>
                        {selectedBombero?.id === bombero.id && (
                          <FaUser className="text-blue-600 text-xl" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Panel de Faenas */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FaBuilding className="mr-2 text-green-600" />
                Faenas Asignadas
              </h2>

              {!selectedBombero ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <FaMapMarkerAlt className="text-gray-300 text-6xl mb-4" />
                  <p className="text-gray-500 text-lg">
                    Selecciona un bombero para gestionar sus faenas
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-gray-700">
                      <span className="font-bold">Editando:</span>{' '}
                      {selectedBombero.nombre} {selectedBombero.apellido}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Selecciona las faenas a las que tendrá acceso
                    </p>
                  </div>

                  <div className="space-y-3 mb-6">
                    {faenas.map((faena) => {
                      const info = FAENAS_INFO[faena.id_faena] || {
                        nombre: faena.nombre,
                        ubicacion: "Ubicación desconocida",
                        color: "gray"
                      };

                      const isSelected = bomberoFaenas.includes(faena.id_faena);
                      const isPrincipal = selectedBombero.id_faena === faena.id_faena;

                      return (
                        <button
                          key={faena.id_faena}
                          onClick={() => !isPrincipal && toggleFaena(faena.id_faena)}
                          disabled={isPrincipal}
                          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                            isPrincipal
                              ? 'border-orange-400 bg-orange-50 opacity-70 cursor-not-allowed'
                              : isSelected
                              ? `border-${info.color}-500 bg-${info.color}-50`
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center">
                                <FaMapMarkerAlt className={`mr-2 text-${info.color}-600`} />
                                <p className="font-bold text-gray-900">{info.nombre}</p>
                              </div>
                              <p className="text-sm text-gray-500 ml-6">{info.ubicacion}</p>
                              {isPrincipal && (
                                <p className="text-xs text-orange-600 font-medium ml-6 mt-1">
                                  Faena Principal (no se puede remover)
                                </p>
                              )}
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? `bg-${info.color}-500 border-${info.color}-500`
                                : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <FaPlus className="text-white transform rotate-45" size={12} />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedBombero(null);
                        setBomberoFaenas([]);
                      }}
                      className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors flex items-center justify-center"
                    >
                      <FaTimes className="mr-2" />
                      Cancelar
                    </button>
                    <button
                      onClick={guardarCambios}
                      disabled={saving || bomberoFaenas.length === 0}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <FaSave className="mr-2" />
                          Guardar Cambios
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GestionarFaenasBomberos;
