using Amazon.SQS;
using Amazon.SQS.Model;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.Marketing;
using easyJet.Holidays.Api.Domain.Data.Eskel;
using easyJet.Holidays.Api.Domain.Data.Themes;
using easyJet.Holidays.Api.Domain.Interfaces.Eskel;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.FeefoDataGenerator.Services;
using easyJet.Holidays.External.AWS.FeefoDataGenerator.Settings;
using easyJet.Holidays.External.Feefo.Models.EnterSale;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using Xunit;
using Hotel = easyJet.Holidays.Api.Domain.Data.Hotels.Hotel;

namespace easyJet.Holidays.External.AWS.FeefoDataGenerator.Tests.Services;

public class FeefoDataGenerationHandlerTests
{
    private readonly Mock<IAmazonSQS> _mockSqsClient;
    private readonly Mock<IEskelService> _mockBookingsService;
    private readonly Mock<IHotelsService> _mockHotelSearchService;

    private readonly FeefoDataGenerationHandler _sut;

    public FeefoDataGenerationHandlerTests()
    {
        _mockSqsClient = new();
        Mock<ILogger<FeefoDataGenerationHandler>> mockLogger = new();
        _mockBookingsService = new();
        _mockHotelSearchService = new();

        FeefoApiSettings feefoApiSettings = new()
        {
            MerchantIdentifier = "MERCHANT_ID",
        };

        MarketingSettings marketingSettings = new()
        {
            UnsubscribeLink = "https://www.easyjet.com/en/holidays/marketing-research-unsubscribe?encEmail={encEmail}",
            EncryptionPassword = "somePassword",
            EncryptionSalt = "pepper"
        };

        LambdaSettings lambdaSettings = new()
        {
            UseDebug = false,
            WebsiteAgentCodes = "TEST",
            VerboseLog = true

        };

        _sut = new(
            _mockBookingsService.Object,
            _mockHotelSearchService.Object,
            _mockSqsClient.Object,
            mockLogger.Object,
            Options.Create(marketingSettings),
            Options.Create(lambdaSettings),
            Options.Create(feefoApiSettings)
        );
    }

    #region CreateFeefoSale
    [Fact]
    public void CreateFeefoSale_HasNoMail_ReturnsNull()
    {
        // Arrange
        var booking = new Booking { ReseverationId = 12345 };

        // Act
        var data = _sut.CreateFeefoSale(booking, default!, default!);

        // Assert
        data.Should().BeNull("because there's no email in the booking.");
    }

    [Fact]
    public void CreateFeefoSale_HasNoReservationID_ReturnsNull()
    {
        // Arrange
        var booking = new Booking { EmailAddress = "testUser@test.test" };

        // Act
        var data = _sut.CreateFeefoSale(booking, default!, default!);

        // Assert
        data.Should().BeNull("because there's no reservation ID in the booking");
    }

    [Fact]
    public void CreateFeefoSale_HasNoHotel_ReturnsNull()
    {
        // Arrange
        var booking = new Booking
        {
            EmailAddress = "testUser@test.test",
            ReseverationId = 12345,
        };

        // Act
        var data = _sut.CreateFeefoSale(booking, default!, new Dictionary<string, Hotel>());

        // Assert
        data.Should().BeNull("because there's no hotel in the booking.");
    }

    [Fact]
    public void CreateFeefoSale_HasNoHotelMapping_ReturnsNull()
    {
        // Arrange
        var booking = new Booking
        {
            EmailAddress = "testUser@test.test",
            ReseverationId = 12345,
            Hotels = new[] { new Api.Domain.Data.Eskel.Hotel { Code = "dsadasd" } }
        };

        // Act
        var data = _sut.CreateFeefoSale(booking, default!, default!);

        // Assert
        data.Should().BeNull("because there's no mapping use with the hotel and its code");
    }

