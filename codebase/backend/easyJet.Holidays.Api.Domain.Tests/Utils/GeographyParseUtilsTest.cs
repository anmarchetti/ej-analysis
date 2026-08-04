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
    public class GeographyParseUtilsTest
    {
        public static readonly List<object[]> BuildGeographyFieldTestData = new List<object[]>
        {
            new object[] {null, "ALL"},
            new object[] {new List<DestinationItem>(), "ALL"},
            new object[]
            {
                new List<DestinationItem>()
                {
                    new DestinationItem() {Code = "ES", Type = DestinationItemType.Country},
                    new DestinationItem() {Code = "IT", Type = DestinationItemType.Country}
                },
                "ES|IT"
            },
            new object[]
            {
                new List<DestinationItem>()
                {
                    new DestinationItem()
                    {
                        Code = "ESBA",
                        Type = DestinationItemType.Region,
                        Parents = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Code = "ES",
                                Type = DestinationItemType.Country
                            }
                        }
                    },
                    new DestinationItem()
                    {
                        Code = "ESDD",
                        Type = DestinationItemType.Region,
                        Parents = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Code = "ES",
                                Type = DestinationItemType.Country
                            }
                        }
                    },
                },
                "ES,ESBA|ESDD"
            },
            new object[]
            {
                new List<DestinationItem>()
                {
                    new DestinationItem()
                    {
                        Code = "ESBABA",
                        Type = DestinationItemType.Resort,
                        Parents = new List<DestinationItem>()
                        {
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
                        Code = "ESDDBB",
                        Type = DestinationItemType.Resort,
                        Parents = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Code = "ES",
                                Type = DestinationItemType.Country
                            },
                            new DestinationItem()
                            {
                                Code = "ESDD",
                                Type = DestinationItemType.Region
                            }
                        }
                    },
                },
                "ES,ESBA|ESDD,ESBABA|ESDDBB"
            },
        };

        public static readonly List<object[]> BuildDestinationsItemsTestData = new List<object[]>
        {
            new object[] {new List<DestinationItem>(), ""},
            new object[]
            {
                new List<DestinationItem>()
                {
                    new DestinationItem() {Code = "ES", Type = DestinationItemType.Country},
                    new DestinationItem() {Code = "IT", Type = DestinationItemType.Country}
                },
                "ES|IT"
            },
            new object[]
            {
                new List<DestinationItem>()
                {
                    new DestinationItem()
                    {
                        Code = "ESBA",
                        Type = DestinationItemType.Region,
                        Parents = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Code = "ES",
                                Type = DestinationItemType.Country
                            }
                        }
                    },
                    new DestinationItem()
                    {
                        Code = "ESDD",
                        Type = DestinationItemType.Region,
                        Parents = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Code = "ES",
                                Type = DestinationItemType.Country
                            }
                        }
                    },
                },
                "ESBA|ESDD"
            },
            new object[]
            {
                new List<DestinationItem>()
                {
                    new DestinationItem()
                    {
                        Code = "ESBA",
                        Type = DestinationItemType.Resort,
                        Parents = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Code = "ES",
                                Type = DestinationItemType.Country
                            },
                        }
                    },
                    new DestinationItem()
                    {
                        Code = "ESBABA",
                        Type = DestinationItemType.Resort,
                        Parents = new List<DestinationItem>()
                        {
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
                        Code = "ESDDBB",
                        Type = DestinationItemType.Resort,
                        Parents = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Code = "ES",
                                Type = DestinationItemType.Country
                            },
                            new DestinationItem()
                            {
                                Code = "ESDD",
                                Type = DestinationItemType.Region
                            }
                        }
                    },
                },
                "ESBA,ESBABA|ESDDBB"
            },
        };

        public static readonly List<object[]> BuildAccomCodesFieldTestData = new List<object[]>
        {
            new object[] {null, null},
            new object[] {new List<DestinationItem>(), null},
            new object[]
            {
                new List<DestinationItem>()
                {
                    new DestinationItem() {Code = "HRDB0020", Type = DestinationItemType.Hotel},
                    new DestinationItem() {Code = "HRDB0021", Type = DestinationItemType.Hotel}
                },
                "HRDB0020,HRDB0021"
            },
            new object[]
            {
                new List<DestinationItem>()
                {
                    new DestinationItem()
                    {
                        Code = "ESBA",
                        Type = DestinationItemType.Region,
                        Parents = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Code = "ES",
                                Type = DestinationItemType.Country
                            }
                        }
                    },
                    new DestinationItem()
                    {
                        Code = "ESDD",
                        Type = DestinationItemType.Region,
                        Parents = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Code = "ES",
                                Type = DestinationItemType.Country
                            }
                        }
                    },
                },
                ""
            },
            new object[]
            {
                new List<DestinationItem>()
                {
                    new DestinationItem()
                    {
                        Code = "HRDB0020",
                        Type = DestinationItemType.Hotel
                    },
                    new DestinationItem()
                    {
                        Code = "HRDB0021",
                        Type = DestinationItemType.Hotel
                    },
                    new DestinationItem()
                    {
                        Code = "HRDB0022",
                        Type = DestinationItemType.Hotel
                    },
                    new DestinationItem()
                    {
                        Code = "ESDDBB",
                        Type = DestinationItemType.Resort,
                        Parents = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Code = "ES",
                                Type = DestinationItemType.Country
                            },
                            new DestinationItem()
                            {
                                Code = "ESDD",
                                Type = DestinationItemType.Region
                            }
                        }
                    },
                },
                "HRDB0020,HRDB0021,HRDB0022"
            },
        };

        [Theory]
        [MemberData(nameof(BuildGeographyFieldTestData))]
        public void BuildGeographyField_Test_Data(List<DestinationItem> destinations, string result)
        {
            // Act
            var actual = GeographyParseUtils.BuildGeographyField(destinations);

            // Assert
            actual.Should().Be(result);
        }

        [Theory]
        [MemberData(nameof(BuildAccomCodesFieldTestData))]
        public void BuildAccomCodesField_TestData_ReturnsCorrectResult(List<DestinationItem> destinations,
            string result)
        {
            // Act
            var actual = GeographyParseUtils.BuildAccomCodesField(destinations);

            // Assert
            actual.Should().Be(result);
        }

        [Fact]
        public async Task DoSplitebByGeographyRequests_Single_Request()
        {
            PackagesSearchRequest request = new PackagesSearchRequest();
            var res = (new object(), false);
            async Task<(object, bool)> Action(PackagesSearchRequest req) => await Task.FromResult(res);
            var destinationsSearchService = new Mock<IDestinationsService>();
            destinationsSearchService.Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()));

            // Arrange
            var actual = await GeographyParseUtils.DoSplitByGeographyRequests(request,
                (Func<PackagesSearchRequest, Task<(object, bool)>>)Action, destinationsSearchService.Object);

            // Assert
            actual.Length.Should().Be(1);
            actual[0].Should().Be(res);
        }

        [Fact]
        public async Task DoSplitebByGeographyRequests_Sinle_Request_ResortOnly()
        {
            PackagesSearchRequest request = new PackagesSearchRequest();
            request.Geography = "ES,ESBA,ESBABA";
            Func<PackagesSearchRequest, Task<(object, bool)>> action = async (PackagesSearchRequest req) =>
                (req.Geography, false);
            var destinationsSearchService = new Mock<IDestinationsService>();
            destinationsSearchService.Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()))
                .Returns(Task.FromResult(new List<DestinationItem>()
                {
                    new DestinationItem()
                    {
                        Type = DestinationItemType.Resort,
                        Code = "ESBABA",
                        Parents = new List<DestinationItem>()
                        {
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
                    }
                }.ToArray()));

            // Arrange
            var actual =
                await GeographyParseUtils.DoSplitByGeographyRequests(request, action, destinationsSearchService.Object);

            // Assert
            actual.Length.Should().Be(1);
            actual[0].Item1.Should().Be("ES,ESBA,ESBABA");
        }

        [Fact]
        public async Task DoSplitebByGeographyRequests_Mutiple_Requests()
        {
            PackagesSearchRequest request = new PackagesSearchRequest();
            request.Geography = "ES,ESBA|ESDD,ESBABA";
            Func<PackagesSearchRequest, Task<(object, bool)>> action = async (PackagesSearchRequest req) =>
                (req.Geography, false);
            var destinationsSearchService = new Mock<IDestinationsService>();
            destinationsSearchService.Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()))
                .Returns(Task.FromResult(new List<DestinationItem>()
                {
                    new DestinationItem()
                    {
                        Type = DestinationItemType.Resort,
                        Code = "ESBABA",
                        Parents = new List<DestinationItem>()
                        {
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
                        Parents = new List<DestinationItem>()
                        {
                            new DestinationItem()
                            {
                                Code = "ES",
                                Type = DestinationItemType.Country
                            }
                        }
                    }
                }.ToArray()));

            // Arrange
            var actual =
                await GeographyParseUtils.DoSplitByGeographyRequests(request, action, destinationsSearchService.Object);

            // Assert
            actual.Length.Should().Be(2);
            actual[0].Item1.Should().Be("ES,ESBA,ESBABA");
            actual[1].Item1.Should().Be("ES,ESDD");
        }

        [Theory]
        [AutoData]
        public async Task DoSplitebByGeographyRequests_IfAccomCodesSpecified_SingleRequest(string accomCodes,
            string geography)
        {
            // Arrange
            PackagesSearchRequest request = new PackagesSearchRequest();
            request.AccomCodes = accomCodes;
            request.Geography = geography;
            request.IsPromo = false;

            var res = (new object(), false);
            async Task<(object, bool)> Action(PackagesSearchRequest req) => res;

            var destinationsSearchService = new Mock<IDestinationsService>();
            destinationsSearchService.Setup(x => x.GetDestinationsByCodes(It.IsAny<string[]>(), It.IsAny<bool>()));

            // Act
            var actual =
                await GeographyParseUtils.DoSplitByGeographyRequests(request,
                    (Func<PackagesSearchRequest, Task<(object, bool)>>)Action,
                    destinationsSearchService.Object);

            // Assert
            actual.Length.Should().Be(1);
            actual[0].Should().Be(res);
        }

        [Theory]
        [MemberData(nameof(BuildDestinationsItemsTestData))]
        public void ParseDestinationItemsByType_TestData_ReturnsCorrectResult(List<DestinationItem> destinations,
            string result)
        {
            // Arrange
            var countries = destinations.Where(item => item.Type == DestinationItemType.Country)
                .Select(item => item.Code).ToList();
            var regions = destinations.Where(item => item.Type == DestinationItemType.Region).Select(item => item.Code).ToList();
            var resorts = destinations.Where(item => item.Type == DestinationItemType.Resort).Select(item => item.Code);

            // Act
            var destinationItemsByType = GeographyParseUtils.ParseDestinationItemsByType(destinations);

            var countriesInfo = destinationItemsByType.GetValueOrDefault(DestinationItemType.Country) ?? new List<DestinationItem>();
            var regionsInfo = destinationItemsByType.GetValueOrDefault(DestinationItemType.Region) ?? new List<DestinationItem>();
            var resortsInfo = destinationItemsByType.GetValueOrDefault(DestinationItemType.Resort) ?? new List<DestinationItem>();

            // Assert
            Assert.Equal(countries, countriesInfo.Select(item => item.Code));
            Assert.Equal(regions, regionsInfo.Select(item => item.Code));
            Assert.Equal(resorts, resortsInfo.Select(item => item.Code));
        }

        [Theory]
        [InlineData("")]
        [InlineData("ES")]
        [InlineData("ES|IT")]
        [InlineData("ES,ESBA|ESDD")]
        [InlineData("ES,ESBA|ESDD,ESBABA|ESDDBB")]
        public void ParseGeographyField_TestData_ReturnsCorrectResult(string geography)
        {
            // Act
            var (countriesInfo, regionsInfo, resortsInfo) = GeographyParseUtils.ParseGeographyField(geography);
            var countries = (string.Join("|", countriesInfo));
            var regions = string.Join("|", regionsInfo);
            var resorts = string.Join("|", resortsInfo);
            var actual = string.Join(",",
                new[] { countries, regions, resorts }.Where(s => !string.IsNullOrWhiteSpace(s)));

            // Assert
            actual.Should().Be(geography);
        }

        [Theory]
        [InlineData("", "")]
        [InlineData("ES", "ES")]
        [InlineData("ES|IT", "ES,IT")]
        [InlineData("ES,ESBA|ESDD", "ES,ESBA,ESDD")]
        [InlineData("ES,ESBA|ESDD,ESBABA|ESDDBB", "ES,ESBA,ESDD,ESBABA,ESDDBB")]
        public async Task GetAllDestinationsCodes_TestData_ReturnsCorrectResult(string geography, string result)
        {
            // Act
            var actual = string.Join(",", GeographyParseUtils.GetAllDestinationsCodes(geography));

            // Assert
            actual.Should().Be(result);
        }

        [Fact]
        public async Task SplitRequestByDestinations_RegionsAndResortsSpecified_MutipleRequests()
        {
            PackagesSearchRequest request = new PackagesSearchRequest();
            Func<PackagesSearchRequest, Task<(object, bool)>> action = async req => (req.Geography, false);

            var destinationItems = new List<DestinationItem>()
            {
                new DestinationItem()
                {
                    Type = DestinationItemType.Resort,
                    Code = "ESBABA",
                    Parents = new List<DestinationItem>()
                    {
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
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Code = "ES",
                            Type = DestinationItemType.Country
                        }
                    }
                }
            };

            // Arrange
            var actual = await GeographyParseUtils.SplitRequestByDestinations(request, action, destinationItems);

            // Assert
            actual.Length.Should().Be(2);
            actual[0].Item1.Should().Be("ES,ESBA,ESBABA");
            actual[1].Item1.Should().Be("ES,ESDD");
        }

        [Fact]
        public async Task SplitRequestByDestinations_RegionAndResortIsParentOfRegion_OneRequestByResorts()
        {
            PackagesSearchRequest request = new PackagesSearchRequest { Geography = "ES,ESTF,ESTFPL" };
            Func<PackagesSearchRequest, Task<(object, bool)>> action = async req => (req.Geography, false);

            var destinationItems = new List<DestinationItem>()
            {
                new DestinationItem()
                {
                    Code = "ESTFPL",
                    Type = DestinationItemType.Resort,
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Code = "ES",
                            Type = DestinationItemType.Country
                        },
                        new DestinationItem()
                        {
                            Code = "ESTF",
                            Type = DestinationItemType.Region,
                        }}
                },
                new DestinationItem()
                {
                    Code = "ESTF", // parent for "ESTFPL"
                    Type = DestinationItemType.Region,
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Code = "ES",
                            Type = DestinationItemType.Country
                        }
                    },
                }
            };

            // Arrange
            var actual = await GeographyParseUtils.SplitRequestByDestinations(request, action, destinationItems);

            // Assert
            actual.Length.Should().Be(1);
            actual[0].Item1.Should().Be("ES,ESTF,ESTFPL");
        }

        [Fact]
        public async Task SplitRequestByDestinations_RegionsSpecified_SingleRequest()
        {
            PackagesSearchRequest request = new PackagesSearchRequest();
            request.Geography = "ES,ESBA|ESDD";
            Func<PackagesSearchRequest, Task<(object, bool)>> action = async req => (req.Geography, false);

            var destinationItems = new List<DestinationItem>()
            {
                new DestinationItem()
                {
                    Type = DestinationItemType.Region,
                    Code = "ESBA",
                    Parents = new List<DestinationItem>()
                    {
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
                    Code = "ESDD",
                    Parents = new List<DestinationItem>()
                    {
                        new DestinationItem()
                        {
                            Code = "ES",
                            Type = DestinationItemType.Country
                        }
                    }
                }
            };

            // Arrange
            var actual = await GeographyParseUtils.SplitRequestByDestinations(request, action, destinationItems);

            // Assert
            actual.Length.Should().Be(1);
            actual[0].Item1.Should().Be("ES,ESBA|ESDD");
        }

        [Fact]
        public void ParseDestinationsField_TestData_ReturnsCorrectResult()
        {
            // Assert
            var destinations = new string[] { "country:ES", "region:ESBC", "virtualregion:VESBC", "resort:ESBCDD" };

            // Act
            var (countriesInfo, regionsInfo, resortsInfo) = GeographyParseUtils.ParseDestinationsField(destinations);

            // Assert
            countriesInfo.Should().Contain("ES");
            regionsInfo.Should().Contain("ESBC");
            regionsInfo.Should().Contain("VESBC");
            resortsInfo.Should().Contain("ESBCDD");
        }

        public static readonly List<object[]> ParseDestinationsFieldEmptyTestDat = new List<object[]>
        {
            new object[] { null },
            new object[] { Array.Empty<string>() },
        };

        [Theory]
        [MemberData(nameof(ParseDestinationsFieldEmptyTestDat))]
        public void ParseDestinationsField_ShouldReturnEmptyDestinations_IfArgumentIsEmptyOrEmpty(string[] destinations)
        {
            // Act
            var (countriesInfo, regionsInfo, resortsInfo) = GeographyParseUtils.ParseDestinationsField(destinations);

            // Assert
            countriesInfo.Should().BeEmpty();
            regionsInfo.Should().BeEmpty();
            resortsInfo.Should().BeEmpty();
        }

        [Fact]
        public void SplitGeographyByDestinations_TestData_ReturnsCorrectResult()
        {
            var destinationItems = new List<DestinationItem>()
            {
                new()
                {
                    Type = DestinationItemType.Country,
                    Code = "ES",
                },
                new()
                {
                    Type = DestinationItemType.Region,
                    Code = "ESBA",
                    Parents =
                    [
                        new()
                        {
                            Code = "ES",
                            Type = DestinationItemType.Country
                        },
                    ]
                },
                new()
                {
                    Type = DestinationItemType.Region,
                    Code = "ESDD",
                    Parents =
                    [
                        new()
                        {
                            Code = "ES",
                            Type = DestinationItemType.Country
                        }
                    ]
                },
                new()
                {
                    Type = DestinationItemType.Resort,
                    Code = "ESDDXX",
                    Parents =
                    [
                        new()
                        {
                            Code = "ESDD",
                            Type = DestinationItemType.Region
                        },
                        new()
                        {
                            Code = "ES",
                            Type = DestinationItemType.Country
                        }
                    ]
                },
                new()
                {
                    Type = DestinationItemType.Hotel,
                    Code = "MT0001X2",
                    Parents =
                    [
                        new()
                        {
                            Code = "MTKLNP",
                            Type = DestinationItemType.Resort
                        },
                        new()
                        {
                            Code = "MTKL",
                            Type = DestinationItemType.Region
                        },
                        new()
                        {
                            Code = "MT",
                            Type = DestinationItemType.Country
                        }
                    ]
                }
            };

            // Arrange
            var (countryCodes, regionCodes, resortCodes) = GeographyParseUtils.SplitGeographyByDestinations(destinationItems);

            // Assert
            countryCodes.Count.Should().Be(2);
            countryCodes.Should().Contain(["MT", "ES"]);
            regionCodes.Count.Should().Be(3);
            regionCodes.Should().Contain(["MTKL", "ESDD", "ESBA"]);
            resortCodes.Count.Should().Be(2);
            resortCodes.Should().Contain(["MTKLNP", "ESDDXX"]);
        }

        [Fact]
        public void SplitGeographyByDestinations_VirtualResort_AddsRelatedResortsToResortCodes()
        {
            // Arrange
            var destinationItems = new List<DestinationItem>()
            {
                new()
                {
                    Type = DestinationItemType.VirtualResort,
                    Code = "VRESORT1",
                    RelatedResorts = new[] { "RESORT1", "RESORT2", "RESORT3" }
                }
            };

            // Act
            var (countryCodes, regionCodes, resortCodes) = GeographyParseUtils.SplitGeographyByDestinations(destinationItems);

            // Assert
            countryCodes.Should().BeEmpty();
            regionCodes.Should().BeEmpty();
            resortCodes.Count.Should().Be(3);
            resortCodes.Should().Contain(["RESORT1", "RESORT2", "RESORT3"]);
        }

        [Fact]
        public void SplitGeographyByDestinations_VirtualResortWithMultipleItems_AddsAllRelatedResorts()
        {
            // Arrange
            var destinationItems = new List<DestinationItem>()
            {
                new()
                {
                    Type = DestinationItemType.VirtualResort,
                    Code = "VRESORT1",
                    RelatedResorts = new[] { "RESORT1", "RESORT2" }
                },
                new()
                {
                    Type = DestinationItemType.VirtualResort,
                    Code = "VRESORT2",
                    RelatedResorts = new[] { "RESORT3", "RESORT4" }
                },
                new()
                {
                    Type = DestinationItemType.Resort,
                    Code = "RESORT5",
                    Parents =
                    [
                        new()
                        {
                            Code = "REGION1",
                            Type = DestinationItemType.Region
                        },
                        new()
                        {
                            Code = "ES",
                            Type = DestinationItemType.Country
                        }
                    ]
                }
            };

            // Act
            var (countryCodes, regionCodes, resortCodes) = GeographyParseUtils.SplitGeographyByDestinations(destinationItems);

            // Assert
            countryCodes.Should().BeEmpty();
            regionCodes.Should().BeEmpty();
            resortCodes.Count.Should().Be(5);
            resortCodes.Should().Contain(["RESORT1", "RESORT2", "RESORT3", "RESORT4", "RESORT5"]);
        }

        [Fact]
        public void SplitGeographyByDestinations_VirtualResortWithNullRelatedResorts_HandlesGracefully()
        {
            // Arrange
            var destinationItems = new List<DestinationItem>()
            {
                new()
                {
                    Type = DestinationItemType.VirtualResort,
                    Code = "VRESORT1",
                    RelatedResorts = null
                }
            };

            // Act
            var (countryCodes, regionCodes, resortCodes) = GeographyParseUtils.SplitGeographyByDestinations(destinationItems);

            // Assert
            countryCodes.Should().BeEmpty();
            regionCodes.Should().BeEmpty();
            resortCodes.Should().BeEmpty();
        }

        [Fact]
        public void SplitGeographyByDestinations_VirtualResortWithEmptyRelatedResorts_HandlesGracefully()
        {
            // Arrange
            var destinationItems = new List<DestinationItem>()
            {
                new()
                {
                    Type = DestinationItemType.VirtualResort,
                    Code = "VRESORT1",
                    RelatedResorts = Array.Empty<string>()
                }
            };

            // Act
            var (countryCodes, regionCodes, resortCodes) = GeographyParseUtils.SplitGeographyByDestinations(destinationItems);

            // Assert
            countryCodes.Should().BeEmpty();
            regionCodes.Should().BeEmpty();
            resortCodes.Should().BeEmpty();
        }
    }
}