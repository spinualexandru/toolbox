import { program } from "commander";

async function whoisQuery(server: string, query: string): Promise<string> {
	return new Promise((resolve, reject) => {
		let data = "";
		const timeout = setTimeout(() => {
			reject(new Error(`Connection to ${server} timed out`));
		}, 10000);

		Bun.connect({
			hostname: server,
			port: 43,
			socket: {
				close() {
					clearTimeout(timeout);
					resolve(data);
				},
				data(_, chunk) {
					data += chunk.toString();
				},
				error(_, err) {
					clearTimeout(timeout);
					reject(err);
				},
				open(socket) {
					socket.write(`${query}\r\n`);
				},
			},
		});
	});
}

function extractTld(domain: string): string {
	const parts = domain.toLowerCase().split(".");
	return parts[parts.length - 1] ?? "";
}

async function findWhoisServer(tld: string): Promise<string | null> {
	const ianaResponse = await whoisQuery("whois.iana.org", tld);
	const match = ianaResponse.match(/whois:\s*(\S+)/i);
	return match?.[1] ?? null;
}

function isRegistered(response: string): boolean {
	const notFoundPatterns = [
		/no match/i,
		/not found/i,
		/no data found/i,
		/no entries found/i,
		/nothing found/i,
		/domain not found/i,
		/no object found/i,
		/status:\s*free/i,
		/status:\s*available/i,
	];
	return !notFoundPatterns.some((pattern) => pattern.test(response));
}

interface WhoisOptions {
	server?: string;
	raw?: boolean;
	checkOnly?: boolean;
	repl?: boolean;
}

async function replMode(options: WhoisOptions) {
	const prompt = "whois> ";
	process.stdout.write(prompt);

	for await (const line of console) {
		const domain = line.trim();

		if (!domain || domain === "exit" || domain === "quit") {
			break;
		}

		try {
			const tld = extractTld(domain);
			const server = options.server ?? (await findWhoisServer(tld));

			if (!server) {
				console.error(`No WHOIS server found for .${tld}`);
				process.stdout.write(prompt);
				continue;
			}

			const response = await whoisQuery(server, domain);

			if (options.checkOnly) {
				console.log(JSON.stringify({ registered: isRegistered(response) }));
			} else {
				console.log(
					`\nWHOIS lookup for ${domain} (server: ${server})\n${"─".repeat(50)}`,
				);
				console.log(response.trim());
				console.log();
			}
		} catch (error) {
			console.error(
				error instanceof Error ? error.message : "WHOIS lookup failed",
			);
		}

		process.stdout.write(prompt);
	}
}

program
	.command("whois [domain]")
	.description("Perform a WHOIS lookup for a domain")
	.option("-s, --server <server>", "Specify WHOIS server directly")
	.option("-r, --raw", "Show raw output without header")
	.option(
		"-c, --check-only",
		"Only check if domain is registered (JSON output)",
	)
	.option("-R, --repl", "Interactive mode - enter domains repeatedly")
	.action(async (domain: string | undefined, options: WhoisOptions) => {
		if (options.repl || !domain) {
			await replMode(options);
			return;
		}

		try {
			const tld = extractTld(domain);
			const server = options.server ?? (await findWhoisServer(tld));

			if (!server) {
				console.error(`No WHOIS server found for .${tld}`);
				process.exit(1);
			}

			const response = await whoisQuery(server, domain);

			if (options.checkOnly) {
				console.log(
					JSON.stringify({ isRegistered: isRegistered(response) }, null, 4),
				);
				return;
			}

			if (!options.raw) {
				console.log(
					`WHOIS lookup for ${domain} (server: ${server})\n${"─".repeat(50)}`,
				);
			}
			console.log(response.trim());
		} catch (error) {
			console.error(
				error instanceof Error ? error.message : "WHOIS lookup failed",
			);
			process.exit(1);
		}
	});
