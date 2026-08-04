using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers.Interfaces;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.Api.Domain.Interfaces.FreeNights;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Services.AmendBooking;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;
using Xunit;
using Offer = easyJet.Holidays.Api.Domain.Data.PackageOffers.Offer;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendBookingDate;

public class AmendDatesServiceTests
{
    private Mock<IAvailableDatesOfferSearchService> _availableDatesOfferSearchServiceMock = new();
    private Mock<IReferenceDataService> _referenceDataServiceMock = new();
    private Mock<IHotelsService> _hotelsServiceMock = new();
    private Mock<IValidateBookingResponseMapper> _validateBookingResponseMapperMock = new();
    private Mock<IBookingRepository> _bookingRepositoryMock = new();
    private Mock<ITransferService> _transferServiceMock = new();
    private Mock<ILanguageService> _languageServiceMock = new();
    private Mock<IAmendPromocodeHandlerService> _amendDatesPromocodeHandlerService = new();
    private Mock<IFreeNightsService> _freeNightsServiceMock = new();
    private Mock<IErrataInfoService> _errataInfoServiceMock = new();
    private Mock<IAmendSeatsService> _amendSeatsService = new();
    private Mock<ISettingsService> _settingsServiceMock = new();
    private readonly Mock<ILogger<AmendDatesService>> _loggerMock = new();
    private AmendDatesService sut;

    private IFixture fixture = FixtureUtils.AutoMoqFixture();

    public AmendDatesServiceTests()
    {
        _settingsServiceMock.Setup(x => x.GetSeatMapSettings()).ReturnsAsync(new SeatMapSettings { EnableSeatMapDateChange = true });
        var apiSettings = Options.Create(new ApiSettings
        {
            AmendBookingChangeDates = new AmendBookingChangeDatesSettings
            {
                MaxNumberOfAttemptsForValidatingOffer = 3
            }
        });

        sut = new AmendDatesService(
            _availableDatesOfferSearchServiceMock.Object,
            _bookingRepositoryMock.Object,
            _validateBookingResponseMapperMock.Object,
            _transferServiceMock.Object,
            _amendDatesPromocodeHandlerService.Object,
            _languageServiceMock.Object,
            _freeNightsServiceMock.Object,
            _errataInfoServiceMock.Object,
            _amendSeatsService.Object,
            _settingsServiceMock.Object,
            _loggerMock.Object,
            apiSettings
        );
    }

    [Fact]
    public async Task GetAvailableBookingDate_Success()
    {
        var offerAmount = 10;

        var availableDates = fixture.Build<AmendDate>().With(x => x.IsAvailable, true).CreateMany(offerAmount);

        _availableDatesOfferSearchServiceMock.Setup(x => x.AvailableDates(It.IsAny<AmendDateInfoRequest>()))
            .ReturnsAsync(new AmendDateInfoResponse
            {
                AmendDates = availableDates,
                AvailableHoliday = true
            });

        _languageServiceMock.Setup(x => x.GetCurrentLanguage()).Returns("en");

        var result = await sut.GetAvailableBookingDate(It.IsAny<AmendDateInfoRequest>());
        result.AmendDates.Count().Should().Be(offerAmount);
        result.AvailableHoliday.Should().BeTrue();
    }

    [Fact]
    public async Task GetAvailableBookingDate_Success_NoAvailableDates()
    {
        var offerAmount = 10;

        var availableDates = fixture.Build<AmendDate>().With(x => x.IsAvailable, false).CreateMany(offerAmount);

        _availableDatesOfferSearchServiceMock.Setup(x => x.AvailableDates(It.IsAny<AmendDateInfoRequest>()))
            .ReturnsAsync(new AmendDateInfoResponse
            {
                AmendDates = availableDates
            });

        var result = await sut.GetAvailableBookingDate(It.IsAny<AmendDateInfoRequest>());
        result.AmendDates.Count().Should().Be(offerAmount);
        result.AvailableHoliday.Should().BeFalse();
    }

