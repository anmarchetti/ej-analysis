using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Services.Booking;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking;

public class InfoCancellationServiceTests
{
    private readonly Mock<IInfoCancellationRepository> _mockCancellationRepository;
    private readonly InfoCancellationService _infoCancellationService;

    public InfoCancellationServiceTests()
    {
        _mockCancellationRepository = new Mock<IInfoCancellationRepository>();
        _infoCancellationService = new InfoCancellationService(_mockCancellationRepository.Object);
    }

    [Fact]
    public async Task GetInfoCancellationAsync_WhenRepositoryReturnsValidResponse_ShouldReturnResponse()
    {
        // Arrange
        var bookingResponse = new BookingResponse ();
        var expectedResponse = new InfoCancellationResponse();

        _mockCancellationRepository
            .Setup(repo => repo.GetInfoCancellationAsync(bookingResponse))
            .ReturnsAsync(expectedResponse);

        // Act
        var result = await _infoCancellationService.GetInfoCancellationAsync(bookingResponse);

        // Assert
        result.Should().BeEquivalentTo(expectedResponse);
        _mockCancellationRepository.Verify(repo => repo.GetInfoCancellationAsync(bookingResponse), Times.Once);
    }

    [Fact]
    public async Task GetInfoCancellationAsync_WhenRepositoryReturnsNull_ShouldThrowApiException()
    {
        // Arrange
        var bookingResponse = new BookingResponse();

        _mockCancellationRepository
            .Setup(repo => repo.GetInfoCancellationAsync(bookingResponse))
            .ReturnsAsync((InfoCancellationResponse)null);

        // Act
        Func<Task> act = async () => await _infoCancellationService.GetInfoCancellationAsync(bookingResponse);

        // Assert
        await act.Should().ThrowAsync<ApiException>()
            .WithMessage("Booking fee could not be retrieved");
        _mockCancellationRepository.Verify(repo => repo.GetInfoCancellationAsync(bookingResponse), Times.Once);
    }
}