import { useState, useEffect } from "react";

const MAX_PAGINATION_BTNS_DESKTOP = 7;
const MAX_PAGINATION_BTNS_MOBILE = 3;
const MOBILE_BREAKPOINT = 768;

export const useResponsivePagination = () => {
  const [maxPaginationButtons, setMaxPaginationButtons] = useState(MAX_PAGINATION_BTNS_DESKTOP);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updatePaginationButtons = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      setMaxPaginationButtons(mobile ? MAX_PAGINATION_BTNS_MOBILE : MAX_PAGINATION_BTNS_DESKTOP);
    };

    updatePaginationButtons();
    window.addEventListener("resize", updatePaginationButtons);
    return () => window.removeEventListener("resize", updatePaginationButtons);
  }, []);

  return { maxPaginationButtons, isMobile };
};