    [Fact]
    public void CreateFeefoSale_HasEverything_ReturnsASale()
    {
        //Arrange
        var booking = new Booking
        {
            EmailAddress = "testUser@test.test",
            ReseverationId = 12345,
            Hotels = [new() { Code = "dsadasd" }]
        };
        var mapping = new Dictionary<string, Hotel>
        {
            {
                "dsadasd",
                new Hotel
                {
                    Name = "TestHotel",
                    HotelTheme = new PackageTheme { Name = "Testing" }
                }
            }

        };

        // Act
        var data = _sut.CreateFeefoSale(booking, default!, mapping);

        // Arrange
        data.Should().NotBeNull().And
                     .BeOfType<FeefoEnterSale>(
            $"because all prerequisites are present and therefore a {typeof(FeefoEnterSale).Name} should be instantiated, albeit incomplete."
        );
    }
    #endregion
    #region GetName 
    [Fact]
    public void GetName_GuestsIsNull_ReturnsNull()
    {
        // Arrange
        var booking = new Booking { Guests = null };

        // Act
        var name = FeefoDataGenerationHandler.GetName(booking);

        // Assert
        name.Should().BeNull();
    }

    [Fact]
    public void GetName_HasNoPassengers_ReturnsNull()
    {
        // Arrange
        var booking = new Booking { Guests = [] };

        // Act
        var name = FeefoDataGenerationHandler.GetName(booking);

        // Assert
        name.Should().BeNull();
    }

    [Fact]
    public void GetName_HasNoPassengersFlaggedAsLead_ReturnsFirstPassenger()
    {
        // Arrange
        var booking = new Booking
        {
            Guests =
            [
                new Guest { Forename = "a", Surname ="b", IsLeadPassenger = false },
                new Guest { Forename = "1", Surname ="2", IsLeadPassenger = false },
                new Guest { Forename = "A", Surname ="B", IsLeadPassenger = false },
            ]
        };

        // Act
        var name = FeefoDataGenerationHandler.GetName(booking);

        // Assert
        name.Should().Be("a b");
    }

    [Fact]
    public void GetName_HasPassengersWithLead_ReturnsTheirName()
    {
        // Arrange
        var booking = new Booking
        {
            Guests =
            [
                new Guest { Forename = "a", Surname ="b", IsLeadPassenger = false },
                new Guest { Forename = "1", Surname ="2", IsLeadPassenger = false },
                new Guest { Forename = "test", Surname ="user", IsLeadPassenger = true },
                new Guest { Forename = "A", Surname ="B", IsLeadPassenger = false },
            ]
        };

        // Act
        var name = FeefoDataGenerationHandler.GetName(booking);

        // Assert
        name.Should().BeEquivalentTo("test user", "because the guest called 'test user' is flagged as LeadPassenger.");
    }
    #endregion
    #region FilterInvalidAndCancelledBookings
    [Fact]
    public void FilterInvalidAndCancelledBookings_ContainsInvalid_ReturnsFiltered()
    {
        // Arrange
        var booking_1 = new Booking { EmailAddress = "a", ConfirmedDateTime = DateTime.UtcNow, BookingStatus = "BKG", AgentCode = "WAGBP" };
        var booking_2 = new Booking { EmailAddress = "b", ConfirmedDateTime = DateTime.UtcNow, BookingStatus = "BKG", AgentCode = "WAGBP" };
        var booking_3 = new Booking { EmailAddress = "b", ConfirmedDateTime = DateTime.UtcNow, AgentCode = "WAGBP" };
        var booking_4 = new Booking { EmailAddress = "b", ConfirmedDateTime = DateTime.UtcNow, BookingStatus = "BKG", AgentCode = "WAGBP" };
        var booking_5 = new Booking { EmailAddress = "a", ConfirmedDateTime = DateTime.UtcNow, CancellationDateTime = DateTime.UtcNow, AgentCode = "WAGBP" };
        var booking_6 = new Booking { EmailAddress = "a", AgentCode = "WAGBP" };
        var booking_7 = new Booking { EmailAddress = "c", ConfirmedDateTime = DateTime.UtcNow, CancellationDateTime = DateTime.UtcNow, AgentCode = "WAGBP" };

        var bookings = new[]
        {
            booking_1,
            booking_2,
            booking_3,
            booking_4,
            booking_5,
            booking_6,
            booking_7,
        };

        // Act
        var filtered = _sut.FilterInvalidAndCancelledBookings(bookings);

        // Assert
        filtered.Should().NotContain(booking_3, "because mail 'b' is not distinct.");
        filtered.Should().NotContain(booking_4, "because mail 'b' is not distinct.");
        filtered.Should().NotContain(booking_5, "because the booking was cancelled.");
        filtered.Should().NotContain(booking_6, "because the booking was not confirmed.");
        filtered.Should().NotContain(booking_7, "because mail 'c' is not in the list.");
    }
    #endregion

