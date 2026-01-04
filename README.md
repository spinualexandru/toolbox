# toolbox

A modular CLI toolbox built with Bun and Commander.js. Easily extendable with a plugin-like module system.

Note: Some modules may require additional system dependencies (e.g., `ollama`). The tool was primarily developed for my personal use on Linux, I encourage you to adapt it to your needs.

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
| `ollama on/off` | Start/stop local Ollama server |
| `tool add <name>` | Scaffold a new tool module |
| `tool from <script>` | Create a tool from a Bash script |
| `edit` | Open toolbox in editor |
| `install-completions` | Generate shell completions |

### Examples

```bash
# AI (supports Google and Ollama providers)
bun run start ai ask "explain async/await"
echo "what is rust?" | bun run start ai ask
bun run start ai chat                   # Interactive mode

# Add a new tool
bun run start tool add mytool
```

## Configuration

Built-in modules are enabled/disabled in `boot.yaml`. Some modules support additional config:

```yaml
modules:
  ai:
    enabled: true
    provider: google    # or "ollama"
    model: gemini-3-flash-preview
```

## Adding New Modules

### User Modules (Recommended)

User modules are auto-discovered from `~/.config/toolbox/modules/` (or `$XDG_CONFIG_HOME/toolbox/modules/`). No configuration needed.

1. Create a file (e.g., `~/.config/toolbox/modules/mytool.ts`)
2. Register commands using the global program:

```typescript
const program = (globalThis as Record<string, unknown>).toolboxProgram as typeof import("commander").program;

program
  .command("mytool")
  .description("My custom tool")
  .action(async () => {
    // implementation
  });
```

Supports both `mytool.ts` and `mytool/index.ts` patterns.

### Built-in Modules

For modules shipped with the toolbox, create a file in `modules/` and enable it in `boot.yaml`:

```typescript
import { program } from "commander";

program.command("mytool").action(async () => { /* ... */ });
```

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
