using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Services.AmendBooking;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking;

public class AmendLuggageServiceTests
{
    private readonly Mock<IBookingRepository> _bookingRepositoryMock = new();
    private readonly Mock<IAuthenticationService> _authenticationServiceMock = new();
    private readonly AmendLuggageService _sut;
    private readonly Mock<ITradeAgentAuthenticationService> _tradeAgentCookieServiceMock = new();

    public AmendLuggageServiceTests()
    {
        _sut = new AmendLuggageService(
            _bookingRepositoryMock.Object,
            _authenticationServiceMock.Object,
            _tradeAgentCookieServiceMock.Object
        );
    }

    [Fact]
    public async Task ChangeExtraLuggage_ForNonLeadPassenger_ShouldThrowsException()
    {
        // Arrange
        _bookingRepositoryMock
            .Setup(repository => repository.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new BookingResponse
            {
                LeadPassenger = new LeadPassenger { Email = "test@test.com" },
                //AmendmentInfo = new AmendmentsInfo {Seats = true}
            });
        _authenticationServiceMock
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(false);

        // Act
        var act = () => _sut.ChangeExtraLuggage(new AmendLuggageRequest { BookingReference = "test" });

        //Assert
        await act.Should()
            .ThrowAsync<ApiException>()
            .WithMessage("Customer is not logged in or is not the lead passenger for the booking");
    }

    [Fact]
    public async Task ChangeExtraLuggage_ForNonTradeAgentWithTradePortalBooking_ShouldThrowsException()
    {
        // Arrange
        _bookingRepositoryMock
            .Setup(repository => repository.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new BookingResponse
            {
                LeadPassenger = new LeadPassenger { Email = "test@test.com" },
                IsExternalAgency = true
            });
        _authenticationServiceMock
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);
        _tradeAgentCookieServiceMock
            .Setup(x => x.IsLoggedInAsTradeAgent())
            .Returns(false);

        // Act
        var act = () => _sut.ChangeExtraLuggage(new AmendLuggageRequest { BookingReference = "test" });

