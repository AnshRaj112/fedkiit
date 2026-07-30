"use client";

import { useEffect, useRef } from "react";
import styles from "./styles/Form.module.scss";
import Input from "../Core/Input";
import { MdOutlineClose } from "react-icons/md";
import { Text } from "../Core";

const SectionValidation = ({
  handleClose,
  section,
  sections,
  fields,
  meta,
  onChangeValidation,
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

  const getSectionOptions = () => {
    const currentIndex = sections.findIndex((sec) => sec._id === section?._id);

    const options = sections
      .map((sec, index) => {
        if (index > currentIndex && index !== currentIndex) {
          return {
            label: `${sec.name}_${sec._id}`,
            value: sec._id,
          };
        }
        return null;
      })
      .filter(Boolean);

    const metaOptions =
      meta !== undefined
        ? meta.map((meta) => ({
            label: meta.name ? `${meta.name}_${meta._id}` : meta._id,
            value: meta._id,
          }))
        : [];

    return [...options, ...metaOptions] || [];
  };

  return (
    <div className={styles.sectionValidation} ref={wrapperRef}>
      <Text style={{ marginBottom: "12px" }} variant={"secondary"}>
        Section Redirects
      </Text>
      <Input
        value={
          section.validations[section.validations.length - 1]?.field_id || ""
        }
        type="select"
        placeholder="Enter Field ID"
        label={"Bind to Field"}
        options={fields.map((field) => ({
          label: field.name ? `${field.name}_${field._id}` : field._id,
          value: field._id,
        }))}
        onChange={(option) => onChangeValidation(option, "field_id")}
        className={styles.fieldInput}
        containerClassName={styles.bindInptContainer}
      />

      {section.validations.map(
        (valid, index) =>
          index !== 0 && (
            <div key={index} ref={scrollRef} className={styles.popFieldInpt}>
              <Input
                type="text"
                value={valid.values}
                label="On Value"
                placeholder="Enter Value"
                onChange={(e) =>
                  onChangeValidation(e.target.value, "values", valid._id)
                }
                disabled={true}
                className={styles.fieldInput}
                style={{ cursor: "not-allowed" }}
                containerClassName={styles.popFieldInptContainer}
              />
              <Input
                value={valid.onNext}
                label="Redirect to"
                type="select"
                options={[
                  ...getSectionOptions(),
                  { label: "End & Submit", value: "submit" },
                ]}
                placeholder="Enter Section ID"
                onChange={(option) =>
                  onChangeValidation(option, "onNext", valid._id)
                }
                className={styles.fieldInput}
                containerClassName={styles.popFieldInptContainer}
              />
              {section.validations.length > 2 && (
                <MdOutlineClose
                  size={24}
                  onClick={() => {
                    onRemoveValidation(valid._id);
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
          )
      )}
    </div>
  );
};

export default SectionValidation;
