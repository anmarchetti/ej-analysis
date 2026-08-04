using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace easyJet.Holidays.Api.Filters
{
    /// <summary>
    /// Returns Unauthorized if user is not logged in
    /// </summary>
    public class TradeAgentOrCustomerAuthorizedAttribute : ActionFilterAttribute
    {
        private readonly IAuthenticationService _authenticationService;
        private readonly ITradeAgentAuthenticationService _tradeAgentAuthService;

        public TradeAgentOrCustomerAuthorizedAttribute(IAuthenticationService authenticationService,
            ITradeAgentAuthenticationService tradeAgentAuthService)
        {
            _authenticationService = authenticationService;
            _tradeAgentAuthService = tradeAgentAuthService;
        }

        public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            if (_tradeAgentAuthService.IsTradePortalEnv())
            {
                if (_tradeAgentAuthService.IsLoggedInAsTradeAgent())
                {
                    await next();
                }
                else
                {
                    context.Result = new UnauthorizedObjectResult("Unauthorized");
                    return;
                }
            }
            else
            {
                var customerEmail = await _authenticationService.GetCustomerEmail();

                if (customerEmail is not null)
                {
                    await next();
                }
                else
                {
                    context.Result = new UnauthorizedObjectResult("Unauthorized");
                    return;
                }
            }
        }
    }
}
