using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Transfers;

public class TransferServiceTest
{
    private Mock<IItemSearchService> _itemSearchServiceMock = new Mock<IItemSearchService>();
    private Mock<IHotelsService> _hotelsServiceMock = new Mock<IHotelsService>();
    private Mock<ITransfersFilterService> _transfersFilterServiceMock = new Mock<ITransfersFilterService>();
    private Mock<ILanguageService> _langServiceMock = new Mock<ILanguageService>();
    private IReferenceDataProvider _referenceDataProvider;
    private IOptions<AtcomSettings> _atcomSettings;
    private IFixture _fixture = FixtureUtils.AutoMoqFixture();
    private TransfersService service;

    public TransferServiceTest()
    {
        _atcomSettings = Options.Create<AtcomSettings>(atcomSettings);
        _referenceDataProvider = _fixture.Freeze<IReferenceDataProvider>();
        service = new TransfersService(
            _itemSearchServiceMock.Object,
            _atcomSettings,
            _fixture.Freeze<IReferenceDataService>(),
            _referenceDataProvider,
            _transfersFilterServiceMock.Object,
            _hotelsServiceMock.Object,
            _langServiceMock.Object
        );
    }

    [Theory]
    [MemberData(nameof(GetAllTestCases))]
    public async Task GetAll(
        string hotelTypePromoCode,
        IEnumerable<TransferItem> transfers,
        IEnumerable<TransferItem> expectedResult
    )
    {
        _itemSearchServiceMock
            .Setup(x => x.GetExtras(It.IsAny<Offer>()))
            .ReturnsAsync(new OfferExtras
            {
                Transfers = transfers
            });

        _transfersFilterServiceMock
            .Setup(x => x.FilterBookingTransfers(It.IsAny<IEnumerable<TransferItem>>(), It.IsAny<Offer>(),
                It.IsAny<IEnumerable<string>>()))
            .Returns<IEnumerable<TransferItem>, Offer, IEnumerable<string>>((transfers, offer, transferCodes) =>
                transfers);

        _hotelsServiceMock
            .Setup(x => x.GetHotelTransfers(It.IsAny<string[]>()))
            .ReturnsAsync(Enumerable.Empty<IEnumerable<HotelTransfer>>());

        var offer = new Offer
        {
            Accom = new Accom
            {
                Unit = new List<Unit>
                {
                    new Unit {Occupation = new Occupation()}
                },
                Code = "Code"
            }
        };

        var result = await service.GetAll(offer, hotelTypePromoCode);

        result.Select(x => x.Code).Should().BeEquivalentTo(expectedResult.Select(x => x.Code));
    }

    public static IEnumerable<object[]> GetAllTestCases()
    {
        yield return new object[]
        {
            "EUBA",
            Transfers(),
            SharedDefaultTransferResult()
        };

        yield return new object[]
        {
            "EUBA",
            OnlyPrivateTransferAvailable(),
            PrivateDefaultTransferResult()
        };

        yield return new object[]
        {
            "EUBF",
            Transfers(),
            SharedDefaultTransferResult()
        };


        yield return new object[]
        {
            "EUBO",
            Transfers(),
            SharedDefaultTransferResult()
        };


        yield return new object[]
        {
            "EUBU",
            Transfers(),
            SharedDefaultTransferResult()
        };


        yield return new object[]
        {
            "EULB",
            Transfers(),
            SharedDefaultTransferResult()
        };

        yield return new object[]
        {
            "EULO",
            Transfers(),
            SharedDefaultTransferResult()
        };

        yield return new object[]
        {
            "EULU",
            Transfers(),
            SharedDefaultTransferResult()
        };

        yield return new object[]
        {
            "EUBL",
            Transfers(),
            PrivateDefaultTransferResult()
        };

        yield return new object[]
        {
            "EULL",
            Transfers(),
            PrivateDefaultTransferResult()
        };

        yield return new object[]
        {
            "EUCB",
            Transfers(),
            NoDefaultTransferResult()
        };

        yield return new object[]
        {
            "EUCO",
            Transfers(),
            NoDefaultTransferResult()
        };

        yield return new object[]
        {
            "EUCL",
            Transfers(),
            NoDefaultTransferResult()
        };
    }