    [Fact]
    public async Task FunctionHandler_NoBookings()
    {
        // Arrange
        _mockBookingsService.Setup(x => x.GetBookingsByCreatedDate(It.IsAny<DateTime>())).ReturnsAsync([]);

        // Act
        await _sut.Generate();

        // Assert
        _mockSqsClient.Verify(
            x => x.SendMessageAsync(It.IsAny<SendMessageRequest>(), It.IsAny<CancellationToken>()),
            Times.Never()
        );
    }

    [Fact]
    public async Task FunctionHandler_AllBookingsInvalid()
    {
        // Arrange
        _mockBookingsService.Setup(x => x.GetBookingsByCreatedDate(It.IsAny<DateTime>())).ReturnsAsync([new Booking()]);

        // Act
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(_sut.Generate);

        // Assert
        var bookingDate = (DateTime)_mockBookingsService.Invocations[0].Arguments[0];
        var errorText = $"All bookings created {bookingDate.ToShortDateString()} have been cancelled or have empty customer email!!!";

        exception.Message.Should().Be(errorText);
        _mockSqsClient.Verify(
            x => x.SendMessageAsync(It.IsAny<SendMessageRequest>(), It.IsAny<CancellationToken>()),
            Times.Never()
        );
    }

    [Theory]
    [MemberData(nameof(ValidBookings))]
    public async Task FunctionHandler_ValidBookings_ProcessWithFeefo(List<MarketingPreferencesScreened> marketingPreferences, List<Booking> bookings)
    {
        // Arrange
        _mockBookingsService
            .Setup(x => x.GetBookingsByCreatedDate(It.IsAny<DateTime>()))
            .ReturnsAsync([.. bookings]);
        _mockHotelSearchService
            .Setup(x => x.GetHotelsByCodes(It.IsAny<string[]>(), It.IsAny<string>()))
            .ReturnsAsync([new Hotel { Code = "TEST" }]);

        // Act
        await _sut.Generate();

        // Assert
        foreach (var booking in bookings)
        {
            _mockSqsClient.Verify(
                mock => mock.SendMessageAsync(It.Is<SendMessageRequest>(message => ValidateSqsMessageEmailAddress(message, booking.EmailAddress)), It.IsAny<CancellationToken>()),
                Times.Once()
            );
        }

    }

    private static bool ValidateSqsMessageEmailAddress(SendMessageRequest message, string email)
    {
        var feefoEntry = JsonConvert.DeserializeObject<FeefoEnterSale>(message.MessageBody);
        return feefoEntry != null
            && feefoEntry.Email == email;
    }

    private static Booking ConstructBooking(string email)
    {
        return new Booking
        {
            CancellationDateTime = null,
            ConfirmedDateTime = DateTime.UtcNow,
            EmailAddress = email,
            BookingStatus = "BKG",
            AgentCode = "TEST",
            Hotels = [new Api.Domain.Data.Eskel.Hotel { Code = "TEST" }],
            ReseverationId = 123
        };
    }

    private static MarketingPreferencesScreened ConstructMarketingPreferences(string email)
    {
        return new MarketingPreferencesScreened
        {
            TTL = DateTime.UtcNow.AddDays(1),
            Status = "Y",
            Email = email,
        };
    }

    public static TheoryData<List<MarketingPreferencesScreened>, List<Booking>> ValidBookings()
    {
        var emails = new[]
        {
            "test1@test.com",
            "test2@test.com",
            "test3@test.com",
        };

        return new TheoryData<List<MarketingPreferencesScreened>, List<Booking>>
        {
            { emails.Select(ConstructMarketingPreferences).ToList(), emails.Select(ConstructBooking).ToList()}
        };
    }
}