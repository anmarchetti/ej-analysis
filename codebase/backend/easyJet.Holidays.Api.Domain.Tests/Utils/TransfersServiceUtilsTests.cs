using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Utils;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Transfers
{
    public class TransfersServiceUtilsTests
    {
        private static List<HotelTransfer> HotelTransfers = new List<HotelTransfer> {
                new HotelTransfer {
                    Code = "S",
                    Content = "shared",
                    ContentByDate = new List<ContentByDate>{
                        new ContentByDate {
                            StartDate = new DateTimeOffset(1,1,1,23,59,0, TimeSpan.Zero),
                            EndDate = new DateTimeOffset(2020,3,1,23,59,0, TimeSpan.Zero),
                            Content = "shared <= 1 March 2020"
                        },
                        new ContentByDate {
                            StartDate = new DateTimeOffset(2020,3,2,23,59,0, TimeSpan.Zero),
                            EndDate = new DateTimeOffset(2020,6,1,23,59,0, TimeSpan.Zero),
                            Content = "shared > 1 March 2020 and <= 1 June 2020"
                        },
                        new ContentByDate {
                            StartDate = new DateTimeOffset(2020,6,2,23,59,0, TimeSpan.Zero),
                            EndDate = new DateTimeOffset(1,1,1,23,59,0, TimeSpan.Zero),
                            Content = "shared after 1 June 2020"
                        }
                    }
                }
            };

        [Theory]
        [InlineData(2020, 2, 25, "shared <= 1 March 2020")]
        [InlineData(2020, 3, 1, "shared <= 1 March 2020")]
        [InlineData(2020, 3, 2, "shared > 1 March 2020 and <= 1 June 2020")]
        [InlineData(2020, 6, 1, "shared > 1 March 2020 and <= 1 June 2020")]
        [InlineData(2020, 6, 2, "shared after 1 June 2020")]
        public async Task EnrichCmsData_NormalIntervals_SelectContent(int year, int month, int day, string expectedContent)
        {
            // Arrange
            var transfers = new List<TransferItem>() {
                new TransferItem {
                    Code = "S"
                }
            };
            var transport = new Transport
            {
                Routes = new List<Route> {
                    new Route{
                        Direction = Direction.Outbound,
                        DepDate = new DateTimeOffset(year, month, day, 0,0,0, TimeSpan.Zero)
                    }
                }
            };

            // Act
            await TransfersServiceUtils.EnrichCmsData(transfers, transport, HotelTransfers, null);

            // Assert
            transfers[0].Content.Should().Be(expectedContent);
        }

        [Theory]
        [InlineData(2020, 3, 1, "default content")]
        [InlineData(2020, 6, 2, "default content")]
        public async Task EnrichCmsData_OutsideOfInternals_DefaultContent(int year, int month, int day, string expectedContent)
        {
            // Arrange
            var hotelTransfers = new List<HotelTransfer> {
                new HotelTransfer {
                    Code = "S",
                    Content = "default content",
                    ContentByDate = new List<ContentByDate>{
                        new ContentByDate {
                            StartDate = new DateTimeOffset(2020,3,2,0,0,0, TimeSpan.Zero),
                            EndDate = new DateTimeOffset(2020,6,1,0,0,0, TimeSpan.Zero),
                            Content = "shared > 1 March 2020 and <= 1 June 2020"
                        }
                    }
                }
            };

            var transfers = new List<TransferItem>() {
                new TransferItem {
                    Code = "S"
                }
            };
            var transport = new Transport
            {
                Routes = new List<Route> {
                    new Route{
                        Direction = Direction.Outbound,
                        DepDate = new DateTimeOffset(year, month, day, 0,0,0, TimeSpan.Zero)
                    }
                }
            };

            // Act
            await TransfersServiceUtils.EnrichCmsData(transfers, transport, hotelTransfers, null);

            // Assert
            transfers[0].Content.Should().Be(expectedContent);
        }
    }
}