    private static IEnumerable<TransferItem> Transfers()
    {
        return new List<TransferItem>
        {
            new TransferItem
            {
                Code = "W2MS006583SS",
                Price = 10,
                PricePP = 10,
                MaxPax = Int32.MaxValue,
                Type = TransferItemType.Shared
            },
            new TransferItem
            {
                Code = "W2MS006564PP",
                Price = 50,
                PricePP = 50,
                MaxPax = Int32.MaxValue,
                Type = TransferItemType.Private
            },
            new TransferItem
            {
                Code = "W2MS006583NS",
                Price = 10,
                PricePP = 10,
                MaxPax = Int32.MaxValue,
                Type = TransferItemType.NoTransfer
            },
            new TransferItem
            {
                Code = "W2MS006564NP",
                Price = 50,
                PricePP = 50,
                MaxPax = Int32.MaxValue,
                Type = TransferItemType.NoTransfer
            }
        };
    }

    private static IEnumerable<TransferItem> OnlyPrivateTransferAvailable()
    {
        return new List<TransferItem>
        {
            new TransferItem
            {
                Code = "W2MS006564PP",
                Price = 50,
                PricePP = 50,
                MaxPax = Int32.MaxValue,
                Type = TransferItemType.Private
            },
            new TransferItem
            {
                Code = "W2MS006564NP",
                Price = 50,
                PricePP = 50,
                MaxPax = Int32.MaxValue,
                Type = TransferItemType.NoTransfer
            }
        };
    }

    private static IEnumerable<TransferItem> SharedDefaultTransferResult()
    {
        return
            new List<TransferItem>
            {
                new TransferItem
                {
                    Code = "W2MS006583SS",
                    Price = 10,
                    PricePP = 10
                },
                new TransferItem
                {
                    Code = "W2MS006564PP",
                    Price = 50,
                    PricePP = 50
                },
                new TransferItem
                {
                    Code = "W2MS006583NS",
                    Price = 10,
                    PricePP = 10
                }
            };
    }

    private static IEnumerable<TransferItem> PrivateDefaultTransferResult()
    {
        return
            new List<TransferItem>
            {
                new TransferItem
                {
                    Code = "W2MS006564PP",
                    Price = 50,
                    PricePP = 50
                },
                new TransferItem
                {
                    Code = "W2MS006564NP",
                    Price = 50,
                    PricePP = 50,
                    MaxPax = Int32.MaxValue,
                    Type = TransferItemType.NoTransfer
                }
            };
    }

    private static IEnumerable<TransferItem> NoDefaultTransferResult()
    {
        return
            new List<TransferItem>
            {
                new TransferItem
                {
                    Code = "W2MS006583SS",
                    Price = 10,
                    PricePP = 10
                },
                new TransferItem
                {
                    Code = "W2MS006564PP",
                    Price = 50,
                    PricePP = 50
                },
                new TransferItem
                {
                    Code = "DEFAULTH",
                    Price = 0,
                    PricePP = 0
                }
            };
    }

    /// <summary>
    /// Settings
    /// </summary>
    private AtcomSettings atcomSettings => new AtcomSettings
    {
        Transfers = new TransfersSettings
        {
            DisableTransfersInHours = 24,
            DefaultTimezoneId = "GMT Standard Time",
            NoTransferCodesToIgnore = new Dictionary<string, string>
            {
                {"S", "R"},
                {"P", "H"},
                {"SS", "NP"},
                {"PP", "NS"},
                {"H", "R"},
                {"R", "H"},
                {"NP", "NS"}
            },
            Types = new TransferTypesSettings
            {
                SyntheticNoTransfer = "DEFAULT",
                DefaultNoTransferCode = "H",
                Shared = new List<string> { "S", "SS" },
                Private = new List<string> { "P", "PP" },
                NoTransfer = new List<string> { "H", "R", "NS", "NP" }
            },
            DefaultTransferHotels = new Dictionary<string, IEnumerable<string>>
            {
                {"NoTransfer", new[] {"EUCB", "EUCO", "EUCL"}},
                {"Shared", new[] {"EUBA", "EUBF", "EUBO", "EUBU", "EULB", "EULO", "EULU"}},
                {"Private", new[] {"EUBL", "EULL"}},
            }
        }
    };

