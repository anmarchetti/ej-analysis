using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Offers;

public class OfferPriceServiceTests
{
    private const string DefaultBagCode = "LUG";

    private IOfferPriceService _sut;
    private readonly Mock<IReferenceDataService> _referenceDataServiceMock;

    public OfferPriceServiceTests()
    {
        _referenceDataServiceMock = new Mock<IReferenceDataService>();
        _referenceDataServiceMock.Setup(x => x.GetPromoCodeSetting()).ReturnsAsync(SetupPromoCodeSettings());
        _referenceDataServiceMock.Setup(x => x.GetLuggageSettings()).ReturnsAsync(() => new LuggageSettings
        {
            DefaultFreeBagsPerNonInfantPassenger = new() { { DefaultBagCode, 1 } }
        });
        _sut = new OfferPriceService(_referenceDataServiceMock.Object);
    }

    [Fact]
    public async Task GetOfferPrices_ValidateBookingIsNull_ReturnsZeroValuePrice()
    {
        // Arrange
        ValidateBookingResponse validateBookingResponse = null;

        //Act
        var offerPrice = await _sut.GetOfferPrice(validateBookingResponse);
        var offerPricePerPerson = await _sut.GetOfferPricePerPerson(validateBookingResponse);

        //Assert
        Assert.Equal(0, offerPrice);
        Assert.Equal(0, offerPricePerPerson);
    }

    [Fact]
    public async Task GetOfferPriceWithoutExtras_ValidateBookingIsNull_ReturnsZeroValuePrice()
    {
        // Arrange
        ValidateBookingResponse validateBookingResponse = null;
        var priceInfo = GetPriceInfo(totalPrice: 0, totalPricePerPerson: 0);

        //Act
        var offerPrice = _sut.GetOfferPriceWithoutExtras(priceInfo, validateBookingResponse);
        var offerPricePerPerson = await _sut.GetOfferPricePerPersonWithoutExtras(priceInfo, validateBookingResponse);

        //Assert
        Assert.Equal(0, offerPrice);
        Assert.Equal(0, offerPricePerPerson);
    }

    [Fact]
    public async Task GetOfferPriceWithoutExtras_ReturnsCorrectValue()
    {
        decimal totalPriceWithExtras = 1000m;
        decimal pricePerPersonWithExtras = 500m;
        var priceInfo = GetPriceInfo(totalPriceWithExtras, pricePerPersonWithExtras);

        var validateBookingResponse = SetupValidateBookingResponse(
            totalPriceWithExtras,
            pricePerPersonWithExtras,
            SetupSeatSelection(),
            SetupGuests(),
            SetupExtraLuggage(),
            null);

        var offerPrice = _sut.GetOfferPriceWithoutExtras(priceInfo, validateBookingResponse);
        var offerPricePerPerson = await _sut.GetOfferPricePerPersonWithoutExtras(priceInfo, validateBookingResponse);

        offerPrice.Should().Be(900m);
        offerPricePerPerson.Should().Be(450m);
    }

    [Fact]
    public async Task GetOfferPriceWithoutExtras_WithTransferSurcharge_ReturnsCorrectValue()
    {
        decimal totalPriceWithExtras = 1000m;
        decimal pricePerPersonWithExtras = 500m;
        decimal smallSeTransferSurcharge = 50m;
        int smallSeTransferSurchargeQty = 3;
        decimal largeSeTransferSurcharge = 100m;
        int largeSeTransferSurchargeQty = 2;

        var priceInfo = GetPriceInfo(totalPriceWithExtras, pricePerPersonWithExtras);

        var validateBookingResponse = SetupValidateBookingResponse(
            totalPriceWithExtras,
            pricePerPersonWithExtras,
            SetupSeatSelection(),
            SetupGuests(),
            SetupExtraLuggage(),
            null,
            smallSeTransferSurcharge,
            largeSeTransferSurcharge,
            smallSeTransferSurchargeQty,
            largeSeTransferSurchargeQty);

        var offerPrice = _sut.GetOfferPriceWithoutExtras(priceInfo, validateBookingResponse);
        var offerPricePerPerson = await _sut.GetOfferPricePerPersonWithoutExtras(priceInfo, validateBookingResponse);

        offerPrice.Should().Be(550m);
        offerPricePerPerson.Should().Be(275m);
    }

    [Fact]
    public async Task GetOfferPriceWithoutExtras_ReturnsCorrectValueWithoutLuggage()
    {
        decimal totalPriceWithExtras = 1000m;
        decimal pricePerPersonWithExtras = 500m;
        var priceInfo = GetPriceInfo(totalPriceWithExtras, pricePerPersonWithExtras);

        var validateBookingResponse = SetupValidateBookingResponse(
            totalPriceWithExtras,
            pricePerPersonWithExtras,
            SetupSeatSelection(),
            SetupGuests(),
            null,
            null);

        var offerPrice = _sut.GetOfferPriceWithoutExtras(priceInfo, validateBookingResponse);
        var offerPricePerPerson = await _sut.GetOfferPricePerPersonWithoutExtras(priceInfo, validateBookingResponse);

        offerPrice.Should().Be(910m);
        offerPricePerPerson.Should().Be(455m);
    }

