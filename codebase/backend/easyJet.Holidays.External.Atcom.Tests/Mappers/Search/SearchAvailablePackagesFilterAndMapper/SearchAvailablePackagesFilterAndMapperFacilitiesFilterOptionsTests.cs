using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.Search
{
    public class SearchAvailablePackagesFilterAndMapperFacilitiesFilterOptionsTests
    {
        private readonly SearchAvailablePackagesFilterAndMapper _sut;

        public SearchAvailablePackagesFilterAndMapperFacilitiesFilterOptionsTests()
        {
            var fixture = MapperTestsHelper.PrepareMapperFixture();
            _sut = fixture.Create<SearchAvailablePackagesFilterAndMapper>();
        }

        /*
         * BOARD TYPE FILTER OPTIONS TESTS
         * 1. no response
         * 2. empty response
         * 3. valid response - collect options from units
         * 4. valid response - collect options from alt boards
         * 5. valid response - same board presented in unit and alt board
         * 6. valid response - collect from filtered set
        */

        [Theory]
        [MemberData(nameof(MapperFacilitiesFilterOptionsTestsData.Map_NullResponse),
            MemberType = typeof(MapperFacilitiesFilterOptionsTestsData))]
        public async Task Map_NullResponse(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(MapperFacilitiesFilterOptionsTestsData.Map_EmptyResponse),
            MemberType = typeof(MapperFacilitiesFilterOptionsTestsData))]
        public async Task Map_EmptyResponse(List<AvCacheResultOffersOfferExtended> offers,
            PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Offers.Count.Should().Be(0);
        }

        [Theory]
        [MemberData(nameof(MapperFacilitiesFilterOptionsTestsData.Map_Collect_All_Options),
            MemberType = typeof(MapperFacilitiesFilterOptionsTestsData))]
        public async Task Map_CollectOptions(List<AvCacheResultOffersOfferExtended> offers,
            PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Filters.FirstOrDefault(x => x.Code == AvailableFilters.Facilities).Should().NotBeNull();

            var facilitiesChildren = actual.SearchOffersResponse.Filters.First(x => x.Code == AvailableFilters.Facilities).Options.SelectMany(x => x.Children);

            facilitiesChildren.FirstOrDefault(o => o.Code == "ABCD").Should().NotBeNull();
            facilitiesChildren.FirstOrDefault(o => o.Code == "ABCD").Count.Should().Be(1);

            facilitiesChildren.FirstOrDefault(o => o.Code == "CDEF").Should().NotBeNull();
            facilitiesChildren.FirstOrDefault(o => o.Code == "CDEF").Count.Should().Be(2);

            facilitiesChildren.FirstOrDefault(o => o.Code == "DEFA").Should().NotBeNull();
            facilitiesChildren.FirstOrDefault(o => o.Code == "DEFA").Count.Should().Be(3);
        }

        [Theory]
        [MemberData(nameof(MapperFacilitiesFilterOptionsTestsData.Map_Options_Filtered_Set),
            MemberType = typeof(MapperFacilitiesFilterOptionsTestsData))]
        public async Task Map_CollectOptions_Filtered_Set(List<AvCacheResultOffersOfferExtended> offers,
            PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Filters.FirstOrDefault(x => x.Code == AvailableFilters.Facilities).Should().NotBeNull();

            var facilitiesChildren = actual.SearchOffersResponse.Filters.First(x => x.Code == AvailableFilters.Facilities).Options.SelectMany(x => x.Children);

            facilitiesChildren.FirstOrDefault(o => o.Code == "ABCD").Should().NotBeNull();
            facilitiesChildren.FirstOrDefault(o => o.Code == "ABCD").Count.Should().Be(1);

            facilitiesChildren.FirstOrDefault(o => o.Code == "CDEF").Should().NotBeNull();
            facilitiesChildren.FirstOrDefault(o => o.Code == "CDEF").Count.Should().Be(1);

            facilitiesChildren.FirstOrDefault(o => o.Code == "EFAB").Children.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(MapperFacilitiesFilterOptionsTestsData.Map_Options_Multiple_Filtered_Set),
            MemberType = typeof(MapperFacilitiesFilterOptionsTestsData))]
        public async Task Map_MultipleFilters(List<AvCacheResultOffersOfferExtended> offers,
            PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Filters.FirstOrDefault(x => x.Code == AvailableFilters.Facilities).Should().NotBeNull();

            var facilitiesChildren = actual.SearchOffersResponse.Filters.First(x => x.Code == AvailableFilters.Facilities).Options.SelectMany(x => x.Children);

            facilitiesChildren.FirstOrDefault(o => o.Code == "ABCD").Should().NotBeNull();
            facilitiesChildren.FirstOrDefault(o => o.Code == "ABCD").Count.Should().Be(1);

            facilitiesChildren.FirstOrDefault(o => o.Code == "DEFA").Should().NotBeNull();
            facilitiesChildren.FirstOrDefault(o => o.Code == "DEFA").Count.Should().Be(1);

            facilitiesChildren.FirstOrDefault(o => o.Code == "CDEF").Should().NotBeNull();
            facilitiesChildren.FirstOrDefault(o => o.Code == "CDEF").Count.Should().Be(1);

            facilitiesChildren.FirstOrDefault(o => o.Code == "EFAB").Children.Should().BeNull();
        }

        [Theory]
        [MemberData(nameof(MapperFacilitiesFilterOptionsTestsData.Map_Options_Multiple_Filtered_Set_NoResults),
            MemberType = typeof(MapperFacilitiesFilterOptionsTestsData))]
        public async Task Map_MultipleFilters_NoResults(List<AvCacheResultOffersOfferExtended> offers,
            PackagesSearchRequest request)
        {
            // Act
            var actual = await _sut.MapWithFilters(offers, request, false);

            // Assert
            actual.SearchOffersResponse.Filters.FirstOrDefault(x => x.Code == AvailableFilters.Facilities).Should().NotBeNull();

            var facilitiesChildren = actual.SearchOffersResponse.Filters.First(x => x.Code == AvailableFilters.Facilities).Options.SelectMany(x => x.Children);

            facilitiesChildren.FirstOrDefault(o => o.Code == "ABCD").Should().NotBeNull();
            facilitiesChildren.FirstOrDefault(o => o.Code == "ABCD").Count.Should().Be(0);

            facilitiesChildren.FirstOrDefault(o => o.Code == "DEFA").Should().NotBeNull();
            facilitiesChildren.FirstOrDefault(o => o.Code == "DEFA").Count.Should().Be(0);

            facilitiesChildren.FirstOrDefault(o => o.Code == "CDEF").Should().NotBeNull();
            facilitiesChildren.FirstOrDefault(o => o.Code == "CDEF").Count.Should().Be(0);

            facilitiesChildren.FirstOrDefault(o => o.Code == "EFAB").Children.Should().BeNull();
        }
    }

    /* 
                            facilities filter options:
                            - should be based on full set
                            - should include numbers based on filtered set
                            - should be case-insensitive
                            - should sum up facilities numbers correctly
                            - should collect all possible facilities
                            - should be distinct, based on code      
     */


    public class MapperFacilitiesFilterOptionsTestsData
    {
        public static IEnumerable<object[]> Map_NullResponse =>
            new List<object[]>
            {
                new object[]
                {
                    null,
                    new PackagesSearchRequest()
                    {
                        Facilities = "abcd"
                    }
                }
            };

        public static IEnumerable<object[]> Map_EmptyResponse =>
            new List<object[]>
            {
                new object[]
                {
                    new List<AvCacheResultOffersOfferExtended>(),
                    new PackagesSearchRequest()
                    {
                        Facilities = "cdef"
                    }
                }
            };

        public static IEnumerable<object[]> Map_Collect_All_Options =>
            new List<object[]>
            {
                new object[]
                {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                            },
                            new[]
                            {
                                SearchAvailablePackagesFilterAndMapper.ToAccomExtended(
                                    new AvCacheResultOffersOfferAccom(){Prom = "ASDE",Cty2 = "DEMU",},
                                    new HotelFilters
                                    {
                                        FacilityGroups = new FacilityGroup[]
                                        {
                                            new FacilityGroup()
                                            {
                                                FacilityFilteredTypes = new List<Facility>()
                                                {
                                                    new Facility()
                                                    {
                                                        Code = "abcd",
                                                        Name = "24 reception"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "cdef",
                                                        Name = "swimming pool"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "defa",
                                                        Name = "drawing lessons"
                                                    }
                                                }
                                            }
                                        }
                                    })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                            },
                            new[]
                            {
                                SearchAvailablePackagesFilterAndMapper.ToAccomExtended(
                                    new AvCacheResultOffersOfferAccom(){Prom = "ASDE", Cty2 = "DEMU",},
                                    new HotelFilters
                                    {
                                        FacilityGroups = new FacilityGroup[]
                                        {
                                            new FacilityGroup()
                                            {
                                                FacilityFilteredTypes = new List<Facility>()
                                                {
                                                    new Facility()
                                                    {
                                                        Code = "Cdef",
                                                        Name = "swimming pool"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "Defa",
                                                        Name = "drawing lessons"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "Efab",
                                                        Name = "Somethign else"
                                                    },
                                                }
                                            }
                                        }
                                    })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                            },
                            new[]
                            {
                                SearchAvailablePackagesFilterAndMapper.ToAccomExtended(
                                    new AvCacheResultOffersOfferAccom(){Prom = "ASDE", Cty2 = "DEMU",},
                                    new HotelFilters
                                    {
                                        FacilityGroups = new FacilityGroup[]
                                        {
                                            new FacilityGroup()
                                            {
                                                FacilityFilteredTypes = new List<Facility>()
                                                {
                                                    new Facility()
                                                    {
                                                        Code = "Defa",
                                                        Name = "drawing lessons"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "Efab",
                                                        Name = "Somethign else"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "FaBc",
                                                        Name = "helicopter tour"
                                                    },
                                                }
                                            }
                                        }
                                    })
                            }
                        )
                    },
                    new PackagesSearchRequest()
                    {
                        Duration = [4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_Options_Filtered_Set =>
            new List<object[]>
            {
                new object[]
                {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                            },
                            new[]
                            {
                                SearchAvailablePackagesFilterAndMapper.ToAccomExtended(
                                    new AvCacheResultOffersOfferAccom() { Prom = "ASDE",Cty2 = "DEMU" },
                                    new HotelFilters
                                    {
                                        FacilityGroups = new FacilityGroup[]
                                        {
                                            new FacilityGroup()
                                            {
                                                FacilityFilteredTypes = new List<Facility>()
                                                {
                                                new Facility()
                                                {
                                                    Code = "abcd",
                                                    Name = "24 reception"
                                                },
                                                new Facility()
                                                {
                                                    Code = "cdef",
                                                    Name = "swimming pool"
                                                },
                                                new Facility()
                                                {
                                                    Code = "defa",
                                                    Name = "drawing lessons"
                                                }
                                                }
                                            }
                                        }
                                    })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                            },
                            new[]
                            {
                                SearchAvailablePackagesFilterAndMapper.ToAccomExtended(
                                    new AvCacheResultOffersOfferAccom() {Prom = "ASDE",  Cty2 = "DEMU" },
                                    new HotelFilters
                                    {
                                        FacilityGroups = new FacilityGroup[]
                                        {
                                            new FacilityGroup()
                                            {
                                                FacilityFilteredTypes = new List<Facility>()
                                                {
                                                    new Facility()
                                                    {
                                                        Code = "Cdef",
                                                        Name = "swimming pool"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "Defa",
                                                        Name = "drawing lessons"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "Efab",
                                                        Name = "Somethign else"
                                                    },
                                                }
                                            }
                                        }
                                    })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                            },
                            new[]
                            {
                                SearchAvailablePackagesFilterAndMapper.ToAccomExtended(
                                    new AvCacheResultOffersOfferAccom() {Prom = "ASDE",  Cty2 = "DEMU" },
                                    new HotelFilters
                                    {
                                        FacilityGroups = new FacilityGroup[]
                                        {
                                            new FacilityGroup()
                                            {
                                                FacilityFilteredTypes = new List<Facility>()
                                                {
                                                    new Facility()
                                                    {
                                                        Code = "Defa",
                                                        Name = "drawing lessons"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "Efab",
                                                        Name = "Somethign else"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "FaBc",
                                                        Name = "helicopter tour"
                                                    },
                                                }
                                            }
                                        }
                                    })
                            }
                        )
                    },
                    new PackagesSearchRequest()
                    {
                        Facilities = "ABCD",
                        Duration = [4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_Options_Multiple_Filtered_Set =>
            new List<object[]>
            {
                new object[]
                {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                            },
                            new[]
                            {
                                SearchAvailablePackagesFilterAndMapper.ToAccomExtended(
                                    new AvCacheResultOffersOfferAccom() {Prom = "ASDE",  Cty2 = "DEMU" },
                                    new HotelFilters
                                    {
                                        FacilityGroups = new FacilityGroup[]
                                        {
                                            new FacilityGroup()
                                            {
                                                FacilityFilteredTypes = new List<Facility>()
                                                {
                                                    new Facility()
                                                    {
                                                        Code = "abcd",
                                                        Name = "24 reception"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "cdef",
                                                        Name = "swimming pool"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "defa",
                                                        Name = "drawing lessons"
                                                    }
                                                }
                                            }
                                        }
                                    })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                            },
                            new[]
                            {
                                SearchAvailablePackagesFilterAndMapper.ToAccomExtended(
                                    new AvCacheResultOffersOfferAccom() {Prom = "ASDE",  Cty2 = "DEMU" },
                                    new HotelFilters
                                    {
                                        FacilityGroups = new FacilityGroup[]
                                        {
                                            new FacilityGroup()
                                            {
                                                FacilityFilteredTypes = new List<Facility>()
                                                {
                                                    new Facility()
                                                    {
                                                        Code = "Cdef",
                                                        Name = "swimming pool"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "Defa",
                                                        Name = "drawing lessons"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "Efab",
                                                        Name = "Somethign else"
                                                    },
                                                }
                                            }
                                        }
                                    })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                            },
                            new[]
                            {
                                SearchAvailablePackagesFilterAndMapper.ToAccomExtended(
                                    new AvCacheResultOffersOfferAccom() {Prom = "ASDE",    Cty2 = "DEMU" },
                                    new HotelFilters
                                    {
                                        FacilityGroups = new FacilityGroup[]
                                        {
                                            new FacilityGroup()
                                            {
                                                FacilityFilteredTypes = new List<Facility>()
                                                {
                                                    new Facility()
                                                    {
                                                        Code = "Defa",
                                                        Name = "drawing lessons"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "Efab",
                                                        Name = "Somethign else"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "FaBc",
                                                        Name = "helicopter tour"
                                                    },
                                                }
                                            }
                                        }
                                    })
                            }
                        )
                    },
                    new PackagesSearchRequest()
                    {
                        Facilities = "ABCD, DEFA",
                        Duration = [4]
                    }
                }
            };

        public static IEnumerable<object[]> Map_Options_Multiple_Filtered_Set_NoResults =>
            new List<object[]>
            {
                new object[]
                {
                    new List<AvCacheResultOffersOfferExtended>()
                    {
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                            },
                            new[]
                            {
                                SearchAvailablePackagesFilterAndMapper.ToAccomExtended(
                                    new AvCacheResultOffersOfferAccom() {Prom = "ASDE",  Cty2 = "DEMU" },
                                    new HotelFilters
                                    {
                                        FacilityGroups = new FacilityGroup[]
                                        {
                                            new FacilityGroup()
                                            {
                                                FacilityFilteredTypes = new List<Facility>()
                                                {
                                                    new Facility()
                                                    {
                                                        Code = "abcd",
                                                        Name = "24 reception"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "cdef",
                                                        Name = "swimming pool"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "defa",
                                                        Name = "drawing lessons"
                                                    }
                                                }
                                            }
                                        }
                                    })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                            },
                            new[]
                            {
                                SearchAvailablePackagesFilterAndMapper.ToAccomExtended(
                                    new AvCacheResultOffersOfferAccom() {Prom = "ASDE",  Cty2 = "DEMU" },
                                    new HotelFilters
                                    {
                                        FacilityGroups = new FacilityGroup[]
                                        {
                                            new FacilityGroup()
                                            {
                                                FacilityFilteredTypes = new List<Facility>()
                                                {
                                                    new Facility()
                                                    {
                                                        Code = "Cdef",
                                                        Name = "swimming pool"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "Defa",
                                                        Name = "drawing lessons"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "Efab",
                                                        Name = "Somethign else"
                                                    },
                                                }
                                            }
                                        }
                                    })
                            }
                        ),
                        new AvCacheResultOffersOfferExtended(
                            new AvCacheResultOffersOffer()
                            {
                            },
                            new[]
                            {
                                SearchAvailablePackagesFilterAndMapper.ToAccomExtended(
                                    new AvCacheResultOffersOfferAccom() {Prom = "ASDE",  Cty2 = "DEMU" },
                                    new HotelFilters
                                    {
                                        FacilityGroups = new FacilityGroup[]
                                        {
                                            new FacilityGroup()
                                            {
                                                FacilityFilteredTypes = new List<Facility>()
                                                {
                                                    new Facility()
                                                    {
                                                        Code = "Defa",
                                                        Name = "drawing lessons"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "Efab",
                                                        Name = "Somethign else"
                                                    },
                                                    new Facility()
                                                    {
                                                        Code = "FaBc",
                                                        Name = "helicopter tour"
                                                    },
                                                }
                                            }
                                        }
                                    })
                            }
                        )
                    },
                    new PackagesSearchRequest()
                    {
                        Facilities = "ABCD, EFAB"
                    }
                }
            };
    }
}