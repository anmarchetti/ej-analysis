using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Utils;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Utils
{
    public class PromoUtilsTests
    {
        private static readonly int maxNumberOfHotelsByRequest = 500;
        [Theory]
        [AutoData]
        public async Task PromoUtils_PromoContainsOnlyHotels_SingleRequest(string code,
           Guid promoPageGuid)
        {
            // Arrange
            PackagesSearchRequest request = new PackagesSearchRequest();
            request.PromoPageId = promoPageGuid.ToString();
            request.IsPromo = true;

            var destinationItems = new List<DestinationItem>()
            {
                new DestinationItem() {Code = code, Type = DestinationItemType.Hotel},
                new DestinationItem() {Code = code, Type = DestinationItemType.Hotel}
            };

            var res = (new object(), false);
            Func<PackagesSearchRequest, Task<(object, bool)>> action = async (PackagesSearchRequest req) => res;
            var destinationsSearchService = new Mock<IDestinationsService>();


            destinationsSearchService.Setup(service => service.GetPromoDestinations(promoPageGuid.ToString()))
                .ReturnsAsync(destinationItems);

            // Act
            var actual =
                await PromoUtils.SplitPromoRequest(request, action,
                    destinationsSearchService.Object, maxNumberOfHotelsByRequest);

            // Assert
            actual.Length.Should().Be(1);
            actual[0].Should().Be(res);
        }

        [Theory]
        [AutoData]
        public async Task DoSplitebByGeographyRequests_PromoContainsHugeAmountHotels_TwoRequests(string code,
            Guid promoPageGuid)
        {
            // Arrange
            PackagesSearchRequest request = new PackagesSearchRequest();
            request.PromoPageId = promoPageGuid.ToString();
            request.IsPromo = true;

            var destinationItems = new List<DestinationItem>();

            //Number of hotels maxNumberOfHotelsByRequest + 1 - should split to two requests
            for (int i = 0; i < maxNumberOfHotelsByRequest + 1; i++)
            {
                destinationItems.Add(new DestinationItem() { Code = code, Type = DestinationItemType.Hotel });
            }


            var res = (new object(), false);
            Func<PackagesSearchRequest, Task<(object, bool)>> action = async (PackagesSearchRequest req) => res;
            var destinationsSearchService = new Mock<IDestinationsService>();


            destinationsSearchService.Setup(service => service.GetPromoDestinations(promoPageGuid.ToString()))
                .ReturnsAsync(destinationItems);

            // Act
            var actual =
                await PromoUtils.SplitPromoRequest(request, action,
                    destinationsSearchService.Object, maxNumberOfHotelsByRequest);

            // Assert
            actual.Length.Should().Be(2);
            actual[0].Should().Be(res);
        }

        [Theory]
        [AutoData]
        public async Task DoSplitebByGeographyRequests_PromoContainsHugeAmountHotels_ThreeRequests(string code,
            Guid promoPageGuid)
        {
            // Arrange
            PackagesSearchRequest request = new PackagesSearchRequest();
            request.PromoPageId = promoPageGuid.ToString();
            request.IsPromo = true;

            var destinationItems = new List<DestinationItem>();

            //Number of hotels (2 * maxNumberOfHotelsByRequest) + 1 - should split to three requests
            for (int i = 0; i < 2 * maxNumberOfHotelsByRequest + 1; i++)
            {
                destinationItems.Add(new DestinationItem() { Code = code, Type = DestinationItemType.Hotel });
            }

            var res = (new object(), false);
            Func<PackagesSearchRequest, Task<(object, bool)>> action = async (PackagesSearchRequest req) => res;
            var destinationsSearchService = new Mock<IDestinationsService>();

            destinationsSearchService.Setup(service => service.GetPromoDestinations(promoPageGuid.ToString()))
                .ReturnsAsync(destinationItems);

            // Act
            var actual =
                await PromoUtils.SplitPromoRequest(request, action,
                    destinationsSearchService.Object, maxNumberOfHotelsByRequest);

            // Assert
            actual.Length.Should().Be(3);
            actual[0].Should().Be(res);
        }

        [Theory]
        [AutoData]
        public async Task PromoUtils_PromoContainsOnlyResorts_SingleRequest(string code,
            Guid promoPageGuid)
        {
            // Arrange
            PackagesSearchRequest request = new PackagesSearchRequest();
            request.PromoPageId = promoPageGuid.ToString();
            request.IsPromo = true;

            var destinationItems = new List<DestinationItem>()
            {
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "ESBABA",
                    Parents = new List<DestinationItem>(){
                        new DestinationItem()
                        {
                            Code = "ES",
                            Type = DestinationItemType.Country
                        },
                        new DestinationItem()
                        {
                            Code = "ESBA",
                            Type = DestinationItemType.Region
                        }
                    }
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "CYLNAN",
                    Parents = new List<DestinationItem>(){
                        new DestinationItem()
                        {
                            Code = "CY",
                            Type = DestinationItemType.Country
                        },
                        new DestinationItem()
                        {
                            Code = "CYLN",
                            Type = DestinationItemType.Region
                        }
                    }
                }

            };

            Func<PackagesSearchRequest, Task<(object, bool)>> action = async (PackagesSearchRequest req) => (req.Geography, false);
            var destinationsSearchService = new Mock<IDestinationsService>();

            destinationsSearchService.Setup(service => service.GetPromoDestinations(promoPageGuid.ToString()))
                .ReturnsAsync(destinationItems);

            // Act
            var actual =
                await PromoUtils.SplitPromoRequest(request, action,
                    destinationsSearchService.Object, maxNumberOfHotelsByRequest);

            // Assert
            actual.Length.Should().Be(1);
            actual[0].Item1.Should().Be("ES|CY,ESBA|CYLN,ESBABA|CYLNAN");
        }

        [Theory]
        [AutoData]
        public async Task PromoUtils_PromoWithGeography(string code,
            Guid promoPageGuid)
        {
            // Arrange
            PackagesSearchRequest request = new PackagesSearchRequest();
            request.PromoPageId = promoPageGuid.ToString();
            request.Geography = "ES|CY,ESBA|CYLN,ESBABA|CYLNAN";
            request.IsPromo = true;

            var destinationItems = new List<DestinationItem>()
            {
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "ESBABA",
                    Parents = new List<DestinationItem>(){
                        new DestinationItem()
                        {
                            Code = "ES",
                            Type = DestinationItemType.Country
                        },
                        new DestinationItem()
                        {
                            Code = "ESBA",
                            Type = DestinationItemType.Region
                        }
                    }
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "CYLNAN",
                    Parents = new List<DestinationItem>(){
                        new DestinationItem()
                        {
                            Code = "CY",
                            Type = DestinationItemType.Country
                        },
                        new DestinationItem()
                        {
                            Code = "CYLN",
                            Type = DestinationItemType.Region
                        }
                    }
                }

            };

            Func<PackagesSearchRequest, Task<(object, bool)>> action = async (PackagesSearchRequest req) => (req.Geography, false);
            var destinationsSearchService = new Mock<IDestinationsService>();

            destinationsSearchService.Setup(service => service.GetPromoDestinations(promoPageGuid.ToString()))
                .ReturnsAsync(destinationItems);

            // Act
            var actual =
                await PromoUtils.SplitPromoRequest(request, action,
                    destinationsSearchService.Object, maxNumberOfHotelsByRequest);

            // Assert
            actual.Length.Should().Be(1);
            actual[0].Item1.Should().Be("ES|CY,ESBA|CYLN,ESBABA|CYLNAN");
        }

        [Theory]
        [AutoData]
        public async Task PromoUtils_PromoContainsOnlyRegions_SingleRequest(string code,
            Guid promoPageGuid)
        {
            // Arrange
            PackagesSearchRequest request = new PackagesSearchRequest();
            request.PromoPageId = promoPageGuid.ToString();
            request.IsPromo = true;

            var destinationItems = new List<DestinationItem>()
            {
                new DestinationItem()
                {
                    Type = DestinationItemType.Region,
                    Code = "ESBA",
                    Parents = new List<DestinationItem>(){
                        new DestinationItem()
                        {
                            Code = "ES",
                            Type = DestinationItemType.Country
                        },
                    }
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Region,
                    Code = "CYLN",
                    Parents = new List<DestinationItem>(){
                        new DestinationItem()
                        {
                            Code = "CY",
                            Type = DestinationItemType.Country
                        },
                    }
                }

            };

            Func<PackagesSearchRequest, Task<(object, bool)>> action = async (PackagesSearchRequest req) => (req.Geography, false);
            var destinationsSearchService = new Mock<IDestinationsService>();

            destinationsSearchService.Setup(service => service.GetPromoDestinations(promoPageGuid.ToString()))
                .ReturnsAsync(destinationItems);

            // Act
            var actual =
                await PromoUtils.SplitPromoRequest(request, action,
                    destinationsSearchService.Object, maxNumberOfHotelsByRequest);

            // Assert
            actual.Length.Should().Be(1);
            actual[0].Item1.Should().Be("ES|CY,ESBA|CYLN");
        }

        [Theory]
        [AutoData]
        public async Task PromoUtils_PromoContainsRegionsAndResorts_MutipleRequests(string code,
            Guid promoPageGuid)
        {
            // Arrange
            PackagesSearchRequest request = new PackagesSearchRequest();
            request.PromoPageId = promoPageGuid.ToString();
            request.IsPromo = true;

            var destinationItems = new List<DestinationItem>()
            {
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "ESBABA",
                    Parents = new List<DestinationItem>(){
                        new DestinationItem()
                        {
                            Code = "ES",
                            Type = DestinationItemType.Country
                        },
                        new DestinationItem()
                        {
                            Code = "ESBA",
                            Type = DestinationItemType.Region
                        }
                    }
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Region,
                    Code = "ESDD",
                    Parents = new List<DestinationItem>(){
                        new DestinationItem()
                        {
                            Code = "ES",
                            Type = DestinationItemType.Country
                        }
                    }
                }
            };

            Func<PackagesSearchRequest, Task<(object, bool)>> action = async (PackagesSearchRequest req) => (req.Geography, false);
            var destinationsSearchService = new Mock<IDestinationsService>();

            destinationsSearchService.Setup(service => service.GetPromoDestinations(promoPageGuid.ToString()))
                .ReturnsAsync(destinationItems);

            // Act
            var actual =
                await PromoUtils.SplitPromoRequest(request, action,
                    destinationsSearchService.Object, maxNumberOfHotelsByRequest);

            // Assert
            actual.Length.Should().Be(2);
            actual[0].Item1.Should().Be("ES,ESBA,ESBABA");
            actual[1].Item1.Should().Be("ES,ESDD");
        }

        [Theory]
        [AutoData]
        public async Task PromoUtils_PromoContainsCountriesAndRegionsAndResorts_MutipleRequests(string code,
           Guid promoPageGuid)
        {
            // Arrange
            PackagesSearchRequest request = new PackagesSearchRequest();
            request.PromoPageId = promoPageGuid.ToString();
            request.IsPromo = true;

            var destinationItems = new List<DestinationItem>()
            {
                new DestinationItem()
                {
                    Type = DestinationItemType.Country,
                    Code = "ES",
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "ESBABA",
                    Parents = new List<DestinationItem>(){
                        new DestinationItem()
                        {
                            Code = "ES",
                            Type = DestinationItemType.Country
                        },
                        new DestinationItem()
                        {
                            Code = "ESBA",
                            Type = DestinationItemType.Region
                        }
                    }
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Region,
                    Code = "ESDD",
                    Parents = new List<DestinationItem>(){
                        new DestinationItem()
                        {
                            Code = "ES",
                            Type = DestinationItemType.Country
                        }
                    }
                }
            };

            Func<PackagesSearchRequest, Task<(object, bool)>> action = async (PackagesSearchRequest req) => (req.Geography, false);
            var destinationsSearchService = new Mock<IDestinationsService>();

            destinationsSearchService.Setup(service => service.GetPromoDestinations(promoPageGuid.ToString()))
                .ReturnsAsync(destinationItems);

            // Act
            var actual =
                await PromoUtils.SplitPromoRequest(request, action,
                    destinationsSearchService.Object, maxNumberOfHotelsByRequest);

            // Assert
            actual.Length.Should().Be(2);
            actual[0].Item1.Should().Be("ES,ESBA,ESBABA");
            actual[1].Item1.Should().Be("ES,ESDD");
        }

        [Theory]
        [AutoData]
        public async Task PromoUtils_PromoContainsCountriesAndRegionsFromAnotherCountry_AddToCountryChildDestinations(string code,
           Guid promoPageGuid)
        {
            // Arrange
            PackagesSearchRequest request = new PackagesSearchRequest();
            request.PromoPageId = promoPageGuid.ToString();
            request.IsPromo = true;

            var destinationItems = new List<DestinationItem>()
            {
                new DestinationItem()
                {
                    Type = DestinationItemType.Country,
                    Code = "CY",
                    Children = new List<DestinationItem>(){
                        new DestinationItem()
                        {
                            Code = "CYLN",
                            Type = DestinationItemType.Region
                        }
                    }
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Region,
                    Code = "ESDD",
                    Parents = new List<DestinationItem>(){
                        new DestinationItem()
                        {
                            Code = "ES",
                            Type = DestinationItemType.Country
                        }
                    }
                }
            };

            Func<PackagesSearchRequest, Task<(object, bool)>> action = async (PackagesSearchRequest req) => (req.Geography, false);
            var destinationsSearchService = new Mock<IDestinationsService>();

            destinationsSearchService.Setup(service => service.GetPromoDestinations(promoPageGuid.ToString()))
                .ReturnsAsync(destinationItems);

            // Act
            var actual =
                await PromoUtils.SplitPromoRequest(request, action,
                    destinationsSearchService.Object, maxNumberOfHotelsByRequest);

            // Assert
            actual.Length.Should().Be(1);
            actual[0].Item1.Should().Be("CY|ES,CYLN|ESDD");
        }

        [Theory]
        [AutoData]
        public async Task PromoUtils_GeographyAndPromoPageIdSpecified_HandledByGeography(string code,
          Guid promoPageGuid)
        {
            // Arrange
            PackagesSearchRequest request = new PackagesSearchRequest();
            request.PromoPageId = promoPageGuid.ToString();
            request.Geography = "ES,ESBA|ESDD";
            request.IsPromo = true;

            var destinationItems = new List<DestinationItem>()
            {
                new DestinationItem()
                {
                    Type = DestinationItemType.Country,
                    Code = "ES",
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "ESBBBB",
                    Parents = new List<DestinationItem>(){
                        new DestinationItem()
                        {
                            Code = "ES",
                            Type = DestinationItemType.Country
                        },
                        new DestinationItem()
                        {
                            Code = "ESBB",
                            Type = DestinationItemType.Region
                        }
                    }
                },
                new DestinationItem()
                {
                    Type = DestinationItemType.Region,
                    Code = "ESDD",
                    Parents = new List<DestinationItem>(){
                        new DestinationItem()
                        {
                            Code = "ES",
                            Type = DestinationItemType.Country
                        }
                    }
                }
            };

            Func<PackagesSearchRequest, Task<(object, bool)>> action = async (PackagesSearchRequest req) => (req.Geography, false);
            var destinationsSearchService = new Mock<IDestinationsService>();

            destinationsSearchService.Setup(service => service.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()))
                .ReturnsAsync(destinationItems.ToArray);

            // Act
            var actual =
                await PromoUtils.SplitPromoRequest(request, action,
                    destinationsSearchService.Object, maxNumberOfHotelsByRequest);

            // Assert
            actual.Length.Should().Be(1);
            actual[0].Item1.Should().Be("ES,ESBA|ESDD");
        }

    }
}