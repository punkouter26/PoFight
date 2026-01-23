General Engineering Principles
Unified Identity: Use Po{SolutionName} as the master prefix for all namespaces, Azure Resource Groups, and Aspire resource names (e.g., PoTask1.API, rg-PoTask1-prod).
Global Cleanup: Actively delete unused files, dead code, or obsolete assets. Maintain a "zero-waste" codebase.
Directory.Build.props: Enforce <TreatWarningsAsErrors>true</TreatWarningsAsErrors> and <Nullable>enable</Nullable> at the repository root to ensure all projects inherit strict safety standards.
Have /health endpoint on the server project that checks connections to all APIs and databases used
Context Management: Maintain a .copilotignore file to exclude bin/, obj/, and node_modules/, keeping AI focus on source logic.
Modern Tooling: Use Context7 MCP to fetch the latest SDKs and NuGet versions, ensuring the AI agent is working with up-to-date documentation.
Package Management: Use Central Package Management (CPM) via Directory.Packages.props with transitive pinning enabled.
Standard: Use DefaultAzureCredential for all environment-agnostic resource access.
Local Development: Primary secrets reside in dotnet user-secrets.
Cloud/Production: Use Azure Key Vault via Managed Identity.
Shared Resources: All keys/secrets are stored in the PoShared resource group in the Key Vault service; use these as a local fallback only if user-secrets are absent.
When deploying services to Azure make sure you use this subscription Punkouter26
Bbb8dfbe-9169-432f-9b7a-fbf861b51037
Use the Managed Identity as needed that is already in the PoShared resource group
Use Context7 MCP to verify latest versions of .NET and any nuget/npm packages
Create .http files that can be helpful for debugging API endpoints (https://learn.microsoft.com/en-us/aspnet/core/test/http-files?view=aspnetcore-10.0)
Look in the Azure resource group PoShared for services to use
Looking into the Key Vault service contained in the resource group PoShared for Secrets and Keys 
Use Kay Vault when running code locally and in Azure
Create debug logs in the browser console and server to provide enough information during function calls to be helpful when debugging




Create a set of 3 test project / Unit (C#)/ Integration (C#) /E2E (typescript)
.NET Unit Tests: Focus on pure logic and domain rules (High speed).
.NET Integration Tests: Target the API and Database. Use Testcontainers to spin up ephemeral SQL/Redis instances to verify real-world behavior.
Playwright E2E headless (TypeScript) (Chromium and mobile only):
Scope: Critical user paths only.
Constraints: Limit rendering to Chromium and Mobile.
Workflow: Run headed during development to verify functionality alongside the local server.


Web game Stack: React/Next.js + .NET 10 API(Azure Static Web Site / Azure API)
Initial development:  Client only with no server / Use client solutions for saving data like high scores
Use .NET API Server for initial data fetching (leaderboards, player profiles) and Client Components only for the interactive game loop Once I have integration the .NET API project into the solution
Do not require the .NET backend to run / If API is offline/not created, then just disable server functionality
