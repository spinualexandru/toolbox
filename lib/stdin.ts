export async function readStdin(timeoutMs = 30000): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		let data = "";
		let timeoutId: Timer | undefined;

		const cleanup = () => {
			if (timeoutId) clearTimeout(timeoutId);
			process.stdin.removeAllListeners("data");
			process.stdin.removeAllListeners("end");
			process.stdin.removeAllListeners("error");
		};

		if (timeoutMs > 0) {
			timeoutId = setTimeout(() => {
				cleanup();
				reject(new Error(`Stdin read timed out after ${timeoutMs}ms`));
			}, timeoutMs);
		}

		process.stdin.setEncoding("utf8");
		process.stdin.on("data", (chunk) => {
			data += chunk;
		});
		process.stdin.on("end", () => {
			cleanup();
			resolve(data.trim());
		});
		process.stdin.on("error", (err) => {
			cleanup();
			reject(err);
		});
	});
}
