import { program } from "commander";
import { handleAdd } from "./commands/add";
import { handleFrom } from "./commands/from";

const tools = program.command("tool");

tools
	.command("add")
	.description("Add a new tool to toolk")
	.argument("<name>", "Name of the new tool")
	.action(handleAdd);

tools
	.command("from")
	.description("Create a new tool from a Bash script")
	.argument("<scriptPath>", "Path to the Bash script")
	.option("--name <name>", "-n", "Name of the new tool")
	.action(handleFrom);
