// Wraps @expo/vector-icons (Feather set) and maps web's icon names to Feather names
// so we can reuse the same icon prop strings as the Next.js admin console.

import Feather from "@expo/vector-icons/Feather";

const MAP: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
  home: "home",
  chart: "bar-chart-2",
  book: "book-open",
  chat: "message-circle",
  bell: "bell",
  user: "user",
  settings: "settings",
  search: "search",
  plus: "plus",
  check: "check",
  chevR: "chevron-right",
  chevD: "chevron-down",
  chevL: "chevron-left",
  chevU: "chevron-up",
  arrowR: "arrow-right",
  arrowUp: "arrow-up",
  arrowDn: "arrow-down",
  close: "x",
  calendar: "calendar",
  clock: "clock",
  file: "file-text",
  download: "download",
  upload: "upload",
  star: "star",
  school: "book", // fallback — Feather has no "school"
  users: "users",
  dollar: "dollar-sign",
  creditcard: "credit-card",
  shield: "shield",
  flag: "flag",
  paperclip: "paperclip",
  send: "send",
  edit: "edit-2",
  trash: "trash-2",
  filter: "filter",
  moon: "moon",
  sun: "sun",
  mail: "mail",
  refresh: "refresh-ccw",
  sparkle: "zap",
  zap: "zap",
  lock: "lock",
  award: "award",
  camera: "camera",
  image: "image",
};

export function Icon({
  name,
  size = 20,
  color,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const featherName = MAP[name] ?? "circle";
  return <Feather name={featherName} size={size} color={color} />;
}
