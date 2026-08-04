using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.ShortList;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.ShortList;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Interfaces.ShortList;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.ShortList;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.ShortList
{

    public class ShortListServiceRepositoryTests
    {
        private IFixture _fixture;

        public ShortListServiceRepositoryTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
        }

        [Fact]
        public async Task Get_Success_Empty_Response_Missing_Hotels_Result()
        {
            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.GetCustomerIdWithErrorsHandling(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("test");
            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.GetUserShortList(It.Is<string>(s => s == "test"), It.IsAny<string>()))
                .ReturnsAsync(
                [
                    new ShortListOfferRequest()
                    {
                        Id = "ID",
                        AccommodationId = "TEST"
                    }
                ]);

            var hotelsService = _fixture.Freeze<Mock<IHotelsService>>();
            hotelsService
                .Setup(x => x.GetMissingCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync([
                    "TEST"
                ]);

            _fixture.Inject(authenticationService.Object);
            _fixture.Inject(shortListService.Object);
            _fixture.Inject(hotelsService.Object);

            var sut = _fixture.Create<ShortListServiceRepository>();

            var result = await sut.Get();

            result.Offers.Count.Should().Be(0);
        }

        [Fact]
        public async Task Get_Success_Result()
        {
            // Arrange
            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.GetCustomerIdWithErrorsHandling(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("test");
            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.GetUserShortList(It.Is<string>(s => s == "test"), It.IsAny<string>()))
                .ReturnsAsync(
                [
                    new ShortListOfferRequest()
                    {
                        Id = "ID",
                        AccommodationId = "TEST",
                        StartDate =  DateFormatUtils.DateOnly(DateTime.Now.AddDays(10)),
                    }
                ]);

            var hotelsService = _fixture.Freeze<Mock<IHotelsService>>();
            hotelsService
                .Setup(x => x.GetMissingCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync([]);
            hotelsService
                .Setup(x => x.Search(It.IsAny<string[]>(), It.IsAny<string>()))
                .ReturnsAsync(new List<Hotel>
            {
                    new Hotel
                    {
                        GiataCode = "1234567"
                    }
            });

            var referenceDataService = _fixture.Freeze<Mock<IReferenceDataService>>();
            referenceDataService
                .Setup(x => x.GetAllThemes())
                .ReturnsAsync([]);
            referenceDataService
                .Setup(x => x.GetTransfers())
                .ReturnsAsync(new Dictionary<string, HotelTransfer>
                {
                    { "SS", new HotelTransfer { Name = "Shared Test" } }
                });

            var accommodationOfferService = _fixture.Freeze<Mock<IAccommodationOfferService>>();
            accommodationOfferService
                .Setup(x => x.SearchAccommodationOffer(It.IsAny<ShortListOfferRequest>()))
                .ReturnsAsync(new SearchOffersResponse()
                {
                    Offers =
                    [
                        new Offer
                        {
                            Accom = new Accom
                            {
                                Code = "TEST",
                                Prom = "EUBF"
                            },
                            Transport = new Transport
                            {
                                Routes = []
                            },
                            Transfers =
                            [
                                new ()
                                {
                                    Code = "B12345SS"
                                }
                            ]
                        }
                    ]
                });

            _fixture.Inject(authenticationService.Object);
            _fixture.Inject(shortListService.Object);
            _fixture.Inject(hotelsService.Object);
            _fixture.Inject(referenceDataService.Object);
            _fixture.Inject(accommodationOfferService.Object);

            var sut = _fixture.Create<ShortListServiceRepository>();

            // Act
            var result = await sut.Get();

            // Assert
            result.Offers.Count.Should().Be(1);
            result.Offers[0].GiataCode.Should().Be("1234567");
            result.Offers[0].Transfers.Count.Should().Be(1);
            result.Offers[0].Transfers[0].Name.Should().Be("Shared Test");
        }

        [Fact]
        public async Task Get_WhenDuplicatedHotels_DuplicatesRemoved()
        {
            var accommodationId = "test-accommodation-id";
            // Arrange
            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.GetCustomerIdWithErrorsHandling(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("test");
            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.GetUserShortList(It.Is<string>(s => s == "test"), It.IsAny<string>()))
                .ReturnsAsync(
                [
                    //deleted as duplicate of hotel added by giata
                    new ShortListOfferRequest()
                    {
                        Id = Guid.NewGuid().ToString(),
                        ShortListType = ShortListType.Hotel,
                        AccommodationId = accommodationId,
                        StartDate =  DateFormatUtils.DateOnly(DateTime.Now.AddDays(10)),
                    },
                    //links to giata ABC
                     new ShortListOfferRequest()
                    {
                        Id = Guid.NewGuid().ToString(),
                        ShortListType = ShortListType.Hotel,
                        AccommodationId = "test-accommodation-2",
                        StartDate =  DateFormatUtils.DateOnly(DateTime.Now.AddDays(10)),
                    },
                    //links to giata ABC
                    // one will be deleted because two entries points to the same hotel (different accommodationId but same giata code)
                     new ShortListOfferRequest()
                    {
                        Id = Guid.NewGuid().ToString(),
                        ShortListType = ShortListType.Hotel,
                        AccommodationId = "test-accommodation-3",
                        StartDate =  DateFormatUtils.DateOnly(DateTime.Now.AddDays(10)),
                    },
                    //will be not deleted
                    new ShortListOfferRequest()
                    {
                        Id = Guid.NewGuid().ToString(),
                        ShortListType = ShortListType.Hotel,
                        GiataCode = "test-giata",
                        StartDate =  DateFormatUtils.DateOnly(DateTime.Now.AddDays(10)),
                    }
                ]);

            var hotelsService = _fixture.Freeze<Mock<IHotelsService>>();
            hotelsService
                .Setup(x => x.GetAccomodationsByGiata(It.IsAny<List<string>>(), It.IsAny<string>()))
                .ReturnsAsync(new Dictionary<string, HashSet<string>> { { "test-giata", new HashSet<string> { accommodationId } } } );
            hotelsService
                .Setup(x => x.GetMissingCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync([]);
            hotelsService
                .Setup(x => x.Search(It.IsAny<string[]>()))
                .ReturnsAsync(new List<Hotel>
            {
                    new Hotel
                    {
                        GiataCode = "ABC",
                        Code = "test-accommodation-2"
                    },
                     new Hotel
                    {
                        GiataCode = "ABC",
                        Code = "test-accommodation-3"
                    }
            });

            var referenceDataService = _fixture.Freeze<Mock<IReferenceDataService>>();
            referenceDataService
                .Setup(x => x.GetAllThemes())
                .ReturnsAsync([]);
            referenceDataService
                .Setup(x => x.GetTransfers())
                .ReturnsAsync(new Dictionary<string, HotelTransfer>
                {
                    { "SS", new HotelTransfer { Name = "Shared Test" } }
                });

            _fixture.Inject(authenticationService.Object);
            _fixture.Inject(shortListService.Object);
            _fixture.Inject(hotelsService.Object);
            _fixture.Inject(referenceDataService.Object);

            var sut = _fixture.Create<ShortListServiceRepository>();

            // Act
            var result = await sut.Get(1, 10);

            // Assert
            result.Offers.Count.Should().Be(2);
        }

        [Fact]
        public async Task Get_WhenNoGiataInRequestsToSearch_GetAccomodationsIdByGiataCodeMethodNotExecuted()
        {
            var accommodationId = "test-accommodation-id";
            // Arrange
            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.GetCustomerIdWithErrorsHandling(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("test");
            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.GetUserShortList(It.Is<string>(s => s == "test"), It.IsAny<string>()))
                .ReturnsAsync(
                               [
                    new ShortListOfferRequest()
                    {
                        Id = Guid.NewGuid().ToString(),
                        ShortListType = ShortListType.Hotel,
                        AccommodationId = accommodationId,
                        StartDate =  DateFormatUtils.DateOnly(DateTime.Now.AddDays(10)),
                    }
                ]);

            var hotelsService = _fixture.Freeze<Mock<IHotelsService>>();
            hotelsService
                .Setup(x => x.GetMissingCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync([]);
            hotelsService
                .Setup(x => x.Search(It.IsAny<string[]>(), It.IsAny<string>()))
                .ReturnsAsync(new List<Hotel>
                {
                    new Hotel
                    {
                        GiataCode = "test-giata"
                    }
            });

            var referenceDataService = _fixture.Freeze<Mock<IReferenceDataService>>();
            referenceDataService
                .Setup(x => x.GetAllThemes())
                .ReturnsAsync([]);
            referenceDataService
                .Setup(x => x.GetTransfers())
                .ReturnsAsync(new Dictionary<string, HotelTransfer>
                {
                    { "SS", new HotelTransfer { Name = "Shared Test" } }
                });

            _fixture.Inject(authenticationService.Object);
            _fixture.Inject(shortListService.Object);
            _fixture.Inject(hotelsService.Object);
            _fixture.Inject(referenceDataService.Object);

            var sut = _fixture.Create<ShortListServiceRepository>();

            // Act
            var result = await sut.Get(1, 10);

            // Assert
            hotelsService.Verify(x => x.GetAccomodationsByGiata(It.IsAny<List<string>>(), It.IsAny<string>()), Times.Never());
        }

        [Fact]
        public async Task Get_Success_Expired_Response_Result()
        {
            // Arrange
            DateTime date = DateTime.Now.AddDays(-10);

            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.GetCustomerIdWithErrorsHandling(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("test");
            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.GetUserShortList(It.Is<string>(s => s == "test"), It.IsAny<string>()))
                .ReturnsAsync(
                [
                    new ShortListOfferRequest()
                    {
                        Id = "ID",
                        AccommodationId = "TEST",
                        StartDate =  DateFormatUtils.DateOnly(date),
                        Transfer = string.Empty
                    }
                ]);

            var hotelsService = _fixture.Freeze<Mock<IHotelsService>>();
            hotelsService
                .Setup(x => x.GetMissingCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync([]);

            var referenceDataService = _fixture.Freeze<Mock<IReferenceDataService>>();
            referenceDataService
                .Setup(x => x.GetAllThemes())
                .ReturnsAsync([]);

            _fixture.Inject(authenticationService.Object);
            _fixture.Inject(shortListService.Object);
            _fixture.Inject(hotelsService.Object);
            _fixture.Inject(referenceDataService.Object);

            var sut = _fixture.Create<ShortListServiceRepository>();

            // Act
            var result = await sut.Get();

            // Assert
            result.Offers.Count.Should().Be(1);
            using (new AssertionScope())
            {
                result.Offers.First().Date.Should().Be(DateFormatUtils.Parse(DateFormatUtils.DateOnly(date)).DateTime);
                result.Offers.First().Price.Should().Be(0);
            }
        }

        [Fact]
        public async Task Summary_Success_Empty_Response_Missing_Hotels_Result()
        {
            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.GetCustomerIdWithErrorsHandling(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("test");
            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.GetUserShortList(It.Is<string>(s => s == "test"), It.IsAny<string>()))
                .ReturnsAsync(
                [
                    new ShortListOfferRequest()
                    {
                        Id = "ID",
                        AccommodationId = "TEST"
                    }
                ]);

            var hotelsService = _fixture.Freeze<Mock<IHotelsService>>();
            hotelsService
                .Setup(x => x.GetMissingCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync([
                    "TEST"
                ]);

            _fixture.Inject(authenticationService.Object);
            _fixture.Inject(shortListService.Object);
            _fixture.Inject(hotelsService.Object);

            var sut = _fixture.Create<ShortListServiceRepository>();

            var result = await sut.Summary(It.IsAny<ShortListType?>(), It.IsAny<bool>());

            result.Offers.Count.Should().Be(0);
        }

        [Fact]
        public async Task Summary_Success_Result()
        {
            // Arrange
            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.GetCustomerIdWithErrorsHandling(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("test");
            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.GetUserShortList(It.Is<string>(s => s == "test"), It.IsAny<string>()))
                .ReturnsAsync(
                [
                    new ShortListOfferRequest()
                    {
                        Id = "ID",
                        AccommodationId = "TEST",
                        StartDate =  DateFormatUtils.DateOnly(DateTime.Now.AddDays(10)),
                    }
                ]);

            var accommodationOfferService = _fixture.Freeze<Mock<IAccommodationOfferService>>();
            accommodationOfferService
                .Setup(x => x.SearchAccommodationOffer(It.IsAny<AccommodationOfferRequest>()))
                .ReturnsAsync(new SearchOffersResponse { Offers = [new Offer()] });

            var hotelsService = _fixture.Freeze<Mock<IHotelsService>>();
            hotelsService
                .Setup(x => x.GetMissingCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync([]);

            _fixture.Inject(authenticationService.Object);
            _fixture.Inject(shortListService.Object);
            _fixture.Inject(hotelsService.Object);
            _fixture.Inject(accommodationOfferService.Object);

            var sut = _fixture.Create<ShortListServiceRepository>();

            // Act
            var result = await sut.Summary(It.IsAny<ShortListType?>(), It.IsAny<bool>());

            // Assert
            result.Offers.Count.Should().Be(1);
            result.Offers[0].Shortlist.Id.Should().Be("ID");
        }

        [Fact]
        public async Task Summary_Success_Expired_Response_Result()
        {
            // Arrange
            DateTime date = DateTime.Now.AddDays(-10);

            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.GetCustomerIdWithErrorsHandling(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("test");
            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.GetUserShortList(It.Is<string>(s => s == "test"), It.IsAny<string>()))
                .ReturnsAsync(
                [
                    new ShortListOfferRequest()
                    {
                        Id = "ID",
                        AccommodationId = "TEST",
                        StartDate =  DateFormatUtils.DateOnly(date),
                    }
                ]);

            var hotelsService = _fixture.Freeze<Mock<IHotelsService>>();
            hotelsService
                .Setup(x => x.GetMissingCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync([]);

            _fixture.Inject(authenticationService.Object);
            _fixture.Inject(shortListService.Object);
            _fixture.Inject(hotelsService.Object);

            var sut = _fixture.Create<ShortListServiceRepository>();

            // Act
            var result = await sut.Summary(It.IsAny<ShortListType?>(), It.IsAny<bool>());

            // Assert
            result.Offers.Count.Should().Be(1);
            using (new AssertionScope())
            {
                result.Offers.First().Date.Should().Be(DateFormatUtils.Parse(DateFormatUtils.DateOnly(date)).DateTime);
                result.Offers.First().Price.Should().Be(0);
            }
        }

        [Fact]
        public async Task Summary_FilterExpiredOffers_Success()
        {
            // Arrange
            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.GetCustomerIdWithErrorsHandling(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("test");
            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.GetUserShortList(It.Is<string>(s => s == "test"), It.IsAny<string>()))
                .ReturnsAsync(
                [
                    new ShortListOfferRequest()
                    {
                        Id = "ExpiredID",
                        AccommodationId = "TEST",
                        StartDate =  DateFormatUtils.DateOnly(DateTime.Now.AddDays(-10)),
                    },
                    new ShortListOfferRequest()
                    {
                        Id = "ID",
                        AccommodationId = "TEST",
                        StartDate =  DateFormatUtils.DateOnly(DateTime.Now.AddDays(10)),
                    }
                ]);

            var hotelsService = _fixture.Freeze<Mock<IHotelsService>>();
            hotelsService
                .Setup(x => x.GetMissingCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync([]);

            var accommodationOfferService = _fixture.Freeze<Mock<IAccommodationOfferService>>();
            accommodationOfferService
                .Setup(x => x.SearchAccommodationOffer(It.IsAny<AccommodationOfferRequest>()))
                .ReturnsAsync(new SearchOffersResponse { Offers = [new Offer()] });

            _fixture.Inject(authenticationService.Object);
            _fixture.Inject(shortListService.Object);
            _fixture.Inject(hotelsService.Object);

            var sut = _fixture.Create<ShortListServiceRepository>();

            // Act
            var result = await sut.Summary(It.IsAny<ShortListType?>(), true);

            // Assert
            result.Offers.Count.Should().Be(1);
            using (new AssertionScope())
            {
                result.Offers[0].Shortlist.Id.Should().Be("ID");
            }
        }

        [Fact]
        public async Task Summary_FilterUnavailableOffers_Success()
        {
            // Arrange
            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.GetCustomerIdWithErrorsHandling(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("test");
            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.GetUserShortList(It.Is<string>(s => s == "test"), It.IsAny<string>()))
                .ReturnsAsync(
                [
                    new ShortListOfferRequest()
                    {
                        Id = "UnavailableID",
                        AccommodationId = "Unavailable",
                        StartDate =  DateFormatUtils.DateOnly(DateTime.Now.AddDays(10)),
                    },
                    new ShortListOfferRequest()
                    {
                        Id = "ID",
                        AccommodationId = "Available",
                        StartDate =  DateFormatUtils.DateOnly(DateTime.Now.AddDays(10)),
                    }
                ]);

            var hotelsService = _fixture.Freeze<Mock<IHotelsService>>();
            hotelsService
                .Setup(x => x.GetMissingCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync([]);

            var accommodationOfferService = _fixture.Freeze<Mock<IAccommodationOfferService>>();
            accommodationOfferService
                .Setup(x => x.SearchAccommodationOffer(It.Is<AccommodationOfferRequest>(request => request.AccommodationId == "Available")))
                .ReturnsAsync(new SearchOffersResponse { Offers = [new Offer()] });

            _fixture.Inject(authenticationService.Object);
            _fixture.Inject(shortListService.Object);
            _fixture.Inject(hotelsService.Object);

            var sut = _fixture.Create<ShortListServiceRepository>();

            // Act
            var result = await sut.Summary(It.IsAny<ShortListType?>(), true);

            // Assert
            result.Offers.Count.Should().Be(1);
            using (new AssertionScope())
            {
                result.Offers[0].Shortlist.Id.Should().Be("ID");
            }
        }

        [Fact]
        public async Task Summary_FilterOffersByType_Success()
        {
            // Arrange
            DateTime date = DateTime.Now.AddDays(-10);

            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.GetCustomerIdWithErrorsHandling(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("test");
            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.GetUserShortList(It.Is<string>(s => s == "test"), It.IsAny<string>()))
                .ReturnsAsync(
                [
                    new ShortListOfferRequest()
                    {
                        Id = "OfferID",
                        AccommodationId = "TEST",
                        StartDate =  DateFormatUtils.DateOnly(date),
                        ShortListType = ShortListType.Offer
                    },
                    new ShortListOfferRequest()
                    {
                        Id = "HotelID",
                        AccommodationId = "TEST",
                        StartDate =  DateFormatUtils.DateOnly(date),
                        ShortListType = ShortListType.Hotel
                    }
                ]);

            var hotelsService = _fixture.Freeze<Mock<IHotelsService>>();
            hotelsService
                .Setup(x => x.GetMissingCodes(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync([]);

            _fixture.Inject(authenticationService.Object);
            _fixture.Inject(shortListService.Object);
            _fixture.Inject(hotelsService.Object);

            var sut = _fixture.Create<ShortListServiceRepository>();

            // Act
            var result = await sut.Summary(ShortListType.Hotel, It.IsAny<bool>());

            // Assert
            result.Offers.Count.Should().Be(1);
            using (new AssertionScope())
            {
                result.Offers[0].Shortlist.Id.Should().Be("HotelID");
            }
        }

        [Fact]
        public async Task CreateOrUpdate_Success_Result()
        {
            // Arrange
            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.GetCustomerIdWithErrorsHandling(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("test");

            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.CreateOrUpdateUserShortList(It.Is<string>(s => s == "test"), It.IsAny<ShortListOfferRequest>(), It.IsAny<string>()))
                .ReturnsAsync(new ShortListStatus());

            var marketService = _fixture.Freeze<Mock<IMarketService>>();
            marketService.Setup(x => x.GetCurrentMarket()).Returns(new MarketSettings { Code = "UK" });

            var languageService = _fixture.Freeze<Mock<ILanguageService>>();
            languageService.Setup(x => x.GetCurrentLanguage()).Returns("en");

            var sut = _fixture.Create<ShortListServiceRepository>();

            // Act
            await sut.CreateOrUpdate(new ShortListOfferRequest());

            // Assert
            shortListService.Verify(
                x => x.CreateOrUpdateUserShortList(
                    It.Is<string>(s => s == "test"),
                    It.Is<ShortListOfferRequest>(y =>
                        y.Id != null &&
                        y.CreatedAt != null &&
                        y.MarketCode == "UK" &&
                        y.Language == "en"),
                    It.IsAny<string>()),
                Times.Once());
        }

        [Fact]
        public async Task CreateOrUpdate_Success_Result_CountRecalculatedUsingFilteredOffers()
        {
            // Arrange
            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.GetCustomerIdWithErrorsHandling(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("test");

            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.CreateOrUpdateUserShortList(It.Is<string>(s => s == "test"), It.IsAny<ShortListOfferRequest>(), It.IsAny<string>()))
                .ReturnsAsync(new ShortListStatus { SavedOffersCount = 99 });
            shortListService
                .Setup(x => x.GetUserShortList(It.Is<string>(s => s == "test"), It.IsAny<string>()))
                .ReturnsAsync(
                [
                    new ShortListOfferRequest
                    {
                        Id = "GIATA",
                        ShortListType = ShortListType.Hotel,
                        GiataCode = "G1"
                    },
                    // Should be removed as duplicate of hotel linked by giata
                    new ShortListOfferRequest
                    {
                        Id = "ACCOM",
                        ShortListType = ShortListType.Hotel,
                        AccommodationId = "A1"
                    }
                ]);

            var hotelsService = _fixture.Freeze<Mock<IHotelsService>>();
            hotelsService
                .Setup(x => x.GetAccomodationsByGiata(It.IsAny<List<string>>(), It.IsAny<string>()))
                .ReturnsAsync(new Dictionary<string, HashSet<string>>
                {
                    { "G1", ["A1"] }
                });

            var marketService = _fixture.Freeze<Mock<IMarketService>>();
            marketService.Setup(x => x.GetCurrentMarket()).Returns(new MarketSettings { Code = "UK" });

            var languageService = _fixture.Freeze<Mock<ILanguageService>>();
            languageService.Setup(x => x.GetCurrentLanguage()).Returns("en");

            _fixture.Inject(authenticationService.Object);
            _fixture.Inject(shortListService.Object);
            _fixture.Inject(hotelsService.Object);

            var sut = _fixture.Create<ShortListServiceRepository>();

            // Act
            var result = await sut.CreateOrUpdate(new ShortListOfferRequest());

            // Assert
            result.SavedOffersCount.Should().Be(1);
        }

        [Fact]
        public async Task CreateOrUpdate_WhenServiceReturnsNullStatus_ReturnsDefaultStatusWithRecalculatedCount()
        {
            // Arrange
            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.GetCustomerIdWithErrorsHandling(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("test");

            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.CreateOrUpdateUserShortList(It.Is<string>(s => s == "test"), It.IsAny<ShortListOfferRequest>(), It.IsAny<string>()))
                .ReturnsAsync((ShortListStatus)null!);
            shortListService
                .Setup(x => x.GetUserShortList(It.Is<string>(s => s == "test"), It.IsAny<string>()))
                .ReturnsAsync((IEnumerable<ShortListOfferRequest>)null!);

            var marketService = _fixture.Freeze<Mock<IMarketService>>();
            marketService.Setup(x => x.GetCurrentMarket()).Returns(new MarketSettings { Code = "UK" });

            var languageService = _fixture.Freeze<Mock<ILanguageService>>();
            languageService.Setup(x => x.GetCurrentLanguage()).Returns("en");

            _fixture.Inject(authenticationService.Object);
            _fixture.Inject(shortListService.Object);

            var sut = _fixture.Create<ShortListServiceRepository>();

            // Act
            var result = await sut.CreateOrUpdate(new ShortListOfferRequest());

            // Assert
            result.Should().NotBeNull();
            result.SavedOffersCount.Should().Be(0);
        }

        [Fact]
        public async Task Delete_Success_Result()
        {
            // Arrange
            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.GetCustomerIdWithErrorsHandling(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("test");
            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.RemoveOfferFormList(It.Is<string>(s => s == "test"), It.IsAny<List<string>>(), It.IsAny<string>()))
                .ReturnsAsync(new ShortListStatus());
            _fixture.Inject(authenticationService.Object);
            _fixture.Inject(shortListService.Object);

            var sut = _fixture.Create<ShortListServiceRepository>();

            // Act
            await sut.Delete(["ID"]);

            // Assert
            shortListService.Verify(x => x.RemoveOfferFormList(It.Is<string>(s => s == "test"), It.Is<List<string>>(y => y.Any(r => r == "ID")), It.IsAny<string>()), Times.Once());
        }

        [Fact]
        public async Task Delete_Success_Result_CountRecalculatedUsingFilteredOffers()
        {
            // Arrange
            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.GetCustomerIdWithErrorsHandling(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("test");

            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.RemoveOfferFormList(It.Is<string>(s => s == "test"), It.IsAny<List<string>>(), It.IsAny<string>()))
                .ReturnsAsync(new ShortListStatus { SavedOffersCount = 99 });
            shortListService
                .Setup(x => x.GetUserShortList(It.Is<string>(s => s == "test"), It.IsAny<string>()))
                .ReturnsAsync(
                [
                    new ShortListOfferRequest
                    {
                        Id = "ID1",
                        ShortListType = ShortListType.Offer
                    },
                    new ShortListOfferRequest
                    {
                        Id = "ID2",
                        ShortListType = ShortListType.Offer
                    }
                ]);

            _fixture.Inject(authenticationService.Object);
            _fixture.Inject(shortListService.Object);

            var sut = _fixture.Create<ShortListServiceRepository>();

            // Act
            var result = await sut.Delete(["ID"]);

            // Assert
            result.SavedOffersCount.Should().Be(2);
        }

        [Fact]
        public async Task Delete_WhenServiceReturnsNullStatus_ReturnsDefaultStatusWithRecalculatedCount()
        {
            // Arrange
            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.GetCustomerIdWithErrorsHandling(It.IsAny<CustomerDetails>()))
                .ReturnsAsync("test");

            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.RemoveOfferFormList(It.Is<string>(s => s == "test"), It.IsAny<List<string>>(), It.IsAny<string>()))
                .ReturnsAsync((ShortListStatus)null!);
            shortListService
                .Setup(x => x.GetUserShortList(It.Is<string>(s => s == "test"), It.IsAny<string>()))
                .ReturnsAsync((IEnumerable<ShortListOfferRequest>)null!);

            _fixture.Inject(authenticationService.Object);
            _fixture.Inject(shortListService.Object);

            var sut = _fixture.Create<ShortListServiceRepository>();

            // Act
            var result = await sut.Delete(["ID"]);

            // Assert
            result.Should().NotBeNull();
            result.SavedOffersCount.Should().Be(0);
        }

        [Theory]
        [MemberData(nameof(UpdateOffersRefToUserShortListData))]
        public async Task UpdateOffersRefToUserShortList_Success_Result(List<Offer> offersInput, ShortListOfferRequest[] dynamoDbResult, List<Offer> offersOutput)
        {
            // Arrange
            const string customerId = "test";

            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.MappedCustomerId(null))
                .ReturnsAsync(customerId);

            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.GetUserShortList(It.Is<string>(s => s == customerId), It.IsAny<string>()))
                .ReturnsAsync(dynamoDbResult);

            _fixture.Inject(authenticationService.Object);
            _fixture.Inject(shortListService.Object);

            var sut = _fixture.Create<ShortListServiceRepository>();

            // Act
            await sut.UpdateOffersRefToUserShortList(offersInput);

            // Assert
            shortListService.Verify(x => x.GetUserShortList(It.Is<string>(s => s == customerId), null), Times.Once());
            offersInput.Should().BeEquivalentTo(offersOutput);
        }

        [Theory]
        [MemberData(nameof(HotelStatusData))]
        public async Task HotelStatus_Success_Result(string accomCode, ShortListOfferRequest[] dynamoDbResult, ShortListStatus hotelStatus)
        {
            // Arrange
            const string customerId = "test";

            _fixture.Inject(Options.Create(new AtcomSettings { Transfers = new TransfersSettings() { Types = new TransferTypesSettings() } }));

            var authenticationService = _fixture.Freeze<Mock<IAuthenticationService>>();
            authenticationService
                .Setup(x => x.GetCustomerIdWithErrorsHandling(null))
                .ReturnsAsync(customerId);

            var shortListService = _fixture.Freeze<Mock<IShortListService>>();
            shortListService
                .Setup(x => x.GetUserShortList(It.Is<string>(s => s == customerId), It.IsAny<string>()))
                .ReturnsAsync(dynamoDbResult);

            _fixture.Inject(authenticationService.Object);
            _fixture.Inject(shortListService.Object);

            var sut = _fixture.Create<ShortListServiceRepository>();

            // Act
            var result = await sut.HotelStatus(accomCode);

            // Assert
            shortListService.Verify(x => x.GetUserShortList(It.Is<string>(s => s == customerId), null), Times.Once());
            result.Should().BeEquivalentTo(hotelStatus);
        }

        public static IEnumerable<object[]> UpdateOffersRefToUserShortListData()
        {
            yield return new object[]
            {
                new List<Offer>
                {
                    new Offer
                    {
                        Accom = new Accom {Code = "ACCOM_ID"},
                        Shortlist = null
                    }
                },
                new[]
                {
                    new ShortListOfferRequest
                    {
                        Id = "ID",
                        AccommodationId = "ACCOM_ID",
                    }
                },
                new List<Offer>
                {
                    new Offer
                    {
                        Accom = new Accom {Code = "ACCOM_ID"},
                        Shortlist = new ShortlistInfo { Id = "ID" }
                    }
                }
            };

            yield return new object[]
            {
                new List<Offer>
                {
                    new Offer
                    {
                        Accom = new Accom {Code = "ACCOM_ID_1"},
                        Shortlist = null
                    }
                },
                new[]
                {
                    new ShortListOfferRequest
                    {
                        Id = "ID",
                        AccommodationId = "ACCOM_ID_2",

                    }
                },
                new List<Offer>
                {
                    new Offer
                    {
                        Accom = new Accom {Code = "ACCOM_ID_1"},
                        Shortlist = null
                    }
                }
            };

            yield return new object[]
            {
                new List<Offer>
                {
                    new Offer
                    {
                        Accom = new Accom {Code = "ACCOM_ID_1"},
                        Shortlist = null
                    }
                },
                null,
                new List<Offer>
                {
                    new Offer
                    {
                        Accom = new Accom {Code = "ACCOM_ID_1"},
                        Shortlist = null
                    }
                }
            };
        }

        public static IEnumerable<object[]> HotelStatusData()
        {
            // Match accomCode
            yield return new object[]
            {
                "ESTF0001",
                new[]
                {
                    new ShortListOfferRequest
                    {
                        Id = "ID",
                        AccommodationId = "AESTF0065",
                        GiataCode = "ESTF0001",
                        ShortListType = ShortListType.Hotel
                    },
                    new ShortListOfferRequest
                    {
                        Id = "ID",
                        AccommodationId = "AESTF0001",
                        GiataCode = "ESTF0002",
                        ShortListType = ShortListType.Hotel
                    }
                },
                new ShortListStatus{SavedOffersCount = 1, CreatedID = "ID"}
            };

            // Do not match accomCode
            yield return new object[]
            {
                "ESCB0002",
                new[]
                {
                    new ShortListOfferRequest
                    {
                        Id = "ID",
                        AccommodationId = "AESTF0065",
                        GiataCode = "ESTF0065",
                        ShortListType = ShortListType.Hotel
                    },
                    new ShortListOfferRequest
                    {
                        Id = "ID",
                        AccommodationId = "AESTF0001",
                        GiataCode = "ESTF0001",
                        ShortListType = ShortListType.Hotel
                    }
                },
                new ShortListStatus{SavedOffersCount = 0, CreatedID = null}
            };

            // Match accomCode, but not batch shortListType
            yield return new object[]
            {
                "ESCB0002",
                new[]
                {
                    new ShortListOfferRequest
                    {
                        Id = "ID",
                        AccommodationId = "AESCB0002",
                        GiataCode = "ESCB0002",
                        ShortListType = ShortListType.Offer
                    },
                    new ShortListOfferRequest
                    {
                        Id = "ID",
                        AccommodationId = "AESTF0001",
                        GiataCode = "ESTF0001",
                        ShortListType = ShortListType.Hotel
                    }
                },
                new ShortListStatus{SavedOffersCount = 0, CreatedID = null}
            };
        }

    }
}
