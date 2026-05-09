export const GROOMING_SERVICES = [
  "Bath & Blow Dry",
  "Full Groom",
  "Nail Trim",
  "Ear Cleaning",
  "Teeth Brushing",
  "De-shedding Treatment",
  "Flea Treatment",
  "Puppy First Groom",
  "Senior Dog Groom",
  "Cat Groom",
  "Other",
];

export const DURATIONS = [
  { label: "30 min", value: 30  },
  { label: "1 hr",   value: 60  },
  { label: "1.5 hr", value: 90  },
  { label: "2 hr",   value: 120 },
  { label: "2.5 hr", value: 150 },
  { label: "3 hr",   value: 180 },
];

export const SCHEDULE_HOURS = { start: 8, end: 20 };

export const STATUS_LABEL = {
  pending:   "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_BADGE = {
  pending:   "bg-warning/10 text-warning",
  confirmed: "bg-primary-light text-primary",
  completed: "bg-success-light text-success-text",
  cancelled: "bg-tag-red text-tag-redText",
};

// Solid red/yellow/green pill for the schedule view appointment blocks.
export const STATUS_PILL = {
  pending:   { bg: "bg-warning", label: "Pending"   },
  confirmed: { bg: "bg-success", label: "Confirmed" },
  completed: { bg: "bg-success", label: "Done"      },
  cancelled: { bg: "bg-danger",  label: "Cancelled" },
};
