import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

const Portal = ({ children }) => {
  const [container] = useState(() => {
    const div = document.createElement("div");
    div.setAttribute("data-portal", "true");
    return div;
  });

  useEffect(() => {
    document.body.appendChild(container);
    return () => {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };
  }, [container]);

  return createPortal(children, container);
};

Portal.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Portal;
