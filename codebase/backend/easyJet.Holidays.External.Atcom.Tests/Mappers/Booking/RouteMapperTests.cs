using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Models.Internal;
using FluentAssertions;
using Xunit;


namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Booking
{
    public class RouteMapperTests
    {
        private const string accomProm = "PROMO123";
        private const bool isOutbound = true;
        private readonly SubServPax[] subServPaxs = Array.Empty<SubServPax>();

        [Fact]
        public void BuildInfoModifyBookingRoute_ShouldSetDurationEqualToTheFlightWhenFlightIsExternal()
        {
            const string duration = "170";
            var flight = CreateFlight(true, duration);

            var actual = RouteMapper.BuildInfoModifyBookingRoute(flight, accomProm, subServPaxs, isOutbound);

            actual.Duration.Should().Be(duration);
        }

        [Fact]
        public void BuildInfoModifyBookingRoute_ShouldSetDurationToCeroWhenFlightIsNotExternal()
        {
            var flight = CreateFlight(false, "24");

            var actual = RouteMapper.BuildInfoModifyBookingRoute(flight, accomProm, subServPaxs, isOutbound);

            actual.Duration.Should().Be("0");
        }

        [Fact]
        public void BuildRoute_ShouldAlwaysMapDurationToFlightDuration()
        {
            const string duration = "24";
            var flight = CreateFlight(false, duration);

            var actual = RouteMapper.BuildRoute(flight, accomProm, subServPaxs, isOutbound);

            actual.Duration.Should().Be(duration);
        }
        private static Route CreateFlight(bool isExternal, string duration)
        {
            return new Route
            {
                IsExternal = isExternal,
                Duration = duration,
                BookingClass = "Y",
                RouteCd = "BJVLGW7T",
                DepPt = "BJV",
                ArrPt = "LGW",
                DepDate = new DateTimeOffset(2023, 7, 2, 10, 15, 0, 0, TimeSpan.Zero),
                ArrDate = new DateTimeOffset(2023, 7, 2, 13, 45, 0, 0, TimeSpan.FromHours(1)),
                CycDate = "2023-10-01",
                Car = "Car1",
            };
        }

    }
}



