"use client";

import { useState, useRef } from "react";
import PropTypes from "prop-types";
import FormField from "./FormField";
import styles from "./styles/Form.module.scss";
import Button from "../Core/Button";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { Text } from "../Core";
import { getOutboundList } from "../../sections/Profile/Admin/Form/NewForm/NewForm";
import { GrNavigate } from "react-icons/gr";
import SectionValidation from "./SectionValidation";
import { nanoid } from "nanoid";

const hasOptions = ["radio", "checkbox", "select"];

const Section = (props) => {
  const {
    section,
    sections,
    setsections,
    meta,
    showAddButton = true,
    disabled = false,
  } = props;
  const [hideSection, sethideSection] = useState(false);
  const [showValidations, setshowValidations] = useState(false);
  const [showDescription, setshowDescription] = useState(false);
  const scrollRef = useRef(null);
  const sectionFields = section.fields || [];

  const onAddField = () => {
    const newSections = sections.map((sec) => {
      if (section._id === sec._id) {
        const newFields = [
          ...sec.fields,
          {
            _id: nanoid(),
            name: "",
            type: "",
            value: "",
            isRequired: true,
            validations: [],
          },
        ];
        return {
          ...sec,
          fields: newFields,
        };
      }
      return sec;
    });
    setsections(newSections);
    setTimeout(() => {
      scrollRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);
  };

  const onUpdateField = (field, property) => {
    const updatedSections = sections.map((sec) => {
      let updatedFields = sec.fields;
      if (section._id === sec._id) {
        updatedFields = sec.fields.map((fld) => {
          if (fld._id === field._id) {
            return field;
          }
          return fld;
        });
      }
      let updatedValidations = sec.validations;
      if (property === "type") {
        const { backSection, nextSection } = getOutboundList(
          sections,
          section._id
        );

        updatedValidations = updatedValidations?.map((valid) => {
          if (valid.onNext === section._id) {
            const nxtSec = getOutboundList(sections, sec._id)?.nextSection;
            return {
              ...valid,
              onNext: nxtSec?._id || null,
            };
          }
          if (valid.onBack === section._id) {
            const backSec = getOutboundList(sections, sec._id)?.backSection;
            return {
              ...valid,
              onBack: backSec?._id || null,
            };
          }
          return valid;
        });

        if (nextSection) {
          const nxtSec = getOutboundList(
            sections,
            nextSection._id
          )?.nextSection;

          if (nextSection.validations[0]) {
            nextSection.validations[0].onNext = nxtSec?._id || null;
          } else {
            nextSection.validations.push({
              _id: nanoid(),
              field_id: null,
              onNext: nxtSec?._id || null,
              onBack: backSection?._id || null,
              values: null,
            });
          }
          // nextSection.validations[0].onNext = nxtSec?._id || null;
        }

        if (backSection) {
          const backSec = getOutboundList(
            sections,
            backSection._id
          )?.backSection;
          backSection.validations[0].onBack = backSec?._id || null;
        }
      }

      return {
        ...sec,
        fields: updatedFields,
        validations: updatedValidations,
      };
    });

    setsections(updatedSections);
  };

  const onRemoveField = (field) => {
    const isConfirm = confirm("Are you sure you want to delete this field?");
    let prevSection = null;
    if (isConfirm) {
      const newSections = sections.map((sec) => {
        if (section._id === sec._id) {
          const newFields = sec.fields.filter((fld) => fld._id !== field?._id);
          const findValidation = sec.validations.find(
            (valid) => valid?.field_id && valid?.field_id === field?._id
          );
          if (findValidation) {
            prevSection = getOutboundList(
              sections,
              findValidation?.onNext
            )?.backSection;
            const removedValidations = sec.validations.filter(
              (valid) => valid?.field_id && valid?.field_id !== field._id
            );
            const findSection = sections.find(
              (sec) => sec._id === findValidation.onNext
            );

            if (findSection) {
              findSection.validations[0].onBack = prevSection?._id || null;
            }
            return {
              ...sec,
              validations: removedValidations,
              fields: newFields,
            };
          }
          return {
            ...sec,
            fields: newFields,
          };
        }
        return sec;
      });

      setsections(newSections);
    }
  };

  const onRemove = () => {
    const isConfirm = confirm("Are you sure you want to delete this section?");
    if (!isConfirm) return;

    const newSections = sections.filter((sec) => sec._id !== section._id);

    const { backSection, nextSection } = getOutboundList(sections, section._id);

    const updatedSections = newSections.map((sec) => {
      const updatedValidations = sec.validations.map((valid) => {
        if (valid.onNext === section._id) {
          const nxtSec = getOutboundList(sections, sec._id)?.nextSection;
          return {
            ...valid,
            onNext: nxtSec?._id || null,
          };
        }
        if (valid.onBack === section._id) {
          const backSec = getOutboundList(sections, sec._id)?.backSection;
          return {
            ...valid,
            onBack: backSec?._id || null,
          };
        }
        return valid;
      });

      if (nextSection) {
        const nxtSec = getOutboundList(sections, nextSection._id)?.nextSection;
        nextSection.validations[0].onNext = nxtSec?._id || null;
      }

      if (backSection) {
        const backSec = getOutboundList(sections, backSection._id)?.backSection;
        backSection.validations[0].onBack = backSec?._id || null;
      }

      return {
        ...sec,
        validations: updatedValidations,
      };
    });

    setsections(updatedSections);
  };

  const onFieldValidationChange = (value, property, field, validationIndex) => {
    const newSections = sections.map((sec) => {
      if (section._id === sec._id) {
        return {
          ...sec,
          fields: sec.fields.map((fld) => {
            if (fld._id === field._id) {
              const newValidations = fld.validations.map((valid) => {
                if (valid._id === validationIndex) {
                  return {
                    ...valid,
                    [property]: value,
                  };
                }
                return valid;
              });

              return {
                ...fld,
                validations: newValidations,
              };
            }
            return fld;
          }),
        };
      }
      return sec;
    });

    setsections(newSections);
  };

  const addNewValidation = (field) => {
    const newSections = sections.map((sec) => {
      if (section._id === sec._id) {
        return {
          ...sec,
          fields: sec.fields.map((fld) => {
            if (fld._id === field._id) {
              return {
                ...fld,
                validations: [
                  ...fld.validations,
                  {
                    _id: nanoid(),
                    type: "",
                    value: "",
                    operator: "",
                    message: "",
                  },
                ],
              };
            }
            return fld;
          }),
        };
      }
      return sec;
    });

    setsections(newSections);
  };

  const onRemoveValidation = (field, validationIndex) => {
    const newSections = sections.map((sec) => {
      if (section._id === sec._id) {
        return {
          ...sec,
          fields: sec.fields.map((fld) => {
            if (fld._id === field._id) {
              return {
                ...fld,
                validations: fld.validations.filter(
                  (valid) => valid._id !== validationIndex
                ),
              };
            }
            return fld;
          }),
        };
      }
      return sec;
    });

    setsections(newSections);
  };

  const isIncludesOptions = () => {
    return (
      section.fields.filter(
        (field) =>
          sections.length > 1 &&
          hasOptions.includes(field.type) &&
          field.value?.split(",").length > 1
      ) || []
    );
  };

  const handleVisibility = () => {
    sethideSection(!hideSection);
    setshowValidations(false);
  };

  const handleUpdateSectionTitle = () => {
    const title = prompt("Enter new section title", section.name);
    if (!title) return;
    if (title === section.name) return;
    const newSections = sections.map((sec) => {
      if (section._id === sec._id) {
        return {
          ...sec,
          name: title,
        };
      }
      return sec;
    });
    setsections(newSections);
  };

  const handleChangeSectionValidation = (value, property, _id) => {
    const { backSection, nextSection } = getOutboundList(sections, section._id);
    let previousOnNextValue = null;

    const updatedSections = sections.map((sec) => {
      if (sec._id === section._id) {
        if (property === "field_id") {
          const field = section.fields.find((fld) => fld._id === value);
          let secValidations = [section.validations[0]];

          const options = field?.value
            ?.split(",")
            .map((val) => val.trim())
            .filter(Boolean);

          options.forEach((val) => {
            secValidations.push({
              _id: nanoid(),
              field_id: value,
              onNext: nextSection?._id || null,
              onBack: backSection?._id || null,
              values: val,
            });
          });

          return {
            ...sec,
            validations: secValidations,
          };
        } else if (property === "values" || property === "onNext") {
          const updatedValidations = sec.validations.map((valid) => {
            if (_id && valid._id === _id) {
              if (property === "onNext") {
                previousOnNextValue = valid.onNext;
              }
              return {
                ...valid,
                [property]: value,
              };
            }
            return valid;
          });

          return {
            ...sec,
            validations: updatedValidations,
          };
        }
      }

      if (property === "onNext") {
        if (sec._id === value) {
          sec.validations[0].onBack = section._id;
          sec.validations[0].onNext = null;
        }

        if (previousOnNextValue && sec._id === previousOnNextValue) {
          const prvSection = getOutboundList(sections, sec._id)?.backSection;
          sec.validations[0].onBack = prvSection ? prvSection._id : null;
          sec.validations[0].onNext = null;
        }
      }

      const updatedValidations = sec.validations.map((valid) => {
        if (property === "field_id" && valid.onBack === section._id) {
          const prvSection = getOutboundList(sections, sec._id)?.backSection;
          return {
            ...valid,
            onBack: prvSection ? prvSection?._id : null,
          };
        }
        return valid;
      });

      return {
        ...sec,
        validations: updatedValidations,
      };
    });

    setsections(updatedSections);
  };

  const handleRemoveValidation = (_id) => {
    const newSections = sections.map((sec) => {
      if (section._id === sec._id) {
        return {
          ...sec,
          validations: sec.validations.filter((valid) => valid._id !== _id),
        };
      }
      return sec;
    });

    setsections(newSections);
  };

  return (
    <div
      title={
        disabled
          ? `${section.name} is an auto-generated section and cannot be edited.`
          : section.name
      }
      className={styles.formFieldContainer}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text
          onDoubleClick={handleUpdateSectionTitle}
          style={{
            userSelect: "none",
            cursor: "pointer",
          }}
          variant={"secondary"}
        >
          {section.name}
        </Text>
        {isIncludesOptions().length > 0 && (
          <GrNavigate
            size={24}
            color="#FF8A00"
            style={{ cursor: "pointer" }}
            onClick={() => setshowValidations(!showValidations)}
          />
        )}
      </div>
      {showDescription ? (
        <Text
          style={{
            cursor: "pointer",
            padding: "10px 0",
            fontSize: "11px",
            opacity: "0.4",
          }}
          onDoubleClick={() => setshowDescription(!showDescription)}
        >
          {section.description}
        </Text>
      ) : (
        <textarea
          value={section.description}
          onDoubleClick={() => {
            if (section.description?.length > 0) {
              setshowDescription(!showDescription);
            } else {
              setshowDescription(false);
              alert("Please enter a description");
            }
          }}
          onChange={(e) => {
            const newSections = sections.map((sec) => {
              if (section._id === sec._id) {
                return {
                  ...sec,
                  description: e.target.value,
                };
              }
              return sec;
            });
            setsections(newSections);
          }}
          minLength={10}
          maxLength={360}
          style={{
            width: "100%",
            padding: "10px 0",
            borderRadius: "0",
            fontSize: "12px",
            border: "none",
            margin: "4px 0 20px 0",
            backgroundColor: "transparent",
            borderBottom: "1px solid #fff",
            color: "#fff",
            resize: "none",
            outline: "none",
            height: "auto",
            maxHeight: "100px",
            opacity: section.description?.length > 0 ? 1 : 0.4,
          }}
          placeholder={`Enter ${section.name} Description`}
        />
      )}
      {!hideSection && (
        <div>
          {sectionFields.map((field) => (
            <div key={field._id} ref={scrollRef}>
              <FormField
                field={field}
                section={section}
                sections={sections}
                setformFields={(data, property) => {
                  onUpdateField(field, property);
                }}
                onRemoveField={() => {
                  onRemoveField(field);
                }}
                onFieldValidationChange={onFieldValidationChange}
                addNewValidation={() => addNewValidation(field)}
                onRemoveValidation={onRemoveValidation}
              />
            </div>
          ))}
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {showAddButton && (
          <Button
            style={{
              width: "15%",
              borderRadius: "30px",
            }}
            onClick={() => {
              onAddField();
              sethideSection(false);
              setshowValidations(false);
            }}
          >
            Add Field
          </Button>
        )}
        {sections.length > 1 && (
          <MdDelete
            size={20}
            onClick={onRemove}
            color="#FF8A00"
            style={{ cursor: "pointer", margin: "auto .7em" }}
          />
        )}
        <p
          title={`Section_${section.name}_${section._id}`}
          style={{
            color: "#fff",
            opacity: "0.4",
            fontSize: "11px",
            fontStyle: "italic",
            marginLeft: sections.length > 1 ? 0 : "8px",
          }}
        >
          {section.name}_{section._id} (total {sectionFields.length} fields)
        </p>

        {hideSection ? (
          <FaAngleDown
            onClick={handleVisibility}
            color="gray"
            size={24}
            style={{ cursor: "pointer", margin: "auto 0 auto auto" }}
          />
        ) : (
          <FaAngleUp
            size={24}
            onClick={handleVisibility}
            color="gray"
            style={{ cursor: "pointer", margin: "auto 0 auto auto" }}
          />
        )}
      </div>

      {showValidations && (
        <SectionValidation
          handleClose={() => setshowValidations(false)}
          section={section}
          sections={sections}
          meta={meta}
          fields={isIncludesOptions()}
          onChangeValidation={handleChangeSectionValidation}
          onRemoveValidation={handleRemoveValidation}
        />
      )}
      {disabled && <div className={styles.disabledSec} />}
    </div>
  );
};

Section.propTypes = {
  section: PropTypes.shape({
    _id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    fields: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
        isRequired: PropTypes.bool.isRequired,
        validations: PropTypes.arrayOf(
          PropTypes.shape({
            _id: PropTypes.number.isRequired,
            condition: PropTypes.string.isRequired,
            target: PropTypes.string.isRequired,
          })
        ).isRequired,
      })
    ).isRequired,
  }).isRequired,
  sections: PropTypes.array.isRequired,
  setsections: PropTypes.func.isRequired,
};

export default Section;