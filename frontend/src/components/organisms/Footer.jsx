import React from "react";

const Footer = () => {
  return (
    <footer className="w-full  text-white text-center py-4">
      <p className="text-sm">&copy; {new Date().getFullYear()} Mi Sitio. Todos los derechos reservados.</p>
    </footer>
  );
};

export default Footer;
