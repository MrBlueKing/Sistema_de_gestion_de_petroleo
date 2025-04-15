const Main = () => {
    return (
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 text-center">
             {/* Últimas operaciones y planificación */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Tabla de últimas operaciones */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Últimas Operaciones</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estación</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volumen</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-900">14/04/2025</td>
                      <td className="px-4 py-3 text-sm text-gray-900">Este</td>
                      <td className="px-4 py-3 text-sm text-green-600">Recarga</td>
                      <td className="px-4 py-3 text-sm text-gray-900">8,500 L</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-900">13/04/2025</td>
                      <td className="px-4 py-3 text-sm text-gray-900">Norte</td>
                      <td className="px-4 py-3 text-sm text-red-600">Consumo</td>
                      <td className="px-4 py-3 text-sm text-gray-900">3,200 L</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-900">13/04/2025</td>
                      <td className="px-4 py-3 text-sm text-gray-900">Oeste</td>
                      <td className="px-4 py-3 text-sm text-red-600">Consumo</td>
                      <td className="px-4 py-3 text-sm text-gray-900">2,800 L</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-900">12/04/2025</td>
                      <td className="px-4 py-3 text-sm text-gray-900">Central</td>
                      <td className="px-4 py-3 text-sm text-green-600">Recarga</td>
                      <td className="px-4 py-3 text-sm text-gray-900">12,000 L</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
        </div>
                 {/* Gráficos y tablas */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico Principal de Consumo */}
            <div className="bg-white rounded-lg shadow col-span-2 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Consumo por Estación</h2>
                <div className="flex items-center space-x-2">
                  <select className="border border-gray-300 rounded-md p-1.5 text-sm">
                    <option>Últimos 7 días</option>
                    <option>Este mes</option>
                    <option>Este año</option>
                  </select>
                </div>
              </div>
              <div className="h-64 w-full bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Gráfico de consumo por estación</p>
              </div>
            </div>
            </div>
        </main>
    );
}

export default Main;