using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Seats;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Seats;
using easyJet.Holidays.Api.Domain.Services.AmendBooking;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using FluentAssertions;
using Moq;
using Xunit;
using Product = easyJet.Holidays.Api.Domain.Data.Booking.Product;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking;

public class AmendSeatsServiceTests
{
    private readonly Mock<IBookingRepository> _bookingRepositoryMock = new();
    private readonly Mock<IAuthenticationService> _authenticationServiceMock = new();
    private readonly AmendSeatsService _amendSeatsService;
    private readonly Mock<ITradeAgentAuthenticationService> _tradeAgentAuthServiceMock = new();
    private readonly Mock<ISeatingService> _seatingServiceMock = new();
    private readonly Mock<IFlightExtraService> _flightExtraServiceMock = new();

    public AmendSeatsServiceTests()
    {
        _amendSeatsService = new AmendSeatsService(
            _bookingRepositoryMock.Object,
            _authenticationServiceMock.Object,
            _tradeAgentAuthServiceMock.Object,
            _seatingServiceMock.Object,
            _flightExtraServiceMock.Object);
    }

    [Fact]
    public async Task ChangeSeats_ThrowsExceptionForNonLeadPassenger()
    {
        // Arrange
        _bookingRepositoryMock.Setup(repository => repository
                .GetBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(new BookingResponse
            {
                LeadPassenger = new LeadPassenger { Email = "test@test.com" },
                AmendmentInfo = new AmendmentsInfo { Seats = true }
            });

        _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(false);

        // Act
        Func<Task<AmendSeatsResponse>> act = () => _amendSeatsService.ChangeSeats(new AmendSeatsRequest { BookingReference = "test" });

        //Assert
        await act.Should().ThrowAsync<ApiException>()
            .WithMessage("Customer is not logged in or is not the lead passenger for the booking");
    }

    [Fact]
    public async Task ChangeSeats_ThrowsExceptionForNonTradeAgentWithTradePortalBooking()
    {
        // Arrange
        _bookingRepositoryMock.Setup(repository => repository
                .GetBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(new BookingResponse
            {
                LeadPassenger = new LeadPassenger { Email = "test@test.com" },
                AmendmentInfo = new AmendmentsInfo { Seats = true },
                IsExternalAgency = true
            });

        _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _tradeAgentAuthServiceMock.Setup(x => x.IsLoggedInAsTradeAgent()).Returns(false);

        // Act
        Func<Task<AmendSeatsResponse>> act = () => _amendSeatsService.ChangeSeats(new AmendSeatsRequest { BookingReference = "test" });

        //Assert
        await act.Should().ThrowAsync<ApiException>()
            .WithMessage("Only trade agents can amend Trade Portal booking");
    }

    [Fact]
    public async Task ChangeSeats_ThrowsExceptionWhenSeatsAmendmentProhibited()
    {
        // Arrange
        _bookingRepositoryMock.Setup(repository => repository
                .GetBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(new BookingResponse
            {
                LeadPassenger = new LeadPassenger { Email = "test@test.com" },
                AmendmentInfo = new AmendmentsInfo { Seats = false }
            });

        _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);

        // Act
        Func<Task<AmendSeatsResponse>> act = () => _amendSeatsService.ChangeSeats(new AmendSeatsRequest { BookingReference = "test" });

        //Assert
        await act.Should().ThrowAsync<ApiException>()
            .WithMessage("Seats modification prohibited");
    }

    [Fact]
    public async Task ChangeSeats_ReturnsExpectedResultForAddingSeats()
    {
        decimal amendmentCharges = 10;

        var newSeatMap = new List<SeatMap>
        {
            new()
            {
                SectorId = "1",
                Seats = new List<Seat>
                {
                    new() {SeatNumber = "1A", Price = 5m, PaxIndex = 1}
                }
            },
            new()
            {
                SectorId = "2",
                Seats = new List<Seat>
                {
                    new() {SeatNumber = "1B", Price = 5m, PaxIndex = 1}
                }
            }
        };

        _bookingRepositoryMock.Setup(repository => repository
                .GetBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(new BookingResponse
            {
                LeadPassenger = new LeadPassenger { Email = "test@test.com" },
                AmendmentInfo = new AmendmentsInfo { Seats = true }
            });

        _bookingRepositoryMock.Setup(repository => repository.ValidateAmendBookingInfo(
            It.IsAny<AmendInfoBookingRequest>(),
            It.IsAny<BookingResponse>(),
            It.IsAny<bool>(), It.IsAny<bool>())).ReturnsAsync(new ValidateAmendBookingResponse
            {
                PaymentInfo = new PriceInfo { AmendmentCharges = amendmentCharges },
                SeatSelection = newSeatMap
            });

        _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);

        var result = await _amendSeatsService.ChangeSeats(new AmendSeatsRequest { BookingReference = "test", SeatSelection = newSeatMap });

        result.AmendmentCharges.Should().Be(amendmentCharges);
        result.NewSeatSelection.Should()
            .BeEquivalentTo(AmendSeatsService.CalculateSeatPriceDifference(newSeatMap, null));
    }

    [Fact]
    public async Task ChangeSeats_ReturnsExpectedResultForChangingSeats()
    {
        decimal amendmentCharges = 10;

        var oldSeatMap = new List<SeatMap>
        {
            new()
            {
                SectorId = "1",
                Seats = new List<Seat>
                {
                    new() {SeatNumber = "2A", Price = 5m, PaxIndex = 1}
                }
            },
            new()
            {
                SectorId = "2",
                Seats = new List<Seat>
                {
                    new() {SeatNumber = "2B", Price = 5m, PaxIndex = 1}
                }
            }
        };

        var newSeatMap = new List<SeatMap>
        {
            new()
            {
                SectorId = "1",
                Seats = new List<Seat>
                {
                    new() {SeatNumber = "1A", Price = 10m, PaxIndex = 1}
                }
            },
            new()
            {
                SectorId = "2",
                Seats = new List<Seat>
                {
                    new() {SeatNumber = "1B", Price = 10m, PaxIndex = 1}
                }
            }
        };

        _bookingRepositoryMock.Setup(repository => repository
                .GetBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(new BookingResponse
            {
                LeadPassenger = new LeadPassenger { Email = "test@test.com" },
                AmendmentInfo = new AmendmentsInfo { Seats = true },
                SeatSelection = oldSeatMap
            });

        _bookingRepositoryMock.Setup(repository => repository.ValidateAmendBookingInfo(
            It.IsAny<AmendInfoBookingRequest>(),
            It.IsAny<BookingResponse>(),
            It.IsAny<bool>(), It.IsAny<bool>())).ReturnsAsync(new ValidateAmendBookingResponse
            {
                PaymentInfo = new PriceInfo { AmendmentCharges = amendmentCharges },
                SeatSelection = newSeatMap
            });

        _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);

        var result = await _amendSeatsService.ChangeSeats(new AmendSeatsRequest { BookingReference = "test", SeatSelection = newSeatMap });

        result.AmendmentCharges.Should().Be(amendmentCharges);
        result.NewSeatSelection.Should()
            .BeEquivalentTo(AmendSeatsService.CalculateSeatPriceDifference(newSeatMap, oldSeatMap));
    }

    [Fact]
    public void CalculateSeatPriceDifference_ReturnsEmptyForNullInput()
    {
        var result = AmendSeatsService.CalculateSeatPriceDifference(null, null);
        result.Should().BeEmpty();
    }

    [Fact]
    public void CalculateSeatPriceDifference_ReturnsEmptyForEmptyInput()
    {
        var result = AmendSeatsService.CalculateSeatPriceDifference(new List<SeatMap>(), new List<SeatMap>());
        result.Should().BeEmpty();
    }

    [Fact]
    public void CalculateSeatPriceDifference_ReturnsZeroDifferenceForSamePrices()
    {
        var seatMap = new List<SeatMap>
        {
            new()
            {
                SectorId = "1",
                Seats = new List<Seat>
                {
                    new() {SeatNumber = "1A", Price = 8.99m, PaxIndex = 1}
                }
            },
            new()
            {
                SectorId = "2",
                Seats = new List<Seat>
                {
                    new() {SeatNumber = "1B", Price = 9m, PaxIndex = 1}
                }
            }
        };

        var result = AmendSeatsService.CalculateSeatPriceDifference(seatMap, seatMap);
        result.All(sm => sm.Seats.All(seat => seat.Price == 0)).Should().BeTrue();
    }

    [Fact]
    public void CalculateSeatPriceDifference_CorrectDifferenceForAddingSeats()
    {
        var oldSeatMap = new List<SeatMap>
        {
            null,
            new() {SectorId = "2", Seats = new List<Seat> {new() {SeatNumber = "10A", Price = 8.99m, PaxIndex = 3}}}
        };

        var newSeatMap = new List<SeatMap>
        {
            new()
            {
                SectorId = "1",
                Seats = new List<Seat>
                {
                    new() {SeatNumber = "1A", Price = 8.99m, PaxIndex = 1}
                }
            },
            new()
            {
                SectorId = "2",
                Seats = new List<Seat>
                {
                    new() {SeatNumber = "1B", Price = 9m, PaxIndex = 1}
                }
            }
        };

        var result = AmendSeatsService.CalculateSeatPriceDifference(newSeatMap, oldSeatMap);

        foreach (var seatMap in result)
        {
            var referenceSeatMap = newSeatMap.Single(sm => sm.SectorId == seatMap.SectorId);
            foreach (var seat in seatMap.Seats)
            {
                var referenceSeat = referenceSeatMap.Seats.Single(s => s.PaxIndex == seat.PaxIndex);
                seat.Price.Should().Be(referenceSeat.Price);
            }
        }
    }

    [Fact]
    public void CalculateSeatPriceDifference_CorrectDifferenceForSeatsUpgrade()
    {
        var oldSeatMap = new List<SeatMap>
        {
            new()
            {
                SectorId = "1",
                Seats = new List<Seat>
                {
                    new() {SeatNumber = "1A", Price = 8.99m, PaxIndex = 1}
                }
            },
            new()
            {
                SectorId = "2",
                Seats = new List<Seat>
                {
                    new() {SeatNumber = "1B", Price = 9m, PaxIndex = 1}
                }
            }
        };

        var newSeatMap = new List<SeatMap>
        {
            new()
            {
                SectorId = "1",
                Seats = new List<Seat>
                {
                    new() {SeatNumber = "1A", Price = 15m, PaxIndex = 1}
                }
            },
            new()
            {
                SectorId = "2",
                Seats = new List<Seat>
                {
                    new() {SeatNumber = "1B", Price = 10.55m, PaxIndex = 1}
                }
            }
        };

        var result = AmendSeatsService.CalculateSeatPriceDifference(newSeatMap, oldSeatMap);

        foreach (var seatMap in result)
        {
            var referenceNewSeatMap = newSeatMap.Single(sm => sm.SectorId == seatMap.SectorId);
            var referenceOldSeatMap = oldSeatMap.Single(sm => sm.SectorId == seatMap.SectorId);
            foreach (var seat in seatMap.Seats)
            {
                var referenceNewSeat = referenceNewSeatMap.Seats.Single(s => s.PaxIndex == seat.PaxIndex);
                var referenceOldSeat = referenceOldSeatMap.Seats.Single(s => s.PaxIndex == seat.PaxIndex);
                seat.Price.Should().Be(referenceNewSeat.Price - referenceOldSeat.Price);
            }
        }
    }

    [Fact]
    public void CalculateSeatPriceDifference_CorrectDifferenceForSeatsDowngrade()
    {
        var oldSeatMap = new List<SeatMap>
        {
            new()
            {
                SectorId = "1",
                Seats = new List<Seat>
                {
                    new() {SeatNumber = "1A", Price = 8.99m, PaxIndex = 1}
                }
            },
            new()
            {
                SectorId = "2",
                Seats = new List<Seat>
                {
                    new() {SeatNumber = "1B", Price = 9m, PaxIndex = 1}
                }
            }
        };

        var newSeatMap = new List<SeatMap>
        {
            new()
            {
                SectorId = "1",
                Seats = new List<Seat>
                {
                    new() {SeatNumber = "1A", Price = 3.45m, PaxIndex = 1}
                }
            },
            new()
            {
                SectorId = "2",
                Seats = new List<Seat>
                {
                    new() {SeatNumber = "1B", Price = 2m, PaxIndex = 1}
                }
            }
        };

        var result = AmendSeatsService.CalculateSeatPriceDifference(newSeatMap, oldSeatMap);
        result.All(sm => sm.Seats.All(seat => seat.Price == 0)).Should().BeTrue();
    }

    [Fact]
    public async Task ChangeSeats_ReturnsPaymentInformationOnlyForAgent()
    {
        decimal amendmentCharges = 10;

        _bookingRepositoryMock.Setup(repository => repository
            .GetBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(new BookingResponse
            {
                LeadPassenger = new LeadPassenger { Email = "test@test.com" },
                AmendmentInfo = new AmendmentsInfo { Seats = true },
                IsExternalAgency = false
            });

        _bookingRepositoryMock.Setup(repository => repository.ValidateAmendBookingInfo(
            It.IsAny<AmendInfoBookingRequest>(),
            It.IsAny<BookingResponse>(),
            It.IsAny<bool>(), It.IsAny<bool>())).ReturnsAsync(new ValidateAmendBookingResponse
            {
                PaymentInfo = new PriceInfo { AmendmentCharges = amendmentCharges },
            });

        _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);

        var result = await _amendSeatsService.ChangeSeats(new AmendSeatsRequest { BookingReference = "test" });

        result.AmendmentCharges.Should().Be(amendmentCharges);

        Assert.Null(result.PaymentInfo);
        Assert.Null(result.PriceBreakdown);
        Assert.Null(result.TradeAgentPriceBreakdown);
    }

    [Fact]
    public void UpdateSeatsInformation_ShouldUpdateProperties()
    {
        // Arrange
        var oldSeat = new Seat
        {
            Price = 100, // Initial values
            PriceBand = "A",
            Products = new List<Product> { new Product { Id = "1", Description = "Old Product", Icon = "Old Icon", Name = "Old Name" } }
        };

        var newSeatInfo = new SeatMapSeat
        {
            Price = 200, // New values
            PriceBand = "B",
            Products = [new() { Id = "2", Description = "New Product", Icon = "New Icon", Name = "New Name" }]
        };

        // Act
        _amendSeatsService.UpdateSeatsInformation(oldSeat, newSeatInfo);

        // Assert
        oldSeat.Price.Should().Be(newSeatInfo.Price);
        oldSeat.PriceBand.Should().Be(newSeatInfo.PriceBand);
        oldSeat.Products.Should().BeEquivalentTo(newSeatInfo.Products.Select(x => new Product
        {
            Id = x.Id,
            Description = x.Description,
            Icon = x.Icon,
            Name = x.Name
        }), options => options.ComparingByMembers<Product>());
    }
}