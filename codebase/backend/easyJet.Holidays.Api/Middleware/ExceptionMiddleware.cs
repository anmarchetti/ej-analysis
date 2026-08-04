using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net;

namespace easyJet.Holidays.Api.Middleware
{
    // You may need to install the Microsoft.AspNetCore.Http.Abstractions package into your project
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly EnvironmentBehaviourSettings _environmentBehaviourSettings;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IOptions<EnvironmentBehaviourSettings> environmentBehaviourSettings)
        {
            _next = next;
            _logger = logger;
            _environmentBehaviourSettings = environmentBehaviourSettings.Value ?? throw new ArgumentNullException(nameof(environmentBehaviourSettings));
        }

        public async Task Invoke(HttpContext httpContext)
        {
            try
            {
                await _next(httpContext);
            }
            catch (Exception ex)
            {
                if (ex is ApiException apiException)
                {
                    var errorMessages = apiException.InnerErrors?.Select(error => new { Message = error.Message, Code = error.Code });
                    _logger.LogError(ex, "Something went wrong. InnerErrors = {errorMessages}", errorMessages);
                }
                else
                {
                    _logger.LogError(ex, "Something went wrong");
                }
                await HandleExceptionAsync(httpContext, ex);
            }
        }

        private Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            // Extract error code from ApiException 
            var errorObject = ExceptionResponseBuilder.BuildErrorObject(context, exception, _environmentBehaviourSettings);
            ApiError[] innerErrors = null;
            HttpStatusCode? apiExceptionStatusCode = null;

            if (exception is ApiException)
            {
                var apiException = (exception as ApiException);
                innerErrors = apiException.InnerErrors;
                apiExceptionStatusCode = apiException.StatusCode;
            }

            context.Response.ContentType = "application/json";
            // If exception is ApiException and has Errors then return 400 (bad request), otherwise it's server error(500)
            var hasApiErrors = innerErrors != null && innerErrors.Length > 0;
            var statusCode = hasApiErrors ? HttpStatusCode.BadRequest : HttpStatusCode.InternalServerError;

            // If api exception has status code then use it, otherwise it will be 503 or 400
            context.Response.StatusCode = (int)(apiExceptionStatusCode ?? statusCode);

            return context.Response.WriteAsync(JsonConvert.SerializeObject(errorObject));
        }
    }

    // Extension method used to add the middleware to the HTTP request pipeline.
    public static class ExceptionMiddlewareExtensions
    {
        public static IApplicationBuilder UseExceptionMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<ExceptionMiddleware>();
        }
    }
}
