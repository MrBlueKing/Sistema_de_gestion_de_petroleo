/**
 * ✅ Utilidades para manejo de RUT
 * Permite que los usuarios ingresen RUT en cualquier formato
 * y lo normaliza para envío al backend
 */

/**
 * Limpiar RUT para normalizarlo (solo números y K)
 * @param {string} rut - RUT en cualquier formato (ej: 12.345.678-9, 12345678-9, 123456789)
 * @returns {string} RUT limpio (solo números y K)
 */
export const cleanRut = (rut) => {
  if (!rut) return '';

  // Eliminar puntos, guiones, espacios
  // Mantener solo números y la letra K (mayúscula o minúscula)
  const cleaned = rut.replace(/[^0-9kK]/g, '');

  console.log('🧹 RUT limpiado:', {
    original: rut,
    limpio: cleaned
  });

  return cleaned;
};

/**
 * Formatear RUT para visualización (con puntos y guion)
 * @param {string} rut - RUT limpio (solo números y K)
 * @returns {string} RUT formateado (ej: 12.345.678-9)
 */
export const formatRut = (rut) => {
  if (!rut) return '';

  // Limpiar primero
  const cleaned = cleanRut(rut);

  // Separar número y dígito verificador
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  // Formatear el cuerpo con puntos
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Retornar con guion antes del dígito verificador
  return `${formattedBody}-${dv}`;
};

/**
 * Validar formato básico de RUT
 * @param {string} rut - RUT en cualquier formato
 * @returns {boolean} true si el formato es válido
 */
export const isValidRutFormat = (rut) => {
  if (!rut) return false;

  const cleaned = cleanRut(rut);

  // Debe tener entre 8 y 9 caracteres (7-8 números + dígito verificador)
  if (cleaned.length < 8 || cleaned.length > 9) {
    return false;
  }

  return true;
};

/**
 * Validar RUT completo con dígito verificador
 * @param {string} rut - RUT en cualquier formato
 * @returns {boolean} true si el RUT es válido
 */
export const validateRut = (rut) => {
  if (!rut) return false;

  // Limpiar el RUT
  const rutLimpio = cleanRut(rut).toLowerCase();

  if (rutLimpio.length < 8) return false;

  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);

  // Calcular dígito verificador
  let suma = 0;
  let multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const dvCalculado = 11 - (suma % 11);
  let dvEsperado;

  if (dvCalculado === 11) dvEsperado = "0";
  else if (dvCalculado === 10) dvEsperado = "k";
  else dvEsperado = dvCalculado.toString();

  return dv === dvEsperado;
};