    [Fact]
    public async Task GetAmendDateSummary_ReturnFullyMatchedOffers()
    {
        var bookingResponse = new BookingResponse
        {
            Package = fixture.Create<BookingPackage>(),
            AmendmentInfo = fixture.Create<AmendmentsInfo>()
        };

        var transport = fixture.Create<Transport>();

        var validateAmendBookingResponse = new ValidateAmendBookingResponse
        {
            Transport = transport
        };

        var offer = fixture.Create<Offer>();
        offer.Transport = transport;

        var offers = new List<Offer>() { offer };

        var hotels = fixture.CreateMany<Hotel>(3);

        var fullyMatchedOffers = new SearchOffersResponse { Offers = offers.ToList() };

        var request = fixture.Create<AmendDatesSummaryRequest>();

        _availableDatesOfferSearchServiceMock.Setup(x => x.SearchFullMatchedOffer(It.IsAny<AmendDatesSummaryRequest>(), It.IsAny<bool>()))
            .ReturnsAsync(fullyMatchedOffers);

        _hotelsServiceMock.Setup(x => x.Search(It.IsAny<string[]>())).ReturnsAsync(hotels);

        _referenceDataServiceMock.Setup(x => x.GetTransfers()).ReturnsAsync(fixture.Create<Dictionary<string, HotelTransfer>>());

        _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<string>(), (string)null))
            .ReturnsAsync(bookingResponse);

        _bookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false))
            .ReturnsAsync(validateAmendBookingResponse);

        _validateBookingResponseMapperMock.Setup(x => x.MapToAmendDatesOffer(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), null))
            .ReturnsAsync(fixture.Create<AmendDatesOffer>());

        var result = await sut.GetAmendDatesSummary(request);

        _availableDatesOfferSearchServiceMock
            .Verify(x => x.SearchFullMatchedOffer(It.IsAny<AmendDatesSummaryRequest>(), true), Times.Once);

        _availableDatesOfferSearchServiceMock
            .Verify(x => x.SearchFullMatchedOffer(It.IsAny<AmendDatesSummaryRequest>(), false), Times.Never);

        _settingsServiceMock.Verify(x => x.GetSeatMapSettings(), Times.Once);
    }

    [Fact]
    public async Task GetAmendDateSummary_ReturnUnhappyPathOffer()
    {
        var bookingResponse = new BookingResponse
        {
            Package = fixture.Create<BookingPackage>(),
            AmendmentInfo = fixture.Create<AmendmentsInfo>()
        };

        var transport = fixture.Create<Transport>();

        var validateAmendBookingResponse = new ValidateAmendBookingResponse
        {
            Transport = transport
        };

        var offer = fixture.Create<Offer>();
        offer.Transport = transport;

        var offers = new List<Offer>() { offer };

        var hotels = fixture.CreateMany<Hotel>(3);

        var unhappyPathOffers = new SearchOffersResponse { Offers = offers.ToList() };

        var fullyMatchedOffers = new SearchOffersResponse { Offers = Enumerable.Empty<Offer>().ToList() };

        var request = fixture.Create<AmendDatesSummaryRequest>();

        _availableDatesOfferSearchServiceMock.Setup(x => x.SearchFullMatchedOffer(It.IsAny<AmendDatesSummaryRequest>(), true))
            .ReturnsAsync(fullyMatchedOffers);

        _availableDatesOfferSearchServiceMock.Setup(x => x.SearchCheapestOffer(It.IsAny<AmendDatesSummaryRequest>()))
            .ReturnsAsync(unhappyPathOffers);

        _hotelsServiceMock.Setup(x => x.Search(It.IsAny<string[]>())).ReturnsAsync(hotels);

        _referenceDataServiceMock.Setup(x => x.GetTransfers()).ReturnsAsync(fixture.Create<Dictionary<string, HotelTransfer>>());

        _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<string>(), (string)null))
            .ReturnsAsync(bookingResponse);

        _bookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false))
            .ReturnsAsync(validateAmendBookingResponse);

        _validateBookingResponseMapperMock.Setup(x => x.MapToAmendDatesOffer(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), null))
            .ReturnsAsync(fixture.Create<AmendDatesOffer>());

        var result = await sut.GetAmendDatesSummary(request);

        _availableDatesOfferSearchServiceMock
            .Verify(x => x.SearchFullMatchedOffer(It.IsAny<AmendDatesSummaryRequest>(), true), Times.Once);

        _availableDatesOfferSearchServiceMock
            .Verify(x => x.SearchCheapestOffer(It.IsAny<AmendDatesSummaryRequest>()), Times.Once);
    }

    [Fact]
    public async Task GetAmendDateSummary_CanNotFindAnyBooking_ThrowException()
    {
        var bookingResponse = new BookingResponse
        {
            Package = fixture.Create<BookingPackage>(),
            AmendmentInfo = fixture.Create<AmendmentsInfo>()
        };

        var validateAmendBookingResponse = new ValidateAmendBookingResponse();

        var offers = fixture.CreateMany<Offer>(5);

        var hotels = fixture.CreateMany<Hotel>(3);

        var emptyOffers = new SearchOffersResponse { Offers = Enumerable.Empty<Offer>().ToList() };

        var request = fixture.Create<AmendDatesSummaryRequest>();

        _availableDatesOfferSearchServiceMock.Setup(x => x.SearchFullMatchedOffer(It.IsAny<AmendDatesSummaryRequest>(), It.IsAny<bool>()))
            .ReturnsAsync(emptyOffers);

        _hotelsServiceMock.Setup(x => x.Search(It.IsAny<string[]>())).ReturnsAsync(hotels);

        _referenceDataServiceMock.Setup(x => x.GetTransfers()).ReturnsAsync(fixture.Create<Dictionary<string, HotelTransfer>>());

        _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<string>(), (string)null))
            .ReturnsAsync(bookingResponse);

        _bookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false))
            .ReturnsAsync(validateAmendBookingResponse);

        _validateBookingResponseMapperMock.Setup(x => x.MapToAmendDatesOffer(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), null))
            .ReturnsAsync(fixture.Create<AmendDatesOffer>());

        Func<Task<AmendDatesOffer>> result = () => sut.GetAmendDatesSummary(request);

        await result.Should()
            .ThrowAsync<ApiException>()
            .Where(x => x.Code.Code == ApiExceptionCodes.GetAvailableDatesSummaryInformation.Code && x.StatusCode == HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetAmendDateSummary_CanNotValidateOffer_ThrowException()
    {
        var bookingResponse = new BookingResponse
        {
            Package = fixture.Create<BookingPackage>(),
            AmendmentInfo = fixture.Create<AmendmentsInfo>()
        };

        var offers = fixture.CreateMany<Offer>(5);

        var hotels = fixture.CreateMany<Hotel>(3);

        var availableOffers = new SearchOffersResponse { Offers = offers.ToList() };

        var request = fixture.Create<AmendDatesSummaryRequest>();

        _availableDatesOfferSearchServiceMock.Setup(x => x.SearchFullMatchedOffer(It.IsAny<AmendDatesSummaryRequest>(), It.IsAny<bool>()))
            .ReturnsAsync(availableOffers);

        _hotelsServiceMock.Setup(x => x.Search(It.IsAny<string[]>())).ReturnsAsync(hotels);

        _referenceDataServiceMock.Setup(x => x.GetTransfers()).ReturnsAsync(fixture.Create<Dictionary<string, HotelTransfer>>());

        _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<string>(), (string)null))
            .ReturnsAsync(bookingResponse);

        _bookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false))
            .ReturnsAsync((ValidateAmendBookingResponse)null);

        Func<Task<AmendDatesOffer>> result = () => sut.GetAmendDatesSummary(request);

        await result.Should()
            .ThrowAsync<ApiException>()
            .Where(x => x.Code.Code == ApiExceptionCodes.GetAvailableDatesSummaryInformation.Code && x.StatusCode == HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetAmendDateSummary_CancellationTokenIsCancelled_ThrowsExceptionInHappyPath()
    {
        var bookingResponse = new BookingResponse
        {
            Package = fixture.Create<BookingPackage>(),
            AmendmentInfo = fixture.Create<AmendmentsInfo>()
        };

        var transport = fixture.Create<Transport>();

        var validateAmendBookingResponse = new ValidateAmendBookingResponse
        {
            Transport = transport
        };

        var offer = fixture.Create<Offer>();
        offer.Transport = transport;

        var offers = new List<Offer>() { offer };

        var hotels = fixture.CreateMany<Hotel>(3);

        var fullyMatchedOffers = new SearchOffersResponse { Offers = offers.ToList() };

        var request = fixture.Create<AmendDatesSummaryRequest>();

        _availableDatesOfferSearchServiceMock.Setup(x => x.SearchFullMatchedOffer(It.IsAny<AmendDatesSummaryRequest>(), It.IsAny<bool>()))
            .ReturnsAsync(fullyMatchedOffers);

        _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<string>(), (string)null))
            .ReturnsAsync(bookingResponse);

        using var cancellationTokenSource = new CancellationTokenSource();
        var cancellationToken = cancellationTokenSource.Token;
        await cancellationTokenSource.CancelAsync();

        Func<Task<AmendDatesOffer>> result = () => sut.GetAmendDatesSummary(request, cancellationToken);
        await result.Should().ThrowAsync<ApiException>();

        _availableDatesOfferSearchServiceMock
            .Verify(x => x.SearchFullMatchedOffer(It.IsAny<AmendDatesSummaryRequest>(), true), Times.Once);
    }

    [Theory]
    [InlineData(5, 0, 5, 1, 0, 0, 3)]
    [InlineData(3, 0, 3, 1, 0, 0, 3)]
    [InlineData(2, 1, 2, 1, 1, 0, 3)]
    [InlineData(1, 1, 1, 1, 1, 1, 3)]
    [InlineData(0, 1, 2, 1, 1, 1, 3)]
    [InlineData(0, 0, 4, 1, 1, 1, 3)]
    [InlineData(0, 0, 3, 1, 1, 1, 3)]
    [InlineData(0, 0, 2, 1, 1, 1, 2)]
    [InlineData(0, 0, 0, 1, 1, 1, 0)]
    public async Task GetAmendDateSummary_ValidateResponseAlwaysNull_ThrowsExceptionAndMakesCorrectNumberOfCallsForSearchAndValidate(int numberOfMatchedOffers, int numberOfCheapestOffers, int numberOfNotMatchedOffers,
        int expectedSearchCallsForMatched, int expectedSearchCallsForCheapest, int expectedSearchCallsForNotMatched, int expectedValidateCalls)
    {
        var bookingResponse = new BookingResponse
        {
            Package = fixture.Create<BookingPackage>(),
            AmendmentInfo = fixture.Create<AmendmentsInfo>()
        };

        var fullyMatchedOffers = new SearchOffersResponse { Offers = fixture.CreateMany<Offer>(numberOfMatchedOffers).ToList() };
        var cheapestMatchedOffer = new SearchOffersResponse { Offers = fixture.CreateMany<Offer>(numberOfCheapestOffers).ToList() };
        var notMatchedOffers = new SearchOffersResponse { Offers = fixture.CreateMany<Offer>(numberOfNotMatchedOffers).ToList() };

        var request = fixture.Create<AmendDatesSummaryRequest>();

        _availableDatesOfferSearchServiceMock.Setup(x => x.SearchFullMatchedOffer(It.IsAny<AmendDatesSummaryRequest>(), It.IsAny<bool>()))
            .ReturnsAsync(fullyMatchedOffers);

        _availableDatesOfferSearchServiceMock.Setup(x => x.SearchCheapestOffer(It.IsAny<AmendDatesSummaryRequest>()))
            .ReturnsAsync(cheapestMatchedOffer);

        _availableDatesOfferSearchServiceMock.Setup(x => x.SearchNotFullyMatchedOffer(It.IsAny<AmendDatesSummaryRequest>()))
            .ReturnsAsync(notMatchedOffers);

        _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<string>(), (string)null))
            .ReturnsAsync(bookingResponse);

        _bookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false))
            .ReturnsAsync((ValidateAmendBookingResponse)null);

        _validateBookingResponseMapperMock.Setup(x => x.MapToAmendDatesOffer(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), null))
            .ReturnsAsync(fixture.Create<AmendDatesOffer>());

        Func<Task<AmendDatesOffer>> result = () => sut.GetAmendDatesSummary(request);
        await result.Should().ThrowAsync<ApiException>();

        _availableDatesOfferSearchServiceMock
            .Verify(x => x.SearchFullMatchedOffer(It.IsAny<AmendDatesSummaryRequest>(), true), Times.Exactly(expectedSearchCallsForMatched));

        _availableDatesOfferSearchServiceMock
            .Verify(x => x.SearchCheapestOffer(It.IsAny<AmendDatesSummaryRequest>()), Times.Exactly(expectedSearchCallsForCheapest));

        _availableDatesOfferSearchServiceMock
            .Verify(x => x.SearchNotFullyMatchedOffer(It.IsAny<AmendDatesSummaryRequest>()), Times.Exactly(expectedSearchCallsForNotMatched));

        _bookingRepositoryMock
           .Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false), Times.Exactly(expectedValidateCalls));
    }

    [Fact]
    public async Task ValidateAmendDatesOffers_EmptyRequest()
    {
        var requestOffer = fixture.CreateMany<AmendDatesOffer>(0);

        var result = await sut.ValidateAmendDatesOffers(requestOffer);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task ValidateAmendDatesOffers_ValidateBookingResponseError_EmptyListReturn()
    {
        var requestOffer = fixture.CreateMany<AmendDatesOffer>(2);

        var booking = new BookingResponse
        {
            Package = fixture.Create<BookingPackage>(),
            AmendmentInfo = fixture.Create<AmendmentsInfo>(),
            DiscountCode = "Test_discount"
        };

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(booking);

        _bookingRepositoryMock.Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
            .ReturnsAsync((ValidateAmendBookingResponse)null);

        var result = await sut.ValidateAmendDatesOffers(requestOffer);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task ValidateAmendDatesOffers_Success()
    {
        var transport = fixture.Create<Transport>();

        var offer = fixture.Create<AmendDatesOffer>();
        offer.Offer.Transport = transport;

        var requestOffer = new List<AmendDatesOffer>() { offer };

        var hotels = fixture.CreateMany<Hotel>(3);

        var requestOfferCount = 1;

        var booking = new BookingResponse
        {
            Package = fixture.Create<BookingPackage>(),
            AmendmentInfo = fixture.Create<AmendmentsInfo>()
        };

        var validateAmendBookingResponse = new ValidateAmendBookingResponse
        {
            PaymentInfo = fixture.Create<PriceInfo>(),
            Transport = transport
        };

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(booking);

        _bookingRepositoryMock
            .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
            .ReturnsAsync(validateAmendBookingResponse);

        _validateBookingResponseMapperMock
            .Setup(x => x.MapToAmendDatesOffer(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<AmendDatesOffer>()))
            .ReturnsAsync(fixture.Create<AmendDatesOffer>());

        var result = await sut.ValidateAmendDatesOffers(requestOffer);

        result.Should().NotBeEmpty();

        _bookingRepositoryMock.Verify(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        _bookingRepositoryMock.Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()), Times.Exactly(requestOfferCount));

        _validateBookingResponseMapperMock.Verify(x => x.MapToAmendDatesOffer(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<AmendDatesOffer>()), Times.Exactly(requestOfferCount));
    }

    [Fact]
    public async Task ValidateAmendDatesOffers_AtcomReturnError_ReturnEmptyList()
    {
        var requestOfferCount = 5;

        var requestOffer = fixture.CreateMany<AmendDatesOffer>(requestOfferCount);

        var booking = new BookingResponse
        {
            Package = fixture.Create<BookingPackage>(),
            AmendmentInfo = fixture.Create<AmendmentsInfo>()
        };

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(booking);

        _bookingRepositoryMock
            .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
            .Returns(Task.FromResult<ValidateAmendBookingResponse>(null));

        _validateBookingResponseMapperMock
            .Setup(x => x.MapToAmendDatesOffer(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<AmendDatesOffer>()))
            .Verifiable();

        var result = await sut.ValidateAmendDatesOffers(requestOffer);

        result.Should().BeEmpty();
        _bookingRepositoryMock.Verify(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        _bookingRepositoryMock.Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()), Times.Exactly(requestOfferCount));

        _validateBookingResponseMapperMock.Verify(x => x.MapToAmendDatesOffer(It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<AmendDatesOffer>()), Times.Never);
    }
}