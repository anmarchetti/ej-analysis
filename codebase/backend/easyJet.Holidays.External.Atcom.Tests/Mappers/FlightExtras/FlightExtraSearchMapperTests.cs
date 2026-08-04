using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.External.Atcom.Mappers.FlightExtras;
using easyJet.Holidays.External.Atcom.Mappers.Guests;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.Atcom.Utils;
using FluentAssertions;
using Xunit;
using Offer = easyJet.Holidays.Api.Domain.Data.PackageOffers.Offer;
using Person = easyJet.Holidays.Api.Domain.Data.Guests.Person;

namespace easyJet.Holidays.External.Atcom.Tests.Mappers.FlightExtras;

public class FlightExtraSearchMapperTests
{
    private const string LargeSportEquipmentCategoryCode = "SPORT";
    private const string BaggageCategoryCode = "BAGE";
    private const string ExtraWeightCategoryCode = "WGT";

    private const string SportsEquipmentLuggageType = "Sports Equipment";
    private const string BagLuggageType = "Bag";
    private const string Bag15kgCode = "LUS";
    private const string Bag23kgCode = "LUG";
    private const string GolfBagCode = "GOLF";
    private const string BikeCode = "BIKE";
    private const string ExtraWeight3KgCode = "WGT";

    private readonly Luggage _luggage;

    public static IEnumerable<object[]> MapRequestNullTestData = new List<object[]>
    {
        new object[] { null, null, null, null },
        new object[] { new Offer(), null, null, null },
        new object[] { null, new List<Person>(), null, null },
        new object[] { null, null, new CltInfo(), null }
    };

    public FlightExtraSearchMapperTests()
    {
        _luggage = CreateLuggage();
    }

