using easyJet.Holidays.Api.Domain.Data.Booking;
using FluentAssertions;
using Xunit;

using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Models.Internal;
using System.Globalization;
using Pax = easyJet.Holidays.External.Atcom.Models.Internal.Pax;
using Person = easyJet.Holidays.Api.Domain.Data.Guests.Person;
using Seat = easyJet.Holidays.External.Atcom.Models.Internal.Seat;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Booking;

public class SeatsMapperTests
{
    private SeatsMapper SeatMapper { get; } = new();

    #region Test Data

    #region GetSeatSelection

    private static readonly List<Benefit> Benefits = new()
    {
        new Benefit
        {
            Name = "One small cabin bag",
            Code = "B0001",
            Description = "Maximum size 45 x 36 x 20 cm.\r\nMust fit under the seat in front of you.",
            Icon = "B0001 icon",
            IsVisibleOnSeatMapPlan = true
        },
        new Benefit
        {
            Name = "One large cabin bag",
            Code = "B0002",
            Description = "Maximum size 56 x 45 x 25 cm.\r\nSubject to available space",
            Icon = "B0002 icon",
            IsVisibleOnSeatMapPlan = true
        },
        new Benefit
        {
            Name = "One large cabin bag",
            Code = "B0003",
            Description = "Maximum size 56 x 45 x 25 cm.",
            Icon = "B0003 icon",
            IsVisibleOnSeatMapPlan = true
        },
        new Benefit
        {
            Name = "Speedy Boarding",
            Code = "B0006",
            Description = "Be amongst the first to board, or board at your leisure.",
            IsVisibleOnSeatMapPlan = false
        },
        new Benefit
        {
            Name = "Dedicated Bag Drop",
            Code = "B0007",
            Description = "Priority Bag Drop desks in the check-in area.",
            IsVisibleOnSeatMapPlan = false
        }
    };

    private static readonly List<Route> Routes = new()
    {
        new Route
        {
            Id = "1",
            DepPt = "LGW",
            DepDate = new DateTimeOffset(2023, 7, 2, 10, 15, 0, 0, TimeSpan.Zero),
            ArrPt = "KRK",
            ArrDate = new DateTimeOffset(2023, 7, 2, 13, 45, 0, 0, TimeSpan.FromHours(1)),
            RouteId = "1",
            FltNo = "8821",
            Car = "EZY",
            ExtRefId = "K6579JT",
            IsExternal = true,
            Paxs = new List<RoutePax>
            {
                new()
                {
                    PaxId = "1",
                    Seat = "5A"
                }
            },
            BookingClass = "Z",
            IsSeatReservationPossible = true,
            SectorId = "1"
        },
        new Route
        {
            Id = "2",
            DepPt = "KRK",
            DepDate = new DateTimeOffset(2023, 7, 8, 14, 20, 0, 0, TimeSpan.FromHours(1)),
            ArrPt = "LGW",
            ArrDate = new DateTimeOffset(2023, 7, 8, 15, 55, 0, 0, TimeSpan.Zero),
            RouteId = "2",
            FltNo = "8822",
            Car = "EZY",
            Direction = Direction.Inbound,
            ExtRefId = "K6579JT",
            IsExternal = true,
            Paxs = new List<RoutePax>
            {
                new()
                {
                    PaxId = "1",
                    Seat = "5D"
                }
            },
            BookingClass = "Y",
            IsSeatReservationPossible = true,
            SectorId = "2"
        }
    };

    private static readonly Seat_Map[] SeatMap =
    {
        new()
        {
            SeatMapSec = new SeatMapSec { SecId = new[] {"1"} },
            Seat = new[]
            {
                new Seat
                {
                    Row = "5",
                    Col = "A",
                    PrcCat = "Standard",
                    Pax = new Pax { Index = "1" },
                    StPrc = new Prc { CurISO = "GBP", Amt = "37.99" },
                    SeatAttr = new[]
                    {
                        new SeatAttribute { Name = "B0001" },
                        new SeatAttribute { Name = "B0003" },
                        new SeatAttribute { Name = "B0006" },
                        new SeatAttribute { Name = "B0007" }
                    }
                }
            }
        },
        new()
        {
            SeatMapSec = new SeatMapSec { SecId = new[] {"2"} },
            Seat = new[]
            {
                new Seat
                {
                    Row = "5",
                    Col = "D",
                    PrcCat = "Standard",
                    Pax = new Pax { Index = "1" },
                    StPrc = new Prc { CurISO = "GBP", Amt = "44.99" },
                    SeatAttr = new[]
                    {
                        new SeatAttribute { Name = "B0001" },
                        new SeatAttribute { Name = "B0003" },
                        new SeatAttribute { Name = "B0006" },
                        new SeatAttribute { Name = "B0007" }
                    }
                }
            }
        }
    };

