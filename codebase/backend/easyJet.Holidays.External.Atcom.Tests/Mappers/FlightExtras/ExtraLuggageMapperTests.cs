using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Settings.Ancillaries;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Mappers.FlightExtras;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.FlightExtras;

public class ExtraLuggageMapperTests
{
    private const string HoldLuggageCategoryCode = "ADDB";
    private const string HoldBaggageCategoryCode = "BAGE";
    private const string HoldBaggageInternalCategoryCode = "BAG";
    private const string HoldBaggageInternalItemCode = "BAG";
    private const string Bag23KgCode = "LUGE";
    private const string HoldBaggage23kg = "LUG";
    private const string Bag15KgCode = "LUSE";
    private const string LargeSportsEquipmentCategoryCode = "SEO";
    private const string BikeCode = "BIKE";
    private const string PrePaidExcessWeight3kg = "WGT";
    private const string PrePaidExcessWeightCategoryCode = "WGT";

    private readonly Mock<IReferenceDataService> _referenceDataServiceMock = new();
    private readonly Mock<ILuggageService> _luggageServiceMock = new();
    private readonly Mock<IFlightExtraService> _flightExtraServiceMock = new();

    
    private readonly ExtraLuggageMapper _sut;
    private readonly IFixture _fixture;

    public ExtraLuggageMapperTests()
    {
        _fixture = FixtureUtils.AutoMoqFixture();
        _sut = new ExtraLuggageMapper(_referenceDataServiceMock.Object, _luggageServiceMock.Object, _flightExtraServiceMock.Object, _fixture.Create<ILogger<ExtraLuggageMapper>>());
    }


    #region MapLuggageInfo

    [Fact]
    public async Task MapLuggageInfo_HandlesNullInput()
    {
        var result = await _sut.MapLuggageInfo(null, null, null);
        result?.Items.Should().BeEmpty();
    }

    

