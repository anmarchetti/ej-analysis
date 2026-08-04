using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Settings.Ancillaries;
using easyJet.Holidays.Api.Domain.Interfaces.Transliteration;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Mappers.Guests;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using InfoModifyBookingResponse = easyJet.Holidays.External.Atcom.Models.ModifyBooking.InfoModifyBookingResponse;
using Pax = easyJet.Holidays.External.Atcom.Models.Internal.Pax;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Booking;

public class ModifyBookingMapperTests
{
    private readonly Mock<SeatsMapper> _seatsMapper = new();
    private readonly Mock<IReferenceDataService> _referenceDataServiceMock = new();
    private readonly Mock<ILuggageService> _luggageServiceMock = new();
    private readonly Mock<IFlightExtraService> _flightExtraServiceMock = new();
    private readonly ModifyBookingMapper _sut;
    private readonly IFixture _fixture;

    public ModifyBookingMapperTests()
    {
        _fixture = FixtureUtils.AutoMoqFixture();

        var tradeAgentCookieService = new Mock<ITradeAgentAuthenticationService>();
        tradeAgentCookieService.Setup(service => service.IsTradePortalEnv()).Returns(true);
        tradeAgentCookieService.Setup(service => service.IsLoggedInAsTradeAgent()).Returns(true);

        var transliterationService = new Mock<ITransliterationService>();
        transliterationService
            .Setup(x => x.ToEnglish(It.IsAny<string>()))
            .Returns<string>(x => x);

        _referenceDataServiceMock
            .Setup(x => x.GetLuggage())
            .ReturnsAsync(Getters.GetDefaultLuggageConfiguration());
        _referenceDataServiceMock
            .Setup(x => x.GetComplimentarySettings(It.IsAny<string>()))
            .ReturnsAsync(Getters.GetDefaultComplimentarySettings());

        _luggageServiceMock
            .Setup(x => x.GetComplimentaryLuggage(It.IsAny<BookingPackage>()))
            .ReturnsAsync(new List<ExtraLuggageItem>());

        var rbm = new RequestBookingMapper(
            Getters.GetAtcomSettings(),
            Getters.GetPriceMapper(tradeAgentCookieService.Object),
            _seatsMapper.Object,
            Getters.GetAtcomRequestGenerator(tradeAgentCookieService.Object),
            Getters.GetLanguageSettings(),
            new ExtraLuggageMapper(_referenceDataServiceMock.Object, _luggageServiceMock.Object, _flightExtraServiceMock.Object, _fixture.Create<ILogger<ExtraLuggageMapper>>()),
            Getters.GetGuestsMapper(transliterationService.Object)
        );

        _sut = new ModifyBookingMapper(rbm, Getters.GetPriceMapper(tradeAgentCookieService.Object));
    }

    [Theory]
    [MemberData(nameof(ModifyBookingMapperTestData.Map_Success), MemberType = typeof(ModifyBookingMapperTestData))]
    public async Task Map_Success_ValidateAmendBookingResponse(InfoModifyBookingResponse infoModifyBookingResponse, ValidateAmendBookingResponse expected)
    {

        // Act
        var actual = await _sut.Map(infoModifyBookingResponse, new PriceBreakdownResponse(), new List<Benefit>(), false);

        // Assert
        actual.Should().BeEquivalentTo(expected);
    }
}

