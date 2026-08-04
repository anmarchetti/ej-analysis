using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using System.Net;
using System.Reflection;

namespace easyJet.Holidays.Api.Extensions;

/// <summary>
/// contains extensions for proper configuration of <inheritdoc cref="IServiceCollection"/>
/// </summary>
internal static class ServiceCollectionExtensions
{
    /// <summary>
    /// Add API versioning and swagger support
    /// </summary>
    /// <param name="services">Services instance</param>
    /// <returns>Services instance</returns>
    public static IServiceCollection ConfigureApiVersioning(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddApiVersioning(config =>
        {
            config.AssumeDefaultVersionWhenUnspecified = true;
            config.ReportApiVersions = true;
            config.ApiVersionReader = new UrlSegmentApiVersionReader();
            config.DefaultApiVersion = new ApiVersion(1, 0);
        }).AddMvc()
        .AddApiExplorer(config =>
        {
            config.GroupNameFormat = "'v'VVV";
            config.SubstituteApiVersionInUrl = true;
        });

        // for controllers, that have multiple returning values per single code, swagger would pick up 1-st ProducesResponseTypeAttribute,
        // it encounters, since this is a limitation of an OpenAPI standard.
        // TODO: if we want to make things be totally documented and shown - need to revisit the code and alter places,
        // where response codes can be changed without breaking FE (which might check particular responses for response codes)
        // https://spec.openapis.org/oas/v3.1.0#responses-object
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new Microsoft.OpenApi.OpenApiInfo
            {
                Version = "v1",
                Title = "easyJet Holidays Api"
            });
            c.OperationFilter<SwaggerDefaultValues>();
            c.CustomSchemaIds(x => x.FullName);

            var mainAssembly = Assembly.GetExecutingAssembly().GetName().Name;
            c.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, $"{mainAssembly}.xml"));
            c.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, $"{mainAssembly}.Domain.xml"));
                
            // this is needed to support polymorphic types in swagger
            var polymorphicTypes = new List<PolymorphismConfig>
            {
                new()
                {
                    BaseType = typeof(PaymentInfo),
                    Discriminator = "paymentType",
                    SubTypes = new() { typeof(CardPaymentInfo), typeof(ApplePayPaymentInfo) }
                }
            };
                
            c.UseOneOfForPolymorphism();
            c.SelectDiscriminatorNameUsing(type =>
            {
                PolymorphismConfig match = polymorphicTypes.FirstOrDefault(p => p.BaseType == type);
                return match?.Discriminator;
            });

            c.SelectSubTypesUsing(baseType =>
            {
                PolymorphismConfig match = polymorphicTypes.FirstOrDefault(p => p.BaseType == baseType);
                return match?.SubTypes ?? Enumerable.Empty<Type>();
            });
        });
        services.AddSwaggerGenNewtonsoftSupport();

        return services;
    }

    /// <summary>
    /// Add Health checks for application and 3rd party services
    /// </summary>
    /// <param name="services">Services instance</param>
    /// <param name="configuration">App configuration</param>
    /// <returns>Services instance</returns>
    public static IServiceCollection ConfigureHealthChecks(this IServiceCollection services, IConfiguration configuration)
    {
        var healthCheckBuilder = services
            .AddHealthChecks()
            .AddCheck("self", () => HealthCheckResult.Healthy());

        var healthCheckSettings = configuration.GetSection("HealthChecks").Get<HealthChecksSettings>();
        healthCheckSettings?.UrlGroups?.ForEach(urlGroup =>
        {
            healthCheckBuilder.AddUrlGroup(options =>
            {
                options.AddUri(new Uri(urlGroup.Uri));
                if (urlGroup.Timeout.HasValue && urlGroup.Timeout > 0)
                {
                    options.UseTimeout(TimeSpan.FromSeconds(urlGroup.Timeout.Value));
                }
            }, urlGroup.Name);
        });

        return services;
    }

    /// <summary>
    /// Wraps model validation errors in ApiException
    /// </summary>
    /// <param name="services">Services collection</param>
    /// <returns>Services collection for chaining</returns>
    public static IServiceCollection ConfigureApiBehaviorOptions(this IServiceCollection services)
    {
        services.Configure<ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = actionContext =>
            {
                var innerErrors = actionContext.ModelState.Values.SelectMany(x => x.Errors).Select(x => new ApiError
                {
                    Message = x.ErrorMessage
                }).ToArray();

                throw new ApiException(ApiExceptionCodes.InvalidModelState, "Invalid model state", innerErrors, null, HttpStatusCode.BadRequest);
            };
        });

        return services;
    }

    /// <summary>
    /// Adds TradePortal Jwt Authentication
    /// </summary>
    /// <param name="services"></param>
    /// <param name="configuration"></param>
    /// <exception cref="Exception"></exception>
    public static void AddTradePortalJwtAuthentication(this IServiceCollection services,
        IConfiguration configuration)
    {
        var settings = configuration.Get<TradePortalSettings>()?.JwtAuth ??
                       throw new Exception("TradePortal:JwtAuth is not configured");

        var signingKeyResolver = new OpenIdConnectSigningKeyResolver(settings.Authority,
            keySetTimeToLive: TimeSpan.FromHours(24));

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = settings.Authority;
                options.Audience = settings.Audience;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateLifetime = true,

                    ValidateIssuer = true,
                    ValidIssuer = settings.Authority,

                    ValidateAudience = true,
                    ValidAudience = "account",

                    ValidateIssuerSigningKey = true,
                    RequireSignedTokens = true,
                    IssuerSigningKeyResolver = (_, _, _, _) => signingKeyResolver.GetSigningKeys(),
                };

                options.Validate();
            });


    }
}