import { $ } from "bun";

const program = (globalThis as Record<string, unknown>)
	.toolkProgram as typeof import("commander").program;

interface SystemdService {
	unit: string;
	load: string;
	active: string;
	sub: string;
	description: string;
}

interface ServicesOptions {
	active?: boolean;
	failed?: boolean;
	json?: boolean;
	filter?: string;
}

function getStatusColor(active: string, sub: string): string {
	if (active === "active" && sub === "running") return "green";
	if (active === "failed") return "red";
	if (active === "inactive") return "gray";
	return "yellow";
}

function formatColoredTable(services: SystemdService[]): void {
	if (services.length === 0) {
		console.log("No services found.");
		return;
	}

	const headers = ["UNIT", "LOAD", "ACTIVE", "SUB", "DESCRIPTION"];
	const rows = services.map((s) => [
		s.unit,
		s.load,
		s.active,
		s.sub,
		s.description,
	]);

	const columnWidths = headers.map((header, i) => {
		const maxContentWidth = Math.max(
			...rows.map((row) => (row[i] ?? "").length),
		);
		return Math.max(header.length, maxContentWidth);
	});

	const formatRow = (cells: string[]) =>
		cells.map((cell, i) => cell.padEnd(columnWidths[i] ?? 0)).join("  ");

	console.log(formatRow(headers));
	console.log(columnWidths.map((w) => "─".repeat(w)).join("──"));

	for (const service of services) {
		const color = getStatusColor(service.active, service.sub);
		const row = formatRow([
			service.unit,
			service.load,
			service.active,
			service.sub,
			service.description,
		]);

		console.log(
			`\x1b[${color === "green" ? "32" : color === "red" ? "31" : color === "gray" ? "90" : "33"}m${row}\x1b[0m`,
		);
	}
}

program
	.command("services")
	.alias("svc")
	.description("List and display systemd services")
	.option("-a, --active", "Show only active services")
	.option("-f, --failed", "Show only failed services")
	.option("-j, --json", "Output as JSON")
	.option("--filter <pattern>", "Filter services by name pattern")
	.action(async (options: ServicesOptions) => {
		try {
			const result =
				await $`systemctl list-units --output=json --no-pager --all`.quiet();

			if (result.exitCode !== 0) {
				console.error("Failed to fetch systemd units");
				process.exit(1);
			}

			const units = JSON.parse(result.stdout.toString()) as SystemdService[];

			let services = units.filter((unit) => unit.unit.endsWith(".service"));

			if (options.active) {
				services = services.filter((s) => s.active === "active");
			}

			if (options.failed) {
				services = services.filter((s) => s.active === "failed");
			}

			if (options.filter) {
				const pattern = new RegExp(options.filter, "i");
				services = services.filter((s) => pattern.test(s.unit));
			}

			if (options.json) {
				console.log(JSON.stringify(services, null, 2));
			} else {
				formatColoredTable(services);
				console.log(`\nTotal: ${services.length} service(s)`);
			}
		} catch (error) {
			console.error(
				error instanceof Error ? error.message : "Failed to list services",
			);
			process.exit(1);
		}
	});
