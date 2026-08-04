using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.External.Atcom.Mappers.InfoCancellation;
using easyJet.Holidays.External.Atcom.Models.InfoCancellation;
using easyJet.Holidays.External.Atcom.Services.Booking;
using easyJet.Holidays.External.Domain.Api;
using FluentAssertions;
using Moq;
using Xunit;
using InfoCancellationResponse = easyJet.Holidays.External.Atcom.Models.InfoCancellation.InfoCancellationResponse;

namespace easyJet.Holidays.External.Atcom.Tests.Services.Booking;

public class InfoCancellationRepositoryTests
{
    private readonly Mock<IInfoCancellationMapper> _mockInfoCancellationMapper;
    private readonly Mock<IApiService> _mockApiService;
    private readonly InfoCancellationRepository _infoCancellationRepository;

    public InfoCancellationRepositoryTests()
    {
        _mockInfoCancellationMapper = new Mock<IInfoCancellationMapper>();
        _mockApiService = new Mock<IApiService>();
        _infoCancellationRepository = new InfoCancellationRepository(
            _mockInfoCancellationMapper.Object,
            _mockApiService.Object);
    }

    [Fact]
    public async Task GetInfoCancellationAsync_WhenRepositoryReturnsValidResponse_ShouldReturnResponse()
    {
        // Arrange
        var bookingResponse = new BookingResponse
        {
            /* Setup BookingResponse properties */
        };
        var expectedApiResponse = new InfoCancellationResponse
        {
            // Setup response here
        };
        var expectedCancellationResponse = new Holidays.Api.Domain.Data.Booking.InfoCancellationResponse
        {
            /* Setup InfoCancellationResponse properties */
        };

        _mockInfoCancellationMapper
            .Setup(mapper => mapper.CreateRequest(bookingResponse, It.IsAny<bool>(), It.IsAny<bool>(), null))
            .ReturnsAsync(new InfoCancellationRequest());

        _mockApiService
            .Setup(service =>
                service
                    .GetResponseContentAsyncCustomErrorHandling<InfoCancellationRequest,
                        InfoCancellationResponse>(
                        It.IsAny<InfoCancellationRequest>()))
            .ReturnsAsync(expectedApiResponse);

        _mockInfoCancellationMapper
            .Setup(mapper => mapper.MapResponse(expectedApiResponse.Payload.Body))
            .Returns(expectedCancellationResponse);

        // Act
        var result = await _infoCancellationRepository.GetInfoCancellationAsync(bookingResponse);

        // Assert
        result.Should().BeEquivalentTo(expectedCancellationResponse);
        _mockApiService.Verify(
            service =>
                service
                    .GetResponseContentAsyncCustomErrorHandling<InfoCancellationRequest,
                        InfoCancellationResponse>(
                        It.IsAny<InfoCancellationRequest>()), Times.Once);
    }


    [Fact]
    public void GetInfoCancellationAsync_WhenBookingResponseIsNull_ShouldThrowArgumentNullException()
    {
        // Act
        Func<Task> act = async () => await _infoCancellationRepository.GetInfoCancellationAsync(null);

        // Assert
        act.Should().ThrowAsync<ArgumentNullException>();
    }
}