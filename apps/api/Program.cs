using Microsoft.EntityFrameworkCore;
using NexusProjectHub.API.Data;
using NexusProjectHub.API.Services;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

// ============================================
// Authentication - Microsoft Entra ID
// ============================================
builder.Services.AddMicrosoftIdentityWebApiAuthentication(builder.Configuration, "AzureAd")
    .EnableTokenAcquisitionToCallDownstreamApi()
    .AddMicrosoftGraph(builder.Configuration.GetSection("MicrosoftGraph"))
    .AddInMemoryTokenCaches();

// Fix: Explicitly allow the Client ID as a valid audience (generic JWT config)
builder.Services.Configure<Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerOptions>(
    Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme, 
    options =>
    {
        var clientId = builder.Configuration["AzureAd:ClientId"];
        options.TokenValidationParameters.ValidAudiences = new[] { clientId, $"api://{clientId}" };
    });

// ============================================
// Database - PostgreSQL
// ============================================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ============================================
// Cache - Redis
// ============================================
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "NexusProjectHub_";
});

// ============================================
// Services
// ============================================
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IMicrosoftGraphService, MicrosoftGraphService>();

// File Storage Service
var storageProvider = builder.Configuration["Storage:Provider"];
if (storageProvider == "OneDrive")
{
    builder.Services.AddScoped<IFileStorageService, OneDriveStorageService>();
}
else
{
    builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
}

// ============================================
// CORS - Allow Frontend
// ============================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            builder.Configuration["Frontend:Url"] ?? "http://localhost:3300"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

// ============================================
// Controllers + Swagger
// ============================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Nexus Project Hub API", Version = "v1" });
});

// ============================================
// Health Checks
// ============================================
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!)
    .AddRedis(builder.Configuration.GetConnectionString("Redis")!);

// Configure Forwarded Headers for Nginx Proxy (Moved here to be before builder.Build())
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor | 
                               Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear(); // Allow any proxy (safe since we run in Docker internal network)
    options.KnownProxies.Clear();
});

var app = builder.Build();

// ============================================
// Auto-create database schema on startup
// ============================================
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    try
    {
        logger.LogInformation("Ensuring database schema exists...");
        db.Database.EnsureCreated();
        logger.LogInformation("Database schema ready.");

        // Seeding Default Workspace
        if (!db.Workspaces.Any())
        {
            logger.LogInformation("Seeding default workspace...");
            db.Workspaces.Add(new NexusProjectHub.API.Models.Workspace
            {
                Id = "default",
                Name = "Default Workspace",
                Slug = "default",
                Description = "Main workspace for Nexus Project Hub"
            });
            db.SaveChanges();
            logger.LogInformation("Default workspace seeded.");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error initializing database.");
    }
}

// ============================================
// Middleware Pipeline
// ============================================
// Enable Swagger in all environments for API testing
app.UseSwagger();
app.UseSwaggerUI();



// ... (existing CORS)
app.UseCors("AllowFrontend");

// Apply Forwarded Headers middleware BEFORE Authentication
app.UseForwardedHeaders();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
