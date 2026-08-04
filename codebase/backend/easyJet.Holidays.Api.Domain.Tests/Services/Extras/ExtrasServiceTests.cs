using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Monitoring;
using easyJet.Holidays.Api.Domain.Monitoring.Analytics;
using easyJet.Holidays.Api.Domain.Services.Extras;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Extras
{
    public class ExtrasServiceTests
    {
        private readonly Mock<IItemSearchService> _itemSearchServiceMock;
        private readonly Mock<ITransferService> _transferServiceMock;
        private readonly Mock<IMetricsService> _metricsServiceMock;
        private readonly Mock<IOtelAnalyticsService> _otelAnalyticsServiceMock;
        private readonly ExtrasService _extrasService;

        public ExtrasServiceTests()
        {
            _itemSearchServiceMock = new Mock<IItemSearchService>();
            _transferServiceMock = new Mock<ITransferService>();
            _metricsServiceMock = new Mock<IMetricsService>();
            _otelAnalyticsServiceMock = new Mock<IOtelAnalyticsService>();

            _extrasService = new ExtrasService(
                _itemSearchServiceMock.Object,
                _transferServiceMock.Object,
                _metricsServiceMock.Object,
                _otelAnalyticsServiceMock.Object
            );
        }

        [Fact]
        public async Task Get_ShouldReturnExtras_WithTransfersPopulated()
        {
            // Arrange
            var offer = CreateMockOffer();
            var mockTransfers = CreateMockTransfers();

            var mockExtras = new OfferExtras
            {
                Transfers = mockTransfers
            };

            _itemSearchServiceMock.Setup(x => x.GetExtras(offer))
                .ReturnsAsync(mockExtras);
            _transferServiceMock.Setup(x => x.GetAll(offer, mockExtras.Transfers))
                .ReturnsAsync(mockTransfers);

            // Act
            var result = await _extrasService.Get(offer);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.Transfers);
            Assert.Equal(mockTransfers.Count, result.Transfers.Count());

            _itemSearchServiceMock.Verify(x => x.GetExtras(offer), Times.Once);
            _transferServiceMock.Verify(x => x.GetAll(offer, mockExtras.Transfers), Times.Once);
        }


        [Fact]
        public async Task TrackExpensiveNoTransferCases_ShouldLogMetric_WhenNoTransferIsExpensive()
        {
            // Arrange
            var offer = CreateMockOffer();
            var mockExtras = CreateMockExtras();
            mockExtras.Transfers = new List<TransferItem>
            {
                new()
                {
                    Type = TransferItemType.NoTransfer,
                    Price = 50
                },
                new()
                {
                    Type = TransferItemType.Shared,
                    Price = 40
                }
            };

            _itemSearchServiceMock.Setup(x => x.GetExtras(offer))
                .ReturnsAsync(mockExtras);
            _transferServiceMock.Setup(x => x.GetAll(offer, mockExtras.Transfers))
                .ReturnsAsync(mockExtras.Transfers);

            // Act
            await _extrasService.Get(offer);

            // Assert
            _metricsServiceMock.Verify(x =>
                x.IncrementCounter(
                    MetricConstants.WebPaidSelfTransferTotal,
                    1,
                    It.Is<KeyValuePair<string, object>>(kvp => kvp.Key == "airport_code" && kvp.Value.Equals("LHR"))),
                Times.Once);
        }

        [Fact]
        public async Task TrackExpensiveNoTransferCases_ShouldNotLogMetric_WhenNoTransferIsCheaper()
        {
            // Arrange
            var offer = CreateMockOffer();
            var mockExtras = CreateMockExtras();
            mockExtras.Transfers = new List<TransferItem>
            {
                new()
                {
                    Type = TransferItemType.NoTransfer,
                    Price = 30
                },
                new()
                {
                    Type = TransferItemType.Shared,
                    Price = 40
                }
            };

            _itemSearchServiceMock.Setup(x => x.GetExtras(offer))
                .ReturnsAsync(mockExtras);
            _transferServiceMock.Setup(x => x.GetAll(offer, mockExtras.Transfers))
                .ReturnsAsync(mockExtras.Transfers);

            // Act
            await _extrasService.Get(offer);

            // Assert
            _metricsServiceMock.Verify(x =>
                x.IncrementCounter(
                    It.IsAny<string>(),
                    It.IsAny<int>(),
                    It.IsAny<KeyValuePair<string, object>>(),
                    It.IsAny<KeyValuePair<string, object>>()),
                Times.Never);
        }

        private static Offer CreateMockOffer()
        {
            return new Offer
            {
                Accom = new Accom
                {
                    Code = "H123"
                },
                Transport = new Transport
                {
                    Routes =
                    [
                        new() { ArrPt = "LHR" }
                    ]
                }
            };
        }

        private static OfferExtras CreateMockExtras()
        {
            return new OfferExtras
            {
                Transfers = new List<TransferItem>()
            };
        }

        private static List<TransferItem> CreateMockTransfers()
        {
            return
            [
                new() { Type = TransferItemType.Shared, Price = 40 },

                new() { Type = TransferItemType.Private, Price = 70 }
            ];
        }
    }
}
