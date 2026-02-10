using Azure.Identity;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// Azure Key Vault — pull secrets from PoShared vault in non-dev environments.
// Locally, use `dotnet user-secrets` instead.
// ---------------------------------------------------------------------------
if (!builder.Environment.IsDevelopment())
{
    var kvUri = new Uri("https://kv-poshared.vault.azure.net/");
    builder.Configuration.AddAzureKeyVault(kvUri, new DefaultAzureCredential());
}

// ---------------------------------------------------------------------------
// Service Registration (OpenAPI, Health Checks, CORS)
// ---------------------------------------------------------------------------
builder.Services.AddOpenApi();

builder.Services.AddHealthChecks();

// Allow the React client to call the API during local development
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// ---------------------------------------------------------------------------
// Middleware Pipeline
// ---------------------------------------------------------------------------
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// ---------------------------------------------------------------------------
// Health Check — verifies API + downstream services are reachable
// ---------------------------------------------------------------------------
app.MapHealthChecks("/health");

// ---------------------------------------------------------------------------
// Diagnostics — exposes configuration (values partially masked for security)
// ---------------------------------------------------------------------------
app.MapGet("/diag", (IConfiguration config) =>
{
    var entries = new Dictionary<string, string?>();

    foreach (var child in config.AsEnumerable())
    {
        entries[child.Key] = MaskValue(child.Value);
    }

    return Results.Json(entries);
})
.WithName("GetDiagnostics")
.WithDescription("Returns all configuration keys with partially-masked values.");

app.Run();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
static string? MaskValue(string? value)
{
    if (string.IsNullOrEmpty(value) || value.Length <= 6)
    {
        return value is null ? null : "***";
    }

    // Show first 3 and last 3 characters, mask the rest
    var visible = 3;
    return string.Concat(
        value.AsSpan(0, visible),
        new string('*', value.Length - visible * 2),
        value.AsSpan(value.Length - visible));
}
