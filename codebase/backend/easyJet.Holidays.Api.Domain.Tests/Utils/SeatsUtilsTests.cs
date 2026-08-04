using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Utils;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Utils
{
    public class SeatsUtilsTests
    {
        [Fact]
        public void HasSelectedSeats_ReturnsFalseForNull()
        {
            var result = SeatsUtils.HasSelectedSeats(null);
            result.Should().BeFalse();
        }

        [Fact]
        public void HasSelectedSeats_ReturnsFalseForEmpty()
        {
            var result = SeatsUtils.HasSelectedSeats(new List<SeatMap>());
            result.Should().BeFalse();
        }

        [Fact]
        public void HasSelectedSeats_ReturnsFalseForSeatMapsWithoutSeats()
        {
            var result = SeatsUtils.HasSelectedSeats(new List<SeatMap> { new SeatMap { Seats = new List<Seat>() } });
            result.Should().BeFalse();
        }

        [Fact]
        public void HasSelectedSeats_ReturnsTrue()
        {
            var result = SeatsUtils.HasSelectedSeats(new List<SeatMap> { new SeatMap { Seats = new List<Seat> { new Seat { PaxIndex = 1, SeatNumber = "1A" } } } });
            result.Should().BeTrue();
        }

        [Fact]
        public void GetSeatsPrices_ReturnsCorrectSums()
        {
            var seatSelection = new List<SeatMap>
            {
                new SeatMap
                {
                    SectorId = "1",
                    Seats = new List<Seat>
                    {
                        new Seat
                        {
                            SeatNumber = "1C",
                            PaxIndex = 1,
                            Price = 10
                        },
                        new Seat
                        {
                            SeatNumber = "23D",
                            PaxIndex = 2,
                            Price = 10
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
                            PaxIndex = 1,
                            Price = 30

                        },
                        new Seat
                        {
                            SeatNumber = "24B",
                            PaxIndex = 2,
                            Price = 40
                        }
                    }
                }
            };

            var guests = new List<PersonWithDetails>
            {
                new PersonWithDetails {Type = PersonType.Adult},
                new PersonWithDetails {Type = PersonType.Child},
                new PersonWithDetails {Type = PersonType.Infant}
            };

            var units = new List<Unit>
            {
                new Unit () { Occupation = new Occupation(){ Adults = 1}},
                new Unit () { Occupation = new Occupation(){ Children = 1}},
                new Unit () { Occupation = new Occupation(){ Infants = 1}}
            };

            var seatsPrice = SeatsUtils.GetSeatsPrice(seatSelection);
            var seatsPricePerPerson = SeatsUtils.GetSeatsPricePerPerson(seatSelection, guests);
            var unitSeatsPricePerPerson = SeatsUtils.GetSeatsPricePerPerson(seatSelection, units);

            seatsPrice.Should().Be(90);
            seatsPricePerPerson.Should().Be(45);
            unitSeatsPricePerPerson.Should().Be(45);
        }

        [Fact]
        public void GetSeatsPrices_ReturnsZeroForNulls()
        {
            var seatsPrice = SeatsUtils.GetSeatsPrice(null);
            var seatsPricePerPerson = SeatsUtils.GetSeatsPricePerPerson(null, (IList<PersonWithDetails>)null);
            var unitSeatsPricePerPerson = SeatsUtils.GetSeatsPricePerPerson(null, (IList<Unit>)null);

            seatsPrice.Should().Be(0);
            seatsPricePerPerson.Should().Be(0);
            unitSeatsPricePerPerson.Should().Be(0);
        }

        [Fact]
        public void GetSeatsPrices_ReturnsZeroForEmpty()
        {
            var seatsPrice = SeatsUtils.GetSeatsPrice(new List<SeatMap>());
            var seatsPricePerPerson = SeatsUtils.GetSeatsPricePerPerson(new List<SeatMap>(), new List<PersonWithDetails>());
            var unitSeatsPricePerPerson = SeatsUtils.GetSeatsPricePerPerson(new List<SeatMap>(), new List<Unit>());

            seatsPrice.Should().Be(0);
            seatsPricePerPerson.Should().Be(0);
            unitSeatsPricePerPerson.Should().Be(0);
        }

        [Fact]
        public void GetSeatsPrices_ReturnsZeroForEmptySeats()
        {
            var seatSelection = new List<SeatMap>
            {
                new SeatMap
                {
                    SectorId = "1",
                    Seats = new List<Seat>()
                },
                new SeatMap
                {
                    SectorId = "2",
                    Seats = new List<Seat>()
                }
            };

            var guests = new List<PersonWithDetails>
            {
                new PersonWithDetails {Type = PersonType.Adult},
                new PersonWithDetails {Type = PersonType.Child},
                new PersonWithDetails {Type = PersonType.Infant}
            };

            var units = new List<Unit>
            {
                new Unit () { Occupation = new Occupation(){ Adults = 1}},
                new Unit () { Occupation = new Occupation(){ Children = 1}},
                new Unit () { Occupation = new Occupation(){ Infants = 1}}
            };

            var seatsPrice = SeatsUtils.GetSeatsPrice(seatSelection);
            var seatsPricePerPerson = SeatsUtils.GetSeatsPricePerPerson(seatSelection, guests);
            var unitSeatsPricePerPerson = SeatsUtils.GetSeatsPricePerPerson(seatSelection, units);

            seatsPrice.Should().Be(0);
            seatsPricePerPerson.Should().Be(0);
            unitSeatsPricePerPerson.Should().Be(0);
        }
    }
}
