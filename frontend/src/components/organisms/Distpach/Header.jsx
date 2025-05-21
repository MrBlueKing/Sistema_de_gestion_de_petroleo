import React, { useState, useContext } from "react";
import { FaBars, FaHome, FaUserCog } from "react-icons/fa";
import { TbCategoryPlus } from "react-icons/tb";
import { FaTruckDroplet } from "react-icons/fa6";
import { HiUserAdd } from "react-icons/hi";
import NotificationDropdown from "../../molecules/NotificationDropdown";
import UserProfileDropdown from "../../molecules/UserProfileDropdown";
import IconButton from "../../atoms/Button/IconButton";
import Sidebar from "../../molecules/SideBard";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/userContext";

const Header = () => {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { setUser } = useContext(UserContext);


    const handleLogout = () => {
        localStorage.removeItem("authToken");
        setUser(null);
        navigate("/");
    };

    return (
        <div className="flex overflow-hidden">
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between bg-white shadow-md px-4 py-2 h-14 fixed top-0 left-0 right-0 z-10">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold text-gray-800">Distpach</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <UserProfileDropdown
                            userMenuOpen={userMenuOpen}
                            setUserMenuOpen={setUserMenuOpen}
                            handleLogout={handleLogout}
                        />
                    </div>
                </header>
                <main className="flex-1 overflow-auto pt-14 bg-gray-50">
                    {/* Contenido principal aquí */}
                </main>
            </div>
        </div>
    );
};

export default Header;
