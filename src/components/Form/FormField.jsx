"use client";

import PropTypes from "prop-types";
import styles from "./styles/Form.module.scss";
import Input from "../Core/Input";
import { MdOutlineClose } from "react-icons/md";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { useState } from "react";
import PopField from "./PopField";
import Switch from "react-switch";
import { getOutboundList } from "../../sections/Profile/Admin/Form/NewForm/NewForm";
import { nanoid } from "nanoid";

const hasOptions = ["radio", "checkbox", "select"];

const fieldTypes = [
  {
    label: "Text",
    value: "text",
  },
  {
    label: "Number",
    value: "number",
  },
  {
    label: "Radio",
    value: "radio",
  },
  {
    label: "Checkbox",
    value: "checkbox",
  },
  {
    label: "List",
    value: "select",
  },
  {
    label: "Date",
    value: "date",
  },
  {
    label: "Image",
    value: "image",
  },
  {
    label: "File",
    value: "file",
  },
  // {
  //   label: "Email",
  //   value: "email",
  // },
  // {
  //   label: "URL",
  //   value: "url",
  // },
  // {
  //   label: "Phone",
  //   value: "tel",
  // },
];

function FormField(props) {
  const {
    field,
    section,
    setformFields,
    onRemoveField,
    sections,
    onFieldValidationChange,
    addNewValidation,
    onRemoveValidation,
  } = props;
  const [showPopMenu, setshowPopMenu] = useState(false);
  const showMenu = field.type && field.value;

  const handleChangeValue = (value, property) => {
    const newFields = [...section.fields];
    const fieldIndex = newFields.findIndex((fld) => fld._id === field?._id);

    if (fieldIndex === -1) {
      console.error("Field not found");
      return;
    }

    newFields[fieldIndex][property] = value;

    const values =
      typeof value !== "object"
        ? property === "isRequired"
          ? value
          : value
              .split(",")
              .map((val) => val.trim())
              .filter(Boolean)
        : [];

    if (property === "value") {
      const fieldValidation = {
        _id: nanoid(),
        type: "length",
        value: values.length > 1 ? 1 : 50,
        operator: "<=",
        message: `${field.name} should be less than ${
          values.length > 1 ? 1 : 200
        } characters long`,
      };

      newFields[fieldIndex].validations = [fieldValidation];

      if (values.length > 1) {
        const { backSection, nextSection } = getOutboundList(
          sections,
          section._id
        );

        let secValidations = [...section.validations];

        if (hasOptions.includes(field.type)) {
          secValidations = secValidations.filter(
            (val) => val.field_id !== field._id
          );

          values.forEach((val) => {
            secValidations.push({
              _id: nanoid(),
              field_id: field._id,
              onNext: nextSection?._id || null,
              onBack: backSection?._id || null,
              values: val,
            });
          });
        }
        section.validations = secValidations;
      }
    }

    if (property === "type") {
      newFields[fieldIndex].value = "";
      const secValidations = {
        _id: nanoid(),
        field_id: null,
        onNext: null,
        onBack: null,
        values: null,
      };
      section.validations =
        (section?.validations[0] === undefined
          ? [secValidations]
          : [section.validations[0]]) || [];
    }

    setformFields(newFields, property);
  };

  return (
    <>
      <div className={styles.mainFieldForm}>
        <Input
          value={field.name}
          placeholder="Enter Name"
          label="Field Name"
          name="Field_Name"
          className={styles.fieldInput}
          containerClassName={styles.containerInput}
          onChange={(e) => handleChangeValue(e.target.value, "name")}
        />
        <Input
          value={field.type}
          placeholder="Select Type"
          label="Field Type"
          name="Field_Type"
          type="select"
          className={styles.fieldInput}
          containerClassName={styles.containerInput}
          options={fieldTypes}
          onChange={(value) => handleChangeValue(value, "type")}
        />
        <Input
          value={
            typeof field.value === "object" ? field.value?.name : field.value
          }
          name="Field_Value"
          placeholder="Enter Value"
          label="Field Value"
          type={
            field.type === "file" || field.type === "image" ? "file" : "text"
          }
          disabled={field.type === "file" || field.type === "image"}
          style={{
            cursor:
              field.type === "file" || field.type === "image"
                ? "not-allowed"
                : "text",
          }}
          className={styles.fieldInput}
          containerClassName={styles.containerInput}
          onChange={(e) => {
            handleChangeValue(e.target.value, "value");
          }}
        />
        <div
          style={{
            marginTop: "16px",
            display: "flex",
            marginRight: "auto",
          }}
        >
          <Switch
            checked={field.isRequired}
            width={36}
            height={18}
            onColor="#FF8A00"
            checkedIcon={false}
            uncheckedIcon={false}
            title="Is this field required?"
            onChange={(value) => {
              handleChangeValue(value, "isRequired");
            }}
          />
        </div>
        {section.fields?.length > 1 && (
          <MdOutlineClose
            size={22}
            onClick={onRemoveField}
            color="#FF8A00"
            style={{
              cursor: "pointer",
              marginTop: "12px",
              zIndex: 10,
            }}
          />
        )}
        {showMenu && (
          <HiOutlineDotsVertical
            onClick={() => {
              setshowPopMenu(!showPopMenu);
            }}
            size={20}
            color="#FF8A00"
            style={{
              cursor: "pointer",
              marginTop: "10px",
              marginLeft: !["text", "number", "date"].includes(field.type)
                ? "8px"
                : "auto",
              zIndex: 10,
            }}
          />
        )}
        {showPopMenu && (
          <PopField
            field={field}
            onFieldValidationChange={onFieldValidationChange}
            handleClose={() => setshowPopMenu(false)}
            sections={sections.filter((sec) => sec._id !== section._id)}
            onAddValidation={addNewValidation}
            onRemoveValidation={onRemoveValidation}
          />
        )}
      </div>
    </>
  );
}

// FormField.propTypes = {
//   field: PropTypes.shape({
//     _id: PropTypes.number.isRequired,
//     name: PropTypes.string.isRequired,
//     type: PropTypes.oneOf([
//       "text",
//       "number",
//       "radio",
//       "checkbox",
//       "select",
//       "date",
//       "file",
//       "email",
//       "url",
//       "tel",
//       "image",
//     ]).isRequired,
//     value: PropTypes.string.isRequired,
//     isRequired: PropTypes.bool.isRequired,
//     validations: PropTypes.arrayOf(
//       PropTypes.shape({
//         _id: PropTypes.number.isRequired,
//         condition: PropTypes.string.isRequired,
//         target: PropTypes.string.isRequired,
//       })
//     ).isRequired,
//   }).isRequired,
//   lastField: PropTypes.object,
//   section: PropTypes.shape({
//     _id: PropTypes.number.isRequired,
//     fields: PropTypes.array.isRequired,
//   }).isRequired,
//   setformFields: PropTypes.func.isRequired,
//   onRemoveField: PropTypes.func.isRequired,
//   sections: PropTypes.array.isRequired,
//   onFieldValidationChange: PropTypes.func.isRequired,
//   addNewValidation: PropTypes.func.isRequired,
//   onRemoveValidation: PropTypes.func.isRequired,
// };

export default FormField;
