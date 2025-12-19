# toolbox

A modular CLI toolbox built with Bun and Commander.js. Easily extendable with a plugin-like module system.

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
| `ai chat [prompt]` | Chat with Google Gemini AI (supports stdin piping) |
| `brightness <level>` | Set screen brightness (0-600) |
| `whois [domain]` | WHOIS lookup with interactive REPL mode |
| `ollama on/off` | Start/stop local Ollama server |
| `tool add <name>` | Scaffold a new tool module |
| `tool from <script>` | Create a tool from a Bash script |
| `edit` | Open toolbox in editor |
| `install-completions` | Generate fish shell completions |

### Examples

```bash
# AI chat
bun run start ai chat "explain async/await"
echo "what is rust?" | bun run start ai chat

# WHOIS lookup
bun run start whois example.com
bun run start whois --repl              # Interactive mode
bun run start whois example.com --check-only

# Screen brightness
bun run start brightness 300

# Add a new tool
bun run start tool add mytool
```

## Configuration

Modules are enabled/disabled in `boot.yaml`:

```yaml
modules:
  ai:
    enabled: true
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
