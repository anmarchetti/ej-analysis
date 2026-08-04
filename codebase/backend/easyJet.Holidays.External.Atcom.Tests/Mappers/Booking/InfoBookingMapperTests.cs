using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;
using easyJet.Holidays.Api.Domain.Data.Settings.Ancillaries;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using InfoBookingRequest = easyJet.Holidays.External.Atcom.Models.InfoBooking.InfoBookingRequest;
using Seat = easyJet.Holidays.Api.Domain.Data.Booking.Seat;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Booking;

public class InfoBookingMapperTests
{
    private readonly IFixture _fixture;
    private readonly Mock<IReferenceDataService> _referenceDataServiceMock;
    private readonly InfoBookingMapper _sut;

    public InfoBookingMapperTests()
    {
        _fixture = FixtureUtils.AutoMoqFixture();
        _fixture.Inject(Options.Create(new AtcomSettings
        {
            CustomerAgencyNo = new List<string> { "CustomerAgencyNo" },
            PaymentCodes = new Dictionary<string, PaymentCodesSettings>{{"CR", new PaymentCodesSettings
            {
                Redeemed = new PaymentTypeSettings()
                {
                    Code = "CR",
                    Group = "CA"
                },
                Issued =new PaymentTypeSettings()
                {
                    Code = "CI",
                    Group = "CA"
                },
            }}},
            CltInfo = new AtcomCltInfoSettings
            {
                AgentGroups = new Dictionary<string, AtcomCltInfoAgentsSettings>
                    {
                        {
                            "default",
                            new AtcomCltInfoAgentsSettings
                            {
                                AgentsNames = new Dictionary<string, string> {
                                    {"UK", "WAGBP" }
                                },
                            }
                        }
                    }
            }
        }));
        _fixture.Inject(Options.Create(new ApiSettings
        {
            Vouchers = new VoucherSettings
            {
                Types = new VoucherTypeSettings
                {
                    GiftCard = "giftcard"
                },
                PromoVouchers = new VoucherReasonSettings()
                {
                    Types = new List<string>() { "marketing" }
                }
            }
        }));
        _fixture.Inject(Options.Create(new LanguageSettings
        {
            MarketLanguages = new Dictionary<string, IEnumerable<string>>
            {
                { "UK", new[] { "en" } }
            }
        }));

        // Configure the mock for IReferenceDataService
        _referenceDataServiceMock = _fixture.Freeze<Mock<IReferenceDataService>>();
        _referenceDataServiceMock
            .Setup(service => service.GetComplimentarySettings(It.IsAny<string>()))
            .ReturnsAsync(MapperFacilitiesFilterOptionsTestsData.GetDefaultComplimentarySettings());

        _referenceDataServiceMock
            .Setup(service => service.GetLuggage())
            .ReturnsAsync(MapperFacilitiesFilterOptionsTestsData.GetDefaultLuggageConfiguration());

        _sut = _fixture.Freeze<InfoBookingMapper>();
    }

    [Theory]
    [MemberData(nameof(MapperFacilitiesFilterOptionsTestsData.Map_NullResponse), MemberType = typeof(MapperFacilitiesFilterOptionsTestsData))]
    public async Task Map_Empty_Response_ShouldNotBreak(Models.InfoBooking.InfoBookingResponse response)
    {
        // Act
        var actual = await _sut.Map(response, null);

        // Assert
        actual.Should().NotBeNull();
    }

    [Theory]
    [MemberData(nameof(MapperFacilitiesFilterOptionsTestsData.Map_With_FreeForKids), MemberType = typeof(MapperFacilitiesFilterOptionsTestsData))]
    public void BuildInfoBookingRequest_Include_Children_Discount(ValidateBookingRequest request, CltInfo cltInfo, string internalFlightPromotionCode)
    {
        // Act
        var actual = InfoBookingMapper.BuildInfoBookingRequest(request, cltInfo, internalFlightPromotionCode, "en_EN");

        // Assert
        actual.Bkg_Ent.Package[0].Items[0].As<Accom>().Child_Price_Reduction.Should().NotBeNull();
        actual.Bkg_Ent.Package[0].Items[0].As<Accom>().Child_Price_Reduction.Cd.Should().Be("ALOW");
    }

