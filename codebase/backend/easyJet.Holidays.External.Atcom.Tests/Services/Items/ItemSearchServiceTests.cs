using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.Atcom.Services.Items;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using System.Globalization;
using Xunit;
using Accom = easyJet.Holidays.Api.Domain.Data.PackageOffers.Accom;
using Offer = easyJet.Holidays.Api.Domain.Data.PackageOffers.Offer;
using ItemSearchRequest = easyJet.Holidays.External.Atcom.Models.ItemSearch.ItemSearchRequest;
using ItemSearchResponse = easyJet.Holidays.External.Atcom.Models.InfoBooking.ItemSearchResponse;
using KeyValuePair = easyJet.Holidays.External.Atcom.Models.Internal.KeyValuePair;
using Type = easyJet.Holidays.External.Atcom.Models.Internal.Type;

namespace easyJet.Holidays.External.Atcom.Tests.Services.Items
{
    public class ItemSearchServiceTests
    {
        private IFixture _fixture = FixtureUtils.AutoMoqFixture();
        private IOptions<AtcomSettings> _atcomSettings;
        private IOptions<ApiSettings> _apiSettings;
        private IOptions<CacheSettings> _cacheSettings;
        private readonly Mock<ICacheService> _cacheServiceMock;

        public ItemSearchServiceTests()
        {
            _atcomSettings = Options.Create(new AtcomSettings
            {
                Booking = new AtcomApiSettings
                {
                    Host = "http://localhost",
                    BaseUrl = "/b"
                },
                Search = new()
                {
                    Uk = new()
                    {
                        Host = "http://search-domain",
                        BaseUrl = "api/searchuk",
                    },
                    Ch = new()
                    {
                        Host = "http://search-domain",
                        BaseUrl = "api/searchch",
                    },
                    De = new()
                    {
                        Host = "http://search-domain",
                        BaseUrl = "api/searchde",
                    },
                    Fr = new()
                    {
                        Host = "http://search-domain",
                        BaseUrl = "api/searchfr",
                    }
                },
                EndpointTemplate = new AtcomEndpointTemplateSettings
                {
                    SearchRoomVariants = "search_rooms_tmpl&{0}",
                    BrandParam = "brnd={0}"
                },
                Transfers = new TransfersSettings
                {
                    Types = new TransferTypesSettings
                    {
                        SyntheticNoTransfer = "SyntheticNoTransferTests"
                    }
                },
                PaymentCodes = new Dictionary<string, PaymentCodesSettings>(),
                CltInfo = new()
                {
                    AgentGroups = new()
                    {
                        {
                            "default",
                            new AtcomCltInfoAgentsSettings
                            {
                                AgentsNames = new() {
                                    {"CH", "WACHFS" },
                                    {"UK", "WAGBP" }
                                },
                                UserNames = new() {
                                    { "CH", "WACHFS" },
                                    {"UK", "WAGBP" }
                                },
                            }
                        }
                    }
                }
            });

            _apiSettings = Options.Create(new ApiSettings
            {
                Vouchers = new VoucherSettings
                {
                    BookingMemos = new BookingMemoSettings()
                    {
                        Cred = new MemoSettings()
                        {
                            Code = "CRED"
                        },
                        MovedToCredit = new MemoSettings()
                        {
                            Code = "REP3"
                        }
                    },
                    Metadata = new Dictionary<string, object>
                {
                    {"currency", "GBP"}
                },
                    Source = new VoucherifySource
                    {
                        BulkTool = "Bulk Tool",
                        CallCentre = "Call Centre",
                        Web = "Web"
                    },
                    Types = new VoucherTypeSettings
                    {
                        Refund = "refund",
                        Incentive = "incentive",
                        Goodwill = "goodwill"
                    },
                    PromoVouchers = new VoucherReasonSettings()
                    {
                        Types = new List<string>() { "marketing" }
                    }
                }
            });

            _cacheSettings = Options.Create(
                new CacheSettings
                {
                    Buckets = new Buckets
                    {
                        Extras = "cacheKey"
                    }
                });

            _cacheServiceMock = _cacheServiceMock = new Mock<ICacheService>();

            _fixture.Inject(_cacheServiceMock);
            _fixture.Inject(_cacheSettings);
            _fixture.Inject(_atcomSettings);
            _fixture.Inject(_apiSettings);
        }

        [Fact]
        public async Task GetExtras_OfferAddedToCache_Success()
        {
            //Arrange

            var sut = _fixture.Create<ItemSearchService>();
            _cacheServiceMock.Setup(x => x.GetOrAddAsync(It.IsAny<string>(), It.IsAny<ICollection<string>>(), It.IsAny<Func<Task<OfferExtras>>>(), It.IsAny<bool>()))
                .ReturnsAsync(new OfferExtras())
                .Verifiable();

            var offer = new Offer
            {
                Transport = new Transport
                {
                    Routes = new List<Route>
                    {
                        new Route { DepDate = DateTime.SpecifyKind(new DateTime(2023, 01, 01, 1, 1, 1), DateTimeKind.Utc) },
                        new Route { DepDate = DateTime.SpecifyKind(new DateTime(2023, 01, 08, 1, 1, 1), DateTimeKind.Utc) }
                    }
                },
                Accom = new Accom
                {
                    Code = "CODE1",
                    Unit = new List<Unit>
                    {
                        new Unit
                        {
                            Occupation = new Occupation
                            {
                                Adults = 2
                            }
                        }
                    }
                }
            };

            //Act
            var offerExtras = await sut.GetExtras(offer);

            //Assert
            offerExtras.Should().NotBeNull();
            _cacheServiceMock.Verify(x => x.GetOrAddAsync(
                It.IsAny<string>(),
                It.IsAny<ICollection<string>>(),
                It.IsAny<Func<Task<OfferExtras>>>(),
                It.IsAny<bool>()),
                Times.Exactly(1));
        }

