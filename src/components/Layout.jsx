import Footer from "./Footer";
import Navbar from "./NavBar";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";

const Layout = ({ children }) => {
  const location = useLocation();
  const hideNavbarFooter =
    location.pathname === "/login" ||
    location.pathname === "/first-time-password";

  return (
    <div className="flex flex-col h-screen">
      {!hideNavbarFooter && <Navbar />}
      <main
        className={`flex-grow flex w-full overflow-hidden ${
          hideNavbarFooter ? "p-0" : ""
        }`}
      >
        <div className="w-full overflow-auto">{children}</div>
      </main>
      {!hideNavbarFooter && <Footer />}
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