public class ModifyBookingMapperTestData
{
    public static IEnumerable<object[]> Map_Success =>
        new List<object[]>
        {
            new object[] {
                new InfoModifyBookingResponse
                {
                    Payload = new Domain.Models.Api.Payload.XmlApiPayload<Models.Internal.InfoModifyBookingResponse.InfoModifyBookingResponse>
                    {
                        Body = new Models.Internal.InfoModifyBookingResponse.InfoModifyBookingResponse()
                        {
                            CusDet = new CusDet[]
                            {
                                new CusDet
                                {
                                    Person = new Person
                                    {
                                        Email = new Email_Type[]
                                        {
                                            new Email_Type { Address = "some@email.com" }
                                        },
                                    }
                                }
                            },
                            Pax = new Pax[]
                            {
                                new Pax
                                {
                                    Age = "20",
                                    Index= "1",
                                    Lead_Pax = true,
                                    Person = new Person
                                    {
                                        FirstName ="FirstName",
                                        LastName = "LastName"
                                    }
                                }
                            },
                            PayData = new PayData[]
                            {
                                new PayData
                                {
                                    Bkg_Prc_Ex = new Bkg_Prc_Ex[]
                                    {
                                        new Bkg_Prc_Ex
                                        {
                                            Amt = "120"
                                        }
                                    }
                                }
                            },
                            Adm = new Adm
                            {
                                SessId = "SessionId",
                                ReqId = "RequestId"
                            },
                            ResSts = ResSts.CONFIRMED,
                            Bkg_Ent = new Bkg_Ent
                            {
                                Package = new Package[]
                                {
                                    new Package
                                    {
                                        Items = new object[]
                                        {
                                            new Accom
                                            {
                                                Rm_Cd = new Rm_Cd[]
                                                {
                                                    new Rm_Cd
                                                    {
                                                        Ser_Sts = new Ser_Sts[]
                                                        {
                                                            Ser_Sts.FIX
                                                        }
                                                    }
                                                },
                                                St_Dt = "2024-01-01",
                                                End_Dt = "2024-01-08",
                                                HtlPrd = new HtlPrd
                                                {

                                                }
                                            }
                                        },
                                        Route_List = new Routing[]
                                        {
                                        },
                                    }
                                },
                                Prices = new Price[] { new Price() { Disc = new Disc { Disc_Code = "DISCOUNT100" } } },
                                Flt_Extra_Cat_List = new Flt_Extra_Cat_List[]
                                {
                                    new Flt_Extra_Cat_List
                                    {
                                        Flt_Inv_Id = "RouteId1",
                                        Flt_Extra_Cat = new Flt_Extra_Cat[]
                                        {
                                            new Flt_Extra_Cat
                                            {
                                                Method = Flt_Extra_CatMethod.BAG,
                                                Code = "code1",
                                                Flt_Extra = new Flt_Extra[]
                                                {
                                                    new Flt_Extra
                                                    {
                                                        Code = "code1",
                                                        Baggage = new Baggage
                                                        {
                                                            Weight = new Weight[]
                                                            {
                                                                new Weight
                                                                {
                                                                    Cd = "100",
                                                                    Piece = new Piece[]
                                                                    {
                                                                        new Piece
                                                                        {
                                                                            Cd = "100",
                                                                            Value = "100"
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            BkgNum = new BkgNum
                            {
                                BkgId = "1"
                            }
                        }
                    }
                },
                new ValidateAmendBookingResponse
                {
                    SessionId = "SessionId",
                    RequestId = "RequestId",
                    ResultStatus = "CONFIRMED",
                    DiscountCode = "DISCOUNT100",
                    Accom = new BookingAccommodation
                    {
                        Hotel = new Holidays.Api.Domain.Data.PackageOffers.OfferHotel
                        {
                            Country = new Holidays.Api.Domain.Data.PackageOffers.HotelCountry
                            {

                            },
                            Location = new Holidays.Api.Domain.Data.PackageOffers.HotelLocation
                            {

                            },
                            FullHotelAddress = new()
                        },
                        Rooms = new List<Holidays.Api.Domain.Data.PackageOffers.Unit>(),
                        StartDate = "2024-01-01",
                        EndDate = "2024-01-08",
                    },
                    Duration = 7,
                    BookingReference = "1",
                    TradeAgentPriceBreakdown = null,
                    PriceBreakdown = new PriceCategory[] {},
                    PaymentInfo = new PriceInfo
                    {
                        PaymentHistory = new PaymentHistoryItem[]{ },
                        Currency = "EUR",
                        BookingPriceEx = 120,
                            AmendmentFeesItems = Array.Empty<FeeItem>(),

                    },
                    ExtraLuggageInfo = new ExtraLuggageInfo
                    {
                        Items = new List<ExtraLuggageItem> { }
                    },
                    Transport = new Holidays.Api.Domain.Data.PackageOffers.Transport
                    {
                        Routes = new List<Holidays.Api.Domain.Data.PackageOffers.Route>(),
                    },
                    Transfers = new List<TransferItem> { new TransferItem { Code = "", Type = TransferItemType.NoTransfer, Quantity = 1, Method = ItemMethod.PP, MaxPax = int.MaxValue } },
                    Guests = new List<Holidays.Api.Domain.Data.Guests.PersonWithDetails>
                    {
                        new Holidays.Api.Domain.Data.Guests.PersonWithDetails
                        {
                            FirstName = "FirstName",
                            LastName = "LastName",
                            Index = "1",
                            IsLead = true,
                            Age = 20,
                        }
                    },
                    LeadPassenger = new Holidays.Api.Domain.Data.Guests.LeadPassenger
                    {
                        Email = "some@email.com"
                    },
                    SeatSelection = new List<SeatMap> { },
                    ApiErrors = null,
                    Currency = new Currency
                    {
                        Code = "EUR"
                    },
                    TaxesAndFees = new List<TaxesAndFees>()
                }
            }
        };
}

public static class Getters
{
    public static IOptions<AtcomSettings> GetAtcomSettings()
    {
        return Options.Create(new AtcomSettings
        {
            CltInfo = new AtcomCltInfoSettings
            {
                AgentGroups = new Dictionary<string, AtcomCltInfoAgentsSettings>
                    {
                        {
                            "default",
                            new AtcomCltInfoAgentsSettings
                            {
                                AgentsNames = new Dictionary<string, string> {
                                    {"CH", "WACHF" },
                                    {"UK", "WAGBP" }
                                }
                            }
                        }
                    }
            },
            PaymentCodes = new Dictionary<string, PaymentCodesSettings>
            {
                {
                    "",
                    new PaymentCodesSettings
                    {
                        Issued = new PaymentTypeSettings { Code = "12345" },
                        Redeemed = new PaymentTypeSettings { Code = "1234" }
                    }
                }
            },
            PricesTypeCode = new PricesTypeCode
            {
                Fees = "FEE"
            }
        });
    }

    public static IOptions<LanguageSettings> GetLanguageSettings()
    {
        return Options.Create(new LanguageSettings
        {
            MarketLanguages = new Dictionary<string, IEnumerable<string>>
            {
                { "CH", new[] { "fr-CH", "de-CH" } },
                { "UK", new[] { "en" } }
            }
        });
    }


    public static IOptions<ApiSettings> GetApiSettings()
    {
        return Options.Create(new ApiSettings
        {
            DisabledOffersForNextDay = true,
            Vouchers = new VoucherSettings
            {
                IsActive = false,
                PromoVouchers = new VoucherReasonSettings { Types = new List<string> { "Promo" } },
                Types = new VoucherTypeSettings { GiftCard = "gift" }
            }
        });
    }

    public static AtcomRequestGenerator GetAtcomRequestGenerator(ITradeAgentAuthenticationService s)
    {
        return new AtcomRequestGenerator(GetAtcomSettings(), s, null, null);
    }

    public static PriceMapper GetPriceMapper(ITradeAgentAuthenticationService s)
    {
        return new PriceMapper(GetAtcomSettings(), GetApiSettings(), s);
    }

    public static GuestsMapper GetGuestsMapper(ITransliterationService s)
    {
        return new GuestsMapper(s);
    }

    public static Luggage GetDefaultLuggageConfiguration()
    {
        return new Luggage
        {
            LuggageCategories = new List<LuggageCategory>
            {
                new()
                {
                    Code = "CABI",
                    Type = "Cabin Bags",
                    LuggageItems = new List<LuggageItemBase>()
                    {
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "SCB1"
                        }
                    }
                },
                new()
                {
                    Code = "BAGE",
                    Type = "Bag",
                    LuggageItems = new List<LuggageItemBase>()
                    {
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "LUS"
                        },
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "LUG"
                        }
                    }
                },
                new()
                {
                    Code = "ADDB",
                    Type = "Bag",
                    LuggageItems = new List<LuggageItemBase>()
                    {
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "LUSE"
                        },
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "LUGE"
                        }
                    }
                },
                new()
                {
                    Code = "SEO",
                    Type = "Sports Equipment",
                    LuggageItems = new List<LuggageItemBase>()
                    {
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "BIKE"
                        },
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "CANO"
                        }
                    }
                }
            }
        };
    }

    public static ComplimentarySettings GetDefaultComplimentarySettings()
    {
        return new ComplimentarySettings
        {
            ComplimentaryIndex = new Dictionary<string, PromotionComplements>
            {
                {
                    "EUBO",
                    new PromotionComplements
                    {
                        PromotionType = "beach-holiday",
                        Codes = new[] { "EUBO" },
                        InternalFallbackCode = "EUBO",
                        Comment = "Beach Holiday Complement",
                        Luggage = new[]
                        {
                            new ComplimentaryLuggage
                            {
                                Code = "LUG",
                                Quantity = (1, 1, 0)
                            }
                        }
                    }
                },
                {
                    "EUCO",
                    new PromotionComplements
                    {
                        PromotionType = "city-breaks",
                        Codes = new[] { "EUCO" },
                        InternalFallbackCode = "EUBO",
                        Comment = "City Breaks Complement",
                        Luggage = Array.Empty<ComplimentaryLuggage>()
                    }
                }
            }
        };
    }
}