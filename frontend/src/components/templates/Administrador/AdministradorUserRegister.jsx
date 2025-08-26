import UniversalHeader from "../../organisms/Todos/UniversalHeader";
import MainUserRegister from '../../organisms/Administrador/MainUserRegister';

const AdministradorUserRegister = () => {
  return (
    <div>
      <UniversalHeader type="admin" />
      <MainUserRegister />
    </div>
  );
}

export default AdministradorUserRegister;
