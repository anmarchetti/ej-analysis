using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace easyJet.Holidays.Api.Extensions
{
    /// <summary>
    /// Represents the Swagger/Swashbuckle operation filter used to document the implicit API version parameter.
    /// </summary>
    /// <remarks>This <see cref="IOperationFilter"/> is only required due to bugs in the <see cref="SwaggerGenerator"/>.
    /// Once they are fixed and published, this class can be removed.</remarks>
    public class SwaggerDefaultValues : IOperationFilter
    {
        /// <summary>
        /// Applies the filter to the specified operation using the given context.
        /// </summary>
        /// <param name="operation">The operation to apply the filter to.</param>
        /// <param name="context">The current operation filter context.</param>
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            var apiDescription = context.ApiDescription;

            operation.Deprecated |= apiDescription.IsDeprecated;

            // REF: https://github.com/domaindrivendev/Swashbuckle.AspNetCore/issues/1752#issue-663991077
            RemoveUnsupportedResponseContentTypes(operation, apiDescription.SupportedResponseTypes);

            if (operation.Parameters == null)
            {
                return;
            }

            ApplyParameterDefaults(operation.Parameters, apiDescription);
        }

        private static void RemoveUnsupportedResponseContentTypes(
            OpenApiOperation operation,
            IList<ApiResponseType> supportedResponseTypes)
        {
            if (operation.Responses == null)
            {
                return;
            }

            foreach (var responseType in supportedResponseTypes)
            {
                var responseKey = responseType.IsDefaultResponse ? "default" : responseType.StatusCode.ToString();

                if (!operation.Responses.TryGetValue(responseKey, out var response) || response?.Content == null)
                {
                    continue;
                }

                foreach (var contentType in response.Content.Keys)
                {
                    if (!responseType.ApiResponseFormats.Any(x => x.MediaType == contentType))
                    {
                        response.Content.Remove(contentType);
                    }
                }
            }
        }

        private static void ApplyParameterDefaults(
            IList<IOpenApiParameter> parameters,
            ApiDescription apiDescription)
        {
            foreach (var parameter in parameters)
            {
                var description = apiDescription.ParameterDescriptions.First(p => p.Name == parameter.Name);

                parameter.Description ??= description.ModelMetadata?.Description;

                if (parameter.Schema is OpenApiSchema openApiSchema
                    && openApiSchema.Default == null
                    && description.DefaultValue != null
                    && description.DefaultValue is not DBNull
                    && description.ModelMetadata is { } modelMetadata)
                {
                    var json = JsonSerializer.Serialize(description.DefaultValue, modelMetadata.ModelType);
                    var element = JsonSerializer.Deserialize<JsonElement>(json);
                    openApiSchema.Default = JsonValue.Create(element);
                }

                if (description.IsRequired && parameter is OpenApiParameter concreteParam)
                {
                    concreteParam.Required = true;
                }
            }
        }
    }
}
