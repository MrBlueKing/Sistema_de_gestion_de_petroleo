import MainAdminOperador from "../../organisms/AdminOperador/MainAdminOperador";
import UniversalHeader from "../../organisms/Todos/UniversalHeader";

const AdminOperador = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-100 pt-2">
            <UniversalHeader type="AdminOperador" />
            <MainAdminOperador />
        </div>
    );
};

export default AdminOperador;