    [Theory]
    [MemberData(nameof(MapperFacilitiesFilterOptionsTestsData.Map_With_Seats), MemberType = typeof(MapperFacilitiesFilterOptionsTestsData))]
    public void BuildInfoBookingRequest_Include_Seat_Selection(ValidateBookingRequest request, CltInfo cltInfo, string internalFlightPromotionCode)
    {
        // Act
        var actual = InfoBookingMapper.BuildInfoBookingRequest(request, cltInfo, internalFlightPromotionCode, "en_EN");
        var infoBRequest = new InfoBookingRequest();
        infoBRequest.Payload.Body = actual;

        // Assert
        actual.Bkg_Ent.Seat_Map.Length.Should().Be(2);

        actual.Bkg_Ent.Seat_Map[0].SeatMapSec.SecId[0].Should().Be("1");
        actual.Bkg_Ent.Seat_Map[0].Seat.Length.Should().Be(2);
        actual.Bkg_Ent.Seat_Map[0].Seat[0].Row.Should().Be("1");
        actual.Bkg_Ent.Seat_Map[0].Seat[0].Col.Should().Be("C");
        actual.Bkg_Ent.Seat_Map[0].Seat[0].Pax.Index.Should().Be("1");
        actual.Bkg_Ent.Seat_Map[0].Seat[1].Row.Should().Be("23");
        actual.Bkg_Ent.Seat_Map[0].Seat[1].Col.Should().Be("D");
        actual.Bkg_Ent.Seat_Map[0].Seat[1].Pax.Index.Should().Be("2");

        actual.Bkg_Ent.Seat_Map[1].SeatMapSec.SecId[0].Should().Be("2");
        actual.Bkg_Ent.Seat_Map[1].Seat.Length.Should().Be(2);
        actual.Bkg_Ent.Seat_Map[1].Seat[0].Row.Should().Be("2");
        actual.Bkg_Ent.Seat_Map[1].Seat[0].Col.Should().Be("A");
        actual.Bkg_Ent.Seat_Map[1].Seat[0].Pax.Index.Should().Be("1");
        actual.Bkg_Ent.Seat_Map[1].Seat[1].Row.Should().Be("24");
        actual.Bkg_Ent.Seat_Map[1].Seat[1].Col.Should().Be("B");
        actual.Bkg_Ent.Seat_Map[1].Seat[1].Pax.Index.Should().Be("2");
    }

    [Theory]
    [MemberData(nameof(MapperFacilitiesFilterOptionsTestsData.Offer_With_Transfer), MemberType = typeof(MapperFacilitiesFilterOptionsTestsData))]
    // https://app.clickup.com/t/2553597/EJHL-4278
    public void BuildInfoBookingRequest_ShouldReferenceAccomAsParentInExtras(ValidateBookingRequest request, CltInfo cltInfo, string internalFlightPromotionCode)
    {
        // Act
        var actual = InfoBookingMapper.BuildInfoBookingRequest(request, cltInfo, internalFlightPromotionCode, "en_EN");
        // Assert
        actual.Bkg_Ent.Package.First().Items.First().As<Accom>().Id.Should().BeEquivalentTo(InfoBookingMapper.AccommodationSectionId);
        actual.Bkg_Ent.Item.Select(x => x.Ref_Prd_Id).Should().AllBeEquivalentTo(InfoBookingMapper.AccommodationSectionId);
    }
}



public static class MapperFacilitiesFilterOptionsTestsData
{
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

