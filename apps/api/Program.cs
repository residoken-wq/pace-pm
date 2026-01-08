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

var app = builder.Build();

// ============================================
// Auto-migrate database on startup
// ============================================
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    try
    {
        logger.LogInformation("Applying database migrations...");
        db.Database.Migrate();
        logger.LogInformation("Database migrations applied successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error applying database migrations. Using EnsureCreated as fallback.");
        db.Database.EnsureCreated();
    }
}

// ============================================
// Middleware Pipeline
// ============================================
// Enable Swagger in all environments for API testing
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
