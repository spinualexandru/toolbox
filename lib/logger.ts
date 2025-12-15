import { color } from "bun";
import { styleText } from "util";
import type { InspectColor } from "util";

const colorToBackgroundColor = (colorName: string | null): string | null => {
  if (!colorName) return null;
  return `bg${colorName.charAt(0).toUpperCase() + colorName.slice(1)}`;
};

export const log = (message: string, _color = "white", _bgColor = "") => {
  const textColor = color(_color, "css");
  const bgColor = colorToBackgroundColor(color(_bgColor, "css"));

  const styledText = styleText(
    [textColor, bgColor].filter(Boolean) as InspectColor[],
    message,
  );

  console.log(styledText);
};
