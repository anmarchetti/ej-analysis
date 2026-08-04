using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Filters
{
    /// <summary>
    /// Validates if idempotency key is presented in headers
    /// </summary>
    public class IdempotencyKeyAttribute : ActionFilterAttribute
    {
        private readonly EnvironmentBehaviourSettings _envSettings;
        private readonly HeadersSettings _headerSettings;

        public IdempotencyKeyAttribute(
            IOptions<EnvironmentBehaviourSettings> envSettings,
            IOptions<HeadersSettings> headerSettings
            )
        {
            _envSettings = envSettings.Value ?? throw new ArgumentNullException(nameof(envSettings));
            _headerSettings = headerSettings.Value ?? throw new ArgumentNullException(nameof(headerSettings));
        }

        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var request = context.HttpContext.Request;
            var idempotencyKey = request.Headers[_headerSettings.IdempotencyKey];

            if (string.IsNullOrWhiteSpace(idempotencyKey) && !_envSettings.AllowBookingWithoutIdempotencyKey)
            {
                context.Result = new BadRequestObjectResult($"{_headerSettings.IdempotencyKey} header value is required");
                return;
            }


            base.OnActionExecuting(context);
        }
    }
}
