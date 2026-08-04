using System.Text.Json;

namespace easyJet.Holidays.Api.ComponentTests.Shared
{
    public static class ResponseContentHelper
    {
        public static async Task<T> ReadContentAsync<T>(HttpResponseMessage response)
        {
            var content = await response.Content.ReadAsStringAsync();
            var responseObject = JsonSerializer.Deserialize<T>(content);
            return responseObject;
        }

        public static T ReadContent<T>(HttpResponseMessage response)
        {
            return ReadContentAsync<T>(response).GetAwaiter().GetResult();
        }
    }
}