using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Filters
{
    public class DisableCreditsAttribute : ActionFilterAttribute
    {
        private readonly VoucherSettings _voucherSettings;

        public DisableCreditsAttribute(IOptions<ApiSettings> apiSettings)
        {
            _voucherSettings = apiSettings.Value?.Vouchers ?? throw new ArgumentNullException(nameof(VoucherSettings));
        }

        public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            if (_voucherSettings?.IsActive != true)
            {
                // Return not found if vouchers
                context.Result = new BadRequestObjectResult("Credit is disabled");
                return;
            }
            await next();
        }
    }
}
