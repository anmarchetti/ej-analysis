using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Themes;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using System.Collections.ObjectModel;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Offers
{
    public class HotelThemeServiceTests
    {
        private readonly ITestOutputHelper _testOutput;
        private readonly Mock<IReferenceDataService> _referenceDataServiceMock = new Mock<IReferenceDataService>();
        private readonly HotelThemeService _sut;

        public HotelThemeServiceTests(ITestOutputHelper testOutput)
        {
            _testOutput = testOutput;
            var cmsSettings = new CmsSettings
            {
                FacilityMatrix = new FacilityMatrixSettings
                {
                    AdultHolidayCode = "adu",
                    FamilyHolidayCode = "fam"
                }
            };

            _sut = new HotelThemeService(_referenceDataServiceMock.Object, Options.Create(cmsSettings));
        }

        [Theory]
        [InlineData("Beach holiday.", "EUBA", PackageThemeType.Beach)]
        [InlineData("City holiday.", "EUCU", PackageThemeType.City)]
        [InlineData("Lake holiday.", "EULA", PackageThemeType.Lake)]
        public async Task GetPackageThemeTypeTests(string reason, string prom, PackageThemeType packageThemeType)
        {
            //Arrange
            _testOutput.WriteLine(reason);

            _referenceDataServiceMock.Setup(x => x.GetAllThemes()).ReturnsAsync(new List<PackageTheme>
            {
                new PackageTheme
                {
                    Code = "L",
                    Name = "Lake",
                    ItemName = "Lake",
                    Types = new List<ThemeType>
                    {
                        new ThemeType
                        {
                            Code = "LU"
                        }
                    }
                },
                new PackageTheme
                {
                    Code = "C",
                    Name = "City",
                    ItemName = "City",
                    Types = new List<ThemeType>
                    {
                        new ThemeType
                        {
                            Code = "CU"
                        }
                    }
                },
                new PackageTheme
                {
                    Code = "B",
                    Name = "Beach",
                    ItemName = "Beach",
                    Types = new List<ThemeType>
                    {
                        new ThemeType
                        {
                            Code = "BU"
                        }
                    }
                }
            });

            //Act
            var result = await _sut.GetPackageThemeType(prom);

            //Assert
            result.Should().Be(packageThemeType);
        }

        [Fact]
        public async Task GetPackageThemeTypeTests_InvalidProm_ThrowException()
        {
            //Arrange
            _testOutput.WriteLine("Invalid prom. Throw exception.");

            _referenceDataServiceMock.Setup(x => x.GetAllThemes()).ReturnsAsync(new List<PackageTheme>
            {
                new PackageTheme
                {
                    Code = "L",
                    Name = "Lake",
                    Types = new List<ThemeType>
                    {
                        new ThemeType
                        {
                            Code = "LU"
                        }
                    }
                },
            });

            //Act
            Func<Task<PackageThemeType>> act = () => _sut.GetPackageThemeType("invalid prom");

            //Assert
            await act.Should().ThrowAsync<ArgumentException>();
        }
        
        [Fact]
        public async Task GetReletedThemeProms_ReturnsEmpty_WhenPromIsNullOrEmpty()
        {
            // Arrange
            string prom = null;

            // Act
            var result = await _sut.GetReletedThemeProms(prom!);

            // Assert
            result.Should().BeEmpty();
        }
        
        [Fact]
        public async Task GetReletedThemeProms_ReturnsExpectedResults()
        {
            // Arrange
            string prom = "EUBA";
            var themeSettings = new List<PackageTheme>
            {
                new PackageTheme
                {
                    Code = "B",
                    Types = new List<ThemeType>
                    {
                        new ThemeType { Code = "BA" },
                        new ThemeType { Code = "BF" },
                        new ThemeType { Code = "BL" }
                    }
                }
            };

            _referenceDataServiceMock.Setup(s => s.GetAllThemes())
                .ReturnsAsync(themeSettings);

            // Act
            var result = await _sut.GetReletedThemeProms(prom);

            // Assert
            result.Should().BeEquivalentTo(new List<string> { "EUBA", "EUBF", "EUBL" });
        }
        
        [Fact]
        public async Task GetReletedThemeProms_ThrowsException_WhenThemeSettingNotFound()
        {
            // Arrange
            string prom = "ABC123";
            var themeSettings = new List<PackageTheme>();

            _referenceDataServiceMock.Setup(s => s.GetAllThemes())
                .ReturnsAsync(themeSettings);

            // Act
            Func<Task> act = async () => await _sut.GetReletedThemeProms(prom);

            // Assert
            await act.Should().ThrowAsync<InvalidOperationException>();
        }

        public static readonly List<object[]> GetThemeTestData = new List<object[]> {
            new object[] { null, null, null, null},
            new object[] { "TE", null, null, null },
            new object[] { "EUBA", null, null, null },
            new object[] { "EUBA", new List<PackageTheme>(), null, null },
            new object[] { "EUBA", new List<PackageTheme>() {
                new PackageTheme(){
                    Code = "B",
                    Types = new List<ThemeType>()
                    {
                        new ThemeType()
                        {
                            Code = "BA"
                        }
                    }
                }
            },
            new PackageTheme(){
                Code = "B",
                Types = null
            },
            new ThemeType()
            {
                Code = "BA"
            }},
        };

        [Theory]
        [MemberData(nameof(GetThemeTestData))]
        public async Task GetTheme_TestData(string promCode, List<PackageTheme> themeSettings, PackageTheme resTheme, ThemeType resType)
        {
            // Arrange 
            _referenceDataServiceMock.Setup(x => x.GetAllThemes()).ReturnsAsync(themeSettings);

            // Act
            var (theme, type) = await _sut.GetTheme(promCode);

            // Assert
            theme.Should().BeEquivalentTo(resTheme);
            type.Should().BeEquivalentTo(resType);
        }

        public static readonly List<object[]> CompareThemeCodeTestData = new List<object[]> {
            new object[] { null, null, false},
            new object[] { "EUBA", null, false },
            new object[] { null, "BA", false },
            new object[] { "EUBA", "BA", true },
            new object[] { "EUBA", "ba", true },
            new object[] { "euba", "BA", true },
            new object[] { "EUBA", "CL", false },
            new object[] { "EU", "BA", false },
        };

        [Theory]
        [MemberData(nameof(CompareThemeCodeTestData))]
        public void CompareThemeCode_TestData(string promCode, string code, bool res)
        {
            // Act
            var actual = HotelThemeService.CompareThemeCode(promCode, code);

            // Assert
            actual.Should().Be(res);
        }

        [Theory]
        [MemberData(nameof(GetHotelTypeTestData))]
        public async Task GetHotelType(HotelType[] facilityMatrix, BaseSearchRequest request, ThemeType expectedTheme)
        {
            // Arrange
            var mockData = expectedTheme == null ? null : new List<HotelTypeFilterConfiguration> { CreateHotelTypeFilterConfiguration(expectedTheme.Code) };
            _referenceDataServiceMock.Setup(x => x.GetFacilityMatrixConfiguration()).ReturnsAsync(mockData);

            // Act
            var theme = await _sut.GetHotelType(facilityMatrix, request);

            // Assert
            theme.Should().Be(expectedTheme);
        }

        [Theory]
        [MemberData(nameof(GetHotelTypeWithPaxMixTestData))]
        public async Task GetHotelTypeWithPaxMix(HotelType[] facilityMatrix, int nChildren, int nInfants, ThemeType expectedTheme)
        {
            // Arrange
            var mockData = expectedTheme == null ? null : new List<HotelTypeFilterConfiguration> { CreateHotelTypeFilterConfiguration(expectedTheme.Code) };
            _referenceDataServiceMock.Setup(x => x.GetFacilityMatrixConfiguration()).ReturnsAsync(mockData);

            // Act
            var theme = await _sut.GetHotelType(facilityMatrix, nChildren, nInfants);

            // Assert
            theme.Should().Be(expectedTheme);
        }

        public static readonly Collection<object[]> GetHotelTypeWithPaxMixTestData =
        [
            // family
            new object[]
            {
                new HotelType[] {CreateHotelType("adu", 5), CreateHotelType("fam", 3), CreateHotelType("lux", 4)},
                2, //children
                1, //infants
                CreateThemeType("fam")
            },
            
            // adult only
            new object[]
            {
                new HotelType[] {CreateHotelType("adu", 5), CreateHotelType("fam", 3), CreateHotelType("lux", 4)},
                0, //children
                0, //infants
                CreateThemeType("adu")
            }
        ];

        public static readonly List<object[]> GetHotelTypeTestData = new List<object[]>
        {
            //pick highest rated
            new object[]
            {
                new HotelType[] { CreateHotelType("adu", 5), CreateHotelType("fam", 3), CreateHotelType ("lux", 4) },
                new BaseSearchRequest(),
                CreateThemeType("adu")
            },

            //pick highest rated from provided types
            new object[]
            {
                new HotelType[] { CreateHotelType("adu", 5), CreateHotelType("fam", 3), CreateHotelType ("lux", 4) },
                new BaseSearchRequest { HotelTypes = "fam,lux" },
                CreateThemeType("lux")
            },

            //return null on empty facility matrix
            new object[]
            {
                null,
                null,
                null,

            },

            //hotel qualifies only for one type (adult), though pax mix has children
            new object[]
            {
                new HotelType[] { CreateHotelType("adu", 5) },
                new BaseSearchRequest
                {
                    Room = new List<RoomAllocation>()
                    {
                        new RoomAllocation
                        {
                            Adults = 2,
                            Children = 1,
                        }
                    }
                },
                CreateThemeType("adu")
            },

            //only adults in the party and hotel applies for adult type => show adult hotel type
            new object[]
            {
                new HotelType[] { CreateHotelType("adu", 5), CreateHotelType("fam", 6), CreateHotelType ("lux", 8) },
                new BaseSearchRequest
                {
                    Room = new List<RoomAllocation>()
                    {
                        new RoomAllocation
                        {
                            Adults = 2
                        }
                    }
                },
                CreateThemeType("adu")
            },

            //child in the party and hotel applies for family type => show family hotel type
            new object[]
            {
                new HotelType[] { CreateHotelType("adu", 5), CreateHotelType("fam", 4) },
                new BaseSearchRequest
                {
                    Room = new List<RoomAllocation>()
                    {
                        new RoomAllocation
                        {
                            Adults = 2,
                            Children = 1,
                        }
                    }
                },
                CreateThemeType("fam")
            },

            //infant in the party and hotel applies for family type => show family hotel type
            new object[]
            {
                new HotelType[] { CreateHotelType("adu", 5), CreateHotelType("fam", 4) },
                new BaseSearchRequest
                {
                    Room = new List<RoomAllocation>()
                    {
                        new RoomAllocation
                        {
                            Adults = 2,
                            Infants = 1
                        }
                    }
                },
                CreateThemeType("fam")
            },

            //only adults in the party and hotel applies for adult type, however family and luxury selected in filter => show highest rated from filters
            new object[]
            {
                new HotelType[] { CreateHotelType("adu", 5), CreateHotelType("fam", 6), CreateHotelType ("lux", 8) },
                new BaseSearchRequest
                {
                    HotelTypes = "fam,lux",
                    Room = new List<RoomAllocation>()
                    {
                        new RoomAllocation
                        {
                            Adults = 2
                        }
                    }
                },
                CreateThemeType("lux")
            },
        };

        private static HotelTypeFilterConfiguration CreateHotelTypeFilterConfiguration(string code)
        {
            return new HotelTypeFilterConfiguration()
            {
                Code = code,
                Description = $"{code}-description",
                FilledIcon = $"{code}-filledIcon",
                Icon = $"{code}-icon",
                Name = $"{code}-name",
                TooltipText = $"{code}-tooltip",
                TypeTitle = $"{code}-title",
            };
        }

        private static HotelType CreateHotelType(string code, int score)
        {
            return new HotelType
            {
                Code = code,
                Value = score
            };
        }

        private static ThemeType CreateThemeType(string code)
        {
            return new ThemeType
            {
                Code = code,
                Description = $"{code}-description",
                FilledIcon = $"{code}-filledIcon",
                Icon = $"{code}-icon",
                Name = $"{code}-name",
                TypeAndThemeTitle = $"{code}-title"
            };
        }
    }
}
