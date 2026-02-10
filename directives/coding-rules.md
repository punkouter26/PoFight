# PoFight Coding Rules

> Master directive for all development on the PoFight solution.

## Naming & Identity

- **Unified Identity**: Use `Po{SolutionName}` as the master prefix → `PoFight`
- Namespaces: `PoFight.API`, `PoFight.API.Tests`, etc.
- Azure Resource Groups: `rg-PoFight-{env}` (e.g., `rg-PoFight-prod`)
- Aspire resources follow the same prefix.

## Global Cleanup

- Maintain a "zero-waste" codebase: delete unused files, dead code, obsolete assets.

## Safety Standards

- `Directory.Build.props` at root enforces:
  - `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`
  - `<Nullable>enable</Nullable>`

## Health Checks

- Implement a `/health` endpoint to verify connections to all APIs and databases.

## Context Management

- `.copilotignore` excludes `bin/`, `obj/`, and `node_modules/` from AI focus.

## Telemetry

- Enable OpenTelemetry globally; aggregate to Application Insights in PoShared.

## Tooling & Packages

- Use Context7 MCP for latest SDKs.
- Central Package Management (CPM) via `Directory.Packages.props` with transitive pinning.

## API UI

- Use OpenApi.

## Secrets & Config

- **Local**: Use `dotnet user-secrets`; backup in PoShared Key Vault.
- **Cloud**: Use Azure Key Vault via Managed Identity within subscription `Punkouter26` (`Bbb8dfbe-9169-432f-9b7a-fbf861b51037`).
- **Shared Resources**: Locate common services and secrets in the `PoShared` resource group.

## Development

- Create `.http` files for API debugging.
- Implement robust server/browser logging for function calls.
- Apply GoF/SOLID patterns + explanatory comments when possible.
- **Ports**: Use `5000` (HTTP) and `5001` (HTTPS).
- For any major feature created, create corresponding UNIT/INTEGRATION/E2E tests.

## Diagnostics

- All apps should have `/diag` page that exposes all connection strings, keys, values, secrets in JSON format — hide middle of values for security.

## Ambiguity Handling

- In Plan Mode, if there is any ambiguity or need for further input, stop and consult user before proceeding with implementation.

## Testing Strategy

- **Unit (C#)**: Pure logic and domain rules.
- **Integration (C#)**: API/DB testing using Testcontainers (SQL/Redis).
- **E2E (Playwright/TS)**: Headless Chromium/Mobile for critical paths. Run headed in dev.
- **Auth Bypass**: Use a test-only login endpoint or custom `AuthenticationHandler`.
- If app uses Google or Microsoft login: add `AddTestAuth()` in Dev to allow faking OAuth via `/dev-login`. Use dev login for E2E testing and manual local testing.
- Create HTTP endpoints for all main functions so they can easily be tested via curl or `.http` files.

## React + .NET 10 API (Static Web App / App Service)

- **Progressive Dev**: Start client-only; use client-side storage for local data.
- **Integration**: Use .NET API for data (leaderboards) once integrated.
- **Resilience**: Ensure the app remains functional if the API is offline.
- Code the React client app so it is still functional if no API exists or it cannot connect to an API.
