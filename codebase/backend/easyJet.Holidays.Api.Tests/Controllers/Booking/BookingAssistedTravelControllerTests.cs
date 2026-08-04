using easyJet.Holidays.Api.Controllers.Booking;
using easyJet.Holidays.Api.Domain.Data.AssistedTravel;
using easyJet.Holidays.Api.Domain.Interfaces.Salesforce;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Globalization;

namespace easyJet.Holidays.Api.Tests.Controllers.Booking;

public class BookingAssistedTravelControllerTests
{
    [Fact]
    public async Task SubmitAssistedTravelRequests_ShouldReturnOk_WhenSalesforceAcceptsSubmission()
    {
        // Arrange
        const string bookingReference = "3625362";
        var request = new AssistedTravelSubmissionRequest
        {
            Passengers =
            [
                new AssistedTravelPassengerSubmission
                {
                    PassengerName = "Passenger One",
                    QuestionsAndAnswers =
                    [
                        new AssistedTravelQuestionAnswer
                        {
                            Question = "Which type of assistance do you require?",
                            Answer = "Mobility assistance"
                        }
                    ]
                }
            ]
        };

        var expected = new AssistedTravelSubmissionResult
        {
            IsSuccessful = true,
            CaseId = "500Pv00000RBPrlIAH",
            SubmittedQuestionsCount = 1
        };

        var salesforceService = new Mock<ISalesforceService>();
        salesforceService
            .Setup(x => x.SubmitAssistedTravelRequests(bookingReference, request))
            .ReturnsAsync(expected);

        var controller = new BookingAssistedTravelController(salesforceService.Object);

        // Act
        var result = await controller.SubmitAssistedTravelRequests(bookingReference, request);

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        ok.Value.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public async Task SubmitAssistedTravelRequests_ShouldReturnBadRequest_WhenRequestHasNoPassengers()
    {
        // Arrange
        var salesforceService = new Mock<ISalesforceService>();
        var controller = new BookingAssistedTravelController(salesforceService.Object);

        var request = new AssistedTravelSubmissionRequest
        {
            Passengers = []
        };

        // Act
        var result = await controller.SubmitAssistedTravelRequests("3625362", request);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        badRequest.Value.Should().Be("At least one passenger with questions is required.");
        salesforceService.Verify(x => x.SubmitAssistedTravelRequests(It.IsAny<string>(), It.IsAny<AssistedTravelSubmissionRequest>()), Times.Never);
    }

    [Fact]
    public async Task SubmitAssistedTravelRequests_ShouldReturnBadRequest_WhenBookingReferenceIsEmpty()
    {
        // Arrange
        var salesforceService = new Mock<ISalesforceService>();
        var controller = new BookingAssistedTravelController(salesforceService.Object);
        var request = new AssistedTravelSubmissionRequest
        {
            Passengers =
            [
                new AssistedTravelPassengerSubmission
                {
                    PassengerName = "Passenger One",
                    QuestionsAndAnswers =
                    [
                        new AssistedTravelQuestionAnswer
                        {
                            Question = "Q1",
                            Answer = "A1"
                        }
                    ]
                }
            ]
        };

        // Act
        var result = await controller.SubmitAssistedTravelRequests(string.Empty, request);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        badRequest.Value.Should().Be("Booking reference cannot be null or empty.");
        salesforceService.Verify(x => x.SubmitAssistedTravelRequests(It.IsAny<string>(), It.IsAny<AssistedTravelSubmissionRequest>()), Times.Never);
    }

    [Fact]
    public async Task SubmitAssistedTravelRequests_ShouldReturnBadRequest_WhenRequestIsNull()
    {
        // Arrange
        var salesforceService = new Mock<ISalesforceService>();
        var controller = new BookingAssistedTravelController(salesforceService.Object);

        // Act
        var result = await controller.SubmitAssistedTravelRequests("3625362", null!);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        badRequest.Value.Should().Be("At least one passenger with questions is required.");
        salesforceService.Verify(x => x.SubmitAssistedTravelRequests(It.IsAny<string>(), It.IsAny<AssistedTravelSubmissionRequest>()), Times.Never);
    }

    [Fact]
    public async Task SubmitAssistedTravelRequests_ShouldPropagateException_WhenServiceThrows()
    {
        // Arrange
        const string bookingReference = "3625362";
        var salesforceService = new Mock<ISalesforceService>();
        salesforceService
            .Setup(x => x.SubmitAssistedTravelRequests(bookingReference, It.IsAny<AssistedTravelSubmissionRequest>()))
            .ThrowsAsync(new InvalidOperationException("Salesforce unavailable"));

        var controller = new BookingAssistedTravelController(salesforceService.Object);
        var request = new AssistedTravelSubmissionRequest
        {
            Passengers =
            [
                new AssistedTravelPassengerSubmission
                {
                    PassengerName = "Passenger One",
                    QuestionsAndAnswers =
                    [
                        new AssistedTravelQuestionAnswer
                        {
                            Question = "Q1",
                            Answer = "A1"
                        }
                    ]
                }
            ]
        };

        // Act
        Func<Task<ActionResult<AssistedTravelSubmissionResult>>> action = () => controller.SubmitAssistedTravelRequests(bookingReference, request);

        // Assert
        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Salesforce unavailable");
    }

    [Fact]
    public async Task GetAssistedTravelRequests_ShouldReturnOk_WhenSalesforceReturnsData()
    {
        // Arrange
        const string bookingReference = "3625362";
        var expected = new AssistedTravelResult
        {
            IsSuccessful = true,
            RequestedAt = DateTimeOffset.Parse("2026-03-11T14:33:25+00:00", CultureInfo.InvariantCulture),
            CaseId = "500Pv00000RBPrlIAH",
            BookingReference = bookingReference,
            Passengers =
            [
                new AssistedTravelPassengerResult
                {
                    PassengerName = "Passenger One",
                    QuestionsAndAnswers =
                    [
                        new AssistedTravelQuestionAnswerResult
                        {
                            Question = "Which type of assistance do you require?",
                            Answer = "Mobility assistance",
                            RequestedAt = DateTimeOffset.Parse("2026-03-11T14:33:26+00:00", CultureInfo.InvariantCulture)
                        }
                    ],
                    AssistanceTypes = ["Mobility assistance"]
                }
            ]
        };

        var salesforceService = new Mock<ISalesforceService>();
        salesforceService
            .Setup(x => x.GetAssistedTravelRequests(bookingReference))
            .ReturnsAsync(expected);

        var controller = new BookingAssistedTravelController(salesforceService.Object);

        // Act
        var result = await controller.GetAssistedTravelRequests(bookingReference);

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        ok.Value.Should().BeEquivalentTo(expected);
        salesforceService.Verify(x => x.GetAssistedTravelRequests(bookingReference), Times.Once);
    }

    [Fact]
    public async Task GetAssistedTravelRequests_ShouldReturnBadRequest_WhenBookingReferenceIsEmpty()
    {
        // Arrange
        var salesforceService = new Mock<ISalesforceService>();
        var controller = new BookingAssistedTravelController(salesforceService.Object);

        // Act
        var result = await controller.GetAssistedTravelRequests(string.Empty);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        badRequest.Value.Should().Be("Booking reference cannot be null or empty.");
        salesforceService.Verify(x => x.GetAssistedTravelRequests(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task GetAssistedTravelRequests_ShouldPropagateException_WhenServiceThrows()
    {
        // Arrange
        const string bookingReference = "3625362";
        var salesforceService = new Mock<ISalesforceService>();
        salesforceService
            .Setup(x => x.GetAssistedTravelRequests(bookingReference))
            .ThrowsAsync(new InvalidOperationException("Salesforce unavailable"));

        var controller = new BookingAssistedTravelController(salesforceService.Object);

        // Act
        Func<Task<ActionResult<AssistedTravelResult>>> action = () => controller.GetAssistedTravelRequests(bookingReference);

        // Assert
        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Salesforce unavailable");
    }
}

