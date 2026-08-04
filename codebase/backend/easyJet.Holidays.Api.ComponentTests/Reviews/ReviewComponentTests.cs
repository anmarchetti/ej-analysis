using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.External.Feefo.Models.DTO;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Microsoft.AspNetCore.Http.Extensions;
using Newtonsoft.Json;
using System.Net;
using Xunit;


namespace easyJet.Holidays.Api.ComponentTests.Reviews;

/// <summary>
/// Component tests for <see cref="ReviewsController"/>
/// </summary>
public class ReviewComponentTests : BaseFixtureAwareComponentTest
{
    public ReviewComponentTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/reviews")]
    [Fact]
    public async Task GetReviews_ReturnsReviewsAndSummaryFromFeefo()
    {
        // Arrange
        var builder = new QueryBuilder
        {
            { "count", "12" },
            { "rating", "4" },
            { "rating", "5" }
        };

        // Act
        var response = await Client.GetAsync("/api/v1.0/reviews" + builder);
        var responseContent = await response.Content.ReadAsStringAsync();

        var result = JsonConvert.DeserializeObject<ReviewsAndSummary>(responseContent);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        result.Should().NotBeNull();

        result!.Reviews.Should().NotBeNullOrEmpty();

        result.Summary.Count.Should().BeGreaterThan(0);
        result.Summary.AverageRating.Should().BeGreaterThan(0);
    }
}