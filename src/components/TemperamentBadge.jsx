import { TEMPERAMENT_CLASSES } from "../constants/pets";

export default function TemperamentBadge({ value }) {
  const classes = TEMPERAMENT_CLASSES[value?.toLowerCase()] ?? "bg-border text-text-muted";
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${classes}`}>
      {value}
    </span>
  );
}
