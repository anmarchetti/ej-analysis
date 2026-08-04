using easyJet.Holidays.Api.Domain.ContractResolvers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.Formatters;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System.Buffers;

namespace easyJet.Holidays.Api.Filters;

public class UseSerializerWithFullConverterForOutputAttribute : ActionFilterAttribute
{
    public override void OnResultExecuting(ResultExecutingContext context)
    {
        if (context.Result is ObjectResult objectResult)
        {
            var serializerSettings = new JsonSerializerSettings
            {
                ContractResolver = new FullObjectResolver(),
            };
            serializerSettings.Converters.Add(new StringEnumConverter());

            var jsonOutputFormatter = new NewtonsoftJsonOutputFormatter(
                serializerSettings,
                ArrayPool<char>.Shared,
                new MvcOptions(),
                null);

            objectResult.Formatters.Add(jsonOutputFormatter);
        }

        base.OnResultExecuting(context);
    }
}

