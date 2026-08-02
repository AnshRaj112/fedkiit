"use client";

import { useId, useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import styles from "./styles/Preview.module.scss";

/**
 * Field renderer for the registration flow.
 *
 * Uses native controls rather than the shared `Input` component: the platform
 * select and date pickers are what people already know on a phone, they carry
 * their own accessibility semantics, and they leave the styling entirely to this
 * stylesheet instead of a JS-injected theme.
 *
 * `handleChange(field, value)` is the only contract with PreviewForm - the value
 * is passed unwrapped, never as a synthetic event.
 */

const TEXTUAL = {
  text: "text",
  number: "number",
  email: "email",
  tel: "tel",
  url: "url",
  password: "password",
  date: "date",
  "datetime-local": "datetime-local",
  time: "time",
};

const FileField = ({ field, inputId, onChange }) => {
  const ref = useRef(null);
  const [name, setName] = useState("");

  return (
    <>
      <input
        ref={ref}
        id={inputId}
        name={field.name}
        type="file"
        className={styles.fileInput}
        accept={field.type === "image" ? "image/*" : undefined}
        onChange={() => {
          const file = ref.current?.files?.[0];
          if (!file) return;
          setName(file.name);
          onChange(file);
        }}
      />
      <label htmlFor={inputId} className={styles.fileTrigger}>
        <Paperclip size={15} aria-hidden="true" />
        <span className={name ? styles.fileName : styles.filePlaceholder}>
          {name || "Choose a file"}
        </span>
      </label>
    </>
  );
};

const Field = ({ field, handleChange }) => {
  const inputId = useId();
  const options = (field.value || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const onChange = (value) => handleChange(field, value);

  if (field.type === "checkbox" || field.type === "radio") {
    const selected = field.onChangeValue;
    return (
      <fieldset className={styles.field}>
        <legend className={styles.label}>
          {field.name}
          {field.isRequired && <span className={styles.required}>*</span>}
        </legend>
        <div className={styles.choices}>
          {options.map((option) => {
            const checked =
              field.type === "checkbox"
                ? Array.isArray(selected) && selected.includes(option)
                : selected === option;

            return (
              <label key={option} className={styles.choice} data-checked={checked || undefined}>
                <input
                  type={field.type}
                  name={`${field.name}-${field._id}`}
                  value={option}
                  checked={checked}
                  onChange={(e) => onChange(e.target.value)}
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={styles.label}>
        {field.name}
        {field.isRequired && <span className={styles.required}>*</span>}
      </label>

      {field.type === "select" ? (
        <div className={styles.selectWrap}>
          <select
            id={inputId}
            name={field.name}
            className={styles.control}
            value={field.onChangeValue || ""}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="" disabled>
              Choose {field.name.toLowerCase()}
            </option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <svg
            className={styles.selectIcon}
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m4 6.5 4 4 4-4" />
          </svg>
        </div>
      ) : field.type === "textArea" ? (
        <textarea
          id={inputId}
          name={field.name}
          className={`${styles.control} ${styles.textarea}`}
          rows={4}
          placeholder={field.value}
          value={field.onChangeValue || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === "file" || field.type === "image" ? (
        <FileField field={field} inputId={inputId} onChange={onChange} />
      ) : (
        <input
          id={inputId}
          name={field.name}
          type={TEXTUAL[field.type] || "text"}
          className={styles.control}
          placeholder={field.value}
          value={field.onChangeValue || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
};

const Section = ({ section, handleChange }) => {
  const fields = (section.fields || []).filter(Boolean);

  // The Team Members section is a flat list of fields that repeats every three
  // entries, one member per group. Grouping them into labelled blocks is what
  // makes a ten-input screen readable.
  if (section.name === "Team Members") {
    const members = [];
    for (let i = 0; i < fields.length; i += 3) {
      members.push(fields.slice(i, i + 3));
    }

    return (
      <div className={styles.fields}>
        {members.map((member, index) => (
          <fieldset key={index} className={styles.memberGroup}>
            <legend className={styles.memberLegend}>Member {index + 1}</legend>
            <div className={styles.memberFields}>
              {member.map((field) => (
                <Field
                  key={field._id}
                  field={field}
                  handleChange={handleChange}
                />
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.fields}>
      {fields.map((field) => (
        <Field key={field._id} field={field} handleChange={handleChange} />
      ))}
    </div>
  );
};

export default Section;
