using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Mappers.Builders;
using FluentAssertions;
using FluentAssertions.Execution;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Mappers;

public class RoomVariantsSearchRequestBuilderTests
{
    [Fact]
    public void BuildRoomVariantsRequest_ShouldCreateCorrectRoomVariantsSearchRequest()
    {
        // Arrange
        var mockBooking = new BookingResponse
        {
            Package = new BookingPackage()
            {
                Accom = new BookingAccommodation()
                {
                    Rooms = new List<Unit>
                    {
                        new Unit() {Code = "R1", Board = "AllInclusive"}
                    }
                }
            },
            MarketCode = "UK"
        };

        var mockAlternativeFlightsSearchRequest = new AmendFlightSearchRequest
        {
            Duration = new List<int> { 7 },
            StartDate = "15-7-2023",
            Room = new List<RoomAllocation>
            {
                new RoomAllocation
                {
                    Adults = 2,
                    Children = 1,
                    Infants = 1
                }
            },
            DepartureAirport = "LGW"
        };

        var mockCurrentOffer = new Offer
        {
            Accom = new Accom()
            {
                PackageId = "P1",
                Id = "A1"
            },
            Transport = new Transport
            {
                Routes = new List<Route>
                {
                    new Route {Id = "R1"},
                    new Route {Id = "R2"}
                }
            }
        };

        // Act
        var result = RoomVariantsSearchRequestBuilder.BuildRoomVariantsRequest(mockBooking, mockAlternativeFlightsSearchRequest, mockCurrentOffer);

        // Assert
        using (new AssertionScope())
        {
            result.Should().NotBeNull();
            result.PackageId.Should().Be("P1");
            result.AccommodationId.Should().Be("A1");
            result.Duration.Should().BeEquivalentTo(new List<int> { 7 });
            result.StartDate.Should().Be("15-7-2023");
            result.Room.First().Adults.Should().Be(2);
            result.Room.First().Children.Should().Be(1);
            result.Room.First().Infants.Should().Be(1);
            result.Room.First().RoomCode.Should().Be("R1");
            result.DepartureAirport.Should().Be("LGW");
            result.BoardType.Should().Be("AllInclusive");
            result.OutboundRouteId.Should().Be("R1");
            result.InboundRouteId.Should().Be("R2");
            result.MarketCode.Should().Be("UK");
        }
    }
}