    [Fact]
    public async Task EnrichTransferWithCmsInfo_Should_EnrichOffersWithHotelTransferData()
    {
        // Arrange

        var offers = new List<Offer>
        {
            new Offer {Accom = new Accom() {Code = "123"}, Transfers = new List<TransferItem> {new TransferItem {Code = "123"}}, Transport = new Transport()}
        };

        var hotelTransfers = new List<List<HotelTransfer>>()
        {
            new List<HotelTransfer>
            {
                new HotelTransfer {Code = "123", Name = "Transfer1", IconUrl = "url"}
            }
        };

        _hotelsServiceMock.Setup(h => h.GetHotelTransfers(It.IsAny<string[]>()))
            .ReturnsAsync(hotelTransfers);

        // Act
        await service.EnrichTransferWithCmsInfo(offers);

        // Assert
        offers.ForEach(offer =>
            offer.Transfers.Should().NotBeEmpty()
        );

        _hotelsServiceMock.Verify(h => h.GetHotelTransfers(It.IsAny<string[]>()), Times.Once);
    }

    [Fact]
    public async Task EnrichTransferWithCmsInfo_NoMatchingHotelTransfers_ShouldSkipEnrichment()
    {
        // Arrange
        var offers = new List<Offer>
        {
            new Offer
            {
                Accom = new Accom() {Code = "A1"},
                Transfers = new List<TransferItem>(),
                Transport = new Transport {Routes = new List<Route>()}
            }
        };
        var hotelTransfers = new List<IEnumerable<HotelTransfer>>(); // Empty list simulates no matches

        _hotelsServiceMock.Setup(h => h.GetHotelTransfers(It.IsAny<string[]>())).ReturnsAsync(hotelTransfers);

        // Act
        await service.EnrichTransferWithCmsInfo(offers);

        // Assert
        foreach (var offer in offers)
        {
            offer.Transfers.Should().BeEmpty();
        }
    }

    [Fact]
    public async Task EnrichTransferWithCmsInfo_WhenGetHotelTransfersThrowsException_ShouldPropagateException()
    {
        // Arrange
        var offers = new List<Offer>
        {
            new Offer {Accom = new Accom() {Code = "A1"}}
        };

        _hotelsServiceMock.Setup(h => h.GetHotelTransfers(It.IsAny<string[]>()))
            .ThrowsAsync(new Exception("Simulated exception"));

        // Act
        Func<Task> act = async () => await service.EnrichTransferWithCmsInfo(offers);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Simulated exception");
    }

    [Fact]
    public async Task GetAllTransfers_Should_ReturnProviderResult()
    {
        var languageCode = "en-GB";
        var expected = new List<HotelTransfer>
        {
            new HotelTransfer { Code = "TR1", Name = "Transfer1" }
        };

        Mock.Get(_referenceDataProvider)
            .Setup(x => x.GetAllTransfers(languageCode))
            .ReturnsAsync(expected);

        var result = await service.GetAllTransfers(languageCode);

        result.Should().BeEquivalentTo(expected);
        Mock.Get(_referenceDataProvider)
            .Verify(x => x.GetAllTransfers(languageCode), Times.Once);
    }

    [Fact]
    public async Task GetAllTransfers_WhenProviderThrows_ShouldPropagateException()
    {
        var languageCode = "en-GB";
        Mock.Get(_referenceDataProvider)
            .Setup(x => x.GetAllTransfers(languageCode))
            .ThrowsAsync(new Exception("provider error"));

        Func<Task> act = async () => await service.GetAllTransfers(languageCode);

        await act.Should().ThrowAsync<Exception>().WithMessage("provider error");
    }
}