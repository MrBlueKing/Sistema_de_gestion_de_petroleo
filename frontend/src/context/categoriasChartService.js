// context/categoriasChartService.js

import axios from '../lib/axios';

class CategoriasChartService {
    
    /**
     * Obtener datos para el piechart principal
     * @param {Object} filtros - Filtros para la consulta
     * @param {string} filtros.fecha_inicio - Fecha de inicio (YYYY-MM-DD)
     * @param {string} filtros.fecha_fin - Fecha de fin (YYYY-MM-DD)
     * @param {string} filtros.modo - 'categorias' o 'maquinas'
     * @param {number} filtros.id_categoria - ID de categoría (para modo 'maquinas')
     * @param {number} filtros.id_faena - ID de faena (opcional)
     */
    async obtenerDatosChart(filtros = {}) {
        try {
            const response = await axios.post('/api/categorias-chart/datos', {
                fecha_inicio: filtros.fechaInicio,
                fecha_fin: filtros.fechaFin,
                modo: filtros.modo || 'categorias',
                id_categoria: filtros.idCategoria,
                id_faena: filtros.idFaena
            });

            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data,
                    metadata: response.data.metadata
                };
            } else {
                throw new Error(response.data.message || 'Error al obtener datos');
            }
        } catch (error) {
            console.error('Error en obtenerDatosChart:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Error de conexión'
            };
        }
    }

    /**
     * Obtener solo categorías (más rápido)
     */
    async obtenerCategorias(fechaInicio, fechaFin, idFaena = null) {
        try {
            const response = await axios.post('/api/categorias-chart/categorias', {
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                id_faena: idFaena
            });

            if (response.data.success) {
                return {
                    success: true,
                    categorias: response.data.categorias,
                    resumen: response.data.resumen
                };
            } else {
                throw new Error(response.data.message || 'Error al obtener categorías');
            }
        } catch (error) {
            console.error('Error en obtenerCategorias:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Error de conexión'
            };
        }
    }

    /**
     * Obtener máquinas de una categoría específica
     */
    async obtenerMaquinasCategoria(idCategoria, fechaInicio, fechaFin, idFaena = null) {
        try {
            const response = await axios.post(`/api/categorias-chart/categorias/${idCategoria}/maquinas`, {
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                id_faena: idFaena
            });

            if (response.data.success) {
                return {
                    success: true,
                    maquinas: response.data.maquinas,
                    categoriaInfo: response.data.categoria_info,
                    resumen: response.data.resumen
                };
            } else {
                throw new Error(response.data.message || 'Error al obtener máquinas');
            }
        } catch (error) {
            console.error('Error en obtenerMaquinasCategoria:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Error de conexión'
            };
        }
    }

    /**
     * Obtener lista de todas las categorías disponibles
     */
    async obtenerListaCategorias() {
        try {
            const response = await axios.get('/api/categorias-chart/lista-categorias');

            if (response.data.success) {
                return {
                    success: true,
                    categorias: response.data.categorias
                };
            } else {
                throw new Error(response.data.message || 'Error al obtener lista de categorías');
            }
        } catch (error) {
            console.error('Error en obtenerListaCategorias:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Error de conexión'
            };
        }
    }

    /**
     * Formatear datos para recharts
     */
    formatearParaRecharts(datos) {
        if (!Array.isArray(datos)) return [];
        
        return datos.map(item => ({
            id: item.id,
            name: item.name,
            value: parseFloat(item.value || 0),
            maquinas_count: item.maquinas_count || 0,
            patente: item.patente || null,
            estado: item.estado || null,
            promedio_consumo: parseFloat(item.promedio_consumo || 0),
            total_registros: item.total_registros || 0
        }));
    }

    /**
     * Generar parámetros de consulta por defecto
     */
    generarFiltrosDefault(fechaInicio = null, fechaFin = null) {
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        
        return {
            fechaInicio: fechaInicio || primerDiaMes.toISOString().split('T')[0],
            fechaFin: fechaFin || hoy.toISOString().split('T')[0],
            modo: 'categorias',
            idCategoria: null,
            idFaena: null
        };
    }
}

// Crear instancia única del servicio
export const categoriasChartService = new CategoriasChartService();

// Exportar también la clase para casos específicos
export default CategoriasChartService;


