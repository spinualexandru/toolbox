import type { InspectColor } from "util";
import { styleText } from "util";

const colorToBackgroundColor = (colorName: string): string | null => {
	if (!colorName) return null;
	return `bg${colorName.charAt(0).toUpperCase() + colorName.slice(1)}`;
};

export const log = (message: string, textColor = "white", bgColor = "") => {
	const bgColorName = colorToBackgroundColor(bgColor);

	const styledText = styleText(
		[textColor, bgColorName].filter(Boolean) as InspectColor[],
		message,
	);

	console.log(styledText);
};
