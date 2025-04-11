import { FaUser } from "react-icons/fa";
export default function Main() {

    return (
      <div className="min-h-screen bg-gray-100">
         <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <FaUser className="mr-2" size={24} />
              Gestión de Usuarios
            </h2>
          </div>
        </main>
      </div>  
  );
}