    [Fact]
    public async Task MapLuggageInfo_HandlesEmptyInput()
    {
        var result = await _sut.MapLuggageInfo(Array.Empty<Flt_Extra_Cat_List>(), new List<Route>(), new BookingPackage());
        result?.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task MapLuggageInfo_ReturnsEmptyLuggageForInternalRoutes()
    {
        var routes = new List<Route>
        {
            new() {IsExternal = false, RouteId = "1"},
            new() {IsExternal = false, RouteId = "2"}
        };

        var result = await _sut.MapLuggageInfo(Array.Empty<Flt_Extra_Cat_List>(), routes, new BookingPackage());
        result?.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task MapLuggageInfo_ReturnsCorrectResult()
    {
        #region Test data

        var flightExtras = new Flt_Extra_Cat_List[]
        {
            new()
            {
                Flt_Inv_Id = "1",
                Flt_Extra_Cat = new[]
                {
                    new Flt_Extra_Cat
                    {
                        Code = HoldLuggageCategoryCode,
                        Flt_Extra = new[]
                        {
                            new Flt_Extra
                            {
                                Code = Bag23KgCode,
                                Bkg_Qty = "2",
                                SubServPaxs = new[]
                                {
                                    new SubServPax
                                    {
                                        Pax_Id = "1",
                                        Pax_Tp = Pax_Tp.ADULT,
                                        Pax_Srv_Prc_Ex = new Prc_Type { Value = "26"}
                                    }
                                }
                            },
                            new Flt_Extra
                            {
                                Code = Bag15KgCode,
                                Bkg_Qty = "1",
                                SubServPaxs = new[]
                                {
                                    new SubServPax
                                    {
                                        Pax_Id = "2",
                                        Pax_Tp = Pax_Tp.CHILD,
                                        Pax_Srv_Prc_Ex = new Prc_Type { Value = "10"}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            new()
            {
                Flt_Inv_Id = "2",
                Flt_Extra_Cat = new[]
                {
                    new Flt_Extra_Cat
                    {
                        Code = LargeSportsEquipmentCategoryCode,
                        Flt_Extra = new[]
                        {
                            new Flt_Extra
                            {
                                Code = BikeCode,
                                Bkg_Qty = "1",
                                SubServPaxs = new[]
                                {
                                    new SubServPax
                                    {
                                        Pax_Id = "1",
                                        Pax_Tp = Pax_Tp.ADULT,
                                        Pax_Srv_Prc_Ex = new Prc_Type { Value = "90"}
                                    }
                                }
                            }
                        }
                    },
                    new Flt_Extra_Cat
                    {
                        Code = HoldLuggageCategoryCode,
                        Flt_Extra = new[]
                        {
                            new Flt_Extra
                            {
                                Code = Bag15KgCode,
                                Bkg_Qty = "2",
                                SubServPaxs = new[]
                                {
                                    new SubServPax
                                    {
                                        Pax_Id = "2",
                                        Pax_Tp = Pax_Tp.CHILD,
                                        Pax_Srv_Prc_Ex = new Prc_Type { Value = "20"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        var routes = new List<Route>
        {
            new() {IsExternal = true, RouteId = "1"},
            new() {IsExternal = true, RouteId = "2"}
        };

        var package = new BookingPackage
        {
            Accom = new BookingAccommodation
            {
                Prom = "EUCO",
                Rooms = new List<Unit>
                {
                    new()
                    {
                        Occupation = new Occupation { Adults = 2, Children = 0, Infants = 0 }
                    }
                }
            },
            Transport = new Transport
            {
                Routes = routes
            }
        };

        var expectedResult = new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "1",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 2,
                    Price = 13D
                },
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "2",
                    ItemCode = Bag15KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[1].RouteId,
                    PassengerId = "1",
                    ItemCode = BikeCode,
                    ItemCategoryCode = LargeSportsEquipmentCategoryCode,
                    Quantity = 1,
                    Price = 90D
                },
                new()
                {
                    RouteId = routes[1].RouteId,
                    PassengerId = "2",
                    ItemCode = Bag15KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 2,
                    Price = 10D
                }
            }
        };

        #endregion

        var luggageService = new LuggageService(_referenceDataServiceMock.Object,
            new Mock<ILuggageValidatorService>().Object, new Mock<IPassengerIndexCalculator>().Object,
            new Mock<IFlightExtraService>().Object, new Mock<ILogger<LuggageService>>().Object);

        var defaultLuggageConfiguration = GetDefaultLuggageConfiguration();
        _referenceDataServiceMock
            .Setup(x => x.GetLuggageSettings())
            .ReturnsAsync(GetDefaultLuggageSettings());
        _referenceDataServiceMock
            .Setup(x => x.GetLuggage())
            .ReturnsAsync(defaultLuggageConfiguration);
        _luggageServiceMock
            .Setup(x => x.GetComplimentaryLuggage(It.IsAny<BookingPackage>()))
            .ReturnsAsync(new List<ExtraLuggageItem>());

        var localSut = new ExtraLuggageMapper(_referenceDataServiceMock.Object, luggageService,
            _flightExtraServiceMock.Object,
            new Mock<ILogger<ExtraLuggageMapper>>().Object);

        var result = await localSut.MapLuggageInfo(flightExtras, routes, package);

        result.Should().BeEquivalentTo(expectedResult);
    }

    #endregion

    #region MapToAtcomModel

    [Fact]
    public void MapToAtcomModel_HandlesNullInput()
    {
        var result = ExtraLuggageMapper.MapToAtcomModel(null, null);
        result.Should().BeNull();
    }


    [Fact]
    public void MapToAtcomModel_HandlesEmptyInput()
    {
        var result = ExtraLuggageMapper.MapToAtcomModel(new ExtraLuggageInfo { Items = new List<ExtraLuggageItem>() }, new List<Route>());
        result.Should().BeNull();
    }

    [Fact]
    public void MapToAtcomModel_ThrowExceptionWhenRouteNotMatch()
    {
        var routes = new List<Route>
        {
            new() {IsExternal = false, RouteId = "1"},
            new() {IsExternal = false, RouteId = "2"}
        };
        var luggageInfo = new ExtraLuggageInfo()
        {
            Items = new List<ExtraLuggageItem>()
            {
                new ExtraLuggageItem()
                {
                    RouteId = "-1",
                    ItemCode = "LUG"
                }
            }
        };


        var act = new Action(() => ExtraLuggageMapper.MapToAtcomModel(luggageInfo, routes, true));
        act.Should().Throw<Exception>();
    }

    [Fact]
    public void MapToAtcomModel_ReturnsNullForInternalRoutes()
    {
        var routes = new List<Route>
        {
            new() {IsExternal = false, RouteId = "1"},
            new() {IsExternal = false, RouteId = "2"}
        };
        var luggageInfo = new ExtraLuggageInfo();

        var result = ExtraLuggageMapper.MapToAtcomModel(luggageInfo, routes);

        result.Should().BeNull();
    }

    [Fact]
    public void MapToAtcomModel_ReturnsCorrectResult()
    {
        var routes = new List<Route>
        {
            new() {IsExternal = true, RouteId = "1"},
            new() {IsExternal = true, RouteId = "2"}
        };

        var luggageInfo = new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "1",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 2,
                    Price = 13D
                },
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "2",
                    ItemCode = Bag15KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[1].RouteId,
                    PassengerId = "1",
                    ItemCode = BikeCode,
                    ItemCategoryCode = LargeSportsEquipmentCategoryCode,
                    Quantity = 1,
                    Price = 90D
                },
                new()
                {
                    RouteId = routes[1].RouteId,
                    PassengerId = "2",
                    ItemCode = Bag15KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 2,
                    Price = 10D
                }
            }
        };

        var result = ExtraLuggageMapper.MapToAtcomModel(luggageInfo, routes);

        result.Length.Should().Be(2);
        result[0].Flt_Inv_Id.Should().Be(routes[0].RouteId);
        result[0].Flt_Extra_Cat.Length.Should().Be(1);
        result[0].Flt_Extra_Cat[0].Code.Should().Be(HoldLuggageCategoryCode);
        result[0].Flt_Extra_Cat[0].Flt_Extra.Length.Should().Be(2);
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].Code.Should().Be(Bag23KgCode);
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].Bkg_Qty.Should().Be("2");
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].SubServPaxs.Should().BeEquivalentTo(new[]
        {
            new SubServPax
            {
                Pax_Id = "1",
                Pax_Tp = Pax_Tp.ADULT
            }
        });
        result[0].Flt_Extra_Cat[0].Flt_Extra[1].Code.Should().Be(Bag15KgCode);
        result[0].Flt_Extra_Cat[0].Flt_Extra[1].SubServPaxs.Should().BeEquivalentTo(new[]
        {
            new SubServPax
            {
                Pax_Id = "2",
                Pax_Tp = Pax_Tp.ADULT
            }
        });

        result[1].Flt_Inv_Id.Should().Be(routes[1].RouteId);
        result[1].Flt_Extra_Cat.Length.Should().Be(2);
        result[1].Flt_Extra_Cat[0].Code.Should().Be(LargeSportsEquipmentCategoryCode);
        result[1].Flt_Extra_Cat[0].Flt_Extra.Length.Should().Be(1);
        result[1].Flt_Extra_Cat[0].Flt_Extra[0].Code.Should().Be(BikeCode);
        result[1].Flt_Extra_Cat[0].Flt_Extra[0].SubServPaxs.Should().BeEquivalentTo(new[]
        {
            new SubServPax
            {
                Pax_Id = "1",
                Pax_Tp = Pax_Tp.ADULT
            }
        });

        result[1].Flt_Extra_Cat[1].Code.Should().Be(HoldLuggageCategoryCode);
        result[1].Flt_Extra_Cat[1].Flt_Extra.Length.Should().Be(1);
        result[1].Flt_Extra_Cat[1].Flt_Extra[0].Code.Should().Be(Bag15KgCode);
        result[1].Flt_Extra_Cat[1].Flt_Extra[0].SubServPaxs.Should().BeEquivalentTo(new[]
        {
            new SubServPax
            {
                Pax_Id = "2",
                Pax_Tp = Pax_Tp.ADULT
            }
        });
    }

    [Fact]
    public void MapToAtcomModel_DefaultLuggageCompatibleWithOldMapper()
    {
        var routes = new List<Route>
        {
            new() {IsExternal = true, RouteId = "1"},
            new() {IsExternal = true, RouteId = "2"}
        };

        var luggageInfo = new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "1",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "2",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "3",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[1].RouteId,
                    PassengerId = "1",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[1].RouteId,
                    PassengerId = "2",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[1].RouteId,
                    PassengerId = "3",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 1,
                    Price = 10D
                }
            }
        };

        var result = ExtraLuggageMapper.MapToAtcomModel(luggageInfo, routes);

        result.Length.Should().Be(2);
        result[0].Flt_Extra_Cat.Length.Should().Be(1);
        result[0].Flt_Extra_Cat[0].Code.Should().Be(HoldLuggageCategoryCode);
        result[0].Flt_Extra_Cat[0].Flt_Extra.Length.Should().Be(1);
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].Code.Should().Be(Bag23KgCode);
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].Bkg_Qty.Should().Be("1");
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].SubServPaxs.Should().BeEquivalentTo(new[]
        {
            new SubServPax
            {
                Pax_Id = "1",
                Pax_Tp = Pax_Tp.ADULT
            },
            new SubServPax
            {
                Pax_Id = "2",
                Pax_Tp = Pax_Tp.ADULT
            },
            new SubServPax
            {
                Pax_Id = "3",
                Pax_Tp = Pax_Tp.ADULT
            }
        });

        result[1].Flt_Extra_Cat.Length.Should().Be(1);
        result[1].Flt_Extra_Cat[0].Code.Should().Be(HoldLuggageCategoryCode);
        result[1].Flt_Extra_Cat[0].Flt_Extra.Length.Should().Be(1);
        result[1].Flt_Extra_Cat[0].Flt_Extra[0].Code.Should().Be(Bag23KgCode);
        result[1].Flt_Extra_Cat[0].Flt_Extra[0].Bkg_Qty.Should().Be("1");
        result[1].Flt_Extra_Cat[0].Flt_Extra[0].SubServPaxs.Should().BeEquivalentTo(new[]
        {
            new SubServPax
            {
                Pax_Id = "1",
                Pax_Tp = Pax_Tp.ADULT
            },
            new SubServPax
            {
                Pax_Id = "2",
                Pax_Tp = Pax_Tp.ADULT
            },
            new SubServPax
            {
                Pax_Id = "3",
                Pax_Tp = Pax_Tp.ADULT
            }
        });
    }

    [Fact]
    public void MapToAtcomModel_GroupsFlightExtrasByQuantityWhenPossible()
    {
        var routes = new List<Route>
        {
            new() {IsExternal = true, RouteId = "1"}
        };

        var luggageInfo = new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "1",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "2",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "3",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 2,
                    Price = 10D
                }
            }
        };

        var result = ExtraLuggageMapper.MapToAtcomModel(luggageInfo, routes);

        result.Length.Should().Be(1);
        result[0].Flt_Extra_Cat.Length.Should().Be(1);
        result[0].Flt_Extra_Cat[0].Code.Should().Be(HoldLuggageCategoryCode);
        result[0].Flt_Extra_Cat[0].Flt_Extra.Length.Should().Be(2);
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].Code.Should().Be(Bag23KgCode);
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].Bkg_Qty.Should().Be("1");
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].SubServPaxs.Should().BeEquivalentTo(new[]
        {
            new SubServPax
            {
                Pax_Id = "1",
                Pax_Tp = Pax_Tp.ADULT
            },
            new SubServPax
            {
                Pax_Id = "2",
                Pax_Tp = Pax_Tp.ADULT
            },
            new SubServPax
            {
                Pax_Id = "3",
                Pax_Tp = Pax_Tp.ADULT
            }
        });

        result[0].Flt_Extra_Cat[0].Flt_Extra[1].Code.Should().Be(Bag23KgCode);
        result[0].Flt_Extra_Cat[0].Flt_Extra[1].Bkg_Qty.Should().Be("1");
        result[0].Flt_Extra_Cat[0].Flt_Extra[1].SubServPaxs.Should().BeEquivalentTo(new[]
        {
            new SubServPax
            {
                Pax_Id = "3",
                Pax_Tp = Pax_Tp.ADULT
            }
        });
    }

    [Fact]
    public void MapToAtcomModel_GroupsFlightExtrasByQuantityWhenPossibleWithCombinedCodes()
    {
        var routes = new List<Route>
        {
            new() {IsExternal = true, RouteId = "1"}
        };

        var luggageInfo = new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "1",
                    ItemCode = HoldBaggage23kg + "_" + PrePaidExcessWeight3kg,
                    ItemCategoryCode = HoldBaggageCategoryCode + "_" + PrePaidExcessWeightCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "2",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "3",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 2,
                    Price = 10D
                }
            }
        };

        var result = ExtraLuggageMapper.MapToAtcomModel(luggageInfo, routes);

        result.Length.Should().Be(1);
        result[0].Flt_Extra_Cat.Length.Should().Be(3);
        result[0].Flt_Extra_Cat[0].Code.Should().Be(HoldBaggageCategoryCode);
        result[0].Flt_Extra_Cat[0].Flt_Extra.Length.Should().Be(1);
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].Code.Should().Be(HoldBaggage23kg);
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].Bkg_Qty.Should().Be("1");

        result[0].Flt_Extra_Cat[1].Code.Should().Be(PrePaidExcessWeightCategoryCode);
        result[0].Flt_Extra_Cat[1].Flt_Extra[0].Code.Should().Be(PrePaidExcessWeight3kg);
        result[0].Flt_Extra_Cat[1].Flt_Extra[0].Bkg_Qty.Should().Be("1");

        result[0].Flt_Extra_Cat[2].Code.Should().Be(HoldLuggageCategoryCode);
        result[0].Flt_Extra_Cat[2].Flt_Extra[0].Code.Should().Be(Bag23KgCode);
        result[0].Flt_Extra_Cat[2].Flt_Extra[0].Bkg_Qty.Should().Be("1");

        result[0].Flt_Extra_Cat[2].Flt_Extra[1].Code.Should().Be(Bag23KgCode);
        result[0].Flt_Extra_Cat[2].Flt_Extra[1].Bkg_Qty.Should().Be("1");
    }

    [Fact]
    public void MapToAtcomModel_CombinedCodesWrongCategoryCode_ThrowException()
    {
        var routes = new List<Route>
        {
            new() {IsExternal = true, RouteId = "1"}
        };

        var luggageInfo = new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "1",
                    ItemCode = HoldBaggage23kg + "_" + PrePaidExcessWeight3kg,
                    ItemCategoryCode = HoldBaggageCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "2",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "3",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 2,
                    Price = 10D
                }
            }
        };

        var act = new Action(() => ExtraLuggageMapper.MapToAtcomModel(luggageInfo, routes));
        act.Should().Throw<ApiException>();
    }

    [Fact]
    public void MapToAtcomModel_GroupsFlightExtrasForSeatChangeByQuantityWhenPossibleWithCombinedCodes()
    {
        var routes = new List<Route>
        {
            new() {IsExternal = true, RouteId = "1"}
        };

        var luggageInfo = new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "1",
                    ItemCode = HoldBaggage23kg + "_" + PrePaidExcessWeight3kg,
                    ItemCategoryCode = HoldBaggageCategoryCode + "_" + PrePaidExcessWeightCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "2",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "2",
                    ItemCode = HoldBaggageInternalItemCode,
                    ItemCategoryCode = HoldBaggageInternalCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "3",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 2,
                    Price = 10D
                }
            }
        };

        var result = ExtraLuggageMapper.MapToAtcomModel(luggageInfo, routes, true);

        result.Length.Should().Be(1);
        result[0].Flt_Extra_Cat.Length.Should().Be(4);
        result[0].Flt_Extra_Cat[0].Code.Should().Be(HoldBaggageCategoryCode);
        result[0].Flt_Extra_Cat[0].Flt_Extra.Length.Should().Be(1);
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].Code.Should().Be(HoldBaggage23kg);
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].Bkg_Qty.Should().Be("1");

        result[0].Flt_Extra_Cat[1].Code.Should().Be(PrePaidExcessWeightCategoryCode);
        result[0].Flt_Extra_Cat[1].Flt_Extra[0].Code.Should().Be(PrePaidExcessWeight3kg);
        result[0].Flt_Extra_Cat[1].Flt_Extra[0].Bkg_Qty.Should().Be("1");

        result[0].Flt_Extra_Cat[2].Code.Should().Be(HoldLuggageCategoryCode);
        result[0].Flt_Extra_Cat[2].Flt_Extra[0].Code.Should().Be(Bag23KgCode);
        result[0].Flt_Extra_Cat[2].Flt_Extra[0].Bkg_Qty.Should().Be("1");

        result[0].Flt_Extra_Cat[2].Flt_Extra[1].Code.Should().Be(Bag23KgCode);
        result[0].Flt_Extra_Cat[2].Flt_Extra[1].Bkg_Qty.Should().Be("1");

        result[0].Flt_Extra_Cat[3].Flt_Extra[0].Code.Should().Be(HoldBaggageInternalItemCode);
        result[0].Flt_Extra_Cat[3].Flt_Extra[0].Class.Should().Be("Y");
        result[0].Flt_Extra_Cat[3].Flt_Extra[0].Atol_Mth.Should().Be(Atol_Mth.NONE);
        result[0].Flt_Extra_Cat[3].Flt_Extra[0].Bkg_Qty.Should().Be("1");
    }

    [Fact]
    public void MapToAtcomModel_GroupsFlightExtrasForSeatChangeByQuantityWhenPossibleWithCombinedCodesEvenItIsInternal()
    {
        var routes = new List<Route>
        {
            new() {IsExternal = false, RouteId = "1"}
        };

        var luggageInfo = new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "1",
                    ItemCode = HoldBaggage23kg + "_" + PrePaidExcessWeight3kg,
                    ItemCategoryCode = HoldBaggageCategoryCode + "_" + PrePaidExcessWeightCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "2",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "2",
                    ItemCode = HoldBaggageInternalItemCode,
                    ItemCategoryCode = HoldBaggageInternalCategoryCode,
                    Quantity = 1,
                    Price = 10D
                },
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "3",
                    ItemCode = Bag23KgCode,
                    ItemCategoryCode = HoldLuggageCategoryCode,
                    Quantity = 2,
                    Price = 10D
                }
            }
        };

        var result = ExtraLuggageMapper.MapToAtcomModel(luggageInfo, routes, true);

        result.Length.Should().Be(1);
        result[0].Flt_Extra_Cat.Length.Should().Be(4);
        result[0].Flt_Extra_Cat[0].Code.Should().Be(HoldBaggageCategoryCode);
        result[0].Flt_Extra_Cat[0].Flt_Extra.Length.Should().Be(1);
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].Code.Should().Be(HoldBaggage23kg);
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].Bkg_Qty.Should().Be("1");

        result[0].Flt_Extra_Cat[1].Code.Should().Be(PrePaidExcessWeightCategoryCode);
        result[0].Flt_Extra_Cat[1].Flt_Extra[0].Code.Should().Be(PrePaidExcessWeight3kg);
        result[0].Flt_Extra_Cat[1].Flt_Extra[0].Bkg_Qty.Should().Be("1");

        result[0].Flt_Extra_Cat[2].Code.Should().Be(HoldLuggageCategoryCode);
        result[0].Flt_Extra_Cat[2].Flt_Extra[0].Code.Should().Be(Bag23KgCode);
        result[0].Flt_Extra_Cat[2].Flt_Extra[0].Bkg_Qty.Should().Be("1");

        result[0].Flt_Extra_Cat[2].Flt_Extra[1].Code.Should().Be(Bag23KgCode);
        result[0].Flt_Extra_Cat[2].Flt_Extra[1].Bkg_Qty.Should().Be("1");

        result[0].Flt_Extra_Cat[3].Flt_Extra[0].Code.Should().Be(HoldBaggageInternalItemCode);
        result[0].Flt_Extra_Cat[3].Flt_Extra[0].Class.Should().Be("Y");
        result[0].Flt_Extra_Cat[3].Flt_Extra[0].Atol_Mth.Should().Be(Atol_Mth.NONE);
        result[0].Flt_Extra_Cat[3].Flt_Extra[0].Bkg_Qty.Should().Be("1");
    }

    [Fact]
    public void MapToAtcomModel_ReturnLuggageOnExternalRouteButNeedToAddExtraFlightInfo()
    {
        var routes = new List<Route>
        {
            new() {IsExternal = true, RouteId = "1"}
        };

        var luggageInfo = new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "1",
                    ItemCode = HoldBaggageInternalItemCode,
                    ItemCategoryCode = HoldBaggageInternalCategoryCode,
                    Quantity = 1,
                    Price = 10D
                }
            }
        };

        var result = ExtraLuggageMapper.MapToAtcomModel(luggageInfo, routes, true);

        result.Length.Should().Be(1);
        result[0].Flt_Extra_Cat.Length.Should().Be(1);
        result[0].Flt_Extra_Cat[0].Code.Should().Be(HoldBaggageInternalCategoryCode);
        result[0].Flt_Extra_Cat[0].Flt_Extra.Length.Should().Be(1);
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].Class.Should().Be("Y");
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].Atol_Mth.Should().Be(Atol_Mth.NONE);
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].Code.Should().Be(HoldBaggageInternalItemCode);
    }

    [Fact]
    public void MapToAtcomModel_ReturnBagLuggageOnExternalRoute()
    {
        var routes = new List<Route>
        {
            new() {IsExternal = true, RouteId = "1"}
        };

        var luggageInfo = new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "1",
                    ItemCode = HoldBaggageInternalItemCode,
                    ItemCategoryCode = HoldBaggageInternalCategoryCode,
                    Quantity = 1,
                    Price = 10D
                }
            }
        };

        var result = ExtraLuggageMapper.MapToAtcomModel(luggageInfo, routes);

        result.Length.Should().Be(1);
        result[0].Flt_Extra_Cat.Length.Should().Be(1);
        result[0].Flt_Extra_Cat[0].Code.Should().Be(HoldBaggageInternalCategoryCode);
        result[0].Flt_Extra_Cat[0].Flt_Extra.Length.Should().Be(1);
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].Code.Should().Be(HoldBaggageInternalItemCode);
    }

    [Fact]
    public void MapToAtcomModel_ReturnHoldLuggageOnExternalRoute()
    {
        var routes = new List<Route>
        {
            new() {IsExternal = true, RouteId = "1"}
        };

        var luggageInfo = new ExtraLuggageInfo
        {
            Items = new List<ExtraLuggageItem>
            {
                new()
                {
                    RouteId = routes[0].RouteId,
                    PassengerId = "1",
                    ItemCode = HoldBaggage23kg,
                    ItemCategoryCode = HoldBaggageCategoryCode,
                    Quantity = 1,
                    Price = 10D
                }
            }
        };

        var result = ExtraLuggageMapper.MapToAtcomModel(luggageInfo, routes, true);

        result.Length.Should().Be(1);
        result[0].Flt_Extra_Cat.Length.Should().Be(1);
        result[0].Flt_Extra_Cat[0].Code.Should().Be(HoldBaggageCategoryCode);
        result[0].Flt_Extra_Cat[0].Flt_Extra.Length.Should().Be(1);
        result[0].Flt_Extra_Cat[0].Flt_Extra[0].Code.Should().Be(HoldBaggage23kg);
    }

    #endregion

    private ComplimentarySettings GetDefaultComplimentarySettings()
    {
        return new ComplimentarySettings
        {
            ComplimentaryIndex = new Dictionary<string, PromotionComplements>
            {
                {
                    "EUBO",
                    new PromotionComplements
                    {
                        PromotionType = "beach-holiday",
                        Codes = new[] { "EUBO" },
                        InternalFallbackCode = "EUBO",
                        Comment = "Beach Holiday Complement",
                        Luggage = new[]
                        {
                            new ComplimentaryLuggage
                            {
                                Code = "LUG",
                                Quantity = (1, 1, 0)
                            }
                        }
                    }
                },
                {
                    "EUCO",
                    new PromotionComplements
                    {
                        PromotionType = "city-breaks",
                        Codes = new[] { "EUCO" },
                        InternalFallbackCode = "EUBO",
                        Comment = "City Breaks Complement",
                        Luggage = Array.Empty<ComplimentaryLuggage>()
                    }
                }
            }
        };
    }

    private Luggage GetDefaultLuggageConfiguration()
    {
        return new Luggage
        {
            LuggageCategories = new List<LuggageCategory>
            {
                new()
                {
                    Code = "CABI",
                    Type = "Cabin Bags",
                    LuggageItems = new List<LuggageItemBase>()
                    {
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "SCB1"
                        }
                    }
                },
                new()
                {
                    Code = "BAGE",
                    Type = "Bag",
                    LuggageItems = new List<LuggageItemBase>()
                    {
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "LUS"
                        },
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "LUG"
                        }
                    }
                },
                new()
                {
                    Code = "ADDB",
                    Type = "Bag",
                    LuggageItems = new List<LuggageItemBase>()
                    {
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "LUSE"
                        },
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "LUGE"
                        }
                    }
                },
                new()
                {
                    Code = "SEO",
                    Type = "Sports Equipment",
                    LuggageItems = new List<LuggageItemBase>()
                    {
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "BIKE"
                        },
                        new LuggageItem()
                        {
                            IsLuggageItemEnabled = true,
                            Code = "CANO"
                        }
                    }
                }
            }
        };
    }

    private LuggageSettings GetDefaultLuggageSettings()
    {
        return new LuggageSettings
        {
            HoldLuggageMaxPerPassenger = 2,
            HoldLuggageCategoryCodes = "ADDB",
            SportsEquipmentCategoryCodes = "SEO",
            LargeCabinBagCategoryCode = "CABI"
        };
    }
}