"use client";

import { useEffect, useRef } from "react";
import { MdOutlineClose } from "react-icons/md";
import styles from "./styles/Form.module.scss";
import Input from "../Core/Input";
import Button from "../Core/Button";
import PropTypes from "prop-types";
import { Text } from "../Core";

const PopField = ({
  field,
  sections,
  handleClose,
  onFieldValidationChange,
  onAddValidation,
  onRemoveValidation,
}) => {
  const wrapperRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  });

  const handleClickOutside = (e) => {
    const { current: wrap } = wrapperRef;
    if (wrap && !wrap.contains(e.target)) {
      handleClose();
    }
  };

  const addCondition = () => {
    onAddValidation(field);
    setTimeout(() => {
      scrollRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);
  };

  const operators = [
    { label: "match", value: "===" },
    { label: "match not", value: "!==" },
    // { label: "contains", value: "includes" },
    // { label: "does not contain", value: "!includes" },
    { label: "less than", value: "<" },
    { label: "greater than", value: ">" },
    { label: "less than or equal to", value: "<=" },
    { label: "greater than or equal to", value: ">=" },
  ];

  const isFieldsFilled = () => {
    return field.validations.every((valid) => {
      return valid.type && valid.value && valid.operator;
    });
  };

  return (
    <div className={styles.popField} ref={wrapperRef}>
      <Text style={{ marginBottom: "12px" }} variant={"secondary"}>
        Field Validations
      </Text>
      {field?.validations?.map((valid, i) => (
        <div key={i} ref={scrollRef} className={styles.popFieldInpt}>
          <Input
            defaultValue={valid.type}
            name="Validation_Type"
            placeholder="Choose Type"
            label="On Type"
            type={"select"}
            value={valid.type}
            options={[
              { label: "Length", value: "length" },
              // { label: "Pattern", value: "pattern" },
              // { label: "Range", value: "range" },
            ]}
            className={styles.fieldInput}
            containerClassName={styles.popFieldInptContainer}
            onChange={(value) =>
              onFieldValidationChange(value, "type", field, valid._id)
            }
          />
          <Input
            defaultValue={valid.value}
            name="Validation_Value"
            placeholder="Make Sure"
            label="Make Sure"
            type={valid.type === "length" ? "number" : "text"}
            className={styles.fieldInput}
            containerClassName={styles.popFieldInptContainer}
            onChange={(e) =>
              onFieldValidationChange(e.target.value, "value", field, valid._id)
            }
          />
          <Input
            name="Validation_Operator"
            placeholder="Match Operator"
            label="Match Operator"
            type={"select"}
            options={operators}
            value={valid.operator}
            className={styles.fieldInput}
            containerClassName={styles.popFieldInptContainer}
            onChange={(value) =>
              onFieldValidationChange(value, "operator", field, valid._id)
            }
          />
          {field?.validations.length > 1 && (
            <MdOutlineClose
              size={24}
              onClick={() => {
                onRemoveValidation(field, valid._id);
              }}
              color="#FF8A00"
              style={{
                cursor: "pointer",
                marginTop: "12px",
                zIndex: 10,
              }}
            />
          )}
        </div>
      ))}
      <div
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <Button onClick={addCondition}>Add Validations</Button>
        <p
          title={`${field.name}_ID_${field._id}`}
          style={{
            color: "#fff",
            opacity: "0.4",
            fontSize: "11px",
            fontStyle: "italic",
            marginRight: "auto",
            marginLeft: sections.length > 1 ? 0 : "8px",
          }}
        >
          {field.name || "Field"}_{field._id} has ({field.validations.length}{" "}
          validations)
        </p>
        <Button onClick={handleClose} variant="secondary">
          Close
        </Button>
      </div>
    </div>
  );
};

PopField.propTypes = {
  field: PropTypes.shape({
    _id: PropTypes.number.isRequired,
    validations: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.number.isRequired,
        condition: PropTypes.string.isRequired,
        target: PropTypes.string.isRequired,
      })
    ).isRequired,
    type: PropTypes.oneOf([
      "text",
      "number",
      "radio",
      "checkbox",
      "select",
      "date",
    ]).isRequired,
  }).isRequired,
  sections: PropTypes.array.isRequired,
  handleClose: PropTypes.func.isRequired,
  onFieldValidationChange: PropTypes.func.isRequired,
  onAddValidation: PropTypes.func.isRequired,
  onRemoveValidation: PropTypes.func.isRequired,
};

export default PopField;
