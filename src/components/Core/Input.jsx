"use client";

import { forwardRef, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FaRegCalendarAlt } from "react-icons/fa";
import Select, { components } from "react-select";
import DatePicker from "react-date-picker";
import { AiOutlineDown } from "react-icons/ai";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import DatePickerWithTime from "react-datepicker";
import styles from "./styles/Core.module.scss";

const CustomInput = forwardRef(
  ({ value, onClick, placeholder = "Select Date & Time" }, ref) => (
    <div
      onClick={onClick}
      ref={ref}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <p
        style={{
          margin: "4px",
          fontSize: "12px !important",
          opacity: value ? 1 : 0.5,
          fontWeight: "100 !important",
        }}
      >
        {value || placeholder}
      </p>
      <FaRegCalendarAlt
        color="var(--text-primary)"
        size={18}
        style={{
          position: "absolute",
          top: "20%",
          right: "8px",
        }}
      />
    </div>
  )
);

CustomInput.displayName = "CustomInput";

CustomInput.propTypes = {
  value: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

const customStyles = {
  control: (provided) => ({
    ...provided,
    display: "flex",
    outline: "none",
    width: "99.5%",
    minHeight: "44px",
    fontSize: "0.9375rem",
    backgroundColor: "var(--surface-0)",
    borderRadius: "var(--radius-md)",
    color: "var(--text-primary)",
    marginBottom: "0",
    marginLeft: "8px",
    marginRight: "8px",
    marginTop: "4px",
    position: "relative",
    border: "1px solid var(--border)",
    boxShadow: "none",
    "&:hover": {
      borderColor: "var(--border)",
    },
  }),
  menu: (provided) => ({
    ...provided,
    width: "99.5%",
    marginLeft: "8px",
    backgroundColor: "var(--surface-2)",
    border: "1px solid var(--border-strong)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--depth)",
    overflow: "hidden",
    zIndex: 1200,
  }),
  menuPortal: (provided) => ({ ...provided, zIndex: 1200 }),
  placeholder: (provided) => ({
    ...provided,
    display: "flex",
    alignItems: "center",
    color: "var(--text-tertiary)",
  }),
  option: (provided, state) => ({
    ...provided,
    color: state.isSelected ? "var(--accent)" : "var(--text-primary)",
    backgroundColor: state.isSelected
      ? "var(--accent-quiet)"
      : "var(--surface-2)",
    cursor: "pointer",
    width: "100%",
    border: "none",
    margin: "0",
    borderRadius: "0",
    "&:hover": {
      backgroundColor: "var(--surface-3)",
      color: "var(--text-primary)",
    },
    "&:active": {
      backgroundColor: "var(--surface-3)",
      color: "var(--accent)",
    },
  }),
  indicatorSeparator: (provided) => ({
    ...provided,
    display: "none",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "center",
    fontSize: "0.9375rem"
  }),
};

const DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <AiOutlineDown
        color="var(--text-secondary)"
        size={20}
        style={{
          position: "absolute",
          right: "12px",
          top: "25%",
        }}
      />
    </components.DropdownIndicator>
  );
};

const coerceDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const Input = (props) => {
  const {
    type = "text",
    containerStyle,
    style,
    placeholder,
    value,
    onChange,
    label,
    options,
    name,
    showLabel = true,
    className,
    containerClassName,
    ...rest
  } = props;
  const dateRef = useRef(null);
  const fileRef = useRef(null);
  const imgRef = useRef(null);
  const [showPassword, setshowPassword] = useState(false);
  const [previewFile, setpreviewFile] = useState(null);

  const filterPassedTime = (time) => {
    const selected = coerceDate(time);
    if (!selected) return true;
    const now = new Date();
    // Only filter times earlier today - editing past events must still work.
    if (selected.toDateString() !== now.toDateString()) return true;
    return selected.getTime() >= now.getTime();
  };

  const getInputTypes = () => {
    switch (type) {
      case "text":
        return (
          <input
            name={name}
            className={`${styles.input} ${className}`}
            type={type}
            style={style || {}}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            {...rest}
          />
        );

      case "number":
        return (
          <input
            name={name}
            className={`${styles.input} ${className}`}
            type={type}
            style={style || {}}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            {...rest}
          />
        );

      case "textArea":
        return (
          <textarea
            name={name}
            className={`${styles.input} ${styles.inputTxtArea} ${className}`}
            type={type}
            style={style || {}}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            {...rest}
          />
        );

      case "select":
        return (
          <div>
            <Select
              name={name}
              placeholder={placeholder}
              value={options.find((option) => option.value === value) || ""}
              options={options}
              onChange={(selectedOption) => onChange(selectedOption.value)}
              styles={customStyles}
              components={{ DropdownIndicator }}
              isSearchable={false}
              className={className}
              menuPosition="auto"
              {...rest}
            />
          </div>
        );

      case "date":
        return (
          <div>
            <DatePicker
              name={name}
              className={`${styles.input} ${styles.inputDate} ${className}`}
              ref={dateRef}
              placeholder={placeholder}
              value={coerceDate(value)}
              onChange={onChange}
              clearIcon={null}
              style={style || {}}
              calendarIcon={
                <FaRegCalendarAlt
                  color="var(--text-primary)"
                  size={18}
                  style={{
                    position: "absolute",
                    top: "25%",
                    right: "12px",
                  }}
                />
              }
              {...rest}
            />
          </div>
        );
      case "datetime-local":
        return (
          <div className={`${styles.input} ${styles.inputDate} ${className}`}>
            <DatePickerWithTime
              name={name}
              ref={dateRef}
              selected={coerceDate(value)}
              onChange={onChange}
              showTimeSelect
              filterTime={filterPassedTime}
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="Time"
              dateFormat="MMMM d, yyyy h:mm aa"
              customInput={<CustomInput placeholder={placeholder} />}
              calendarClassName={styles.dateTimeCalendar}
              popperPlacement="bottom-start"
              {...rest}
            />
          </div>
        );
      case "radio":
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <input
              name={name}
              className={styles.input}
              type={type}
              style={{ width: "auto" }}
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              {...rest}
            />
            <label
              style={{
                color: "#fff",
                fontSize: ".8em",
                marginLeft: "2px",
                marginTop: "-5px",
              }}
              htmlFor={name}
            >
              {label}
            </label>
          </div>
        );
      case "checkbox":
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <input
              name={name}
              className={styles.input}
              type={type}
              style={{ width: "auto" }}
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              {...rest}
            />
            <label
              style={{
                color: "#fff",
                fontSize: ".8em",
                marginLeft: "2px",
                marginTop: "-5px",
              }}
              htmlFor={name}
            >
              {label}
            </label>
          </div>
        );

      case "password":
        return (
          <div>
            <div
              style={{
                position: "relative",
              }}
            >
              <input
                name={name}
                maxLength={rest.maxLength || 20}
                max={rest.max || 20}
                className={styles.input}
                type={showPassword ? "text" : "password"}
                style={style || {}}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                {...rest}
              />
              {showPassword ? (
                <FaEyeSlash
                  onClick={() => setshowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "16px",
                    top: "25%",
                    cursor: "pointer",
                  }}
                  color="#fff"
                  size={18}
                />
              ) : (
                <FaEye
                  onClick={() => setshowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "16px",
                    top: "25%",
                    cursor: "pointer",
                  }}
                  color="#fff"
                  size={18}
                />
              )}
            </div>
          </div>
        );
      case "file":
        return (
          <div
            className={styles.input}
            onClick={() => fileRef.current?.click()}
            style={{
              height: "40px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              userSelect: "none",
            }}
          >
            <input
              ref={fileRef}
              name={name}
              type={type}
              style={{
                display: "none",
              }}
              placeholder={placeholder}
              onChange={() => {
                const e = {
                  target: {
                    value: fileRef.current.files[0],
                  },
                };
                setpreviewFile(URL.createObjectURL(fileRef.current.files[0]));
                onChange(e);
              }}
              {...rest}
            />
            {previewFile && (
              <img
                src={previewFile}
                style={{
                  height: "24px",
                  width: "24px",
                  borderRadius: "8px",
                  marginRight: "8px",
                }}
              />
            )}
            <span
              style={{
                color: "#fff",
                opacity: value ? 1 : 0.5,
                width: "100%",
                overflow: "hidden",
              }}
            >
              {value || "No file selected"}
            </span>
          </div>
        );
      case "image":
        return (
          <div
            className={styles.input}
            onClick={() => {
              imgRef.current?.click();
            }}
            style={{
              height: "40px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              userSelect: "none",
            }}
          >
            <input
              ref={imgRef}
              name={name}
              type={"file"}
              accept="image/png, image/jpeg, image/jpg"
              style={{
                display: "none",
              }}
              placeholder={placeholder}
              onChange={() => {
                const e = {
                  target: {
                    value: imgRef.current.files[0],
                  },
                };
                setpreviewFile(URL.createObjectURL(imgRef.current.files[0]));
                onChange(e);
              }}
              {...rest}
            />
            {previewFile && (
              <img
                src={previewFile}
                style={{
                  height: "24px",
                  width: "24px",
                  borderRadius: "8px",
                  marginRight: "8px",
                }}
              />
            )}
            <span
              style={{
                color: "#fff",
                opacity: value ? 1 : 0.5,
                width: "100%",
                overflow: "hidden",
              }}
            >
              {value || "No images selected"}
            </span>
          </div>
        );
      default:
        return (
          <input
            name={name}
            className={styles.input}
            type={type}
            style={style || {}}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            {...rest}
          />
        );
    }
  };

  return (
    <div
      className={`${styles.containerInput} ${containerClassName}`}
      style={
        containerStyle || {
          marginTop: type === "select" ? "0" : "8px",
        }
      }
    >
      {showLabel && (
        <label
          style={{
            color: "#fff",
            marginBottom: "4px",
            fontSize: ".8em",
            marginLeft: "8px",
          }}
          htmlFor={label}
        >
          {label}
        </label>
      )}
      {getInputTypes()}
    </div>
  );
};

Input.propTypes = {
  type: PropTypes.oneOf([
    "text",
    "number",
    "textarea",
    "select",
    "date",
    "datetime-local",
    "radio",
    "checkbox",
    "password",
  ]),
  containerStyle: PropTypes.object,
  style: PropTypes.object,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
    PropTypes.instanceOf(Date),
  ]),
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
    })
  ),
  name: PropTypes.string,
  showLabel: PropTypes.bool,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
};

export default Input;
