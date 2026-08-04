/**
 * The Year dropdown, in one place.
 *
 * Three screens each carried their own copy — sign-up, complete-profile and
 * edit-profile — with different values ("1st" vs "1st Year") and different
 * casing. That is how six spellings of the same year ended up in the database,
 * splitting one cohort across three buckets in the EventStats year counts.
 *
 * Values here are the canonical stored form; `normalizeYear` in
 * `lib/academic.ts` folds anything older onto the same set on write.
 *
 * The year is chosen, not derived: a lateral-entry student admitted in 2025
 * joins the 2024 batch directly in 2nd year, which no roll number implies.
 */
export const YEAR_OPTIONS = [
  { value: "1st", label: "1st Year" },
  { value: "2nd", label: "2nd Year" },
  { value: "3rd", label: "3rd Year" },
  { value: "4th", label: "4th Year" },
  { value: "5th", label: "5th Year" },
  { value: "Passout", label: "Passout" },
];

export default YEAR_OPTIONS;
