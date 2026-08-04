using easyJet.Holidays.External.Musement.Mappers;
using easyJet.Holidays.External.Musement.Models;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Musement.Tests.Mappers;
public class ExcursionMapperTests
{
    [Theory]
    [AutoMoqData]
    public void MapExcursionResponse_SandboxHostUrlReplaced(SearchActivitiesResponseBody searchActivity, string currency)
    {
        ArgumentNullException.ThrowIfNull(searchActivity);

        searchActivity.Url = "https://.sbox.musement.com/uk/rest-of-the-url";

        var response = ExcursionMapper.MapExcursionResponse(
            [searchActivity],
            "https://.sbox.musement.com/uk/rest-of-the-url",
            "https://experiences.easyjet.com/uk",
            currency);

        response.ExcursionsLink.Should().Be("https://experiences.easyjet.com/uk/rest-of-the-url");
        response.Excursions.Count().Should().Be(1);
        response.Excursions.ElementAt(0).Url.Should().Be($"https://experiences.easyjet.com/uk/rest-of-the-url?currency={currency}");
    }

    [Theory]
    [AutoMoqData]
    public void MapExcursionResponse_HostUrlReplaced(SearchActivitiesResponseBody searchActivity, string currency)
    {
        ArgumentNullException.ThrowIfNull(searchActivity);

        searchActivity.Url = "https://www.musement.com/uk/rest-of-the-url";
        
        var response = ExcursionMapper.MapExcursionResponse(
            [searchActivity],
            "https://www.musement.com/uk/rest-of-the-url",
            "https://experiences.easyjet.com/uk",
            currency);

        response.ExcursionsLink.Should().Be("https://experiences.easyjet.com/uk/rest-of-the-url");
        response.Excursions.Count().Should().Be(1);
        response.Excursions.ElementAt(0).Url.Should().Be($"https://experiences.easyjet.com/uk/rest-of-the-url?currency={currency}");
    }
}
