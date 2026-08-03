# MCP Usage

The repository includes `.mcp.json` entries for Nx, Angular CLI, Playwright, GitHub, and Prisma.

## Intended usage

- Nx MCP: inspect project graph, generators, targets, and boundaries.
- Angular MCP: current Angular guidance and workspace-aware operations.
- Playwright MCP: interact with the running UI and capture evidence.
- GitHub MCP: issues, pull requests, review, and repository context.
- Prisma MCP: schema and database workflows.

## Rules

- Prefer workspace-aware MCP tools over guessing commands.
- Never place tokens directly in `.mcp.json`.
- Do not allow generated output to bypass review or quality gates.
- Record notable tool incompatibilities in testing exceptions or architecture decisions.
