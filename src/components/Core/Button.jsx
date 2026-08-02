"use client";

import PropTypes from "prop-types";
import styles from "./styles/Core.module.scss";

const Button = ({
  variant = "primary",
  children,
  isLoading = false,
  onClick,
  style,
  disabled = false,
  ...rest
}) => {
  const combinedStyle = {
    color:
      variant === "primary" ? "var(--text-inverse)" : "var(--text-primary)",
    backgroundColor:
      variant === "primary" ? "var(--accent)" : "var(--surface-2)",
    borderColor:
      variant === "primary" ? "transparent" : "var(--border-strong)",
    opacity: disabled || isLoading ? 0.5 : 1,
    cursor: disabled || isLoading ? "not-allowed" : "pointer",
    ...style,
  };

  return (
    <button
      className={styles.main_Button}
      style={combinedStyle}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...rest}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(["primary", "secondary"]),
  children: PropTypes.node.isRequired,
  isLoading: PropTypes.bool,
  onClick: PropTypes.func,
  style: PropTypes.object,
  disabled: PropTypes.bool,
};

export default Button;
