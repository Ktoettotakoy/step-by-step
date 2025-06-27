/*
	jsrepo 1.28.3
	Installed from https://reactbits.dev/default/
	1-24-2025
*/

import { useState, useEffect } from "react";
import { useSpring, animated } from "@react-spring/web";
import "./Dock.css"; // Import your CSS for styling

const Dock = ({
  position = "bottom",
  collapsible = false,
  responsive = "bottom",
  onItemClick = () => {}
}) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [isDockVisible, setDockVisible] = useState(!collapsible);
  const [currentPosition, setCurrentPosition] = useState(position);

  const dockItems = [
  { label: "Home", target: "hero" },
  { label: "Skills", target: "skills" },
  { label: "Projects", target: "projects" },
  { label: "Contact", target: "contact" },
];

  const handleMouseEnter = (index) => {
    setHoverIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const handleParentMouseEnter = () => {
    if (collapsible) {
      setDockVisible(true);
    }
  };

  const handleParentMouseLeave = () => {
    if (collapsible) {
      setDockVisible(false);
    }
  };

  // Update position based on screen size and responsive prop
  useEffect(() => {
    const updatePosition = () => {
      if (responsive && window.innerWidth <= 768) {
        // Adjust threshold as needed
        setCurrentPosition(responsive);
      } else {
        setCurrentPosition(position);
      }
    };

    updatePosition(); // Initial update

    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [position, responsive, collapsible]);

  const getDockStyle = () => {
    const flexDirection =
      currentPosition === "left" || currentPosition === "right"
        ? "column"
        : "row";
    return { flexDirection };
  };

  const scaleSpring = (index) => {
    const translateValue = (() => {
      if (hoverIndex === index) {
        switch (currentPosition) {
          case "left":
            return "translateX(5px) translateY(0px)";
          case "right":
            return "translateX(-5px) translateY(0px)";
          case "top":
            return "translateX(0px) translateY(5px)";
          case "bottom":
            return "translateX(0px) translateY(-5px)";
          default:
            return "translateX(0px) translateY(0px)";
        }
      } else {
        return "translateX(0px) translateY(0px)";
      }
    })();

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSpring({
      transform:
        hoverIndex === index
          ? `scale(1.3) ${translateValue}`
          : hoverIndex !== null && Math.abs(hoverIndex - index) === 1
            ? `scale(1.2) translateX(0px) translateY(0px)`
            : `scale(1) translateX(0px) translateY(0px)`,
      config: { tension: 200, friction: 15 },
    });
  };

  const visibilitySpring = useSpring({
    opacity: isDockVisible ? 1 : 0,
    config: { tension: 120, friction: 14 },
  });

  return (
    <div
      className={`dock-container ${currentPosition}`}
      onMouseEnter={handleParentMouseEnter}
      onMouseLeave={handleParentMouseLeave}
    >
      <animated.div
        className="dock"
        style={{ ...getDockStyle(), ...visibilitySpring }}
      >
      {dockItems.map(({ label, target }, index) => (
        <animated.div
          key={label}
          className="dock-item"
          style={scaleSpring(index)}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
          onClick={() => onItemClick(target)}
        >
          {label}
        </animated.div>
      ))}
      </animated.div>
    </div>
  );
};

export default Dock;
