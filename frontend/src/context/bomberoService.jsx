import axios from "../lib/axios";

// Servicio para las operaciones del formulario de Bombero
const bomberoService = {
  // Obtener personal interno con la estructura actual de la API
  getPersonalInterno: async () => {
    try {
      const response = await axios.get("/api/personal-internos");
      
      if (response.data && response.data.success && Array.isArray(response.data.personal_interno)) {
        return response.data.personal_interno;
      } else {
        console.error("Formato de respuesta no esperado:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Error al obtener personal interno:", error);
      return [];
    }
  },
  
  // Obtener personal externo
  getPersonalExterno: async () => {
    try {
      const response = await axios.get("/api/personal-externos");
      console.log('externos:', response);
      if (response.data && response.data.success && Array.isArray(response.data.personal_externo)) {
        return response.data.personal_externo;
      } else {
        console.error("Formato de respuesta no esperado:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Error al obtener personal externo:", error);
      return [];
    }
  },
  
  // Obtener todo el personal según tipo
  getPersonalPorTipo: async (tipo) => {
    if (tipo === "interno") {
      return bomberoService.getPersonalInterno();
    } else {
      return bomberoService.getPersonalExterno();
    }
  },
  
  // Filtrar personal por ubicación - esta función se usa para filtrar en el cliente
  filtrarPersonalPorUbicacion: (personal, ubicacion) => {
    if (!ubicacion || !Array.isArray(personal)) return [];
    
    // Convertimos a minúsculas para comparación insensible a mayúsculas/minúsculas
    const ubicacionLower = ubicacion.toLowerCase();
    
    return personal.filter(item => {
      // Extraemos el objeto de personal interno/externo según su estructura
      const personalData = item.personal_interno || item.personal_externo;
      
      if (!personalData || !personalData.ubicacion) return false;
      
      // Comparamos la ubicación
      return personalData.ubicacion.toLowerCase() === ubicacionLower;
    });
  },
  
  // Buscar personal por término de búsqueda - esta función se usa para buscar en el cliente
  buscarPersonal: (personal, termino) => {
    if (!termino || !Array.isArray(personal)) return personal;
    
    const terminoLower = termino.toLowerCase();
    
    return personal.filter(item => {
      // Extraemos el objeto de personal interno/externo según su estructura
      const personalData = item.personal_interno || item.personal_externo;
      
      if (!personalData) return false;
      
      // Buscamos en nombre, apellido y rut
      return (
        (personalData.nombre && personalData.nombre.toLowerCase().includes(terminoLower)) ||
        (personalData.apellido && personalData.apellido.toLowerCase().includes(terminoLower)) ||
        (personalData.rut && personalData.rut.toLowerCase().includes(terminoLower))
      );
    });
  },
  
  // Obtener todas las faenas y buscar la del usuario por ID
  getFaenaById: async (idFaena) => {
    try {
      // Obtenemos todas las faenas
      const response = await axios.get("/api/faenas");
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // Buscamos la faena con el ID específico
        const faena = response.data.data.find(f => f.id_faena === idFaena);
        
        if (faena) {
          return faena;
        } else {
          console.warn(`No se encontró faena con ID ${idFaena}`);
          return null;
        }
      } else {
        console.error("Formato de respuesta no esperado para faenas:", response.data);
        return null;
      }
    } catch (error) {
      console.error(`Error al obtener faena con ID ${idFaena}:`, error);
      return null;
    }
  },
  
  // Obtener todas las faenas
  getAllFaenas: async () => {
    try {
      const response = await axios.get("/api/faenas");
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        console.error("Formato de respuesta no esperado para faenas:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Error al obtener todas las faenas:", error);
      return [];
    }
  },
  
  // Obtener información del bombero actual
  getBomberoInfo: async (bomberoBadgeId) => {
    try {
      const response = await axios.get(`/api/user/${bomberoBadgeId}`);
      if (response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error al obtener información del bombero:", error);
      return null;
    }
  },
  
  // Obtener categorías de maquinaria
  getCategoriasMaquinaria: async () => {
    try {
      const response = await axios.get("/api/categorias");
      
      if (response.data && response.data.success && Array.isArray(response.data.categorias)) {
        return response.data.categorias;
      } else {
        console.error("Formato de respuesta no esperado para categorías:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Error al obtener categorías de maquinaria:", error);
      return [];
    }
  },
  
  // Registrar un consumo de combustible
  registrarConsumo: async (datosConsumo) => {
    try {
      const response = await axios.post("/api/consumos", datosConsumo);
      return response.data;
    } catch (error) {
      console.error("Error al registrar consumo:", error);
      throw error;
    }
  }
};

export default bomberoService;