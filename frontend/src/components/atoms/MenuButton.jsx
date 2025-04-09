import { CiMenuBurger } from "react-icons/ci";

const MenuButton = ({ onClick }) => {
  return (
    <button onClick={onClick} className="p-2">
      <CiMenuBurger size={24} />
    </button>
  );
};

export default MenuButton;
