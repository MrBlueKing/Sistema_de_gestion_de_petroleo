// src/components/templates/MenuPrincipalBombero.jsx
import { useState } from "react";
import MenuButton from "../../components/atoms/MenuButton";
import UserGreeting from "../../components/atoms/UserGreeting";
import Badge from "../../components/atoms/Badge";

const MenuPrincipalBombero = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userName = "Usuario"; // O lo que sea que uses como nombre del usuario
  
  return (
    <header className="bg-white shadow-md">
      <div className="flex items-center justify-between p-4">
        {/* Menu Button */}
        <MenuButton onClick={() => setIsMenuOpen(!isMenuOpen)} />

        {/* User Greeting - centrado */}
        <div className="flex-1 flex justify-center">
          <UserGreeting userName={userName} />
        </div>

        {/* Badge - alineado a la derecha */}
        <div>
          <Badge />
        </div>
      </div>
    </header>
  );
};

export default MenuPrincipalBombero;
