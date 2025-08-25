// 🎯 LAYOUT BASE COMÚN PARA TODOS LOS COMPONENTES DE ADMIN OPERADOR
import React from 'react';

/**
 * Layout base común que proporciona estructura consistente
 * para todos los componentes del TabNavigation
 */
const AdminLayoutBase = ({ 
  title, 
  icon: Icon, 
  description, 
  children,
  headerActions = null,
  className = ""
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header consistente */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && <Icon className="text-blue-600 text-2xl" />}
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
                {description && (
                  <p className="text-gray-600 mt-1">{description}</p>
                )}
              </div>
            </div>
            {headerActions && (
              <div className="flex items-center gap-3">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
        {children}
      </div>
    </div>
  );
};

/**
 * Componente para secciones de métricas/estadísticas
 */
export const MetricsSection = ({ children, className = "" }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Componente individual para métricas
 */
export const MetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = "blue",
  subtitle = null,
  trend = null 
}) => {
  const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-600", 
    yellow: "text-yellow-600",
    red: "text-red-600",
    purple: "text-purple-600"
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          <p className={`text-3xl font-bold ${colorClasses[color]} mb-1`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 text-sm">
              {trend}
            </div>
          )}
        </div>
        {Icon && (
          <Icon className={`h-8 w-8 ${colorClasses[color]} flex-shrink-0`} />
        )}
      </div>
    </div>
  );
};

/**
 * Componente para tablas con diseño consistente
 */
export const TableSection = ({ 
  title, 
  children, 
  searchComponent = null,
  headerActions = null,
  className = ""
}) => {
  return (
    <div className={`bg-white shadow-sm rounded-lg border border-gray-200 ${className}`}>
      {/* Header de la tabla */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            {searchComponent}
            {headerActions}
          </div>
        </div>
      </div>

      {/* Contenido de la tabla */}
      <div className="overflow-hidden">
        {children}
      </div>
    </div>
  );
};

/**
 * Componente para búsqueda estándar
 */
export const SearchInput = ({ 
  value, 
  onChange, 
  placeholder = "Buscar...",
  className = ""
}) => {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  );
};

/**
 * Componente para tabla responsive sin scroll horizontal
 */
export const ResponsiveTable = ({ 
  headers, 
  data, 
  renderRow,
  emptyMessage = "No hay datos disponibles",
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Vista desktop */}
      <div className="hidden lg:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => renderRow(item, index))}
          </tbody>
        </table>
      </div>

      {/* Vista móvil/tablet - Cards responsivos */}
      <div className="lg:hidden">
        <div className="space-y-4 p-4">
          {data.map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              {renderRow(item, index, true)} {/* isMobile = true */}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

/**
 * Componente para secciones adicionales/complementarias
 */
export const AdditionalSection = ({ 
  title, 
  children, 
  className = "",
  collapsible = false,
  defaultOpen = true 
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div 
        className={`px-6 py-4 border-b border-gray-200 ${collapsible ? 'cursor-pointer' : ''}`}
        onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {collapsible && (
            <svg 
              className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
      {(!collapsible || isOpen) && (
        <div className="p-6">
          {children}
        </div>
      )}
    </div>
  );
};

export default AdminLayoutBase;