        //Assert
        await act.Should()
            .ThrowAsync<ApiException>()
            .WithMessage("Only trade agents can amend Trade Portal booking");
    }

    [Fact]
    public async Task ChangeExtraLuggage_ForAddingLuggage_ReturnsExpectedResult()
    {
        // Arrange
        decimal amendmentCharges = 10;
        var extraLuggage = new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    Price = 10,
                    Quantity = 1,
                    ItemCode = "LUS",
                    ItemCategoryCode = "BAGE",
                    PassengerId = "1",
                    RouteId = "1"
                },
                new()
                {
                    Price = 10,
                    Quantity = 1,
                    ItemCode = "LUS",
                    ItemCategoryCode = "BAGE",
                    PassengerId = "1",
                    RouteId = "2"
                }
            }
        };
        _bookingRepositoryMock
            .Setup(repository => repository.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new BookingResponse
            {
                LeadPassenger = new LeadPassenger { Email = "test@test.com" },
            });
        _bookingRepositoryMock
            .Setup(repository => repository.ValidateAmendBookingInfo(
                It.IsAny<AmendInfoBookingRequest>(),
                It.IsAny<BookingResponse>(),
                It.IsAny<bool>(),
                It.IsAny<bool>()
            ))
            .ReturnsAsync(new ValidateAmendBookingResponse
            {
                PaymentInfo = new PriceInfo { AmendmentCharges = amendmentCharges },
                ExtraLuggageInfo = extraLuggage
            });
        _authenticationServiceMock
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        // Act
        var result = await _sut.ChangeExtraLuggage(new AmendLuggageRequest { BookingReference = "test", ExtraLuggageInfo = extraLuggage });

        // Assert
        result.AmendmentCharges.Should().Be(amendmentCharges);
        result.ExtraLuggageInfo.Should().BeEquivalentTo(extraLuggage);
    }

    [Fact]
    public async Task ChangeExtraLuggage_ForChangingLuggage_ShouldReturnsExpectedResult()
    {
        decimal amendmentCharges = 10;
        var oldExtraLuggage = new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    Price = 10,
                    Quantity = 1,
                    ItemCode = "LUS",
                    ItemCategoryCode = "BAGE",
                    PassengerId = "1",
                    RouteId = "1"
                },
                new()
                {
                    Price = 10,
                    Quantity = 1,
                    ItemCode = "LUS",
                    ItemCategoryCode = "BAGE",
                    PassengerId = "1",
                    RouteId = "2"
                }
            },
        };
        var newExtraLuggage = new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    Price = 10,
                    Quantity = 1,
                    ItemCode = "LUS",
                    ItemCategoryCode = "BAGE",
                    PassengerId = "1",
                    RouteId = "1"
                },
                new()
                {
                    Price = 10,
                    Quantity = 1,
                    ItemCode = "LUS",
                    ItemCategoryCode = "BAGE",
                    PassengerId = "1",
                    RouteId = "2"
                },
                new()
                {
                    Price = 10,
                    Quantity = 1,
                    ItemCode = "LUS",
                    ItemCategoryCode = "BAGE",
                    PassengerId = "2",
                    RouteId = "1"
                },
                new()
                {
                    Price = 10,
                    Quantity = 1,
                    ItemCode = "LUS",
                    ItemCategoryCode = "BAGE",
                    PassengerId = "2",
                    RouteId = "2"
                }
            },
        };
        _bookingRepositoryMock
            .Setup(repository => repository.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new BookingResponse
            {
                LeadPassenger = new LeadPassenger { Email = "test@test.com" },
                ExtraLuggageInfo = oldExtraLuggage
            });
        _bookingRepositoryMock
            .Setup(repository => repository.ValidateAmendBookingInfo(
                It.IsAny<AmendInfoBookingRequest>(),
                It.IsAny<BookingResponse>(),
                It.IsAny<bool>(),
                It.IsAny<bool>()
            ))
            .ReturnsAsync(new ValidateAmendBookingResponse
            {
                PaymentInfo = new PriceInfo { AmendmentCharges = amendmentCharges },
                ExtraLuggageInfo = newExtraLuggage
            });
        _authenticationServiceMock
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        var result = await _sut.ChangeExtraLuggage(new AmendLuggageRequest { BookingReference = "test", ExtraLuggageInfo = newExtraLuggage });

        result.AmendmentCharges.Should().Be(amendmentCharges);
        result.ExtraLuggageInfo.Should().BeEquivalentTo(newExtraLuggage);
    }

    [Fact]
    public async Task ChangeExtraLuggage_ForAgent_ReturnsPaymentInformation()
    {
        decimal amendmentCharges = 10;
        _bookingRepositoryMock
            .Setup(repository => repository.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new BookingResponse
            {
                LeadPassenger = new LeadPassenger { Email = "test@test.com" },
                IsExternalAgency = false
            });

        _bookingRepositoryMock
            .Setup(repository => repository.ValidateAmendBookingInfo(
                It.IsAny<AmendInfoBookingRequest>(),
                It.IsAny<BookingResponse>(),
                It.IsAny<bool>(),
                It.IsAny<bool>()
            ))
            .ReturnsAsync(new ValidateAmendBookingResponse
            {
                PaymentInfo = new PriceInfo { AmendmentCharges = amendmentCharges },
            });

        _authenticationServiceMock
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        var result = await _sut.ChangeExtraLuggage(new AmendLuggageRequest { BookingReference = "test" });

        result.AmendmentCharges.Should().Be(amendmentCharges);
        result.PaymentInfo.Should().BeNull();
        result.PriceBreakdown.Should().BeNull();
        result.TradeAgentPriceBreakdown.Should().BeNull();
    }
}