    [Fact]
    public async Task GetOfferPriceWithoutExtras_ReturnsCorrectValueWithoutSeatsAndLuggage()
    {
        decimal totalPriceWithExtras = 1000m;
        decimal pricePerPersonWithExtras = 500m;
        var priceInfo = GetPriceInfo(totalPriceWithExtras, pricePerPersonWithExtras);

        var validateBookingResponse = SetupValidateBookingResponse(
            totalPriceWithExtras,
            pricePerPersonWithExtras,
            null,
            SetupGuests(),
            null,
            null);

        var offerPrice = _sut.GetOfferPriceWithoutExtras(priceInfo, validateBookingResponse);
        var offerPricePerPerson = await _sut.GetOfferPricePerPersonWithoutExtras(priceInfo, validateBookingResponse);

        offerPrice.Should().Be(1000m);
        offerPricePerPerson.Should().Be(500m);
    }

    [Fact]
    public async Task GetOfferPriceWithoutExtras_ReturnsCorrectValueWithoutAirportParking()
    {
        decimal totalPriceWithExtras = 1000m;
        decimal pricePerPersonWithExtras = 150m;
        var priceInfo = GetPriceInfo(totalPriceWithExtras, pricePerPersonWithExtras);

        var validateBookingResponse = SetupValidateBookingResponse(
            totalPriceWithExtras,
            pricePerPersonWithExtras,
            seatSelection:null,
            SetupGuests(),
            null,
            SetupAirportParkingSelection());

        var offerPrice = _sut.GetOfferPriceWithoutExtras(priceInfo, validateBookingResponse);
        var offerPricePerPerson = await _sut.GetOfferPricePerPersonWithoutExtras(priceInfo, validateBookingResponse);

        offerPrice.Should().Be(700m);
        offerPricePerPerson.Should().Be(0);
    }

    [Fact]
    public async Task GetOfferPrices_ValidateBookingIsNullSeatsCalculationNotIncluded_ReturnsZeroValuePrice()
    {
        // Arrange
        ValidateBookingResponse validateBookingResponse = null;

        //Act
        var offerPrice = await _sut.GetOfferPrice(validateBookingResponse);
        var offerPricePerPerson = await _sut.GetOfferPricePerPerson(validateBookingResponse);

        //Assert
        Assert.Equal(0, offerPrice);
        Assert.Equal(0, offerPricePerPerson);
    }

    [Fact]
    public async Task GetOfferPrice_PromoCodeIsDisabled_ReturnsOriginalPrices()
    {
        // Arrange
        const decimal totalPriceWithSeats = 1000m;
        const decimal pricePerPersonWithSeats = 100m;

        const decimal expectedTotalPrice = 910m;
        const decimal expectedPricePerPerson = 55m;

        var validateBookingResponse = SetupValidateBookingResponse(
            totalPriceWithSeats,
            pricePerPersonWithSeats,
            SetupSeatSelection(),
            SetupGuests(),
            null,
            null);

        //Act
        var offerPrice = await _sut.GetOfferPrice(validateBookingResponse);
        var offerPricePerPerson = await _sut.GetOfferPricePerPerson(validateBookingResponse);

        //Assert
        Assert.Equal(expectedTotalPrice, offerPrice);
        Assert.Equal(expectedPricePerPerson, offerPricePerPerson);
    }

    [Fact]
    public async Task GetOfferPrice_SeatsCalculatedIncluded_ReturnsTotalPrices()
    {
        //Arrange
        _referenceDataServiceMock.Setup(x => x.GetPromoCodeSetting())
            .ReturnsAsync(SetupPromoCodeSettings(true, true));

        _sut = new OfferPriceService(_referenceDataServiceMock.Object);

        const decimal totalPriceWithSeats = 1000m;
        const decimal pricePerPersonWithSeats = 100m;

        const decimal expectedTotalPrice = 1000m;
        const decimal expectedPricePerPerson = 100m;

        var validateBookingResponse = SetupValidateBookingResponse(
            totalPriceWithSeats,
            pricePerPersonWithSeats,
            SetupSeatSelection(),
            SetupGuests(),
            null,
            null);

        //Act
        var offerPrice = await _sut.GetOfferPrice(validateBookingResponse);
        var offerPricePerPerson = await _sut.GetOfferPricePerPerson(validateBookingResponse);

        //Assert
        Assert.Equal(expectedTotalPrice, offerPrice);
        Assert.Equal(expectedPricePerPerson, offerPricePerPerson);
    }

