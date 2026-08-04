using easyJet.Foundation.BeCause.Models.Response;
using FluentAssertions;
using Newtonsoft.Json;
using Xunit;

namespace easyJet.Foundation.BeCause.Tests
{
    public class ApiStatusTests
    {
        [Theory]
        [InlineData("Pending", ApiStatus.Pending)]
        [InlineData("InProgress", ApiStatus.InProgress)]
        [InlineData("Success", ApiStatus.Success)]
        [InlineData("PartialSuccess", ApiStatus.PartialSuccess)]
        [InlineData("Error", ApiStatus.Error)]
        [InlineData("Cancelled", ApiStatus.Cancelled)]
        [InlineData("Scheduled", ApiStatus.Scheduled)]
        public void StatusResponse_DeserializesAllApiStatusValues(string value, ApiStatus expected)
        {
            var json = $"{{\"status\":\"{value}\"}}";

            var result = JsonConvert.DeserializeObject<StatusResponse>(json);

            result.Status.Should().Be(expected);
        }
    }
}
