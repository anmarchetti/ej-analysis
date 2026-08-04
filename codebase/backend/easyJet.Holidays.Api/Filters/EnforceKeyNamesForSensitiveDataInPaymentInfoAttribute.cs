using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Payment;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Net;
using System.Text.Json;

namespace easyJet.Holidays.Api.Filters;

/// <summary>
/// Check that card number and cvv fields in payment info are camelCase.
/// </summary>
[AttributeUsage(AttributeTargets.Method)]
public sealed class EnforceKeyNamesForSensitiveDataInPaymentInfoAttribute : ActionFilterAttribute
{
    private static readonly List<string> CamelCaseProperties = ["cardNumber", "cvv"];
    
    /// <inheritdoc />
    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(next);
        
        using JsonDocument doc = await GetJsonDocument(context);

        var paymentInfo = doc.RootElement
            .EnumerateObject()
            .FirstOrDefault(p => p.Name.Equals("paymentInfo", StringComparison.OrdinalIgnoreCase));
        
        if (paymentInfo.Value.ValueKind is JsonValueKind.Undefined or not JsonValueKind.Object)
        {
            // If paymentInfo is not present or not an object, skip the checks
            await next();
            return;
        }
        
        var paymentInfoKeys = paymentInfo.Value.EnumerateObject().Select(p => p.Name).ToList();
        
        CamelCaseProperties.ForEach(propertyName =>
        {
            IsPropertyKeyCamelCase(context, paymentInfoKeys, paymentInfo.Value, propertyName);    
        });
            
        if (!context.ModelState.IsValid)
        {
            var innerErrors = context.ModelState.Values.SelectMany(x => x.Errors).Select(x => new ApiError
            {
                Message = x.ErrorMessage
            }).ToArray();
        
            throw new ApiException(ApiExceptionCodes.InvalidModelState, "Invalid model state", innerErrors, null, HttpStatusCode.BadRequest);
        }
        
        await next();
    }

    private static async Task<JsonDocument> GetJsonDocument(ActionExecutingContext context)
    {
        JsonDocument doc = null;
        try
        {
            context.HttpContext.Request.EnableBuffering();
            context.HttpContext.Request.Body.Position = 0;

            using var reader = new StreamReader(context.HttpContext.Request.Body, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            context.HttpContext.Request.Body.Position = 0;
        
            doc = JsonDocument.Parse(body, new JsonDocumentOptions { AllowTrailingCommas = true });
            return doc;
        }
        catch
        {
            doc?.Dispose();
            throw;
        }
    }

    private static void IsPropertyKeyCamelCase(ActionExecutingContext context, List<string> paymentInfoKeys,
        JsonElement paymentInfo, string propertyName)
    {
        bool isPropertyPresent = paymentInfoKeys.Any(k => k.Equals(propertyName, StringComparison.OrdinalIgnoreCase));
        if(isPropertyPresent && !paymentInfo.TryGetProperty(propertyName, out _))
            context.ModelState.AddModelError(
                propertyName,
                $"Key '{propertyName}' is not camelCase."
            );
    }
}