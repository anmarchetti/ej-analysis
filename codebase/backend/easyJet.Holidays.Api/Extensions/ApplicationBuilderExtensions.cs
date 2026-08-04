using easyJet.Holidays.Api.Domain.Settings;

namespace easyJet.Holidays.Api.Extensions;

/// <summary>
/// contains extensions for proper configuration of <inheritdoc cref="IApplicationBuilder"/>
/// </summary>
internal static class ApplicationBuilderExtensions
{
    /// <summary>
    /// Adds a middleware delegate which puts in reposen server information: machine name, correlation id, release number
    /// </summary>
    /// <param name="app">Application builder instance</param>
    /// <param name="configuration">Configuration model</param>
    /// <returns></returns>
    public static IApplicationBuilder AddHostDataInResponseHeaders(this IApplicationBuilder app, IConfiguration configuration)
    {
        var apiConfigSection = configuration.GetSection("Api");
        var apiConfig = apiConfigSection.Get<ApiSettings>();

        return app.Use(async (context, nextMiddleware) =>
        {
            context.Response.OnStarting(() =>
            {
                context.Response.Headers.Append("X-Api-Host", apiConfig?.ApiHost);
                context.Response.Headers.Append("X-Api-CorrelationId", context.TraceIdentifier);
                context.Response.Headers.Append("X-Api-Release", apiConfig?.Release);
                return Task.FromResult(0);
            });
            await nextMiddleware();
        });
    }

    /// <summary>
    /// Registers swagger with UI, if swagger is enabled in <see cref="ApiSettings.EnableSwagger"/>
    /// </summary>
    /// <param name="instance">the ApplicationBuilder to configure</param>
    /// <param name="apiSettings">the ApiSettings object based on which swagger will be configured (or not)</param>
    /// <returns></returns>
    public static IApplicationBuilder ConfigureSwagger(this IApplicationBuilder instance, ApiSettings apiSettings)
    {
        ArgumentNullException.ThrowIfNull(apiSettings);

        if (apiSettings.EnableSwagger)
        {
            // Enable middleware to serve generated Swagger as a JSON endpoint.
            instance.UseSwagger(c =>
            {
                c.RouteTemplate = $"{apiSettings.RoutePrefix.Swagger}" + "/{documentname}/swagger.json";
            });

            // Enable middleware to serve swagger-ui (HTML, JS, CSS, etc.),
            // specifying the Swagger JSON endpoint.
            instance.UseSwaggerUI(c =>
            {
                c.RoutePrefix = apiSettings.RoutePrefix.Swagger;
                c.SwaggerEndpoint($"/{apiSettings.RoutePrefix.Swagger}/v1/swagger.json", "easyJet Holidays Api v1");
            });
        }

        return instance;
    }
}