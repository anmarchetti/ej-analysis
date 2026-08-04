using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Data.RecommendedDestination;
using easyJet.Holidays.Api.Domain.Interfaces.HolidayInspiration;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace easyJet.Holidays.Api.Domain.Tests.Controllers;

public class HolidayInspirationControllerTests
{
    [Fact]
    public async Task GetWiderRecommendedDestinations_WhenServiceReturnDestinations_ShouldReturnOkResponse()
    {
        // Arrange
        var serviceResponse = new RecommendedDestinationResponse
        {
            Destinations = [
                new RecommendedDestination()
                {
                    Code = "ESTF",
                    Url = new Uri("/destinations/spain/tenerife", UriKind.Relative)
                }
            ]
        };

        var serviceMock = new Mock<IHolidayInspirationSevice>();
        serviceMock
            .Setup(x => x.GetRecommendedDestinations(It.IsAny<RecommendedDestinationsRequest>()))
            .ReturnsAsync(serviceResponse);

        var sut = new HolidayInspirationController(serviceMock.Object);

        // Act
        var response = await sut.RecommendedDestinations(new RecommendedDestinationsRequest());

        // Assert
        response.Should().NotBeNull();
        response.Should().BeOfType<OkObjectResult>();
        response.As<OkObjectResult>().Value.Should().BeEquivalentTo(serviceResponse);
    }

    [Fact]
    public async Task GetRecommendedQuestions_WhenServiceReturnDestinations_ShouldReturnOkResponse()
    {
        // Arrange
        var serviceResponse = new RecommendedQuestions()
        {
            Months = [1, 10]
        };

        var serviceMock = new Mock<IHolidayInspirationSevice>();
        serviceMock
            .Setup(x => x.ValidateAnswers(It.IsAny<ValidateRecommendedRequest>()))
            .ReturnsAsync(serviceResponse);

        var sut = new HolidayInspirationController(serviceMock.Object);

        // Act
        var response = await sut.ValidateAnswers(new ValidateRecommendedRequest());

        // Assert
        response.Should().NotBeNull();
        response.Should().BeOfType<OkObjectResult>();
        response.As<OkObjectResult>().Value.Should().BeEquivalentTo(serviceResponse);
    }
}