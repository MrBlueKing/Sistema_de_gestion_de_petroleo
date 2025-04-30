import axios from "../lib/axios";

// Función auxiliar para formatear usuarios
const formatearUsuarios = (usuarios) => {
  if (!Array.isArray(usuarios)) return [];
  
  return usuarios.map(user => {
    // Si los datos vienen de la API con estructura conocida
    if (user.id_personal_interno || user.id_personal_externo) {
      return {
        id: user.id_personal_interno || user.id_personal_externo,
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        rut: user.rut || "",
        cargo: user.cargo || "",
        ubicacion: user.ubicacion || "",
        faena: user.faena || "",
        id_faena: user.id_faena || null,
        empresa: user.empresa || "",
        tipo: user.id_personal_interno ? "interno" : "externo",
        // Mantener el objeto original también
        ...user
      };
    }
    
    // Si ya viene con formato correcto, solo aseguramos campos obligatorios
    return {
      id: user.id || 0,
      nombre: user.nombre || "",
      apellido: user.apellido || "",
      faena: user.faena || "",
      id_faena: user.id_faena || null,
      ...user
    };
  });
};

// Servicio para las operaciones del formulario de Bombero
const bomberoService = {
  // Obtener personal según el tipo seleccionado con opción de filtrado por id_faena o nombre de faena
  getPersonalPorTipo: async (tipo, filtro = null) => {
    try {
      const endpoint = tipo === "interno" ? "/api/personal-internos" : "/api/personal-externos";
      
      // Construir la URL con los parámetros necesarios
      let url = endpoint;
      
      // Primero verificamos si el filtro parece ser un ID (número) o un nombre de faena (string)
      if (filtro !== null) {
        if (typeof filtro === 'number' || !isNaN(parseInt(filtro))) {
          // Es un id_faena
          url += `?id_faena=${encodeURIComponent(filtro)}`;
        } else {
          // Es un nombre de faena
          url += `?faena=${encodeURIComponent(filtro)}`;
        }
      }
      
      const response = await axios.get(url);
      
      // Determinar la propiedad correcta según el tipo
      const propertyName = tipo === "interno" ? "personal_interno" : "personal_externo";
      
      let usuarios = [];
      if (response.data && response.data[propertyName] && Array.isArray(response.data[propertyName])) {
        usuarios = formatearUsuarios(response.data[propertyName]);
      } else if (Array.isArray(response.data)) {
        usuarios = formatearUsuarios(response.data);
      } else {
        console.error(`Formato de respuesta no esperado para ${tipo}:`, response.data);
        return [];
      }
      
      // Si tenemos un filtro y el backend no lo aplicó, lo aplicamos aquí
      if (filtro !== null && usuarios.length > 0) {
        if (typeof filtro === 'number' || !isNaN(parseInt(filtro))) {
          // Filtrar por id_faena
          const idFaena = parseInt(filtro);
          return usuarios.filter(user => user.id_faena === idFaena);
        } else {
          // Filtrar por nombre de faena
          return usuarios.filter(user => 
            user.faena && user.faena.toLowerCase() === filtro.toLowerCase()
          );
        }
      }
      
      return usuarios;
    } catch (error) {
      console.error(`Error al obtener personal ${tipo}:`, error);
      return [];
    }
  },
  
  // Buscar personal por nombre con opción de filtrado por id_faena o nombre de faena
  buscarPersonal: async (tipo, termino, filtro = null) => {
    try {
      const endpoint = tipo === "interno" ? "/api/personal-internos" : "/api/personal-externos";
      
      // Construir la URL con los parámetros necesarios
      let url = `${endpoint}?search=${encodeURIComponent(termino)}`;
      
      // Añadir filtro de faena si está disponible
      if (filtro !== null) {
        if (typeof filtro === 'number' || !isNaN(parseInt(filtro))) {
          // Es un id_faena
          url += `&id_faena=${encodeURIComponent(filtro)}`;
        } else {
          // Es un nombre de faena
          url += `&faena=${encodeURIComponent(filtro)}`;
        }
      }
      
      const response = await axios.get(url);
      
      // Determinar la propiedad correcta según el tipo
      const propertyName = tipo === "interno" ? "personal_interno" : "personal_externo";
      
      let usuarios = [];
      if (response.data && response.data[propertyName] && Array.isArray(response.data[propertyName])) {
        usuarios = formatearUsuarios(response.data[propertyName]);
      } else if (Array.isArray(response.data)) {
        usuarios = formatearUsuarios(response.data);
      } else {
        console.error(`Formato de respuesta no esperado para búsqueda de ${tipo}:`, response.data);
        return [];
      }
      
      // Filtrar por el término de búsqueda si no fue filtrado en el backend
      const searchTermLower = termino.toLowerCase();
      usuarios = usuarios.filter(user => 
        (user.nombre && user.nombre.toLowerCase().includes(searchTermLower)) ||
        (user.apellido && user.apellido.toLowerCase().includes(searchTermLower)) ||
        (user.rut && user.rut.toLowerCase().includes(searchTermLower))
      );
      
      // Aplicar filtro adicional por faena si el backend no lo aplicó
      if (filtro !== null) {
        if (typeof filtro === 'number' || !isNaN(parseInt(filtro))) {
          // Filtrar por id_faena
          const idFaena = parseInt(filtro);
          return usuarios.filter(user => user.id_faena === idFaena);
        } else {
          // Filtrar por nombre de faena
          return usuarios.filter(user => 
            user.faena && user.faena.toLowerCase() === filtro.toLowerCase()
          );
        }
      }
      
      return usuarios;
    } catch (error) {
      console.error(`Error al buscar personal ${tipo}:`, error);
      return [];
    }
  },
  
  // Resto de funciones mantienen su implementación original...
  // Obtener personal interno
  getPersonalInterno: async () => {
    try {
      const response = await axios.get("/api/personal-internos");
      
      if (response.data && response.data.personal_interno && Array.isArray(response.data.personal_interno)) {
        return formatearUsuarios(response.data.personal_interno);
      } else if (Array.isArray(response.data)) {
        return formatearUsuarios(response.data);
      } else {
        console.error("Formato de respuesta no esperado:", response.data);
      }
    } catch (error) {
      console.error("Error al obtener personal interno:", error);
    }
  },
  
  // Obtener personal externo
  getPersonalExterno: async () => {
    try {
      const response = await axios.get("/api/personal-externos");
      
      if (response.data && response.data.personal_externo && Array.isArray(response.data.personal_externo)) {
        return formatearUsuarios(response.data.personal_externo);
      } else if (Array.isArray(response.data)) {
        return formatearUsuarios(response.data);
      } else {
        console.error("Formato de respuesta no esperado:", response.data);
      }
    } catch (error) {
      console.error("Error al obtener personal externo:", error);
    }
  },
  
  // Obtener información del bombero actual
  getBomberoInfo: async (bomberoBadgeId) => {
    try {
      const response = await axios.get(`/api/bomberos/${bomberoBadgeId}`);
      if (response.data) {
        return {
          id: response.data.id || 0,
          nombre: response.data.nombre || "",
          apellido: response.data.apellido || "",
          faena: response.data.faena || "",
          id_faena: response.data.id_faena || null,
          ...response.data
        };
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
      const response = await axios.get("/api/categorias-maquinaria");
      
      if (response.data && response.data.categorias && Array.isArray(response.data.categorias)) {
        return response.data.categorias;
      } else if (Array.isArray(response.data)) {
        return response.data;
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