    public static IEnumerable<object[]> TestDataSet = new List<object[]>
    {
        new object[] { Routes, SeatMap, Benefits }
    };

    public static IEnumerable<object[]> EmptyDataSet = new List<object[]>
    {
        new object[] { null, null, null, null },
        new object[] { new List<Route>(), null, null, new List<SeatMap>() },
        new object[] { new List<Route>(), new Seat_Map[]{}, new List<Benefit>(), new List<SeatMap>() }
    };

    #endregion

    #region GetAtcomSeatMap

    private static readonly List<SeatMap> SeatSelection2Adults = new()
    {
        new()
        {
            FlightNumber = "11",
            SectorId = "1",
            Seats = new List<Holidays.Api.Domain.Data.Booking.Seat>
            {
                new()
                {
                    PaxIndex = 1,
                    Price = 10,
                    SeatNumber = "1A"
                },
                new()
                {
                    PaxIndex = 2,
                    Price = 10,
                    SeatNumber = "1B"
                }
            }
        },
        new()
        {
            FlightNumber = "22",
            SectorId = "2",
            Seats = new List<Holidays.Api.Domain.Data.Booking.Seat>
            {
                new()
                {
                    PaxIndex = 1,
                    Price = 10,
                    SeatNumber = "2A"
                },
                new()
                {
                    PaxIndex = 2,
                    Price = 10,
                    SeatNumber = "2B"
                }
            }
        }
    };

    private static readonly List<SeatMap> SeatSelection2Adults2Children = new()
    {
        new()
        {
            FlightNumber = "11",
            SectorId = "1",
            Seats = new List<Holidays.Api.Domain.Data.Booking.Seat>
            {
                new()
                {
                    PaxIndex = 1,
                    Price = 10,
                    SeatNumber = "1A"
                },
                new()
                {
                    PaxIndex = 2,
                    Price = 10,
                    SeatNumber = "1B"
                },
                new()
                {
                    PaxIndex = 3,
                    Price = 10,
                    SeatNumber = "1C"
                },
                new()
                {
                    PaxIndex = 4,
                    Price = 10,
                    SeatNumber = "1D"
                }
            }
        },
        new()
        {
            FlightNumber = "22",
            SectorId = "2",
            Seats = new List<Holidays.Api.Domain.Data.Booking.Seat>
            {
                new()
                {
                    PaxIndex = 1,
                    Price = 10,
                    SeatNumber = "2A"
                },
                new()
                {
                    PaxIndex = 2,
                    Price = 10,
                    SeatNumber = "2B"
                },
                new()
                {
                    PaxIndex = 3,
                    Price = 10,
                    SeatNumber = "2C"
                },
                new()
                {
                    PaxIndex = 4,
                    Price = 10,
                    SeatNumber = "2D"
                }
            }
        }
    };

    private static readonly List<SeatMap> SeatSelection2Adults1Infant = new()
    {
        new()
        {
            FlightNumber = "11",
            SectorId = "1",
            Seats = new List<Holidays.Api.Domain.Data.Booking.Seat>
            {
                new()
                {
                    PaxIndex = 1,
                    Price = 10,
                    SeatNumber = "1A"
                },
                new()
                {
                    PaxIndex = 2,
                    Price = 10,
                    SeatNumber = "1B"
                },
                new()
                {
                    PaxIndex = 3,
                    Price = 10,
                    SeatNumber = "1A"
                }
            }
        },
        new()
        {
            FlightNumber = "22",
            SectorId = "2",
            Seats = new List<Holidays.Api.Domain.Data.Booking.Seat>
            {
                new()
                {
                    PaxIndex = 1,
                    Price = 10,
                    SeatNumber = "2A"
                },
                new()
                {
                    PaxIndex = 2,
                    Price = 10,
                    SeatNumber = "2B"
                },
                new()
                {
                    PaxIndex = 3,
                    Price = 10,
                    SeatNumber = "2A"
                }
            }
        }
    };

