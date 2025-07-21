import Main from "../../organisms/Gerente/Main";
import Header from "../../organisms/Gerente/Header";
import UniversalHeader from "../../organisms/Todos/UniversalHeader";

const DieselDashboard = () => {
  return (
    <div>
      <UniversalHeader type="gerente" />
      <Main />
    </div>
  );
};

export default DieselDashboard;
