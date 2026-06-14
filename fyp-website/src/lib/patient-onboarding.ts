export interface PatientWizardData {
  // Step 1 – Account
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;

  // Step 2 – Contact
  phone: string;
  city: string;
  address: string;

  // Step 3 – About You
  dateOfBirth: string;
  gender: string;

  // Step 4 – Health (all optional)
  medicalHistory: string;
  allergies: string;
}

export const INITIAL_WIZARD_DATA: PatientWizardData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  city: "",
  address: "",
  dateOfBirth: "",
  gender: "",
  medicalHistory: "",
  allergies: "",
};

export const STEP_TITLES = ["Account", "Contact", "About You", "Health", "Review"];

export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

/** Returns an error message or null if valid */
export function validateStep(step: number, data: PatientWizardData): string | null {
  switch (step) {
    case 0:
      if (!data.firstName.trim()) return "First name is required";
      if (!data.lastName.trim()) return "Last name is required";
      if (!data.email.includes("@")) return "Valid email is required";
      if (data.password.length < 6) return "Password must be at least 6 characters";
      if (data.password !== data.confirmPassword) return "Passwords do not match";
      return null;
    case 1:
      if (!data.phone.trim()) return "Phone number is required";
      if (!data.city.trim()) return "City is required";
      return null;
    case 2:
    case 3:
      return null; // optional fields
    case 4:
      return null; // review step
    default:
      return null;
  }
}