    public static IEnumerable<object[]> Map_NullResponse =>
        new List<object[]>
        {
            new object[]
            {
                new Models.InfoBooking.InfoBookingResponse()
                {
                    Payload = new Domain.Models.Api.Payload.XmlApiPayload<InfoBookingResponse>
                    {
                        Body = new InfoBookingResponse
                        {
                            Adm = new Adm
                            {
                                SessId = "one",
                                ReqId = "two",

                            },
                            Bkg_Ent = new Bkg_Ent
                            {

                            },
                            TrvDox = new TrvDox
                            {
                                DoxLang = "en_EN"

                            },
                            PayData = new[]
                            {
                                new PayData
                                {

                                }
                            },
                            ResSts = ResSts.CONFIRMED,
                            Agt_No = "WAGBP"
                        }
                    }
                }
            }
        };

    public static IEnumerable<object[]> Map_With_FreeForKids =>
        new List<object[]>
        {
            new object[]
            {
                new ValidateBookingRequest()
                {
                    Offer = new Holidays.Api.Domain.Data.PackageOffers.Offer
                    {
                        Accom = new Holidays.Api.Domain.Data.PackageOffers.Accom
                        {
                            Date = new DateTime(2020, 02, 15),
                            Stay = 7,
                            Code = "XIUG",
                            Prom = "PLM",
                            Unit = new List<Holidays.Api.Domain.Data.PackageOffers.Unit>
                            {
                                new Holidays.Api.Domain.Data.PackageOffers.Unit
                                {
                                    Code = "TW098",
                                    Board = "FB",
                                    FreeForKids = true
                                }
                            }
                        },
                        Transport = new Holidays.Api.Domain.Data.PackageOffers.Transport
                        {
                            Routes = new List<Holidays.Api.Domain.Data.PackageOffers.Route>
                            {
                                new Holidays.Api.Domain.Data.PackageOffers.Route
                                {
                                    DepDate = new DateTimeOffset(new DateTime(2020, 02, 15), TimeSpan.Zero),
                                    ArrDate = new DateTimeOffset(new DateTime(2020, 02, 15), TimeSpan.Zero),
                                    FltNo = "987",
                                    Car = "EZY"
                                },
                                new Holidays.Api.Domain.Data.PackageOffers.Route
                                {
                                    DepDate = new DateTimeOffset(new DateTime(2020, 02, 22), TimeSpan.Zero),
                                    ArrDate = new DateTimeOffset(new DateTime(2020, 02, 15), TimeSpan.Zero),
                                    FltNo = "987",
                                    Car = "EZY"
                                }
                            }
                        }
                    },
                    ExtraLuggageInfo = new ExtraLuggageInfo
                    {
                        Items = []
                    },
                    Guests = new List<Holidays.Api.Domain.Data.Guests.Person>
                    {

                    }
                },
                new CltInfo
                {

                },
                ""
            }
        };

