using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using FluentAssertions;
using Xunit;
using Moq;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.HolidaysExtras;
using easyJet.Holidays.Api.Domain.Services.AirportParking;
using easyJet.Holidays.Tests.Domain;
using Force.DeepCloner;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AirportParking
{
    public class AirportParkingServiceTests
    {
        private readonly Mock<IItemSearchService> _itemSearchServiceMock = new();
        private readonly Mock<IHolidayExtrasService> _holidayExtrasServiceMock = new();
        private readonly Mock<ILogger<AirportParkingService>> _loggerMock = new();

        private readonly List<AirportParkingItem> _airportParkings =
        [
            new()
            {
                Title = "Park Up Meet and Greet", BookingDetails = { TotalPrice = 100, ProductCode = "ProductCode" }
            },
            new() { Title = "Multi storey T2 west", BookingDetails = { TotalPrice = 60, ProductCode = "ProductCode2" } }
        ];

        public AirportParkingServiceTests()
        {
            _itemSearchServiceMock
                .Setup(x => x.GetAirportParkings(It.Is<Offer>(y => y.Id != "null")))
                .ReturnsAsync(_airportParkings);
            _holidayExtrasServiceMock.Setup(x => x.GetImagesBaseUrl())
                .Returns(new Uri("http://local/imageLibrary/Images/", UriKind.Absolute));
        }

        [Fact]
        public async Task Search_WhenProductLibraryItemIsFound_ReturnsAllParkings()
        {
            //Arrange

            _holidayExtrasServiceMock
                .Setup(x => x.GetHolidayExtrasProduct(It.IsAny<string>()))
                .ReturnsAsync(new HolidayExtrasProducts
                {
                    Products =
                    [
                        new HolidayExtrasProduct
                        {
                            Name = "Car park name",
                            Description = "Car park sell point",
                            TransferTip = "Transfer tip",
                            BrandImage = new Uri("holiday-extras-meet-greet-desktop.png", UriKind.Relative),
                            MeetAndGreet = "0"
                        }
                    ]
                });

            var sut = new AirportParkingService(_itemSearchServiceMock.Object, _holidayExtrasServiceMock.Object,
                _loggerMock.Object);

            //Act
            AirportParkingResponse searchResults = await sut.Search(new Offer());

            // Assert
            searchResults.Should().NotBeNull();
            searchResults.AirportParkingItems.Should().HaveCount(2);
        }

        [Fact]
        public async Task Search_WhenMoreThanOneProductItemIsFound_UsesDataFromTheFirstOne()
        {
            //Arrange

            _holidayExtrasServiceMock
                .Setup(x => x.GetHolidayExtrasProduct(It.IsAny<string>()))
                .ReturnsAsync(new HolidayExtrasProducts
                {
                    Products =
                    [
                        new HolidayExtrasProduct
                        {
                            Name = "First car park name",
                            Description = "First Car park sell point",
                            TransferTip = "First Transfer tip",
                            BrandImage = new Uri("first-holiday-extras-meet-greet-desktop.png", UriKind.Relative),
                            MeetAndGreet = "0"
                        },
                        new HolidayExtrasProduct
                        {
                            Name = "Second car park name",
                            Description = "Second car park sell point",
                            TransferTip = "Second transfer tip",
                            BrandImage = new Uri("second-holiday-extras-meet-greet-desktop.png", UriKind.Relative),
                            MeetAndGreet = "1"
                        }
                    ]
                });

            var sut = new AirportParkingService(_itemSearchServiceMock.Object, _holidayExtrasServiceMock.Object,
                _loggerMock.Object);

            //Act
            AirportParkingResponse searchResults = await sut.Search(new Offer());

            // Assert
            searchResults.Should().NotBeNull();
            AirportParkingItem firstAirportParking = searchResults.AirportParkingItems.FirstOrDefault();

            // Assert
            firstAirportParking?.Title.Should().Be("Park Up Meet and Greet");
            firstAirportParking?.Description.Should().Be("First Car park sell point");
            firstAirportParking?.TransferTip.Should().Be("First Transfer tip");
            firstAirportParking?.BrandImage.Should()
                .Be("http://local/imageLibrary/Images/first-holiday-extras-meet-greet-desktop.png");
            firstAirportParking?.IsMeetAndGreet.Should().Be(false);
        }

        [Fact]
        public async Task Search_WhenProductLibraryItemIsFound_ReturnsAllItsFields()
        {
            //Arrange

            _holidayExtrasServiceMock
                .Setup(x => x.GetHolidayExtrasProduct(It.IsAny<string>()))
                .ReturnsAsync(new HolidayExtrasProducts
                {
                    Products =
                    [
                        new HolidayExtrasProduct
                        {
                            Name = "Car park name",
                            Description = "Car park sell point",
                            TransferTip = "Transfer tip",
                            BrandImage = new Uri("holiday-extras-meet-greet-desktop.png", UriKind.Relative),
                            MeetAndGreet = "1"
                        }
                    ]
                });

            var sut = new AirportParkingService(_itemSearchServiceMock.Object, _holidayExtrasServiceMock.Object,
                _loggerMock.Object);

            //Act

            AirportParkingResponse searchResults = await sut.Search(new Offer());
            AirportParkingItem firstAirportParking = searchResults.AirportParkingItems.FirstOrDefault();

            // Assert
            firstAirportParking?.Title.Should().Be("Park Up Meet and Greet");
            firstAirportParking?.BookingDetails.TotalPrice.Should().Be(100);
            firstAirportParking?.Description.Should().Be("Car park sell point");
            firstAirportParking?.TransferTip.Should().Be("Transfer tip");
            firstAirportParking?.BrandImage.Should()
                .Be("http://local/imageLibrary/Images/holiday-extras-meet-greet-desktop.png");
            firstAirportParking?.IsMeetAndGreet.Should().Be(true);
        }

        [Fact]
        public async Task Search_WhenProductLibraryItemHasBlankName_ReturnsAirportParkingItemName()
        {
            //Arrange

            _holidayExtrasServiceMock
                .Setup(x => x.GetHolidayExtrasProduct(It.IsAny<string>()))
                .ReturnsAsync(new HolidayExtrasProducts
                {
                    Products =
                    [
                        new HolidayExtrasProduct
                        {
                            Description = "Car park sell point",
                            TransferTip = "Transfer tip",
                            BrandImage = new Uri("http://sample.com/img.jpg"),
                            Name = "Awesome Parking Space"
                        }
                    ]
                });


            var sut = new AirportParkingService(_itemSearchServiceMock.Object, _holidayExtrasServiceMock.Object,
                _loggerMock.Object);

            //Act

            AirportParkingResponse searchResults = await sut.Search(new Offer());
            AirportParkingItem firstAirportParking = searchResults.AirportParkingItems.FirstOrDefault();

            // Assert

            searchResults.Should().NotBeNull();
            searchResults.AirportParkingItems.Should().NotBeEmpty();
            firstAirportParking.Should().NotBeNull();
            firstAirportParking?.Title.Should().Be("Park Up Meet and Greet");
            firstAirportParking?.BookingDetails.TotalPrice.Should().Be(100);
            firstAirportParking?.Description.Should().Be("Car park sell point");
            firstAirportParking?.TransferTip.Should().Be("Transfer tip");
        }

        [Fact]
        public async Task Search_WhenProductLibraryItemNotFound_ReturnsEmptyFields()
        {
            //Arrange

            // No product inserted, so Holiday Extras will not find the Product when searching for it.

            var sut = new AirportParkingService(_itemSearchServiceMock.Object, _holidayExtrasServiceMock.Object,
                _loggerMock.Object);

            //Act

            AirportParkingResponse searchResults = await sut.Search(new Offer());
            AirportParkingItem firstAirportParking = searchResults.AirportParkingItems.FirstOrDefault();

            // Assert

            searchResults.Should().NotBeNull();
            firstAirportParking.Should().BeNull();
            firstAirportParking?.Description.Should().BeNullOrEmpty();
            firstAirportParking?.TransferTip.Should().BeNullOrEmpty();
        }

        [Fact]
        public async Task Search_WhenAirportParkingIsNullFromAtCom_ReturnsEmptyFields()
        {
            //Arrange

            _itemSearchServiceMock
                .Setup(x => x.GetAirportParkings(It.Is<Offer>(y => y.Id == "null")))
                .ReturnsAsync(null as List<AirportParkingItem>);

            // No product inserted, so Holiday Extras will not find the Product when searching for it.

            var sut = new AirportParkingService(_itemSearchServiceMock.Object, _holidayExtrasServiceMock.Object,
                _loggerMock.Object);

            //Act

            AirportParkingResponse searchResults = await sut.Search(new Offer { Id = "null" });
            AirportParkingItem firstAirportParking = searchResults.AirportParkingItems.FirstOrDefault();
            // Assert

            searchResults.Should().NotBeNull();
            firstAirportParking.Should().BeNull();
            firstAirportParking?.Description.Should().BeNullOrEmpty();
            firstAirportParking?.TransferTip.Should().BeNullOrEmpty();
        }

        [Fact]
        public async Task Search_WhenAirportParkingIsEmptyObjectFromAtCom_ReturnsEmptyFields()
        {
            //Arrange

            _itemSearchServiceMock
                .Setup(x => x.GetAirportParkings(It.Is<Offer>(y => y.Id == "null")))
                .ReturnsAsync(new List<AirportParkingItem>());

            // No product inserted, so Holiday Extras will not find the Product when searching for it.

            var sut = new AirportParkingService(_itemSearchServiceMock.Object, _holidayExtrasServiceMock.Object,
                _loggerMock.Object);

            //Act

            AirportParkingResponse searchResults = await sut.Search(new Offer { Id = "null" });
            AirportParkingItem firstAirportParking = searchResults.AirportParkingItems.FirstOrDefault();

            // Assert

            searchResults.Should().NotBeNull();
            firstAirportParking.Should().BeNull();
            firstAirportParking?.Description.Should().BeNullOrEmpty();
            firstAirportParking?.TransferTip.Should().BeNullOrEmpty();
        }

        [Fact]
        public async Task Search_WhenAirportParkingIsEmptyObjectFromHolidayExtras_ReturnsEmptyFields()
        {
            //Arrange

            _itemSearchServiceMock
                .Setup(x => x.GetAirportParkings(It.Is<Offer>(y => y.Id == "null")))
                .ReturnsAsync(new List<AirportParkingItem>());

            _holidayExtrasServiceMock
                .Setup(x => x.GetHolidayExtrasProduct(It.IsAny<string>()))
                .ReturnsAsync(new HolidayExtrasProducts { Products = [new HolidayExtrasProduct()] });


            // No product inserted, so Holiday Extras will not find the Product when searching for it.

            var sut = new AirportParkingService(_itemSearchServiceMock.Object, _holidayExtrasServiceMock.Object,
                _loggerMock.Object);

            //Act

            AirportParkingResponse searchResults = await sut.Search(new Offer { Id = "null" });
            AirportParkingItem firstAirportParking = searchResults.AirportParkingItems.FirstOrDefault();

            // Assert

            searchResults.Should().NotBeNull();
            firstAirportParking.Should().BeNull();
            firstAirportParking?.Description.Should().BeNullOrEmpty();
            firstAirportParking?.TransferTip.Should().BeNullOrEmpty();
        }

        [Fact]
        public async Task EnrichBookingWithAirportParking_WhenAirportParkingItemIsPassed_ReturnsHolidaysExtrasDetails()
        {
            //Arrange
            AirportParkingItem airportParkingItemMock = new AirportParkingItem
            {
                BookingDetails = { ProductCode = "LGM1", BookingReferenceCode = "XRYTRE" }
            };
            _holidayExtrasServiceMock
                .Setup(x => x.GetHolidayExtrasProduct(airportParkingItemMock.BookingDetails.ProductCode))
                .ReturnsAsync(new HolidayExtrasProducts
                {
                    Products = [new HolidayExtrasProduct { Name = "Airport 1", Address = "London, United kingdom" }]
                });


            var sut = new AirportParkingService(_itemSearchServiceMock.Object, _holidayExtrasServiceMock.Object,
                _loggerMock.Object);

            //Act
            await sut.EnrichBookingWithAirportParking(airportParkingItemMock);

            // Assert
            airportParkingItemMock.Should().NotBeNull();
            airportParkingItemMock.Title.Should().Be("Airport 1");
            airportParkingItemMock.Address.Should().Be("London, United kingdom");
        }

        [Fact]
        public async Task EnrichBookingWithAirportParking_WhenAirportParkingItemIsNull_ShouldDoNothing()
        {
            //Arrange
            _holidayExtrasServiceMock.Setup(x => x.GetHolidayExtrasProduct(It.IsAny<string>()))
                .ReturnsAsync(new HolidayExtrasProducts { Products = [new HolidayExtrasProduct()] });

            var sut = new AirportParkingService(_itemSearchServiceMock.Object, _holidayExtrasServiceMock.Object,
                _loggerMock.Object);

            var exceptionAsync = await Record.ExceptionAsync(() => sut.EnrichBookingWithAirportParking(null));

            Assert.Null(exceptionAsync);
        }

        [Fact]
        public async Task
            EnrichBookingWithAirportParking_WhenAirportProductCodeIsNull_AirportParkingItemObjectIsNotModified()
        {
            // Arrange
            const string transferTipMock = "transfer tip";
            AirportParkingItem airportParkingItem = new AirportParkingItem
            {
                TransferTip = transferTipMock, BookingDetails = { ProductCode = "", }
            };

            _holidayExtrasServiceMock
                .Setup(x => x.GetHolidayExtrasProduct(airportParkingItem.BookingDetails.ProductCode))
                .ReturnsAsync(new HolidayExtrasProducts { Products = [new HolidayExtrasProduct()] });


            var sut = new AirportParkingService(_itemSearchServiceMock.Object, _holidayExtrasServiceMock.Object,
                _loggerMock.Object);
            await sut.EnrichBookingWithAirportParking(airportParkingItem);

            // Assert
            Assert.Equal(transferTipMock, airportParkingItem.TransferTip);
            airportParkingItem.Title.Should().BeNull();
            airportParkingItem.Address.Should().BeNull();
        }

        [Fact]
        public async Task
            EnrichBookingWithAirportParking_WhenAirportParkingItemHasTitle_AirportParkingItemTitleIsNotModified()
        {
            //Arrange
            const string titleMock = "title";
            AirportParkingItem airportParkingItem =
                new AirportParkingItem { Title = titleMock, BookingDetails = { ProductCode = "LGM2", } };

            _holidayExtrasServiceMock
                .Setup(x => x.GetHolidayExtrasProduct(airportParkingItem.BookingDetails.ProductCode))
                .ReturnsAsync(new HolidayExtrasProducts
                {
                    Products = [new HolidayExtrasProduct() { Name = "Holidays extra title", Address = "London" }]
                });

            // Act
            var sut = new AirportParkingService(_itemSearchServiceMock.Object, _holidayExtrasServiceMock.Object,
                _loggerMock.Object);
            await sut.EnrichBookingWithAirportParking(airportParkingItem);

            // Assert
            Assert.Equal(titleMock, airportParkingItem.Title);
            Assert.NotEqual("Holidays extra title", airportParkingItem.Title);
            Assert.Equal("London", airportParkingItem.Address);
        }

        [Fact]
        public async Task EnrichBookingWithAirportParking_ShouldNotProceed_WhenResponseIsNull()
        {
            // Arrange
            var airportParkingItem = new AirportParkingItem
            {
                Title = "Airport Parking Title",
                Address = "Airport Parking Address",
                BookingDetails = { ProductCode = "test" }
            };
            var expectedResult = airportParkingItem.DeepClone();
            _holidayExtrasServiceMock.Setup(x => x.GetHolidayExtrasProduct(It.IsAny<string>()))
                .ReturnsAsync((HolidayExtrasProducts)null);

            // Act
            var sut = new AirportParkingService(_itemSearchServiceMock.Object, _holidayExtrasServiceMock.Object,
                _loggerMock.Object);
            await sut.EnrichBookingWithAirportParking(airportParkingItem);

            // Assert
            _holidayExtrasServiceMock.Verify(x => x.GetHolidayExtrasProduct(It.IsAny<string>()), Times.Once);
            Assert.Equal(expectedResult.Title, airportParkingItem.Title);
            Assert.Equal(expectedResult.Address, airportParkingItem.Address);
        }

        [Fact]
        public async Task EnrichBookingWithAirportParking_ShouldNotProceed_WhenNoProductsReturned()
        {
            // Arrange
            var expectedResponse = new HolidayExtrasProducts { Products = null };
            var airportParkingItem = new AirportParkingItem
            {
                Title = "Airport Parking Title",
                Address = "Airport Parking Address",
                BookingDetails = { ProductCode = "test" }
            };
            var expectedResult = airportParkingItem.DeepClone();
            _holidayExtrasServiceMock.Setup(x => x.GetHolidayExtrasProduct(It.IsAny<string>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var sut = new AirportParkingService(_itemSearchServiceMock.Object, _holidayExtrasServiceMock.Object,
                _loggerMock.Object);
            await sut.EnrichBookingWithAirportParking(airportParkingItem);

            // Assert
            _holidayExtrasServiceMock.Verify(x => x.GetHolidayExtrasProduct(It.IsAny<string>()), Times.Once);
            Assert.Equal(expectedResult.Title, airportParkingItem.Title);
            Assert.Equal(expectedResult.Address, airportParkingItem.Address);
        }

        [Fact]
        public async Task EnrichBookingWithAirportParking_ShouldLogWarning_WhenMultipleProductsReturned()
        {
            // Arrange
            var airportParkingItem = new AirportParkingItem { BookingDetails = { ProductCode = "test" } };
            var product1 = new HolidayExtrasProduct { Name = "Test Product 1", Address = "Test Address" };
            var product2 = new HolidayExtrasProduct { Name = "Test Product 2", Address = "Test Address" };
            var productLibraryItems =
                new HolidayExtrasProducts { Products = new List<HolidayExtrasProduct> { product1, product2 } };
            _holidayExtrasServiceMock.Setup(x => x.GetHolidayExtrasProduct(It.IsAny<string>()))
                .ReturnsAsync(productLibraryItems);

            // Act
            var sut = new AirportParkingService(_itemSearchServiceMock.Object, _holidayExtrasServiceMock.Object,
                _loggerMock.Object);
            await sut.EnrichBookingWithAirportParking(airportParkingItem);

            // Assert
            _loggerMock.Verify(LoggerTestUtils.VerifyForLogLevel<AirportParkingService>(LogLevel.Warning), Times.Once);
        }


        [Fact]
        public async Task EnrichOffersWithParking_WhenCalledWithAValidCode_SetsAirportParkingWithinTheOffer()
        {
            //Arrange

            const string airportParkingCode = "12345678";
            var testItem = new AirportParkingItem
            {
                BookingDetails = new AirportParkingBookingDetails
                {
                    ProductCode = airportParkingCode,
                    StartDate = new DateTime(year: 2010, 3, 14, 0, 0, 0, DateTimeKind.Utc)
                }
            };

            _itemSearchServiceMock
                .Setup(x => x.GetAirportParkings(It.IsAny<Offer>()))
                .ReturnsAsync(new List<AirportParkingItem> { testItem });

            _holidayExtrasServiceMock
                .Setup(x => x.GetHolidayExtrasProduct(It.Is<string>(s => s == airportParkingCode)))
                .ReturnsAsync(new HolidayExtrasProducts
                {
                    Products =
                    [
                        new HolidayExtrasProduct
                        {
                            Name = "Car park name",
                            Description = "Car park sell point",
                            TransferTip = "Transfer tip",
                            BrandImage = new Uri("holiday-extras-meet-greet-desktop.png", UriKind.Relative),
                            MeetAndGreet = "1"
                        }
                    ]
                });

            var sut = new AirportParkingService(_itemSearchServiceMock.Object, _holidayExtrasServiceMock.Object,
                _loggerMock.Object);
            Offer offer = new();

            //Act

            await sut.EnrichOffersWithParking(new List<Offer> { offer }, airportParkingCode);

            // Assert

            Assert.NotNull(offer.AirportParkingItem);
            Assert.Equal("Car park name", offer.AirportParkingItem.Title);
            Assert.Equal("Car park sell point", offer.AirportParkingItem.Description);
            Assert.NotNull(offer.AirportParkingItem.BookingDetails);
            Assert.Equal(airportParkingCode, offer.AirportParkingItem.BookingDetails.ProductCode);
            Assert.Equal(14, offer.AirportParkingItem.BookingDetails.StartDate.Day);
        }

        [Fact]
        public async Task
            EnrichOffersWithParking_WhenNoMatchingFoundInHolidayExtras_ThatAirportParkingItemIsDiscardedAndNotReturned()
        {
            //Arrange

            const string airportParkingCode = "12345678";
            var testItem = new AirportParkingItem
            {
                BookingDetails = new AirportParkingBookingDetails
                {
                    ProductCode = airportParkingCode,
                    StartDate = new DateTime(year: 2010, 3, 14, 0, 0, 0, DateTimeKind.Utc)
                }
            };

            _itemSearchServiceMock
                .Setup(x => x.GetAirportParkings(It.IsAny<Offer>()))
                .ReturnsAsync(new List<AirportParkingItem> { testItem });

            var sut = new AirportParkingService(_itemSearchServiceMock.Object, _holidayExtrasServiceMock.Object,
                _loggerMock.Object);
            Offer offer = new();

            //Act

            await sut.EnrichOffersWithParking(new List<Offer> { offer }, airportParkingCode);

            // Assert

            Assert.Null(offer.AirportParkingItem);
        }
    }
}