using easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings;
using easyJet.Holidays.Api.Domain.Data.Seats;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking
{
    public class FlightSeatPlanCacheServiceTests
    {
        private readonly FlightSeatPlanCacheService _flightSeatPlanCacheService;
        private readonly Mock<IAWSDbRepository<FlightSeatPlan>> _flightSeatPlanRepoMock = new();

        #region Test Data

        private const string PriceBand1 = "Extra legroom";
        private const string PriceBand2 = "Standard";
        private const string FlightId = "FlightId";

        private static readonly List<Product> Products1 = new()
        {
            new Product
            {
                Id = "B0001",
                Name = "Large under seat bag"
            },
            new Product
            {
                Id = "B0002",
                Name = "Extra legroom"
            }
        };

        private static readonly List<Product> Products2 = new()
        {
            new Product
            {
                Id = "B0003",
                Name = "Small under seat bag"
            }
        };

        private static readonly SeatMapSeat Seat1A = new()
        {
            Number = "1A",
            Price = 20,
            PriceBand = PriceBand1,
            Products = Products1
        };

        private static readonly SeatMapSeat Seat1B = new()
        {
            Number = "1B",
            Price = 20,
            PriceBand = PriceBand1,
            Products = Products1
        };

        private static readonly SeatMapSeat Seat2B = new()
        {
            Number = "2B",
            Price = 5,
            PriceBand = PriceBand2,
            Products = Products2
        };

        private static readonly GetSeatsMapResponse GetSeatsMapResponse = new()
        {
            Rows = new List<SeatMapRow>
            {
                new()
                {
                    Blocks = new List<SeatMapRowBlock>
                    {
                        new()
                        {
                            Seats = new List<SeatMapSeat> { Seat1A, Seat1B }
                        }
                    }
                },
                new()
                {
                    Blocks = new List<SeatMapRowBlock>
                    {
                        new()
                        {
                            Seats = new List<SeatMapSeat> { Seat2B }
                        }
                    }
                }
            }
        };

        #endregion

        public FlightSeatPlanCacheServiceTests()
        {
            var awsSettings = Options.Create(new AwsSettings
            {
                TTL = new AwsSettingsTTL { FlightSeatPlan = 24 }
            });

            _flightSeatPlanCacheService = new FlightSeatPlanCacheService(
                _flightSeatPlanRepoMock.Object,
                new Mock<ILogger<BookingSessionService>>().Object,
                awsSettings
            );
        }

        [Fact]
        public void GetFlightId_ReturnsCorrectValue()
        {
            var flightNumber = "EZY1234";
            var departureAirportCode = "LGW";
            var arrivalAirportCode = "BCN";
            var departureDate = new DateTime(2023, 2, 1);
            var promo = "";

            var result = FlightSeatPlanCacheService.GetFlightId(
                flightNumber,
                departureAirportCode,
                arrivalAirportCode,
                departureDate,
                promo);

            result.Should().Be("EZY1234LGWBCN20230201");
        }

        [Fact]
        public void GetFlightId_WithPromo_ReturnsCorrectValue()
        {
            var flightNumber = "EZY1234";
            var departureAirportCode = "LGW";
            var arrivalAirportCode = "BCN";
            var departureDate = new DateTime(2023, 2, 1);
            var promo = "EUBX";

            var result = FlightSeatPlanCacheService.GetFlightId(
                flightNumber,
                departureAirportCode,
                arrivalAirportCode,
                departureDate,
                promo);

            result.Should().Be("EZY1234LGWBCN20230201EUBX");
        }

        [Fact]
        public void ConvertGetSeatsMapResponse_ReturnsEmptyListForEmptyInput()
        {
            var getSeatsMapResponse = new GetSeatsMapResponse();
            var result = FlightSeatPlanCacheService.ConvertGetSeatsMapResponse(getSeatsMapResponse);
            result.Should().BeEmpty();
        }

        [Fact]
        public void ConvertGetSeatsMapResponse_ReturnsCorrectValue()
        {
            var result = FlightSeatPlanCacheService.ConvertGetSeatsMapResponse(GetSeatsMapResponse);
            result.Should().BeEquivalentTo(new List<Seat> { GetSeat(Seat1A), GetSeat(Seat1B), GetSeat(Seat2B) });
        }

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        public async Task GetFlightSeatPlan_ThrowsExceptionForNullOrEmptyInput(string input)
        {
            _flightSeatPlanRepoMock.Setup(mock => mock.GetItemAsync(It.IsAny<string>()))
                .ReturnsAsync(new FlightSeatPlan());

            Func<Task<List<Seat>>> act = () => _flightSeatPlanCacheService.GetFlightSeatPlan(input);

            await act.Should().ThrowAsync<ArgumentException>();
        }

        [Fact]
        public async Task GetFlightSeatPlan_ReturnsNullForExpiredValue()
        {
            _flightSeatPlanRepoMock.Setup(mock => mock.GetItemAsync(It.IsAny<string>()))
                .ReturnsAsync(new FlightSeatPlan { TTL = DateTime.UtcNow.AddDays(-1) });

            var result = await _flightSeatPlanCacheService.GetFlightSeatPlan(FlightId);

            result.Should().BeNull();
        }

        [Fact]
        public async Task GetFlightSeatPlan_ReturnsNonExpiredValue()
        {
            List<Seat> seats = new List<Seat>
            {
                GetSeat(Seat1A), GetSeat(Seat2B)
            };

            _flightSeatPlanRepoMock.Setup(mock => mock.GetItemAsync(It.IsAny<string>()))
                .ReturnsAsync(new FlightSeatPlan { TTL = DateTime.UtcNow.AddDays(1), Seats = seats });

            var result = await _flightSeatPlanCacheService.GetFlightSeatPlan(FlightId);

            result.Should().BeEquivalentTo(seats);
        }

        [Theory]
        [InlineData(null, null)]
        [InlineData("", null)]
        [InlineData(FlightId, null)]
        public async Task CreateFlightSeatPlan_ThrowsExceptionForNullOrEmptyInput(string flightId, GetSeatsMapResponse seatsMapResponse)
        {
            Func<Task<List<Seat>>> act = () => _flightSeatPlanCacheService.CreateFlightSeatPlan(flightId, seatsMapResponse);

            await act.Should().ThrowAsync<ArgumentException>();
        }

        [Fact]
        public async Task CreateFlightSeatPlan_SavesDataToRepo()
        {
            var result = await _flightSeatPlanCacheService.CreateFlightSeatPlan(FlightId, GetSeatsMapResponse);

            _flightSeatPlanRepoMock.Verify(
                repo => repo.SaveAsync(
                    It.Is<FlightSeatPlan>(plan => plan.Seats.SequenceEqual(result) && plan.FlightId == FlightId)),
                Times.Once);

            result.Should().BeEquivalentTo(new List<Seat> { GetSeat(Seat1A), GetSeat(Seat1B), GetSeat(Seat2B) });
        }

        private Seat GetSeat(SeatMapSeat seat)
        {
            return new Seat
            {
                Number = seat.Number,
                Price = seat.Price,
                PriceBand = seat.PriceBand,
                Products = seat.Products
            };
        }
    }
}
