# toolbox

A modular CLI toolbox built with Bun and Commander.js. Easily extendable with a plugin-like module system.

Note: Pre-installed modules may require additional system dependencies (e.g., `whois`, `wf-recorder`, `slurp`, `systemd`). The tool was primarily developed for my personal use on Linux, I encourage you to adapt it to your needs.

## Installation

```bash
bun install
```

## Usage

```bash
bun run start [command]
```

### Available Commands

| Command | Description |
|---------|-------------|
| `ai ask [prompt]` | One-shot AI question (supports stdin piping) |
| `ai chat` | Interactive AI chat session |
| `brightness <level>` | Set screen brightness (0-600) |
| `whois [domain]` | WHOIS lookup with interactive REPL mode |
| `ollama on/off` | Start/stop local Ollama server |
| `services` | List systemd services (alias: `svc`) |
| `record` | Record screen region using wf-recorder |
| `tool add <name>` | Scaffold a new tool module |
| `tool from <script>` | Create a tool from a Bash script |
| `edit` | Open toolbox in editor |
| `install-completions` | Generate fish shell completions |

### Examples

```bash
# AI (supports Google and Ollama providers)
bun run start ai ask "explain async/await"
echo "what is rust?" | bun run start ai ask
bun run start ai chat                   # Interactive mode

# WHOIS lookup
bun run start whois example.com
bun run start whois --repl              # Interactive mode

# Systemd services
bun run start services --active         # Show active services
bun run start svc --failed              # Show failed services
bun run start svc --filter docker       # Filter by name

# Screen recording
bun run start record                    # Select region with slurp

# Screen brightness
bun run start brightness 300

# Add a new tool
bun run start tool add mytool
```

## Configuration

Modules are enabled/disabled in `boot.yaml`. Some modules support additional config:

```yaml
modules:
  ai:
    enabled: true
    provider: google    # or "ollama"
    model: gemini-3-flash-preview
  whois:
    enabled: true
```

## Adding New Modules

1. Create a file in `modules/` (e.g., `modules/mytool.ts`)
2. Register commands using Commander:

```typescript
import { program } from "commander";

program
  .command("mytool")
  .description("My custom tool")
  .action(async () => {
    // implementation
  });
```

3. Enable it in `boot.yaml`:

```yaml
modules:
  mytool:
    enabled: true
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | Required for AI chat functionality |

## Development

```bash
bun run dev      # Run with watch mode
bun run check    # Lint and format check
bun run build.ts # Build to ./build
```