    public static IEnumerable<object[]> Map_With_Seats =>
        new List<object[]>
        {
            new object[]
            {
                new ValidateBookingRequest()
                {
                    ExtraLuggageInfo = new ExtraLuggageInfo
                    {
                        Items = []
                    },
                    Offer = new Holidays.Api.Domain.Data.PackageOffers.Offer
                    {
                        Accom = new Holidays.Api.Domain.Data.PackageOffers.Accom
                        {
                            Date = new DateTime(2020, 02, 15),
                            Stay = 7,
                            Code = "XIUG",
                            Prom = "PLM",
                            Unit = new List<Holidays.Api.Domain.Data.PackageOffers.Unit>
                            {
                                new Holidays.Api.Domain.Data.PackageOffers.Unit
                                {
                                    Code = "TW098",
                                    Board = "FB",
                                    FreeForKids = true
                                }
                            }
                        },
                        Transport = new Holidays.Api.Domain.Data.PackageOffers.Transport
                        {
                            Routes = new List<Holidays.Api.Domain.Data.PackageOffers.Route>
                            {
                                new Holidays.Api.Domain.Data.PackageOffers.Route
                                {
                                    DepDate = new DateTimeOffset(new DateTime(2020, 02, 15), TimeSpan.Zero),
                                    ArrDate = new DateTimeOffset(new DateTime(2020, 02, 15), TimeSpan.Zero),
                                    FltNo = "987",
                                    Car = "EZY"
                                },
                                new Holidays.Api.Domain.Data.PackageOffers.Route
                                {
                                    DepDate = new DateTimeOffset(new DateTime(2020, 02, 22), TimeSpan.Zero),
                                    ArrDate = new DateTimeOffset(new DateTime(2020, 02, 15), TimeSpan.Zero),
                                    FltNo = "987",
                                    Car = "EZY"
                                }
                            }
                        }
                    },
                    Guests = new List<Holidays.Api.Domain.Data.Guests.Person>
                    {
                        new() {Type = PersonType.Adult},
                        new() {Type = PersonType.Adult}
                    },
                    SeatSelection = new List<SeatMap>
                    {
                        new SeatMap
                        {
                            SectorId = "1",
                            Seats = new List<Seat>
                            {
                                new Seat
                                {
                                    SeatNumber = "1C",
                                    PaxIndex = 1

                                },
                                new Seat
                                {
                                    SeatNumber = "23D",
                                    PaxIndex = 2
                                }
                            }
                        },
                        new SeatMap
                        {
                            SectorId = "2",
                            Seats = new List<Seat>
                            {
                                new Seat
                                {
                                    SeatNumber = "2A",
                                    PaxIndex = 1

                                },
                                new Seat
                                {
                                    SeatNumber = "24B",
                                    PaxIndex = 2
                                }
                            }
                        }
                    }
                },
                new CltInfo
                {

                    },
                    ""
                }
            };

    public static TheoryData<ValidateBookingRequest, CltInfo, string> Offer_With_Transfer => new()
    {
        {
            new ValidateBookingRequest() {
                    Offer = new Holidays.Api.Domain.Data.PackageOffers.Offer
                    {
                        Accom = new Holidays.Api.Domain.Data.PackageOffers.Accom
                        {
                            Date = new DateTime(2024, 08, 03),
                            Stay = 7,
                            Code = "ESMJ0121",
                            Prom = "EUBF",
                            Unit = new List<Holidays.Api.Domain.Data.PackageOffers.Unit>
                            {
                                new Holidays.Api.Domain.Data.PackageOffers.Unit
                                {
                                    Code = "STU01",
                                    Board = "SC",
                                    FreeForKids = true
                                }
                            }
                        },
                        Transfers = new List<TransferItem>
                        {
                            new TransferItem
                            {
                                AutoInclude = false,
                                Code = "JUMB113511SS",
                                IsHidden = false,
                                MCMethod = MultiCentreMethod.MANY,
                                Method = ItemMethod.PP,
                                Name = "Shared - Shuttle standard bus",
                                Price = 60,
                                Quantity = 3,
                                Type = TransferItemType.Shared
                            }
                        },
                        Transport = new Holidays.Api.Domain.Data.PackageOffers.Transport
                        {
                            Routes = new List<Holidays.Api.Domain.Data.PackageOffers.Route>
                            {
                                new Holidays.Api.Domain.Data.PackageOffers.Route
                                {
                                    ArrDate = new DateTimeOffset(new DateTime(2024, 08, 03, 20, 30, 0)),
                                    ArrPt = "PMI",
                                    Car = "EZY",
                                    DepDate = new DateTimeOffset(new DateTime(2024, 08, 03, 16, 50, 0)),
                                    DepPt = "MAN",
                                    FltNo = "EZY2021",
                                },
                                new Holidays.Api.Domain.Data.PackageOffers.Route
                                {
                                    ArrDate = new DateTimeOffset(new DateTime(2024, 08, 10, 23, 05, 0)),
                                    ArrPt = "MAN",
                                    Car = "EZY",
                                    DepDate = new DateTimeOffset(new DateTime(2024, 08, 10, 20, 0, 0)),
                                    DepPt = "MAN",
                                    FltNo = "EZY2022",
                                }
                            }
                        }
                    },
                    Guests = new List<Holidays.Api.Domain.Data.Guests.Person>
                    {
                    },
                },
                new CltInfo
                {
                },
                ""
            }
        };
}