        [Fact]
        public async Task GetAirportParking_WhenKeyDataIsFullOfSpaces_SanitizesCorrectly()
        {
            //Arrange
            var apiServiceMock = new Mock<IApiService>();
            _fixture.Inject(apiServiceMock);

            var sut = _fixture.Create<ItemSearchService>();

            var response = new ItemSearchResponse
            {
                Payload = new XmlApiPayload<Models.Internal.ItemSearchResponse>()
                {
                    Body = new Models.Internal.ItemSearchResponse
                    {
                        Offers =
                        [
                            new Offers
                            {
                                Item_Set =
                                [
                                    new Item_Set
                                    {
                                        Item =
                                        [
                                            new Item
                                            {
                                                Tot_Prc = new Prc_Type { Value = "50" },
                                                Code = "LGV4",
                                                St_Dt = "2025-02-23",
                                                End_Dt = "2025-02-28",
                                                Item1 = new Prom { Code = "PROM" },
                                                Items =
                                                [
                                                    new CarPark { Type = Type.OFF_SITE, Start_TimeStr = "11:15:00", End_TimeStr = "18:55:00" },
                                                    new SrcData
                                                    {
                                                        KeyValuePair =
                                                        [
                                                            new KeyValuePair
                                                            {
                                                                Key = "KeyData",
                                                                Value =
                                                                    "<KeyData>\n  <BookingURL>/sandbox/v1/carpark/HPBRX0/priceCheck?</BookingURL>\n  <Ticket>\n    <AvailabilityList>\n      <Availability Code=\"BRX0\" Name=\"Silver Zone\">\n        <AirportTransfer TravelDuration=\"9\" Frequency=\"15\" Price=\"\"/>\n        <Prices TotalPrice=\"59.00\"/>\n        <Raw>\n          <Filter>\n            <meet_and_greet>0</meet_and_greet>\n            <park_and_ride>1</park_and_ride>\n            <on_airport>1</on_airport>\n            <car_parked_for_you>1</car_parked_for_you>\n            <lead_time>180</lead_time>\n          </Filter>\n          <tfhrpricing>daily</tfhrpricing>\n        </Raw>\n      </Availability>\n    </AvailabilityList>\n  </Ticket>\n</KeyData>\n"
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            };

            apiServiceMock.Setup(x => x.GetResponseContentAsync<ItemSearchRequest, ItemSearchResponse>(It.IsAny<ItemSearchRequest>()))
                .ReturnsAsync(response);

            var offer = new Offer
            {
                Transport = new Transport
                {
                    Routes =
                    [
                        new Route
                        {
                            Direction = Direction.Outbound,
                            DepDate = DateTime.Parse("2025-02-23T14:15:00", CultureInfo.InvariantCulture),
                            ArrDate = DateTime.Parse("2025-02-23T18:45:00", CultureInfo.InvariantCulture)
                        },

                        new Route
                        {
                            Direction = Direction.Inbound,
                            DepDate = DateTime.Parse("2025-02-28T12:35:00", CultureInfo.InvariantCulture),
                            ArrDate = DateTime.Parse("2025-02-28T16:55:00", CultureInfo.InvariantCulture)
                        }
                    ]
                },
                Accom = new Accom { Code = "CODE1", Stay = 5, Unit = [new Unit { Occupation = new Occupation { Adults = 2, PaxIds = [1] } }] }
            };

            //Act
            var airportParkings = await sut.GetAirportParkings(offer);

            //Assert
            airportParkings.Should().NotBeNull();
            airportParkings.FirstOrDefault().Should().NotBeNull();

            const string expected =
                "<KeyData><BookingURL>/sandbox/v1/carpark/HPBRX0/priceCheck?</BookingURL><Ticket><AvailabilityList><Availability Code=\"BRX0\" Name=\"Silver Zone\"><AirportTransfer TravelDuration=\"9\" Frequency=\"15\" Price=\"\"/><Prices TotalPrice=\"59.00\"/><Raw><Filter><meet_and_greet>0</meet_and_greet><park_and_ride>1</park_and_ride><on_airport>1</on_airport><car_parked_for_you>1</car_parked_for_you><lead_time>180</lead_time></Filter><tfhrpricing>daily</tfhrpricing></Raw></Availability></AvailabilityList></Ticket></KeyData>";

            Assert.Equal(expected, airportParkings.First().BookingDetails.KeyData);
        }
    }
}