    [Theory]
    [MemberData(nameof(MapRequestNullTestData))]
    public void MapRequest_NullInput_ThrowsException(Offer offer, IEnumerable<Person> guests, CltInfo cltInfo, string promoCode)
    {
        var act = new Action(() => FlightExtraSearchMapper.MapRequest(offer, guests, cltInfo, promoCode));
        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void MapRequest_EmptyInput_ThrowsException()
    {
        var act = new Action(() => FlightExtraSearchMapper.MapRequest(new Offer(), new List<Person>(), new CltInfo(), String.Empty));
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void MapRequest_ReturnsCorrectResult()
    {
        string promoCode = "prom";
        Offer offer = new()
        {
            Accom = new()
            {
                Prom = "offerProm"
            },
            Transport = new()
            {
                Routes = new List<Route>
            {
                new()
                {
                    Direction  = Direction.Outbound,
                    DepDate = new DateTimeOffset(new DateTime(2022, 1,7, 17, 0, 0)),
                    ArrDate = new DateTimeOffset(new DateTime(2022, 1,7, 19, 0, 0)),
                    DepPt = "DepPt",
                    ArrPt = "ArrPt",
                    FltNo = "EZY1111"
                },
                new()
                {
                    Direction  = Direction.Inbound,
                    DepDate = new DateTimeOffset(new DateTime(2022, 1,8, 17, 0, 0)),
                    ArrDate = new DateTimeOffset(new DateTime(2022, 1,8, 19, 0, 0)),
                    DepPt = "DepPt",
                    ArrPt = "ArrPt",
                    FltNo = "EZY2222"
                }
            }
            }
        };

        List<Person> guests = new()
        {
            new Person { Age = 30, Type = PersonType.Adult },
            new Person { Age = 35, Type = PersonType.Adult },
            new Person { Age = 10, Type = PersonType.Child },
            new Person { Age = 1, Type = PersonType.Infant }
        };

        CltInfo cltInfo = new() { User_Name = "test" };

        var result = FlightExtraSearchMapper.MapRequest(offer, guests, cltInfo, promoCode);

        result.CltInfo.Should().Be(cltInfo);

        var nonInfants = guests
            .Where(guest => guest.Type == PersonType.Adult || guest.Type == PersonType.Child)
            .ToList();

        result.Occs.Length.Should().Be(nonInfants.Count);
        for (int i = 0; i < nonInfants.Count; i++)
        {
            result.Occs[i].Pax[0].Age.Should().Be(nonInfants[i].Age.ToString());
            result.Occs[i].Pax[0].Index.Should().Be((i + 1).ToString());
            result.Occs[i].Pax[0].Pax_Tp.Should().Be(GuestsMapper.MapType(nonInfants[i].Type));
        }

        foreach (var routing in result.Base_Prd.Route_List)
        {
            routing.ItemsElementName.Should().BeEquivalentTo(offer.Transport.Routes.Select(_ => ItemsChoiceType.Route).ToArray());
            for (var i = 0; i < routing.Items.Length; i++)
            {
                var routingItem = (Route_Tp)routing.Items[i];

                routingItem.Route_Id.Should().Be((i + 1).ToString());
                routingItem.Ext_Ref_Id.System.Should().Be(AtcomConstants.SystemCode);
                routingItem.Ext_Ref_Id.Sub_System.Should().Be(AtcomConstants.SubSystemCode);
                routingItem.Ext_Ref_Id.Alt_Ref.System.Should().Be(AtcomConstants.SystemCode);
                routingItem.Item.Should().BeOfType<Prom>().Which.Code.Should().Be(promoCode);
            }
        }
    }

    [Fact]
    public void MapResponse_ResponseIsNull_ReturnsEmptyList()
    {
        // Act
        var result = FlightExtraSearchMapper.MapResponse(
            null,
            _luggage,
            null,
            false);

        // Assert
        Assert.Empty(result);
    }


    [Fact]
    public void MapResponse_ResponseOffersAreEmpty_ReturnsEmptyList()
    {
        // Act
        var result = FlightExtraSearchMapper.MapResponse(
            new Models.FlightExtraSearch.FlightExtraSearchResponse(),
            _luggage,
            null,
            false);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public void MapResponse_HoldLuggageAndSportsEquipmentAreEnabledForBookingFlow_ReturnsAllItems()
    {
        // Arrange
        var response = CreateFlightExtraSearchResponse();
        var luggageSettings = CreateLuggageSettings(holdLuggageEnabled: true, sportsEquipmentEnabled: true);

        var sportsCategory = AddFlightExtraCategory(response, LargeSportEquipmentCategoryCode);
        AddFlightExtra(sportsCategory, BikeCode, 45);
        var bagsCategory = AddFlightExtraCategory(response, BaggageCategoryCode);
        AddFlightExtra(bagsCategory, Bag23kgCode, 10);

        // Act
        var result = FlightExtraSearchMapper.MapResponse(
            response,
            _luggage,
            luggageSettings,
            false);

        // Assert
        Assert.Equal(2, actual: result.First().FlightExtraCategories.Count);
        Assert.Equal(LargeSportEquipmentCategoryCode, actual: result.First().FlightExtraCategories.First().CategoryCode);
        Assert.Equal(BaggageCategoryCode, actual: result.First().FlightExtraCategories.ElementAt(1).CategoryCode);
    }

    [Fact]
    public void MapResponse_HoldLuggageIsEnabledForBookingFlow_ReturnsBagItem()
    {
        // Arrange
        var response = CreateFlightExtraSearchResponse();
        var luggageSettings = CreateLuggageSettings(holdLuggageEnabled: true, sportsEquipmentEnabled: false);

        var sportsCategory = AddFlightExtraCategory(response, LargeSportEquipmentCategoryCode);
        AddFlightExtra(sportsCategory, BikeCode, 45);
        var bagsCategory = AddFlightExtraCategory(response, BaggageCategoryCode);
        AddFlightExtra(bagsCategory, Bag23kgCode, 10);

        // Act
        var result = FlightExtraSearchMapper.MapResponse(
            response,
            _luggage,
            luggageSettings,
            false);

        // Assert
        Assert.Single(result.First().FlightExtraCategories);
        Assert.Equal(BaggageCategoryCode, actual: result.First().FlightExtraCategories.First().CategoryCode);
    }

    [Fact]
    public void MapResponse_HoldLuggageIsDisabledForBookingFlow_ReturnsSportEquipmentItem()
    {
        // Arrange
        var response = CreateFlightExtraSearchResponse();
        var luggageSettings = CreateLuggageSettings(holdLuggageEnabled: false, sportsEquipmentEnabled: true);

        var sportsCategory = AddFlightExtraCategory(response, LargeSportEquipmentCategoryCode);
        AddFlightExtra(sportsCategory, BikeCode, 45);
        var bagsCategory = AddFlightExtraCategory(response, BaggageCategoryCode);
        AddFlightExtra(bagsCategory, Bag23kgCode, 10);

        // Act
        var result = FlightExtraSearchMapper.MapResponse(
            response,
            _luggage,
            luggageSettings,
            false);

        // Assert
        Assert.Single(result.First().FlightExtraCategories);
        Assert.Equal(LargeSportEquipmentCategoryCode, actual: result.First().FlightExtraCategories.First().CategoryCode);
    }

    [Fact]
    public void MapResponse_HoldLuggageIsEnabledForPostBookingFlow_ReturnsAllItems()
    {
        // Arrange
        var response = CreateFlightExtraSearchResponse();
        var luggageSettings = CreateLuggageSettings(holdLuggageEnabled: false, sportsEquipmentEnabled: false);

        var sportsCategory = AddFlightExtraCategory(response, LargeSportEquipmentCategoryCode);
        AddFlightExtra(sportsCategory, BikeCode, 45);
        var bagsCategory = AddFlightExtraCategory(response, BaggageCategoryCode);
        AddFlightExtra(bagsCategory, Bag23kgCode, 10);

        // Act
        var result = FlightExtraSearchMapper.MapResponse(
            response,
            _luggage,
            luggageSettings,
            true);

        // Assert
        Assert.Equal(2, actual: result.First().FlightExtraCategories.Count);
        Assert.Equal(LargeSportEquipmentCategoryCode, actual: result.First().FlightExtraCategories.First().CategoryCode);
        Assert.Equal(BaggageCategoryCode, actual: result.First().FlightExtraCategories.ElementAt(1).CategoryCode);
    }

    [Fact]
    public void MapResponse_ReturnsOnlyItemsConfiguredInSitecore()
    {
        // Arrange
        var response = CreateFlightExtraSearchResponse();
        var luggageSettings = CreateLuggageSettings(holdLuggageEnabled: true, sportsEquipmentEnabled: true);

        var sportsCategory = AddFlightExtraCategory(response, LargeSportEquipmentCategoryCode);
        AddFlightExtra(sportsCategory, BikeCode, 45);
        AddFlightExtra(sportsCategory, GolfBagCode, 10);
        AddFlightExtra(sportsCategory, "SPORT1", 10);

        var bagsCategory = AddFlightExtraCategory(response, BaggageCategoryCode);
        AddFlightExtra(bagsCategory, Bag23kgCode, 10);
        AddFlightExtra(bagsCategory, Bag15kgCode, 10);
        AddFlightExtra(bagsCategory, "BAG1", 10);

        var otherCategory = AddFlightExtraCategory(response, "OTHER");
        AddFlightExtra(otherCategory, "OTHER1", 10);
        AddFlightExtra(otherCategory, "OTHER2", 20);

        // Act
        var result = FlightExtraSearchMapper.MapResponse(
            response,
            _luggage,
            luggageSettings,
            false);

        // Assert
        var categoryCodes = result.First().FlightExtraCategories.Select(category => category.CategoryCode).ToList();
        categoryCodes.Should().NotContain("OTHER");
        categoryCodes.Should().NotContain(ExtraWeightCategoryCode);
        categoryCodes.Should().Contain(new[] { LargeSportEquipmentCategoryCode, BaggageCategoryCode });

        var sportItemCodes = result.First().FlightExtraCategories
            .Single(c => c.CategoryCode == LargeSportEquipmentCategoryCode).FlightExtras
            .Select(x => x.FlightExtraCode)
            .ToList();
        sportItemCodes.Should().NotContain("SPORT1");
        sportItemCodes.Should().Contain(new[] { BikeCode, GolfBagCode });

        var bagCodes = result.First().FlightExtraCategories
            .Single(c => c.CategoryCode == BaggageCategoryCode).FlightExtras
            .Select(x => x.FlightExtraCode)
            .ToList();
        bagCodes.Should().NotContain("BAG1");
        bagCodes.Should().Contain(new[] { Bag15kgCode, Bag23kgCode });
    }

    [Fact]
    public void MapResponse_AddZeroQuantityLuggageItem()
    {
        // Arrange
        var response = CreateFlightExtraSearchResponse();
        var luggageSettings = CreateLuggageSettings(holdLuggageEnabled: true, sportsEquipmentEnabled: true);

        var sportsCategory = AddFlightExtraCategory(response, LargeSportEquipmentCategoryCode);
        AddFlightExtra(sportsCategory, BikeCode, 45);
        AddFlightExtra(sportsCategory, GolfBagCode, 10);
        AddFlightExtra(sportsCategory, "SPORT1", 10);

        var bagsCategory = AddFlightExtraCategory(response, BaggageCategoryCode);
        AddFlightExtra(bagsCategory, Bag23kgCode, 10, availableQuantity: 0);
        AddFlightExtra(bagsCategory, Bag15kgCode, 10);
        AddFlightExtra(bagsCategory, "BAG1", 10);

        var otherCategory = AddFlightExtraCategory(response, "OTHER");
        AddFlightExtra(otherCategory, "OTHER1", 10);
        AddFlightExtra(otherCategory, "OTHER2", 20);

        // Act
        var result = FlightExtraSearchMapper.MapResponse(
            response,
            _luggage,
            luggageSettings,
            false);

        // Assert
        result[0].FlightExtraCategories[0].CategoryCode.Should().Be(LargeSportEquipmentCategoryCode);
        result[0].FlightExtraCategories[0].FlightExtras.Count.Should().Be(2);

        result[0].FlightExtraCategories[1].CategoryCode.Should().Be(BaggageCategoryCode);
        result[0].FlightExtraCategories[1].FlightExtras.Count.Should().Be(2);

        var bag23Kg = result[0].FlightExtraCategories[1].FlightExtras.First(i => i.FlightExtraCode == Bag23kgCode);
        bag23Kg.Should().NotBeNull();
        bag23Kg.AvailableQuantity.Should().Be(0);
    }

    [Fact]
    public void MapResponse_ReturnsCorrectResult()
    {
        var response = CreateFlightExtraSearchResponse();
        var luggageSettings = CreateLuggageSettings(holdLuggageEnabled: true, sportsEquipmentEnabled: true);

        var sportsCategory = AddFlightExtraCategory(response, LargeSportEquipmentCategoryCode);
        AddFlightExtra(sportsCategory, BikeCode, 45, 35, 10);

        var bagsCategory = AddFlightExtraCategory(response, BaggageCategoryCode);
        AddFlightExtra(bagsCategory, Bag15kgCode, 10, 10, 50);

        var result = FlightExtraSearchMapper.MapResponse(
            response,
            _luggage,
            luggageSettings,
            false);

        var sportEquipment = result.Single().FlightExtraCategories
            .First(c => c.CategoryCode == LargeSportEquipmentCategoryCode).FlightExtras;
        var bike = sportEquipment.Single(i => i.FlightExtraCode == BikeCode);
        bike.AdultPrice.Should().Be(45);
        bike.ChildPrice.Should().Be(35);
        bike.AvailableQuantity.Should().Be(10);

        var bags = result.Single().FlightExtraCategories
            .First(c => c.CategoryCode == BaggageCategoryCode).FlightExtras;
        var bag = bags.Single(i => i.FlightExtraCode == Bag15kgCode);
        bag.AdultPrice.Should().Be(10);
        bag.ChildPrice.Should().Be(10);
        bag.AvailableQuantity.Should().Be(50);
    }

    [Fact]
    public void MapResponse_DisabledEachBagsItemsInConfig_ReturnsOnlySports()
    {
        // Arrange
        var response = CreateFlightExtraSearchResponse();
        var luggageSettings = CreateLuggageSettings(holdLuggageEnabled: true, sportsEquipmentEnabled: true);
        var luggageItems = _luggage.LuggageCategories.First(x => x.Code == BaggageCategoryCode).LuggageItems;
        foreach (var luggageItem in luggageItems)
            luggageItem.IsLuggageItemEnabled = false;

        var sportsCategory = AddFlightExtraCategory(response, LargeSportEquipmentCategoryCode);
        AddFlightExtra(sportsCategory, BikeCode, 45);
        var bagsCategory = AddFlightExtraCategory(response, BaggageCategoryCode);
        AddFlightExtra(bagsCategory, Bag23kgCode, 10);

        // Act
        var actual = FlightExtraSearchMapper.MapResponse(
            response,
            _luggage,
            luggageSettings,
            false).ToArray();

        // Assert
        actual.First().FlightExtraCategories.Should().HaveCount(1);
        actual.First().FlightExtraCategories.First().CategoryCode.Should().Be(LargeSportEquipmentCategoryCode);
        actual.First().FlightExtraCategories.First().FlightExtras.Should().HaveCount(1);
    }

    [Fact]
    public void MapResponse_DisabledEachSportItemsInConfig_ReturnsOnlyBags()
    {
        // Arrange
        var response = CreateFlightExtraSearchResponse();
        var luggageSettings = CreateLuggageSettings(holdLuggageEnabled: true, sportsEquipmentEnabled: true);
        var luggageItems = _luggage.LuggageCategories.First(x => x.Code == LargeSportEquipmentCategoryCode).LuggageItems;
        foreach (var luggageItem in luggageItems)
            luggageItem.IsLuggageItemEnabled = false;

        var sportsCategory = AddFlightExtraCategory(response, LargeSportEquipmentCategoryCode);
        AddFlightExtra(sportsCategory, BikeCode, 45);
        var bagsCategory = AddFlightExtraCategory(response, BaggageCategoryCode);
        AddFlightExtra(bagsCategory, Bag23kgCode, 10);
        AddFlightExtra(bagsCategory, Bag15kgCode, 1);

        // Act
        var actual = FlightExtraSearchMapper.MapResponse(
            response,
            _luggage,
            luggageSettings,
            false).ToArray();

        // Assert
        actual.First().FlightExtraCategories.Should().HaveCount(1);
        actual.First().FlightExtraCategories.First().CategoryCode.Should().Be(BaggageCategoryCode);
        actual.First().FlightExtraCategories.First().FlightExtras.Should().HaveCount(2);
    }

    [Fact]
    public void MapResponse_DisabledInConfigButEnabledInSettings_ReturnsEmpty()
    {
        // Arrange
        var response = CreateFlightExtraSearchResponse();
        var luggageSettings = CreateLuggageSettings(holdLuggageEnabled: true, sportsEquipmentEnabled: true);
        var luggageItems = _luggage.LuggageCategories.SelectMany(x => x.LuggageItems);
        foreach (var luggageItem in luggageItems)
            luggageItem.IsLuggageItemEnabled = false;

        var sportsCategory = AddFlightExtraCategory(response, LargeSportEquipmentCategoryCode);
        AddFlightExtra(sportsCategory, BikeCode, 45);
        var bagsCategory = AddFlightExtraCategory(response, BaggageCategoryCode);
        AddFlightExtra(bagsCategory, Bag23kgCode, 10);

        // Act
        var actual = FlightExtraSearchMapper.MapResponse(
            response,
            _luggage,
            luggageSettings,
            false).ToArray();

        // Assert
        actual.First().FlightExtraCategories.Should().HaveCount(0);
    }

    private Luggage CreateLuggage()
    {
        return new Luggage
        {
            LuggageCategories = new List<LuggageCategory>
            {
                new()
                {
                    Type = BagLuggageType,
                    Code = BaggageCategoryCode,
                    Name = "Hold Baggage",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem()
                        {
                            Name = "Hold Baggage 15 kg",
                            Code = Bag15kgCode,
                            IsLuggageItemEnabled = true
                        },
                        new LuggageItem()
                        {
                            Name = "Hold Baggage 23 kg",
                            Code = Bag23kgCode,
                            IsLuggageItemEnabled = true
                        }
                    }
                },
                new()
                {
                    Type = SportsEquipmentLuggageType,
                    Code = LargeSportEquipmentCategoryCode,
                    Name = "Small Sports Equipment",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem()
                        {
                            Name = "Golf Bag",
                            Code = GolfBagCode,
                            IsLuggageItemEnabled = true
                        },
                        new LuggageItem()
                        {
                            Name = "Bike",
                            Code = BikeCode,
                            IsLuggageItemEnabled = true
                        }
                    }
                },
                new()
                {
                    Type = "",
                    Code = ExtraWeightCategoryCode,
                    Name = "",
                    LuggageItems = new List<LuggageItemBase>
                    {
                        new LuggageItem()
                        {
                            Name = "Extra weight 3 kg",
                            Code = ExtraWeight3KgCode,
                            IsLuggageItemEnabled = true
                        }
                    }
                }
            }
        };
    }

    private LuggageSettings CreateLuggageSettings(bool holdLuggageEnabled, bool sportsEquipmentEnabled)
    {
        return new LuggageSettings
        {
            EnableHoldLuggageBookingFlow = holdLuggageEnabled,
            EnableSportsEquipmentBookingFlow = sportsEquipmentEnabled
        };
    }

    private static Flt_Extra_Cat AddFlightExtraCategory(Models.FlightExtraSearch.FlightExtraSearchResponse response, string code)
    {
        var tempCollection = response.Payload.Body.Offers.First().Flt_Extra_Cat_List.First().Flt_Extra_Cat.ToList();

        var newCategory = new Flt_Extra_Cat { Code = code };
        tempCollection.Add(newCategory);
        response.Payload.Body.Offers.First().Flt_Extra_Cat_List.First().Flt_Extra_Cat = tempCollection.ToArray();

        return newCategory;
    }

    private static void AddFlightExtra(Flt_Extra_Cat parentCategory, string code, decimal adultPrice, decimal childPrice = 0, int availableQuantity = 100)
    {
        if (childPrice == 0)
        {
            childPrice = adultPrice;
        }

        var tempCollection = parentCategory.Flt_Extra?.ToList() ?? new List<Flt_Extra>();

        tempCollection.Add(new Flt_Extra
        {
            Code = code,
            Qty = new[] { new Avl { Num = availableQuantity.ToString() } },
            Adt_Prc = new Prc_Type { Value = adultPrice.ToString("#.##") },
            Chd_Prc = new Prc_Type { Value = childPrice.ToString("#.##") }
        });

        parentCategory.Flt_Extra = tempCollection.ToArray();
    }

    private Models.FlightExtraSearch.FlightExtraSearchResponse CreateFlightExtraSearchResponse()
    {
        return new Models.FlightExtraSearch.FlightExtraSearchResponse
        {
            Payload = new Domain.Models.Api.Payload.XmlApiPayload<FlightExtraSearchResponse>
            {
                Body = new FlightExtraSearchResponse
                {
                    Offers = new Offers[]
                    {
                        new()
                        {
                            Flt_Extra_Cat_List = new Flt_Extra_Cat_List[]
                            {
                                new()
                                {
                                    Flt_Extra_Cat =  new Flt_Extra_Cat[] { }
                                }
                            },
                            Route_List = new Routing[]
                            {
                                new()
                                {
                                    Items = new Route_Tp[]
                                    {
                                        new()
                                        {
                                            Flt_Inv_Id = "flt_inv_id",
                                            Flt_No = "fl_no"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
    }
}