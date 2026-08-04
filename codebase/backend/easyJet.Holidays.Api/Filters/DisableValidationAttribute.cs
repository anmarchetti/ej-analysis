using Microsoft.AspNetCore.Mvc.Filters;

namespace easyJet.Holidays.Api.Filters;

[AttributeUsage(AttributeTargets.All)]
public class DisableValidationAttribute : ActionFilterAttribute
{
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        var modelState = context.ModelState;
        modelState.Clear();

        foreach (var modelValue in modelState.Values)
        {
            modelValue.Errors.Clear();
        }
    }
}