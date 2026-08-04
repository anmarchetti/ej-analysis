using Xunit;
using FluentAssertions;
using Microsoft.Extensions.Options;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using Moq;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Services;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using AutoFixture;
using easyJet.Holidays.Tests.Domain;
using Microsoft.Extensions.Logging;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Interfaces.Transliteration;
using easyJet.Holidays.External.Atcom.Mappers.Guests;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Language;
using System.Collections;


namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Booking
{
    public class RequestBookingMapperExternalIdsTests
    {
        const string roomCode = "EXT_ROOM_101";
        const string boardCode = "EXT_BB_01";

        private readonly IFixture _fixture = FixtureUtils.AutoMoqFixture();


        [Fact]
        public async Task MapOffer_ValidData_ShouldMapRoomAndBoardExternalCodes()
        {
            var requestBookingMapper = CreateRequestBookingMapper(_fixture);
            var atcomresBookingBaseResponse = CreateAtcomResponse(roomCode, boardCode);

            var response = await requestBookingMapper.MapResponse(atcomresBookingBaseResponse, null, []);

            response.Package.Accom.Rooms[0]?.ExternalRoomCode.Should().Be(roomCode);
            response.Package.Accom.Rooms[0]?.ExternalBoardCode.Should().Be(boardCode);
        }

        [Fact]
        public async Task MapOffer_ValidData_ShouldWorkWhenRoomAndBoardCodesAreEmpty()
        {
            var requestBookingMapper = CreateRequestBookingMapper(_fixture);
            var atcomresBookingBaseResponse = CreateAtcomResponse(null, null);

            var response = await requestBookingMapper.MapResponse(atcomresBookingBaseResponse, null, []);

            response.Package.Accom.Rooms.Count.Should().Be(1);
            response.Package.Accom.Rooms[0]?.ExternalRoomCode.Should().Be(null);
            response.Package.Accom.Rooms[0]?.ExternalBoardCode.Should().Be(null);
        }

        [Fact]
        public async Task MapOffer_NonRefundableTrue_IsRefundableMustBeFalse()
        {
            var requestBookingMapper = CreateRequestBookingMapper(_fixture);

            Rm_Cd[] rooms =
            [
                new Rm_Cd
                {
                    Rm_No = "101",
                    Code = "STD",
                    BB_Cd = "BB",
                    Ext_Rm_Cd = roomCode,
                    Ext_BB_Cd = boardCode,
                    Ser_Sts = null,
                    SubServPaxs =
                    [
                        new SubServPax { Pax_Id = "1", Pax_Srv_Prc_Ex = new Prc_Type { Value = "100", } }
                    ],
                    Is_Non_Refundable = true
                }
            ];

            var atcomResBookingBaseResponse = CreateAtcomResponseWithRooms(rooms);
            var response = await requestBookingMapper.MapResponse(atcomResBookingBaseResponse, null, []);

            response.Package.Accom.Rooms.Count.Should().Be(1);
            response.Package.Accom.Rooms[0]?.IsRefundable.Should().BeFalse();
            response.IsRefundable.Should().BeFalse();
        }

        [Fact]
        public async Task MapOffer_NonRefundableFalse_IsRefundableMustBeTrue()
        {
            var requestBookingMapper = CreateRequestBookingMapper(_fixture);

            Rm_Cd[] rooms =
            [
                new Rm_Cd
                {
                    Rm_No = "101",
                    Code = "STD",
                    BB_Cd = "BB",
                    Ext_Rm_Cd = roomCode,
                    Ext_BB_Cd = boardCode,
                    Ser_Sts = null,
                    SubServPaxs = 
                    [
                        new SubServPax { Pax_Id = "1", Pax_Srv_Prc_Ex = new Prc_Type { Value = "100", } }
                    ],
                    Is_Non_Refundable = false
                }
            ];

            var atcomResBookingBaseResponse = CreateAtcomResponseWithRooms(rooms);
            var response = await requestBookingMapper.MapResponse(atcomResBookingBaseResponse, null, []);

            response.Package.Accom.Rooms.Count.Should().Be(1);
            response.Package.Accom.Rooms[0]?.IsRefundable.Should().BeTrue();
            response.IsRefundable.Should().BeTrue();
        }

        [Fact]
        public async Task MapOffer_MultipleRoomsIsNonRefundableIsTrue_IsRefundableMustBeFalse()
        {
            var requestBookingMapper = CreateRequestBookingMapper(_fixture);

            Rm_Cd[] rooms =
            [
                new Rm_Cd
                {
                    Rm_No = "101",
                    Code = "STD",
                    BB_Cd = "BB",
                    Ext_Rm_Cd = roomCode,
                    Ext_BB_Cd = boardCode,
                    Ser_Sts = null,
                    SubServPaxs =
                    [
                        new SubServPax { Pax_Id = "1", Pax_Srv_Prc_Ex = new Prc_Type { Value = "100", } }
                    ],
                    Is_Non_Refundable = true
                },
                new Rm_Cd
                {
                    Rm_No = "102",
                    Code = "STD",
                    BB_Cd = "BB",
                    Ext_Rm_Cd = roomCode,
                    Ext_BB_Cd = boardCode,
                    Ser_Sts = null,
                    SubServPaxs =
                    [
                        new SubServPax { Pax_Id = "1", Pax_Srv_Prc_Ex = new Prc_Type { Value = "100", } }
                    ],
                    Is_Non_Refundable = true
                }
            ];

            var atcomResBookingBaseResponse = CreateAtcomResponseWithRooms(rooms);
            var response = await requestBookingMapper.MapResponse(atcomResBookingBaseResponse, null, []);

            response.Package.Accom.Rooms.Count.Should().Be(2);
            response.Package.Accom.Rooms[0]?.IsRefundable.Should().BeFalse();
            response.Package.Accom.Rooms[0]?.IsRefundable.Should().BeFalse();
            response.IsRefundable.Should().BeFalse();
        }

        [Fact]
        public async Task MapOffer_MultipleRoomsOneIsNonRefundable_IsRefundableMustBeFalse()
        {
            var requestBookingMapper = CreateRequestBookingMapper(_fixture);

            Rm_Cd[] rooms =
            [
                new Rm_Cd
                {
                    Rm_No = "101",
                    Code = "STD",
                    BB_Cd = "BB",
                    Ext_Rm_Cd = roomCode,
                    Ext_BB_Cd = boardCode,
                    Ser_Sts = null,
                    SubServPaxs =
                    [
                        new SubServPax { Pax_Id = "1", Pax_Srv_Prc_Ex = new Prc_Type { Value = "100", } }
                    ],
                    Is_Non_Refundable = true
                },
                new Rm_Cd
                {
                    Rm_No = "102",
                    Code = "STD",
                    BB_Cd = "BB",
                    Ext_Rm_Cd = roomCode,
                    Ext_BB_Cd = boardCode,
                    Ser_Sts = null,
                    SubServPaxs =
                    [
                        new SubServPax { Pax_Id = "1", Pax_Srv_Prc_Ex = new Prc_Type { Value = "100", } }
                    ],
                    Is_Non_Refundable = false
                },
                new Rm_Cd
                {
                    Rm_No = "103",
                    Code = "STD",
                    BB_Cd = "BB",
                    Ext_Rm_Cd = roomCode,
                    Ext_BB_Cd = boardCode,
                    Ser_Sts = null,
                    SubServPaxs =
                    [
                        new SubServPax { Pax_Id = "1", Pax_Srv_Prc_Ex = new Prc_Type { Value = "100", } }
                    ],
                    Is_Non_Refundable = false
                },
            ];

            var atcomResBookingBaseResponse = CreateAtcomResponseWithRooms(rooms);
            var response = await requestBookingMapper.MapResponse(atcomResBookingBaseResponse, null, []);

            response.Package.Accom.Rooms.Count.Should().Be(3);
            response.Package.Accom.Rooms[0]?.IsRefundable.Should().BeFalse();
            response.Package.Accom.Rooms[1]?.IsRefundable.Should().BeTrue();
            response.Package.Accom.Rooms[2]?.IsRefundable.Should().BeTrue();
            response.IsRefundable.Should().BeFalse();
        }

        [Fact]
        public async Task MapOffer_MultipleRoomsOneIsNonRefundableNotSet_IsRefundableMustBeFalse()
        {
            var requestBookingMapper = CreateRequestBookingMapper(_fixture);

            Rm_Cd[] rooms =
            [
                new Rm_Cd
                {
                    Rm_No = "101",
                    Code = "STD",
                    BB_Cd = "BB",
                    Ext_Rm_Cd = roomCode,
                    Ext_BB_Cd = boardCode,
                    Ser_Sts = null,
                    SubServPaxs =
                    [
                        new SubServPax { Pax_Id = "1", Pax_Srv_Prc_Ex = new Prc_Type { Value = "100", } }
                    ],
                    Is_Non_Refundable = true
                },
                new Rm_Cd
                {
                    Rm_No = "102",
                    Code = "STD",
                    BB_Cd = "BB",
                    Ext_Rm_Cd = roomCode,
                    Ext_BB_Cd = boardCode,
                    Ser_Sts = null,
                    SubServPaxs =
                    [
                        new SubServPax { Pax_Id = "1", Pax_Srv_Prc_Ex = new Prc_Type { Value = "100", } }
                    ]
                },
                new Rm_Cd
                {
                    Rm_No = "103",
                    Code = "STD",
                    BB_Cd = "BB",
                    Ext_Rm_Cd = roomCode,
                    Ext_BB_Cd = boardCode,
                    Ser_Sts = null,
                    SubServPaxs =
                    [
                        new SubServPax { Pax_Id = "1", Pax_Srv_Prc_Ex = new Prc_Type { Value = "100", } }
                    ]
                },
            ];

            var atcomResBookingBaseResponse = CreateAtcomResponseWithRooms(rooms);
            var response = await requestBookingMapper.MapResponse(atcomResBookingBaseResponse, null, []);

            response.Package.Accom.Rooms.Count.Should().Be(3);
            response.Package.Accom.Rooms[0]?.IsRefundable.Should().BeFalse();
            response.Package.Accom.Rooms[1]?.IsRefundable.Should().BeTrue();
            response.Package.Accom.Rooms[2]?.IsRefundable.Should().BeTrue();
            response.IsRefundable.Should().BeFalse();
        }

        [Theory]
        [ClassData(typeof(BuildAtcomBookingBaseRequest_ValidDataData))]
        public void BuildAtcomBookingBaseRequest_ShouldIncludeRoomAndBoardExternalIdsWhenPresentInAccommodation(BookingAccommodation accommodation, Transport transport, List<PersonWithDetails> guests, string expectedRoomCode, string expectedBoardCode)
        {
            var requestBookingMapper = CreateRequestBookingMapper(_fixture);

            var request = requestBookingMapper.BuildAtcomBookingBaseRequest(accommodation, transport, guests, [], null, null, null, null);

            ((Models.Internal.Accom)request.Bkg_Ent.Package[0].Items[0]).Rm_Cd[0].Ext_Rm_Cd.Should().Be(expectedRoomCode);
            ((Models.Internal.Accom)request.Bkg_Ent.Package[0].Items[0]).Rm_Cd[0].Ext_BB_Cd.Should().Be(expectedBoardCode);
        }

        private static AtcomresBookingBaseResponse CreateAtcomResponse(string roomCode, string boardCode)
        {
            Rm_Cd[] rooms = new Rm_Cd[]
            {
                new Rm_Cd
                {
                    Rm_No = "101",
                    Code = "STD",
                    BB_Cd = "BB",
                    Ext_Rm_Cd = roomCode,
                    Ext_BB_Cd = boardCode,
                    Ser_Sts = null,
                    SubServPaxs = new[]
                    {
                        new SubServPax { Pax_Id = "1", Pax_Srv_Prc_Ex = new Prc_Type { Value = "100", } }
                    }
                }
            };
            
            return CreateAtcomResponseWithRooms(rooms);
        }

        private static AtcomresBookingBaseResponse CreateAtcomResponseWithRooms(Rm_Cd[] rooms)
        {
            var atcomResBookingBaseResponse = new AtcomresBookingBaseResponse
            {
                Pax =
                [
                    new Pax
                    {
                        Lead_Pax = true,
                        Age = "30",
                        Index = "1",
                        Canceled = false,
                    }
                ],
                BkgSts = BkgSts.BOOKING,
                CusDet =
                [
                    new CusDet
                    {
                        Person = new Models.Internal.Person
                        {}
                    }
                ],
                Bkg_Ent = new Bkg_Ent
                {
                    Package =
                    [
                        new Package
                        {
                            Items =
                            [
                                new Models.Internal.Accom
                                {
                                    Id = "A1",
                                    HtlPrd =  new HtlPrd
                                        {
                                            Name = "Hotel Product 1"
                                        }
                                    ,
                                    Rm_Cd = rooms
                                }
                            ]
                        }
                    ]
                },
                Agt_No = "WAGBP"
            };
            return atcomResBookingBaseResponse;
        }

        private static RequestBookingMapper CreateRequestBookingMapper(IFixture fixture)
        {
            var atcomSettings = Options.Create(new AtcomSettings
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
                                },
                                UserNames = new Dictionary<string, string> {
                                    {"CH", "EZYVRPS" },
                                    {"UK", "EZYVRP" }
                                }
                            }
                        }
                    }
                },
                PaymentCodes = new Dictionary<string, PaymentCodesSettings> { { "", new PaymentCodesSettings { Issued = new PaymentTypeSettings { Code = "12345" }, Redeemed = new PaymentTypeSettings { Code = "1234" } } } }
            });
            var languageSettings = Options.Create(new LanguageSettings
            {
                MarketLanguages = new Dictionary<string, IEnumerable<string>> {
                        { "CH", new []{"fr-CH", "de-CH"}},
                        { "UK", new []{"en"}}
                        }
            });
            var tradeAgent = new Mock<ITradeAgentAuthenticationService>();
            var apiSettings = Options.Create(new ApiSettings
            {
                DisabledOffersForNextDay = true,
                Vouchers = new VoucherSettings
                {
                    IsActive = false,
                    PromoVouchers = new VoucherReasonSettings { Types = new List<string> { "Promo" } },
                    Types = new VoucherTypeSettings { GiftCard = "gift" }
                }
            });
            var priceMapper = new PriceMapper(atcomSettings, apiSettings, tradeAgent.Object);
            var seatsMapper = new Mock<SeatsMapper>();
            var marketingService = new Mock<IMarketService>();
            var languageService = new Mock<ILanguageService>();
            var atcomRequestGenerator = new AtcomRequestGenerator(atcomSettings, tradeAgent.Object, marketingService.Object, languageService.Object);
            var referenceDataService = new Mock<IReferenceDataService>();
            var luggageServiceMock = new Mock<ILuggageService>();
            var flightExtraService = new Mock<IFlightExtraService>();
            var extraLuggageMapper = new ExtraLuggageMapper(referenceDataService.Object, luggageServiceMock.Object, flightExtraService.Object, fixture.Create<ILogger<ExtraLuggageMapper>>());
            var transliterationServiceMock = new Mock<ITransliterationService>();
            var guestsMapper = new GuestsMapper(transliterationServiceMock.Object);
            return new RequestBookingMapper(atcomSettings, priceMapper, seatsMapper.Object, atcomRequestGenerator, languageSettings, extraLuggageMapper, guestsMapper);
        }

        public class BuildAtcomBookingBaseRequest_ValidDataData : IEnumerable<object[]>
        {
            static readonly List<PersonWithDetails> guests = new List<PersonWithDetails>
                    {
                        new PersonWithDetails
                        {
                            Title = "Mr",
                            FirstName = "John",
                            LastName = "Doe",
                            DateOfBirth = new DateTimeOffset(1990, 5, 15, 0, 0, 0, TimeSpan.Zero),
                            IsLead = true,
                            Index = "1",
                            NotBornYet = false,
                            Type = PersonType.Adult // Assuming this property is inherited from Person
                        }
                    };
            static readonly Transport transport = new Transport
            {
                Routes = new List<Route>
                        {
                            new Route
                            {
                                Id = "R1",
                                CycDate = "2025-08-13",
                                DepPt = "LGW",
                                DepDate = new DateTimeOffset(2025, 8, 13, 8, 0, 0, TimeSpan.Zero),
                                DepName = "London Gatwick",
                                DepItemName = "Gatwick Airport",
                                DepLocation = "UK",
                                ArrPt = "PMI",
                                ArrDate = new DateTimeOffset(2025, 8, 13, 11, 0, 0, TimeSpan.Zero),
                                ArrName = "Palma de Mallorca",
                                ArrItemName = "Mallorca Airport",
                                ArrLocation = "Spain",
                                RouteCd = "LGWPMI",
                                RouteId = "LGWPMI20250813",
                                Avail = 10,
                                FltNo = "EJ1234",
                                Car = "EJ",
                                Direction = Direction.Outbound,
                                ExtRefId = "EXT123",
                                IsExternal = false,
                                Paxs = new List<RoutePax>
                                {
                                    new RoutePax { PaxId = "1", ExternalPNR = "PNR123", Seat = "12A" }
                                },
                                BookingClass = "Y",
                                Terminal = "S",
                                ArrTerminal = "A",
                                DepTerminal = "S",
                                Duration = "3h",
                                SectorId = "SEC1",
                                TotalPrice = 150.0m
                            },
                            new Route
                            {
                                Id = "R2",
                                CycDate = "2025-08-20",
                                DepPt = "PMI",
                                DepDate = new DateTimeOffset(2025, 8, 20, 12, 0, 0, TimeSpan.Zero),
                                DepName = "Palma de Mallorca",
                                DepItemName = "Mallorca Airport",
                                DepLocation = "Spain",
                                ArrPt = "LGW",
                                ArrDate = new DateTimeOffset(2025, 8, 20, 15, 0, 0, TimeSpan.Zero),
                                ArrName = "London Gatwick",
                                ArrItemName = "Gatwick Airport",
                                ArrLocation = "UK",
                                RouteCd = "PMILGW",
                                RouteId = "PMILGW20250820",
                                Avail = 10,
                                FltNo = "EJ5678",
                                Car = "EJ",
                                Direction = Direction.Inbound,
                                ExtRefId = "EXT456",
                                IsExternal = false,
                                Paxs = new List<RoutePax>
                                {
                                    new RoutePax { PaxId = "1", ExternalPNR = "PNR456", Seat = "14B" }
                                },
                                BookingClass = "Y",
                                Terminal = "A",
                                ArrTerminal = "S",
                                DepTerminal = "A",
                                Duration = "3h",
                                SectorId = "SEC2",
                                TotalPrice = 150.0m
                            }
                        }
            };

            public IEnumerator<object[]> GetEnumerator()
            {
                yield return new object[] {
                    new BookingAccommodation
                    {
                        Rooms = new List<Unit>
                        {
                            new Unit
                            {
                                Code = "STD",
                                Board = "BB",
                                ExternalRoomCode = roomCode,
                                ExternalBoardCode = boardCode
                            }
                        }
                    },
                    transport,
                    guests,
                    roomCode,
                    boardCode
                };
                yield return new object[] {
                    new BookingAccommodation
                    {
                        Rooms = new List<Unit>
                        {
                            new Unit
                            {
                                Code = "STD",
                                Board = "BB",
                            }
                        }
                    },
                    transport,
                    guests,
                    null,
                    null
                };
            }

            IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();

        }
    }

}