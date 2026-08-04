using System.Text;
using System.Text.Json;

namespace easyJet.Holidays.Api.ComponentTests.Shared
{
    public class RequestContentHelper
    {
        public static StringContent CreateEmptyRequestParameters() =>
            new StringContent("{}", Encoding.UTF8, "application/json");

        public static StringContent CreateRequestParameters<T>(T content) =>
            new StringContent(JsonSerializer.Serialize(content), Encoding.UTF8, "application/json");
    }
}