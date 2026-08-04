using easyJet.Holidays.External.Apollo.Models;
using Newtonsoft.Json;
using Xunit;

namespace easyJet.Holidays.External.Apollo.Tests.Models;

public class ApolloGraphQlResponseTests
{
    [Fact]
    public void HasErrors_WhenErrorsNullOrEmpty_ReturnsFalse()
    {
        var withNull = new ApolloGraphQlResponse<object>();
        var withEmpty = new ApolloGraphQlResponse<object> { Errors = [] };

        Assert.False(withNull.HasErrors);
        Assert.False(withEmpty.HasErrors);
    }

    [Fact]
    public void HasErrors_WhenErrorsExist_ReturnsTrue()
    {
        var response = new ApolloGraphQlResponse<object>
        {
            Errors = [new ApolloGraphQlError { Message = "boom" }]
        };

        Assert.True(response.HasErrors);
    }

    [Fact]
    public void Deserialize_MapsDataAndErrorsProperties()
    {
        const string json = """
                            {
                              "data": { "value": "ok" },
                              "errors": [{ "message": "bad request" }]
                            }
                            """;

        var response = JsonConvert.DeserializeObject<ApolloGraphQlResponse<Dictionary<string, string>>>(json);

        Assert.NotNull(response);
        Assert.Equal("ok", response!.Data!["value"]);
        Assert.True(response.HasErrors);
        Assert.Equal("bad request", response.Errors![0].Message);
    }
}