    [Fact]
    public async Task GetOfferPrice_SeatsCalculatedNotIncluded_ReturnsPriceWithoutSeats()
    {
        //Arrange
        _referenceDataServiceMock.Setup(x => x.GetPromoCodeSetting())
            .ReturnsAsync(SetupPromoCodeSettings(true));

        _sut = new OfferPriceService(_referenceDataServiceMock.Object);

        const decimal totalPriceWithSeats = 1000m;
        const decimal pricePerPersonWithSeats = 100m;

        const decimal expectedTotalPrice = 910m;
        const decimal expectedPricePerPerson = 55m;

        var validateBookingResponse = SetupValidateBookingResponse(
            totalPriceWithSeats,
            pricePerPersonWithSeats,
            SetupSeatSelection(),
            SetupGuests(),
            null,
            null);

        //Act
        var offerPrice = await _sut.GetOfferPrice(validateBookingResponse);
        var offerPricePerPerson = await _sut.GetOfferPricePerPerson(validateBookingResponse);

        //Assert
        Assert.Equal(expectedTotalPrice, offerPrice);
        Assert.Equal(expectedPricePerPerson, offerPricePerPerson);
    }

    private ValidateBookingResponse SetupValidateBookingResponse(
        decimal totalPrice,
        decimal pricePerPerson,
        List<SeatMap> seatSelection,
        List<PersonWithDetails> guests,
        ExtraLuggageInfo extraLuggage,
        AirportParkingItem airportParking,
        decimal smallSeTransferSurcharge = 0,
        decimal largeSeTransferSurcharge = 0,
        int smallSeTransferSurchargeQty = 0,
        int largeSeTransferSurchargeQty = 0)
    {
        var result = new ValidateBookingResponse
        {
            PaymentInfo = new PriceInfo
            {
                TotalPrice = totalPrice,
                PricePP = pricePerPerson
            },
            SeatSelection = seatSelection,
            Guests = guests,
            ExtraLuggageInfo = extraLuggage,
            AirportParking = airportParking,
        };

        if (smallSeTransferSurcharge > 0 || largeSeTransferSurcharge > 0)
        {
            result.Transfers = new List<TransferItem>
            {
                new()
                {
                    Type = TransferItemType.Shared,
                    SmallSeSurcharge = smallSeTransferSurcharge,
                    SmallSeSurchargeQuantity = smallSeTransferSurchargeQty,
                    LargeSeSurcharge = largeSeTransferSurcharge,
                    LargeSeSurchargeQuantity = largeSeTransferSurchargeQty
                }
            };
        }

        return result;
    }

    private PromoCodeSettings SetupPromoCodeSettings(bool isEnable = false, bool includedSeatsPrice = false)
    {
        return new PromoCodeSettings
        {
            IsPromoCodeEnabled = isEnable,
            IsSeatsCalculationIncluded = includedSeatsPrice
        };
    }

    private List<SeatMap> SetupSeatSelection()
    {
        return new List<SeatMap>
        {
            new()
            {
                Seats = new List<Seat>
                {
                    new() { Price = 10 },
                    new() { Price = 10 }
                }
            },
            new()
            {
                Seats = new List<Seat>
                {
                    new() { Price = 30 },
                    new() { Price = 40 }
                }
            }
        };
    }

    private List<PersonWithDetails> SetupGuests()
    {
        return new List<PersonWithDetails>
        {
            new() { Type = PersonType.Adult },
            new() { Type = PersonType.Child },
            new() { Type = PersonType.Infant }
        };
    }

    private ExtraLuggageInfo SetupExtraLuggage()
    {
        return new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    ItemCategoryCode = "BAGE",
                    ItemCode = DefaultBagCode,
                    PassengerId = "1",
                    Price = 9,
                    RouteId = "1",
                    Quantity = 1,
                    IsComplimentary = true
                },
                new()
                {
                    ItemCategoryCode = "BAGE",
                    ItemCode = DefaultBagCode,
                    PassengerId = "1",
                    Price = 9,
                    RouteId = "2",
                    Quantity = 1,
                    IsComplimentary = true
                },
                new()
                {
                    ItemCategoryCode = "ADDB",
                    ItemCode = "LUSE",
                    PassengerId = "1",
                    Price = 5,
                    RouteId = "1",
                    Quantity = 1,
                    IsComplimentary = false
                },
                new()
                {
                    ItemCategoryCode = "ADDB",
                    ItemCode = "LUSE",
                    PassengerId = "1",
                    Price = 5,
                    RouteId = "2",
                    Quantity = 1,
                    IsComplimentary = false
                }
            }
        };
    }

    private static AirportParkingItem SetupAirportParkingSelection()
    {
        return new AirportParkingItem
        {
            BookingDetails = new AirportParkingBookingDetails
            {
                TotalPrice = 300
            }
        };
    }

    private PriceInfo GetPriceInfo(decimal totalPrice, decimal totalPricePerPerson)
    {
        return new PriceInfo { TotalPrice = totalPrice, PricePP = totalPricePerPerson };
    }
}