    private static readonly List<SeatMap> SeatSelection2Adults2Infants = new()
    {
        new()
        {
            FlightNumber = "11",
            SectorId = "1",
            Seats = new List<Holidays.Api.Domain.Data.Booking.Seat>
            {
                new()
                {
                    PaxIndex = 1,
                    Price = 10,
                    SeatNumber = "1A"
                },
                new()
                {
                    PaxIndex = 2,
                    Price = 10,
                    SeatNumber = "1B"
                },
                new()
                {
                    PaxIndex = 3,
                    Price = 10,
                    SeatNumber = "1A"
                },
                new()
                {
                    PaxIndex = 4,
                    Price = 10,
                    SeatNumber = "1B"
                }
            }
        },
        new()
        {
            FlightNumber = "22",
            SectorId = "2",
            Seats = new List<Holidays.Api.Domain.Data.Booking.Seat>
            {
                new()
                {
                    PaxIndex = 1,
                    Price = 10,
                    SeatNumber = "2A"
                },
                new()
                {
                    PaxIndex = 2,
                    Price = 10,
                    SeatNumber = "2B"
                },
                new()
                {
                    PaxIndex = 3,
                    Price = 10,
                    SeatNumber = "2A"
                },
                new()
                {
                    PaxIndex = 4,
                    Price = 10,
                    SeatNumber = "2B"
                }
            }
        }
    };

    private static readonly List<Person> Guests2Adults = new()
    {
        new()
        {
            Type = PersonType.Adult
        },
        new()
        {
            Type = PersonType.Adult
        }
    };

    private static readonly List<Person> Guests2Adults1Infant = new()
    {
        new()
        {
            Type = PersonType.Adult
        },
        new()
        {
            Type = PersonType.Infant
        },
        new()
        {
            Type = PersonType.Adult
        }
    };

    private static readonly List<Person> Guests2Adults2Infants = new()
    {
        new()
        {
            Type = PersonType.Adult
        },
        new()
        {
            Type = PersonType.Infant
        },
        new()
        {
            Type = PersonType.Adult
        },
        new()
        {
            Type = PersonType.Infant
        }
    };

    private static readonly List<Person> Guests2Adults2Children2Infants = new()
    {
        new()
        {
            Type = PersonType.Adult
        },
        new()
        {
            Type = PersonType.Child
        },
        new()
        {
            Type = PersonType.Adult
        },
        new()
        {
            Type = PersonType.Infant
        },
        new()
        {
            Type = PersonType.Infant
        },
        new()
        {
            Type = PersonType.Child
        }
    };

    private static readonly Seat_Map[] Expected2Adults1Infant =
{
        new()
        {
            SeatMapSec = new SeatMapSec { SecId = new[] {"1"} },
            Seat = new[]
            {
                new Seat
                {
                    Row = "1",
                    Col = "A",
                    Pax = new Pax { Index = "1", Pax_Tp = Pax_Tp.ADULT },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                },
                new Seat
                {
                    Row = "1",
                    Col = "B",
                    Pax = new Pax { Index = "2", Pax_Tp = Pax_Tp.ADULT },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                },
                new Seat
                {
                    Row = "1",
                    Col = "A",
                    Pax = new Pax { Index = "3", Pax_Tp = Pax_Tp.INFANT }
                }
            }
        },
        new()
        {
            SeatMapSec = new SeatMapSec { SecId = new[] {"2"} },
            Seat = new[]
            {
                new Seat
                {
                    Row = "2",
                    Col = "A",
                    Pax = new Pax { Index = "1", Pax_Tp = Pax_Tp.ADULT },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                },
                new Seat
                {
                    Row = "2",
                    Col = "B",
                    Pax = new Pax { Index = "2", Pax_Tp = Pax_Tp.ADULT },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                },
                new Seat
                {
                    Row = "2",
                    Col = "A",
                    Pax = new Pax { Index = "3", Pax_Tp = Pax_Tp.INFANT }
                }
            }
        }
    };

