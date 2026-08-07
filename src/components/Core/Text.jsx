"use client";

import PropTypes from "prop-types";
import styles from "./styles/Core.module.scss";

const Text = (props) => {
  const {
    children,
    // Defaults to "" for the same reason as Input: it is interpolated into a
    // template literal, so an omitted prop became a literal "undefined" class.
    className = "",
    variant = "primary",
    type = "h6",
    style,
    onClick,
    ...rest
  } = props;

  const getTextVariant = () => {
    switch (type) {
      case "h1":
        return styles.h1;
      case "h2":
        return styles.h2;
      case "h3":
        return styles.h3;
      case "h4":
        return styles.h4;
      case "h5":
        return styles.h5;
      case "h6":
        return styles.h6;
      case "p":
        // The stylesheet defines `.body2` but never `.body1`, so this arm has
        // always produced no class — same in the original. Returning "" keeps
        // the rendering identical without emitting class="undefined".
        return "";
      case "body2":
        return styles.body2;
      default:
        return styles.h6;
    }
  };

  const inlineStyle = {
    color: variant === "primary" ? "#fff" : "#FF8A00",
    ...style,
  };

  const getOnClick = () => {
    if (onClick) {
      return onClick;
    }
    return () => {};
  };

  return (
    <div
      style={inlineStyle}
      className={`${getTextVariant()} ${className}`}
      onClick={getOnClick()}
      {...rest}
    >
      {children}
    </div>
  );
};

Text.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["primary", "secondary"]),
  type: PropTypes.oneOf(["h1", "h2", "h3", "h4", "h5", "h6", "p", "body2"]),
  style: PropTypes.object,
  onClick: PropTypes.func,
};

export default Text;
