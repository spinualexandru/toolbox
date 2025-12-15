export const withTemplate = async (
	templateName: string,
	data: Record<string, string>,
): Promise<string> => {
	const template = await Bun.file(`./templates/${templateName}.edge`).text();
	return template.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] || "");
};