    private static readonly Seat_Map[] Expected2Adults2Infants =
    {
        new()
        {
            SeatMapSec = new SeatMapSec { SecId = new[] {"1"} },
            Seat = new[]
            {
                new Seat
                {
                    Row = "1",
                    Col = "A",
                    Pax = new Pax { Index = "1", Pax_Tp = Pax_Tp.ADULT },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                },
                new Seat
                {
                    Row = "1",
                    Col = "B",
                    Pax = new Pax { Index = "2", Pax_Tp = Pax_Tp.ADULT },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                },
                new Seat
                {
                    Row = "1",
                    Col = "A",
                    Pax = new Pax { Index = "3", Pax_Tp = Pax_Tp.INFANT }
                },
                new Seat
                {
                    Row = "1",
                    Col = "B",
                    Pax = new Pax { Index = "4", Pax_Tp = Pax_Tp.INFANT }
                }
            }
        },
        new()
        {
            SeatMapSec = new SeatMapSec { SecId = new[] {"2"} },
            Seat = new[]
            {
                new Seat
                {
                    Row = "2",
                    Col = "A",
                    Pax = new Pax { Index = "1", Pax_Tp = Pax_Tp.ADULT },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                },
                new Seat
                {
                    Row = "2",
                    Col = "B",
                    Pax = new Pax { Index = "2", Pax_Tp = Pax_Tp.ADULT },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                },
                new Seat
                {
                    Row = "2",
                    Col = "A",
                    Pax = new Pax { Index = "3", Pax_Tp = Pax_Tp.INFANT }
                },
                new Seat
                {
                    Row = "2",
                    Col = "B",
                    Pax = new Pax { Index = "4", Pax_Tp = Pax_Tp.INFANT }
                }
            }
        }
    };

    private static readonly Seat_Map[] Expected2Adults0Infants =
    {
        new()
        {
            SeatMapSec = new SeatMapSec { SecId = new[] {"1"} },
            Seat = new[]
            {
                new Seat
                {
                    Row = "1",
                    Col = "A",
                    Pax = new Pax { Index = "1", Pax_Tp = Pax_Tp.ADULT },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                },
                new Seat
                {
                    Row = "1",
                    Col = "B",
                    Pax = new Pax { Index = "2", Pax_Tp = Pax_Tp.ADULT },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                }
            }
        },
        new()
        {
            SeatMapSec = new SeatMapSec { SecId = new[] {"2"} },
            Seat = new[]
            {
                new Seat
                {
                    Row = "2",
                    Col = "A",
                    Pax = new Pax { Index = "1", Pax_Tp = Pax_Tp.ADULT },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                },
                new Seat
                {
                    Row = "2",
                    Col = "B",
                    Pax = new Pax { Index = "2", Pax_Tp = Pax_Tp.ADULT },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                }
            }
        }
    };

    private static readonly Seat_Map[] Expected2Adults2Children2Infants =
    {
        new()
        {
            SeatMapSec = new SeatMapSec { SecId = new[] {"1"} },
            Seat = new[]
            {
                new Seat
                {
                    Row = "1",
                    Col = "A",
                    Pax = new Pax { Index = "1", Pax_Tp = Pax_Tp.ADULT },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                },
                new Seat
                {
                    Row = "1",
                    Col = "B",
                    Pax = new Pax { Index = "2", Pax_Tp = Pax_Tp.ADULT },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                },
                new Seat
                {
                    Row = "1",
                    Col = "C",
                    Pax = new Pax { Index = "3", Pax_Tp = Pax_Tp.CHILD },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                },
                new Seat
                {
                    Row = "1",
                    Col = "D",
                    Pax = new Pax { Index = "4", Pax_Tp = Pax_Tp.CHILD },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                },
                new Seat
                {
                    Row = "1",
                    Col = "A",
                    Pax = new Pax { Index = "5", Pax_Tp = Pax_Tp.INFANT }
                },
                new Seat
                {
                    Row = "1",
                    Col = "B",
                    Pax = new Pax { Index = "6", Pax_Tp = Pax_Tp.INFANT }
                }
            }
        },
        new()
        {
            SeatMapSec = new SeatMapSec { SecId = new[] {"2"} },
            Seat = new[]
            {
                new Seat
                {
                    Row = "2",
                    Col = "A",
                    Pax = new Pax { Index = "1", Pax_Tp = Pax_Tp.ADULT },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                },
                new Seat
                {
                    Row = "2",
                    Col = "B",
                    Pax = new Pax { Index = "2", Pax_Tp = Pax_Tp.ADULT },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                },
                new Seat
                {
                    Row = "2",
                    Col = "C",
                    Pax = new Pax { Index = "3", Pax_Tp = Pax_Tp.CHILD },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                },
                new Seat
                {
                    Row = "2",
                    Col = "D",
                    Pax = new Pax { Index = "4", Pax_Tp = Pax_Tp.CHILD },
                    StPrc = new Prc { CurISO = "GBP", Amt = "10" }
                },
                new Seat
                {
                    Row = "2",
                    Col = "A",
                    Pax = new Pax { Index = "5", Pax_Tp = Pax_Tp.INFANT }
                },
                new Seat
                {
                    Row = "2",
                    Col = "B",
                    Pax = new Pax { Index = "6", Pax_Tp = Pax_Tp.INFANT }
                }
            }
        }
    };

