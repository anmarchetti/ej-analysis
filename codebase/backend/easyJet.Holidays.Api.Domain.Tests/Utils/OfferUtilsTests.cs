using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Utils;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Utils
{
    public class OfferUtilsTests
    {
        [Theory]
        [MemberData(nameof(OfferCodeTestData))]
        public void Build_OfferCode(Offer offer, string expected)
        {
            // Act
            var actual = OfferUtils.BuildOfferCode(offer);

            // Assert
            actual.Should().Be(expected);
        }

        [Theory]
        [MemberData(nameof(BuildAccomodationRequestCode_Request_TestData))]
        public void BuildAccomodationRequestCode_Request(AccommodationOfferRequest request, bool withoutDate, string expected)
        {
            // Act
            var actual = OfferUtils.BuildAccomodationRequestCode(request, withoutDate);

            // Assert
            actual.Should().Be(expected);
        }

        [Theory]
        [MemberData(nameof(BuildOfferRequestCode_Offer_TestData))]
        public void BuildOfferRequestCode_Offer(Offer offer, string expected)
        {
            // Act
            var actual = OfferUtils.BuildOfferRequestCode(offer);

            // Assert
            actual.Should().Be(expected);
        }

        [Theory]
        [MemberData(nameof(CompareAccomadationRequestAndOfferInfo_TestData))]
        public void CompareAccomadationRequestAndOfferInfo(AccommodationOfferRequest request, Offer offer, bool expected)
        {
            // Act
            var actual = OfferUtils.CompareAccomadationRequestAndOfferInfo(request, offer);

            // Assert
            actual.Should().Be(expected);
        }

        [Theory]
        [MemberData(nameof(CompareAccomadationRequests_TestData))]
        public void CompareAccomadationRequests(AccommodationOfferRequest first, AccommodationOfferRequest second, bool checkExpired, bool expected)
        {
            // Act
            var actual = OfferUtils.CompareAccomadationRequests(first, second, checkExpired);

            // Assert
            actual.Should().Be(expected);
        }

        public static readonly List<object[]> CompareAccomadationRequests_TestData = new List<object[]> {
            new object[] {
                new AccommodationOfferRequest(){
                    AccommodationId = "Aid",
                    PackageId = "Pid",
                    OutboundRouteId = "Oid",
                    InboundRouteId = "Iid",
                    Transfer = "T",
                    Duration = new List<int>(){7},
                    BoardType = "BB",
                    StartDate = "2020-07-07",
                    Room = new List<RoomAllocation>()
                    {
                        new RoomAllocation()
                        {
                            Adults = 2,
                            Children = 1,
                            Infants = 0,
                            RoomCode = "test"
                        }
                    }
                },
                new AccommodationOfferRequest(){
                    AccommodationId = "Aid",
                    PackageId = "Pid",
                    OutboundRouteId = "Oid",
                    InboundRouteId = "Iid",
                    Transfer = "T",
                    Duration = new List<int>(){7},
                    BoardType = "BB",
                    StartDate = "2020-07-07",
                    Room = new List<RoomAllocation>()
                    {
                        new RoomAllocation()
                        {
                            Adults = 2,
                            Children = 1,
                            Infants = 0,
                            RoomCode = "test"
                        }
                    }
                }, false, true},
            new object[] {
                new AccommodationOfferRequest(){
                    AccommodationId = "Aid",
                    PackageId = "Pid",
                    OutboundRouteId = "Oid",
                    InboundRouteId = "Iid",
                    Transfer = "T",
                    Duration = new List<int>(){7},
                    BoardType = "BB",
                    StartDate = "2019-09-07",
                    Room = new List<RoomAllocation>()
                    {
                        new RoomAllocation()
                        {
                            Adults = 2,
                            Children = 1,
                            Infants = 0,
                            RoomCode = "test"
                        }
                    }
                },
                new AccommodationOfferRequest(){
                    AccommodationId = "Aid",
                    PackageId = "Pid",
                    OutboundRouteId = "Oid",
                    InboundRouteId = "Iid",
                    Transfer = "T",
                    Duration = new List<int>(){7},
                    BoardType = "BB",
                    StartDate = "2020-01-07",
                    Room = new List<RoomAllocation>()
                    {
                        new RoomAllocation()
                        {
                            Adults = 2,
                            Children = 1,
                            Infants = 0,
                            RoomCode = "test"
                        }
                    }
                }, true, true},
            new object[] {
                new AccommodationOfferRequest(){
                    AccommodationId = "Aid",
                    PackageId = "Pid",
                    OutboundRouteId = "Oid",
                    InboundRouteId = "Iid",
                    Transfer = "T",
                    Duration = new List<int>(){7},
                    BoardType = "BB",
                    StartDate = "3020-09-07",
                    Room = new List<RoomAllocation>()
                    {
                        new RoomAllocation()
                        {
                            Adults = 2,
                            Children = 1,
                            Infants = 0,
                            RoomCode = "test"
                        }
                    }
                },
                new AccommodationOfferRequest(){
                    AccommodationId = "Aid",
                    PackageId = "Pid",
                    OutboundRouteId = "Oid",
                    InboundRouteId = "Iid",
                    Transfer = "T",
                    Duration = new List<int>(){7},
                    BoardType = "BB",
                    StartDate = "2020-01-07",
                    Room = new List<RoomAllocation>()
                    {
                        new RoomAllocation()
                        {
                            Adults = 2,
                            Children = 1,
                            Infants = 0,
                            RoomCode = "test"
                        }
                    }
                }, true, false},
            new object[] {
                new AccommodationOfferRequest(){
                    AccommodationId = "AnitherID",
                    PackageId = "Pid",
                    OutboundRouteId = "Oid",
                    InboundRouteId = "Iid",
                    Transfer = "T",
                    Duration = new List<int>(){7},
                    BoardType = "BB",
                    StartDate = "2020-07-07",
                    Room = new List<RoomAllocation>()
                    {
                        new RoomAllocation()
                        {
                            Adults = 2,
                            Children = 1,
                            Infants = 0,
                            RoomCode = "test"
                        }
                    }
                },
                new AccommodationOfferRequest(){
                    AccommodationId = "Aid",
                    PackageId = "Pid",
                    OutboundRouteId = "Oid",
                    InboundRouteId = "Iid",
                    Transfer = "T",
                    Duration = new List<int>(){7},
                    BoardType = "BB",
                    StartDate = "2020-07-07",
                    Room = new List<RoomAllocation>()
                    {
                        new RoomAllocation()
                        {
                            Adults = 2,
                            Children = 1,
                            Infants = 0,
                            RoomCode = "test"
                        }
                    }
                }, false, false},
        };

        public static readonly List<object[]> CompareAccomadationRequestAndOfferInfo_TestData = new List<object[]> {
            new object[] {
                new AccommodationOfferRequest(){
                    AccommodationId = "Aid",
                    PackageId = "Pid",
                    OutboundRouteId = "Oid",
                    InboundRouteId = "Iid",
                    Transfer = "T",
                    Duration = new List<int>(){7},
                    BoardType = "BB",
                    StartDate = "2020-07-07",
                    Room = new List<RoomAllocation>()
                    {
                        new RoomAllocation()
                        {
                            Adults = 2,
                            Children = 1,
                            Infants = 0,
                            RoomCode = "test"
                        }
                    }
                },
                new Offer(){
                    Accom = new Accom()
                    {
                        Code = "Aid",
                        PackageId = "Pid",
                        Unit = new List<Unit>()
                        {
                            new Unit()
                            {
                                Board = "BB",
                                Code = "test",
                                Occupation = new Occupation()
                                {
                                    Adults = 2,
                                    Infants = 0,
                                    Children = 1
                                }
                            }
                        }
                    },
                    Transfers = new List<TransferItem>()
                    {
                        new TransferItem()
                        {
                            Code = "T"
                        }
                    },
                    Transport = new Transport()
                    {
                        Routes = new List<Route>()
                        {
                            new Route()
                            {
                                Direction = Direction.Outbound,
                                Id = "Oid"
                            },
                            new Route()
                            {
                                Direction = Direction.Inbound,
                                Id = "Iid"
                            }
                        }
                    },
                    Date = new DateTime(2020, 7,7),
                    Stay = 7,
                }, true},
            new object[] {
                new AccommodationOfferRequest(){
                    AccommodationId = "AnotherID",
                    PackageId = "Pid",
                    OutboundRouteId = "Oid",
                    InboundRouteId = "Iid",
                    Transfer = "T",
                    Duration = new List<int>(){7},
                    BoardType = "BB",
                    StartDate = "2020-07-07",
                    Room = new List<RoomAllocation>()
                    {
                        new RoomAllocation()
                        {
                            Adults = 2,
                            Children = 1,
                            Infants = 0,
                            RoomCode = "test"
                        }
                    }
                },
                new Offer(){
                    Accom = new Accom()
                    {
                        Code = "Aid",
                        PackageId = "Pid",
                        Unit = new List<Unit>()
                        {
                            new Unit()
                            {
                                Board = "BB",
                                Code = "test",
                                Occupation = new Occupation()
                                {
                                    Adults = 2,
                                    Infants = 0,
                                    Children = 1
                                }
                            }
                        }
                    },
                    Transfers = new List<TransferItem>()
                    {
                        new TransferItem()
                        {
                            Code = "T"
                        }
                    },
                    Transport = new Transport()
                    {
                        Routes = new List<Route>()
                        {
                            new Route()
                            {
                                Direction = Direction.Outbound,
                                Id = "Oid"
                            },
                            new Route()
                            {
                                Direction = Direction.Inbound,
                                Id = "Iid"
                            }
                        }
                    },
                    Date = new DateTime(2020, 7,7),
                    Stay = 7,
                }, false},
        };

        public static readonly List<object[]> BuildOfferRequestCode_Offer_TestData = new List<object[]> {
            new object[] { null, ""},
            new object[] { new Offer(){
                Accom = new Accom()
                {
                    Code = "Aid",
                    PackageId = "Pid",
                    Unit = new List<Unit>()
                    {
                        new Unit()
                        {
                            Board = "BB",
                            Code = "test",
                            Occupation = new Occupation()
                            {
                                Adults = 2,
                                Infants = 0,
                                Children = 1
                            }
                        }
                    }
                },
                Transfers = new List<TransferItem>()
                {
                    new TransferItem()
                    {
                        Code = "T"
                    }
                },
                Transport = new Transport()
                {
                    Routes = new List<Route>()
                    {
                        new Route()
                        {
                            Direction = Direction.Outbound,
                            Id = "Oid"
                        },
                        new Route()
                        {
                            Direction = Direction.Inbound,
                            Id = "Iid"
                        }
                    }
                },
                Date = new DateTime(2020, 7,7),
                Stay = 7,
            }, "Aid_Pid_Oid_Iid_T_7_BB_2020-07-07_2-1-0-test"},
        };

        public static readonly List<object[]> BuildAccomodationRequestCode_Request_TestData = new List<object[]> {
            new object[] { null, false, ""},
            new object[] { new AccommodationOfferRequest(){
                AccommodationId = "Aid",
                PackageId = "Pid",
                OutboundRouteId = "Oid",
                InboundRouteId = "Iid",
                Transfer = "T",
                Duration = new List<int>(){7},
                BoardType = "BB",
                StartDate = "2020-07-07",
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation()
                    {
                        Adults = 2,
                        Children = 1,
                        Infants = 0,
                        RoomCode = "test"
                    }
                }
            }, false, "Aid_Pid_Oid_Iid_T_7_BB_2020-07-07_2-1-0-test"},
            new object[] { new AccommodationOfferRequest(){
                AccommodationId = "Aid",
                PackageId = "Pid",
                OutboundRouteId = "Oid",
                InboundRouteId = "Iid",
                Transfer = "T",
                Duration = new List<int>(){7},
                BoardType = "BB",
                StartDate = "2020-07-07",
                Room = new List<RoomAllocation>()
                {
                    new RoomAllocation()
                    {
                        Adults = 2,
                        Children = 1,
                        Infants = 0,
                        RoomCode = "test"
                    }
                }
            }, true, "Aid_Pid_Oid_Iid_T_7_BB_2-1-0-test"},

        };

        public static readonly List<object[]> OfferCodeTestData = new List<object[]> {
            new object[] { null, ""},
            new object[] { new Offer() {
                Accom = new Accom()
                {
                    Code = "Code",
                    PackageId = "Package",
                    Unit = new List<Unit>()
                    {
                        new Unit()
                        {
                            Code = "1DA",
                            Board = "BB"
                        }
                    }
                }
            }, "Code_Package_1DA-BB"}
        };
    }
}
