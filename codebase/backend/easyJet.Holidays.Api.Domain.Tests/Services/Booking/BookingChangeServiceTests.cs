#nullable enable
using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking;

[Obsolete("Sut is obsolete")]
public class BookingChangeServiceTests
{
    [Fact]
    public async Task Success_Change_Booking_PrivacyAsync()
    {
        // Arrange
        var memo = new List<Memo> { new Memo { Code = "PRVC", Text = "False" } };
        var fixture = FixtureUtils.AutoMoqFixture();
        var authServiceMock = fixture.Freeze<Mock<IAuthenticationService>>();
        authServiceMock.Setup(x => x.GetCustomerEmail()).ReturnsAsync("Test@test.com");

        // put settings which to make sure that change is allowed
        fixture.Inject(Options.Create(new AtcomSettings
        {
            ChangeBooking = new ChangeBookingSettings
            {
                IsActive = true,
                AllowedStatuses = ["BOOKING"],
                AllowMultipleChanges = true,
                Memo = new AtcomMemoSettings { BookingPrivacyCode = "PRVC" }
            }
        }));
        var fetchBookingService = fixture.Freeze<Mock<IBookingFetchService>>();
        fetchBookingService.Setup(x => x.BookingCanBeChanged(It.IsAny<BookingResponse>())).ReturnsAsync(true);

        var bookingRepository = fixture.Freeze<Mock<IBookingRepository>>();
        bookingRepository.Setup(x => x.GetBookingMemo(It.IsAny<string>())).ReturnsAsync(memo);

        var sut = fixture.Freeze<BookingChangeService>();

        var booking = new BookingResponse
        {
            BookingStatus = "BOOKING",
            PaymentInfo = new PriceInfo { BalanceDueAmount = 0 },
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route { Direction = Direction.Outbound, }
                    ]
                }
            },
            CustomerDetails = new CustomerDetails { Email = "Test@test.com" },
            Memo = memo
        };

        // Act
        var act = await sut.ChangeBookingPrivacy(booking, false);

        // Assert
        act.Should().Equal(memo);
    }

    [Fact]
    public async Task Error_Customer_Validate_To_Change_Booking_PrivacyAsync()
    {
        // Arrange
        var memo = new List<Memo> { new Memo { Code = "PRVC", Text = "True" } };
        var fixture = FixtureUtils.AutoMoqFixture();
        var authServiceMock = fixture.Freeze<Mock<IAuthenticationService>>();
        authServiceMock.Setup(x => x.CustomerDetails())
            .ReturnsAsync(new Domain.Data.Authentication.CustomerDetails { Email = "Test@test.com" });

        // put settings which to make sure that change is allowed
        fixture.Inject(Options.Create(new AtcomSettings
        {
            ChangeBooking = new ChangeBookingSettings
            {
                IsActive = true,
                AllowedStatuses = ["BOOKING"],
                AllowMultipleChanges = true,
                Memo = new AtcomMemoSettings { BookingPrivacyCode = "PRVC" }
            }
        }));
        var fetchBookingService = fixture.Freeze<Mock<IBookingFetchService>>();
        fetchBookingService.Setup(x => x.BookingCanBeChanged(It.IsAny<BookingResponse>()))
            .ReturnsAsync(It.IsAny<bool>());

        var bookingRepository = fixture.Freeze<Mock<IBookingRepository>>();
        bookingRepository.Setup(x => x.GetBookingMemo(It.IsAny<string>())).ReturnsAsync(It.IsAny<List<Memo>>());

        var sut = fixture.Freeze<BookingChangeService>();

        var booking = new BookingResponse
        {
            BookingStatus = "BOOKING",
            PaymentInfo = new PriceInfo { BalanceDueAmount = 0 },
            Package = new BookingPackage
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route { Direction = Direction.Outbound, }
                    ]
                }
            },
            CustomerDetails = new CustomerDetails { Email = "Test111@test.com" },
            Memo = memo
        };


        // Act
        Func<Task> act = () => sut.ChangeBookingPrivacy(booking, false);

        // Assert
        await act.Should().ThrowExactlyAsync<ApiException>()
            .Where(e => e.Code.Code == ApiExceptionCodes.BookingCannotSetPrivacy.Code);
    }

    public static IEnumerable<object[]> ValidateChangeBookingNewOfferTestData()
    {
        // because, isValid
        // bookingDepDate,
        // ewOfferDepDate
        yield return new object[]
        {
            "new offer date < current booking date", false, DateTimeOffset.Now.AddDays(10),
            DateTimeOffset.Now.AddDays(5)
        };

        yield return new object[]
        {
            "new offer date == current booking date", true, DateTimeOffset.Now.AddDays(10),
            DateTimeOffset.Now.AddDays(10)
        };

        yield return new object[]
        {
            "new offer date > current booking date", true, DateTimeOffset.Now.AddDays(10),
            DateTimeOffset.Now.AddDays(15)
        };
    }

    [Fact]
    public async Task Error_Customer_Email_Does_Not_Match_Booking_Email()
    {
        // Arrange
        var fixture = FixtureUtils.AutoMoqFixture();
        var authServiceMock = fixture.Freeze<Mock<IAuthenticationService>>();
        authServiceMock.Setup(x => x.GetCustomerEmail()).ReturnsAsync("AnotherEmail@test.com");

        fixture.Inject(Options.Create(new AtcomSettings
        {
            ChangeBooking = new ChangeBookingSettings
            {
                IsActive = true,
                AllowedStatuses = ["BOOKING"],
                Memo = new AtcomMemoSettings { BookingPrivacyCode = "PRVC" }
            }
        }));

        var sut = fixture.Freeze<BookingChangeService>();

        var booking = new BookingResponse
        {
            BookingStatus = "BOOKING", CustomerDetails = new CustomerDetails { Email = "Test@test.com" }
        };

        // Act
        Func<Task> act = () => sut.ChangeBookingPrivacy(booking, true);

        // Assert
        await act.Should().ThrowExactlyAsync<ApiException>()
            .Where(e => e.Code.Code == ApiExceptionCodes.BookingCannotSetPrivacy.Code);
    }

    [Fact]
    public async Task Success_Add_New_Privacy_Memo()
    {
        // Arrange
        var fixture = FixtureUtils.AutoMoqFixture();
        var authServiceMock = fixture.Freeze<Mock<IAuthenticationService>>();
        authServiceMock.Setup(x => x.GetCustomerEmail()).ReturnsAsync("Test@test.com");

        fixture.Inject(Options.Create(new AtcomSettings
        {
            ChangeBooking = new ChangeBookingSettings
            {
                IsActive = true,
                AllowedStatuses = ["BOOKING"],
                Memo = new AtcomMemoSettings
                {
                    BookingPrivacyCode = "PRVC",
                    BookingIsPrivateText = "Private",
                    BookingIsNotPrivateText = "Public"
                }
            }
        }));

        var bookingRepository = fixture.Freeze<Mock<IBookingRepository>>();
        bookingRepository.Setup(x => x.GetBookingMemo(It.IsAny<string>())).ReturnsAsync(new List<Memo>());

        var sut = fixture.Freeze<BookingChangeService>();

        var booking = new BookingResponse
        {
            BookingReference = "123",
            BookingStatus = "BOOKING",
            CustomerDetails = new CustomerDetails { Email = "Test@test.com" },
            Memo = new List<Memo>()
        };

        // Act
        await sut.ChangeBookingPrivacy(booking, true);

        // Assert
        bookingRepository.Verify(x => x.ModifyMemo("123", It.IsAny<BookingMemo>()), Times.Once);
    }

    [Fact]
    public async Task Success_Update_Existing_Memo_To_Private()
    {
        // Arrange
        var memo = new List<Memo> { new Memo { Code = "PRVC", Text = "Public" } };
        var fixture = FixtureUtils.AutoMoqFixture();
        var authServiceMock = fixture.Freeze<Mock<IAuthenticationService>>();
        authServiceMock.Setup(x => x.GetCustomerEmail()).ReturnsAsync("Test@test.com");

        fixture.Inject(Options.Create(new AtcomSettings
        {
            ChangeBooking = new ChangeBookingSettings
            {
                IsActive = true,
                AllowedStatuses = ["BOOKING"],
                Memo = new AtcomMemoSettings
                {
                    BookingPrivacyCode = "PRVC",
                    BookingIsPrivateText = "Private",
                    BookingIsNotPrivateText = "Public"
                }
            }
        }));

        var bookingRepository = fixture.Freeze<Mock<IBookingRepository>>();
        bookingRepository.Setup(x => x.GetBookingMemo(It.IsAny<string>())).ReturnsAsync(memo);

        var sut = fixture.Freeze<BookingChangeService>();

        var booking = new BookingResponse
        {
            BookingReference = "123",
            BookingStatus = "BOOKING",
            CustomerDetails = new CustomerDetails { Email = "Test@test.com" },
            Memo = memo
        };

        // Act
        await sut.ChangeBookingPrivacy(booking, true);

        // Assert
        bookingRepository.Verify(
            x => x.ModifyMemo("123",
                It.Is<BookingMemo>(
                    bookingMemo => bookingMemo.Code == "PRVC" && bookingMemo.Description == "Private")),
            Times.Once);
    }

    [Fact]
    public async Task Success_Update_Existing_Memo_To_Public()
    {
        // Arrange
        var memo = new List<Memo> { new Memo { Code = "PRVC", Text = "Private" } };
        var fixture = FixtureUtils.AutoMoqFixture();
        var authServiceMock = fixture.Freeze<Mock<IAuthenticationService>>();
        authServiceMock.Setup(x => x.GetCustomerEmail()).ReturnsAsync("Test@test.com");

        fixture.Inject(Options.Create(new AtcomSettings
        {
            ChangeBooking = new ChangeBookingSettings
            {
                IsActive = true,
                AllowedStatuses = ["BOOKING"],
                Memo = new AtcomMemoSettings
                {
                    BookingPrivacyCode = "PRVC",
                    BookingIsPrivateText = "Private",
                    BookingIsNotPrivateText = "Public"
                }
            }
        }));

        var bookingRepository = fixture.Freeze<Mock<IBookingRepository>>();
        bookingRepository.Setup(x => x.GetBookingMemo(It.IsAny<string>())).ReturnsAsync(memo);

        var sut = fixture.Freeze<BookingChangeService>();

        var booking = new BookingResponse
        {
            BookingReference = "123",
            BookingStatus = "BOOKING",
            CustomerDetails = new CustomerDetails { Email = "Test@test.com" },
            Memo = memo
        };

        // Act
        await sut.ChangeBookingPrivacy(booking, false);

        // Assert
        bookingRepository.Verify(
            x => x.ModifyMemo("123",
                It.Is<BookingMemo>(bookingMemo =>
                    bookingMemo.Code == "PRVC" && bookingMemo.Description == "Public")), Times.Once);
    }

    [Fact]
    public async Task AmendSpecialRequests_ShouldReturnUpdatedBookingResponse()
    {
        // Arrange
        var fixture = FixtureUtils.AutoMoqFixture();

        var bookingResponse = new BookingResponse
        {
            BookingReference = "123",
            AmendmentInfo = new AmendmentsInfo(),
            SpecialRequests = new List<SpecialRequest>().ToArray()
        };

        var amendSsrRequest = new AmendSsrRequest
        {
            BookingReference = "123", 
            SpecialRequests = ["MEAL"]
        };

        var bookingRepositoryMock = fixture.Freeze<Mock<IBookingRepository>>();
        bookingRepositoryMock.Setup(x => x.GetBooking(amendSsrRequest)).ReturnsAsync(bookingResponse);

        var bookingSpecialRequestServiceMock = fixture.Freeze<Mock<IBookingSpecialRequestService>>();
        bookingSpecialRequestServiceMock
            .Setup(x => x.EnsureAmmendSSr(bookingResponse, true))
            .ReturnsAsync(bookingResponse);
        bookingSpecialRequestServiceMock
            .Setup(x => x.AmmendSpecialRequestsFromBooking(amendSsrRequest.SpecialRequests, bookingResponse))
            .ReturnsAsync(bookingResponse);
        bookingSpecialRequestServiceMock
            .Setup(x => x.ValidateSpecialRequestAmendmends(bookingResponse))
            .ReturnsAsync(true);

        var bookingFetchServiceMock = fixture.Freeze<Mock<IBookingFetchService>>();
        bookingFetchServiceMock
            .Setup(x => x.EnrichAndSecureBookingResponse(bookingResponse))
            .Returns(Task.CompletedTask);

        var hotelsServiceMock = fixture.Freeze<Mock<IHotelsService>>();
        hotelsServiceMock
            .Setup(x => x.EnrichBookingResponse(bookingResponse))
            .Returns(Task.CompletedTask);

        var sut = fixture.Freeze<BookingChangeService>();

        // Act
        var result = await sut.AmendSpecialRequests(amendSsrRequest);

        // Assert
        result.Should().NotBeNull();
        result.Should().Be(bookingResponse);

        bookingRepositoryMock.Verify(x => x.GetBooking(amendSsrRequest), Times.Once);
        bookingSpecialRequestServiceMock.Verify(x => x.EnsureAmmendSSr(bookingResponse, true), Times.Once);
        bookingSpecialRequestServiceMock.Verify(
            x => x.AmmendSpecialRequestsFromBooking(amendSsrRequest.SpecialRequests, bookingResponse), Times.Once);
        bookingSpecialRequestServiceMock.Verify(x => x.ValidateSpecialRequestAmendmends(bookingResponse),
            Times.Once);
        bookingFetchServiceMock.Verify(x => x.EnrichAndSecureBookingResponse(bookingResponse), Times.Once);
        hotelsServiceMock.Verify(x => x.EnrichBookingResponse(bookingResponse), Times.Once);
    }
}