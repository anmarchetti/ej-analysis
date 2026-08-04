using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.ContractResolvers;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System.Net;

namespace easyJet.Holidays.Api.Domain.Binders;

public class FullModelBinder : IModelBinder
{
    public async Task BindModelAsync(ModelBindingContext bindingContext)
    {
        if (bindingContext == null)
            throw new ArgumentNullException(nameof(bindingContext));

        try
        {
            using var reader = new StreamReader(bindingContext.HttpContext.Request.Body);

            var inputContent = await reader.ReadToEndAsync();

            var targetType = bindingContext.ModelType;

            var result = JsonConvert.DeserializeObject(inputContent, targetType, new JsonSerializerSettings()
            {
                ContractResolver = new FullObjectResolver(),
                Converters = { new StringEnumConverter() },
            });

            bindingContext.Result = ModelBindingResult.Success(result);
        }
        catch (Exception exc)
        {
            throw new ApiException(
                ApiExceptionCodes.InvalidModelState,
                exc.ToString(),
                null,
                exc.InnerException,
                HttpStatusCode.BadRequest
            );
        }
    }
}