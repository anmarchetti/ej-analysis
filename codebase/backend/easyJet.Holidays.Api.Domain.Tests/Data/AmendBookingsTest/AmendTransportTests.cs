using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Utils.Comparers;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests
{
    public class AmendTransportTests
    {
        [Theory]
        [MemberData(nameof(AmendTransportListtestCases))]
        public void AmendTransportComparer_Compare_ReturnExpectedResult(AmendTransport amendTransport, Transport transport, bool expectedResult)
        {
            AmendTransportComparer.Equals(amendTransport, transport).Should().Be(expectedResult);
        }

        public static IEnumerable<object[]> AmendTransportListtestCases()
        {
            yield return new object[]
            {
                    new AmendTransport()
                    {
                        Routes = new List<Route>
                        {
                            new Route()
                            {
                                DepPt = "DepPt1",
                                DepDate = DateTimeOffset.Parse("2023-01-21T10:55:00+00:00"),
                                ArrPt = "arrPt1",
                                ArrDate = DateTimeOffset.Parse("2023-01-21T13:50:00+00:00"),
                                FltNo = "LGW"
                            }
                        }
                    },
                    new Transport()
                    {
                        Routes = new List<Route>
                        {
                            new Route()
                            {
                                DepPt = "DepPt1",
                                DepDate = DateTimeOffset.Parse("2023-01-21T10:55:00+00:00"),
                                ArrPt = "arrPt1",
                                ArrDate = DateTimeOffset.Parse("2023-01-21T13:50:00+00:00"),
                                FltNo = "LGW"
                            }
                        }
                    },
                true
            };
            yield return new object[]
            {
                    new AmendTransport()
                    {
                        Routes = new List<Route>
                        {
                            new Route()
                            {
                                DepPt = "DepPt2",
                                DepDate = DateTimeOffset.Parse("2023-01-21T10:55:00+00:00"),
                                ArrPt = "arrPt1",
                                ArrDate = DateTimeOffset.Parse("2023-01-21T13:50:00+00:00"),
                                FltNo = "LGW"
                            }
                        }
                    },
                    new Transport()
                    {
                        Routes = new List<Route>
                        {
                            new Route()
                            {
                                DepPt = "DepPt1",
                                DepDate = DateTimeOffset.Parse("2023-01-21T10:55:00+00:00"),
                                ArrPt = "arrPt1",
                                ArrDate = DateTimeOffset.Parse("2023-01-21T13:50:00+00:00"),
                                FltNo = "LGW"
                            }
                        }
                    },
                false
            };
            yield return new object[]
            {
                    new AmendTransport()
                    {
                        Routes = new List<Route>
                        {
                            new Route()
                            {
                                DepPt = "DepPt1",
                                DepDate = DateTimeOffset.Parse("2023-01-21T10:55:00+00:00"),
                                ArrPt = "arrPt1",
                                ArrDate = DateTimeOffset.Parse("2023-01-21T13:50:00+00:00"),
                                FltNo = "LGT"
                            }
                        }
                    },
                    new Transport()
                    {
                        Routes = new List<Route>
                        {
                            new Route()
                            {
                                DepPt = "DepPt1",
                                DepDate = DateTimeOffset.Parse("2023-01-21T10:55:00+00:00"),
                                ArrPt = "arrPt1",
                                ArrDate = DateTimeOffset.Parse("2023-01-21T13:50:00+00:00"),
                                FltNo = "LGW"
                            }
                        }
                    },
                false
            };
            yield return new object[]
            {
                    new AmendTransport()
                    {
                        Routes = new List<Route>
                        {
                            new Route()
                            {
                                DepPt = "DepPt1",
                                DepDate = DateTimeOffset.Parse("2023-01-21T10:55:00+00:00"),
                                ArrPt = "arrPt2",
                                ArrDate = DateTimeOffset.Parse("2023-01-21T13:50:00+00:00"),
                                FltNo = "LGW"
                            }
                        }
                    },
                    new Transport()
                    {
                        Routes = new List<Route>
                        {
                            new Route()
                            {
                                DepPt = "DepPt1",
                                DepDate = DateTimeOffset.Parse("2023-01-21T10:55:00+00:00"),
                                ArrPt = "arrPt1",
                                ArrDate = DateTimeOffset.Parse("2023-01-21T13:50:00+00:00"),
                                FltNo = "LGW"
                            }
                        }
                    },
                false
            };
            yield return new object[]
            {
                    new AmendTransport()
                    {
                        Routes = new List<Route>
                        {
                            new Route()
                            {
                                DepPt = "DepPt1",
                                DepDate = DateTimeOffset.Parse("2023-02-21T10:55:00+00:00"),
                                ArrPt = "arrPt1",
                                ArrDate = DateTimeOffset.Parse("2023-01-21T13:50:00+00:00"),
                                FltNo = "LGW"
                            }
                        }
                    },
                    new Transport()
                    {
                        Routes = new List<Route>
                        {
                            new Route()
                            {
                                DepPt = "DepPt1",
                                DepDate = DateTimeOffset.Parse("2023-01-21T10:55:00+00:00"),
                                ArrPt = "arrPt1",
                                ArrDate = DateTimeOffset.Parse("2023-01-21T13:50:00+00:00"),
                                FltNo = "LGW"
                            }
                        }
                    },
                false
            };
            yield return new object[]
            {
                    new AmendTransport()
                    {
                        Routes = new List<Route>
                        {
                            new Route()
                            {
                                DepPt = "DepPt1",
                                DepDate = DateTimeOffset.Parse("2023-01-21T10:55:00+00:00"),
                                ArrPt = "arrPt1",
                                ArrDate = DateTimeOffset.Parse("2023-02-21T13:50:00+00:00"),
                                FltNo = "LGW"
                            }
                        }
                    },
                    new Transport()
                    {
                        Routes = new List<Route>
                        {
                            new Route()
                            {
                                DepPt = "DepPt1",
                                DepDate = DateTimeOffset.Parse("2023-01-21T10:55:00+00:00"),
                                ArrPt = "arrPt1",
                                ArrDate = DateTimeOffset.Parse("2023-01-21T13:50:00+00:00"),
                                FltNo = "LGW"
                            }
                        }
                    },
                false
            };
            yield return new object[]
            {
                    null,
                    new Transport()
                    {
                        Routes = new List<Route>
                        {
                            new Route()
                            {
                                DepPt = "DepPt1",
                                DepDate = DateTimeOffset.Parse("2023-01-21T10:55:00+00:00"),
                                ArrPt = "arrPt1",
                                ArrDate = DateTimeOffset.Parse("2023-01-21T13:50:00+00:00"),
                                FltNo = "LGW"
                            }
                        }
                    },
                false
             };
            yield return new object[]
            {
                    new AmendTransport()
                    {
                        Routes = new List<Route>
                        {
                            new Route()
                            {
                                DepPt = "DepPt1",
                                DepDate = DateTimeOffset.Parse("2023-01-21T10:55:00+00:00"),
                                ArrPt = "arrPt1",
                                ArrDate = DateTimeOffset.Parse("2023-01-21T13:50:00+00:00"),
                                FltNo = "LGW"
                            }
                        }
                    },
                    null,
                false
             };
        }
    }
}