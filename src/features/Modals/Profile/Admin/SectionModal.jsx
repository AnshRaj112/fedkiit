"use client";

import { Input } from "../../../../components";
import styles from "./styles/Preview.module.scss";

const getFieldPlaceholder = (field) => {
  if (field.type === "select") return `Choose ${field.name}`;
  if (field.placeholder) return field.placeholder;

  const nameLower = (field.name || "").toLowerCase();
  if (nameLower.includes("roll")) {
    return "Enter Roll Number";
  }
  if (nameLower.includes("whatsapp") || nameLower.includes("phone") || nameLower.includes("contact")) {
    return "Enter WhatsApp Number";
  }
  if (nameLower.includes("email")) {
    return "Enter Email Address";
  }
  if (
    field.value &&
    typeof field.value === "string" &&
    !field.value.toLowerCase().includes("whatsapp")
  ) {
    return field.value;
  }
  return `Enter ${field.name || "detail"}`;
};

const Section = ({ section, handleChange }) => {
  const getInputFields = (field) => {
    const validTypes = ["checkbox", "radio"];
    if (validTypes.includes(field.type)) {
      const valueToArray = field.value.split(",");
      return valueToArray.map((value, index) => (
        <div
          key={index}
          style={{
            marginTop: index === 0 ? ".5em" : "0",
          }}
        >
          <Input
            placeholder={value}
            label={value}
            showLabel={false}
            type={field.type}
            value={value}
            name={field.name}
            onChange={(e) => handleChange(field, e.target.value)}
          />
        </div>
      ));
    }
  };

  const getTeamFields = () => {
    const data = [];
    if (section.name === "Team Members") {
      section.fields.forEach((field, index) => {
        if (index % 3 === 0) {
          const team = section.fields.slice(index, index + 3);
          data.push(team);
        }
      });
      return data;
    }
  };

  const renderTeamFields = () => {
    return getTeamFields().map((team, index) => (
      <div
        key={index}
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {team.map((field, idx) => (
          <div
            key={idx}
            style={{
              flex: "1 1 30%",
              minWidth: "200px",
            }}
          >
            <Input
              placeholder={getFieldPlaceholder(field)}
              label={`${field.name} ${field.isRequired ? "*" : ""}`}
              type={field.type}
              name={field.name}
              style={{ width: "100%" }}
              value={
                field.type === "file" || field.type === "image"
                  ? field.onChangeValue?.name
                  : field.onChangeValue
              }
              onChange={(e) => {
                const val = field.type === "select" ? e : e.target.value;
                handleChange(field, val);
              }}
              options={
                field.type === "select"
                  ? field.value.split(",").map((option) => {
                      return { value: option, label: option };
                    })
                  : []
              }
            />
          </div>
        ))}
      </div>
    ));
  };

  return (
    <div key={section._id} className={styles.formFieldContainer}>
      {section.name === "Team Members" && renderTeamFields()}
      {section.name !== "Team Members" &&
        section.fields.length > 0 &&
        section.fields.map(
          (field) =>
            field !== undefined && (
              <div key={field._id}>
                {field.type !== "checkbox" && field.type !== "radio" ? (
                  <Input
                    placeholder={getFieldPlaceholder(field)}
                    label={`${field.name} ${field.isRequired ? "*" : ""}`}
                    type={field.type}
                    name={field.name}
                    value={
                      field.type === "file" || field.type === "image"
                        ? field.onChangeValue?.name
                        : field.onChangeValue
                    }
                    onChange={(e) => {
                      const val = field.type === "select" ? e : e.target.value;
                      handleChange(field, val);
                    }}
                    options={
                      field.type === "select"
                        ? field.value.split(",").map((option) => {
                            return { value: option, label: option };
                          })
                        : []
                    }
                  />
                ) : (
                  <label
                    style={{
                      color: "#fff",
                      fontSize: ".8em",
                    }}
                  >
                    {field.name}
                  </label>
                )}
                {getInputFields(field)}
              </div>
            )
        )}
    </div>
  );
};

export default Section;
