using easyJet.Holidays.Api.Domain.Data.Settings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Filters;

/// <summary>
/// If enabled via <see cref="SharedServicesSettings.Enabled"/>, allows access when auth header is set to <see cref="SharedServicesSettings.Key"/>
/// </summary>
public class SharedServicesAuthorizedAttribute : ActionFilterAttribute
{
    private readonly SharedServicesSettings _sharedServicesSettings;

    /// <param name="sharedServicesSettings"></param>
    /// <exception cref="ArgumentNullException"> when passed Options instance is null</exception>
    public SharedServicesAuthorizedAttribute(IOptions<SharedServicesSettings> sharedServicesSettings)
    {
        _sharedServicesSettings = sharedServicesSettings?.Value ?? throw new ArgumentNullException(nameof(sharedServicesSettings));
    }

    /// <inheritdoc/>
    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var auth = context.HttpContext.Request.Headers.Authorization;
        if (!_sharedServicesSettings.Enabled)
        {
            context.Result = new ForbidResult();
            return;
        }
        if (auth != _sharedServicesSettings.Key)
        {
            context.Result = new UnauthorizedObjectResult(string.Empty);
            return;
        }
        await next();
    }
}