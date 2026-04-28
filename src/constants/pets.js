export const TEMPERAMENTS = ["friendly", "calm", "energetic", "nervous", "aggressive", "independent"];

export const VACCINES = [
  { label: "Rabies",           species: ["dog", "cat"] },
  { label: "DHPP",             species: ["dog"] },
  { label: "Bordetella",       species: ["dog"] },
  { label: "Leptospirosis",    species: ["dog"] },
  { label: "Lyme",             species: ["dog"] },
  { label: "Canine Influenza", species: ["dog"] },
  { label: "FVRCP",            species: ["cat"] },
  { label: "FeLV",             species: ["cat"] },
  { label: "Other",            species: [] },
];

export const TEMPERAMENT_CLASSES = {
  friendly:    "bg-temperament-friendly text-temperament-friendlyText",
  calm:        "bg-temperament-calm text-temperament-calmText",
  energetic:   "bg-temperament-energetic text-temperament-energeticText",
  nervous:     "bg-temperament-nervous text-temperament-nervousText",
  aggressive:  "bg-temperament-aggressive text-temperament-aggressiveText",
  independent: "bg-temperament-independent text-temperament-independentText",
};