    public static IEnumerable<object[]> TestDataGetAtcomSeatMap = new List<object[]>
    {
        new object[] { null, null, null },
        new object[] { new List<SeatMap>(), new List<Person>(), Array.Empty<Seat_Map>() },
        new object[] { new List<SeatMap> { new() { Seats = new List<Holidays.Api.Domain.Data.Booking.Seat>() }}, new List<Person>(), Array.Empty<Seat_Map>() },
        new object[] { SeatSelection2Adults, Guests2Adults1Infant, Expected2Adults1Infant },
        new object[] { SeatSelection2Adults, Guests2Adults2Infants, Expected2Adults2Infants },
        new object[] { SeatSelection2Adults, Guests2Adults, Expected2Adults0Infants },
        new object[] { SeatSelection2Adults2Children, Guests2Adults2Children2Infants, Expected2Adults2Children2Infants },
        new object[] { SeatSelection2Adults1Infant, Guests2Adults2Infants, Expected2Adults2Infants },
        new object[] { SeatSelection2Adults2Infants, Guests2Adults2Infants, Expected2Adults2Infants }
    };

    #endregion

    #endregion

    [Theory]
    [MemberData(nameof(EmptyDataSet))]
    public void GetSeatSelection_ReturnsExpectedResultForEmptyInput(List<Route> routes, Seat_Map[] seatMap, List<Benefit> benefits, List<SeatMap> expectedResult)
    {
        var result = SeatMapper.GetSeatSelection(routes, seatMap, benefits);
        result.Should().BeEquivalentTo(expectedResult);
    }

    [Theory]
    [MemberData(nameof(TestDataSet))]
    public void GetSeatSelection_ReturnsExpectedResult(List<Route> routes, Seat_Map[] seatMap, List<Benefit> benefits)
    {
        var result = SeatMapper.GetSeatSelection(routes, seatMap, benefits);

        result.Count.Should().Be(routes.Count(r => !string.IsNullOrWhiteSpace(r.SectorId)));
        foreach (var sm in result)
        {
            var route = routes.Single(r => r.SectorId == sm.SectorId);
            var atcomSeats = seatMap.Single(sm => sm.SeatMapSec.SecId.First() == route.SectorId).Seat;

            sm.FlightNumber.Should().Be(route.FlightNumberWithoutCar);
            sm.IsSeatReservationPossible.Should().Be(route.IsSeatReservationPossible);
            sm.Seats.Count.Should().Be(
                route.Paxs.Count(p => !string.IsNullOrWhiteSpace(p.Seat) && !string.IsNullOrWhiteSpace(p.PaxId)));

            foreach (var seat in sm.Seats)
            {
                var atcomSeat = atcomSeats.Single(s => s.Pax.Index == seat.PaxIndex.ToString());

                seat.SeatNumber.Should().Be(atcomSeat.Row + atcomSeat.Col);
                seat.SeatNumber.Should().Be(route.Paxs.First(p => p.PaxId == seat.PaxIndex.ToString()).Seat);
                seat.Price.Should().Be(decimal.Parse(atcomSeat.StPrc.Amt, CultureInfo.InvariantCulture));
                seat.PriceBand.Should().Be(atcomSeat.PrcCat);

                var expectedProducts = benefits
                    .Where(b => b.IsVisibleOnSeatMapPlan)
                    .IntersectBy(atcomSeat.SeatAttr.Select(a => a.Name), b => b.Code)
                    .Select(b => new Product
                    {
                        Id = b.Code,
                        Name = b.Name,
                        Description = b.Description,
                        Icon = b.Icon
                    })
                    .ToList();

                seat.Products.Should().BeEquivalentTo(expectedProducts);
            }
        }
    }

    [Theory]
    [MemberData(nameof(TestDataGetAtcomSeatMap))]
    public void GetAtcomSeatMap_CorrectResult(
        List<SeatMap> seatSelection,
        List<Person> guests,
        Seat_Map[] expected)
    {
        var result = SeatsMapper.GetAtcomSeatMap(seatSelection, guests, includePrices: true);
        result.Should().BeEquivalentTo(expected);
    }
}