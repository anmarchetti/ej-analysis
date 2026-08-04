using easyJet.Holidays.Api.Domain.Services.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace easyJet.Holidays.Api.Filters
{
    /// <summary>
    /// Returns Unauthorized if customer is not logged in
    /// </summary>
    public class CustomerAuthorizedAttribute : ActionFilterAttribute
    {
        private readonly IAuthenticationService _authenticationService;

        public CustomerAuthorizedAttribute(IAuthenticationService authenticationService)
        {
            _authenticationService = authenticationService;
        }

        public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var customerEmail = await _authenticationService.GetCustomerEmail();
            if (customerEmail == null)
            {
                context.Result = new UnauthorizedObjectResult("Unauthorized");
                return;
            }

            await next();
        }
    }
}
