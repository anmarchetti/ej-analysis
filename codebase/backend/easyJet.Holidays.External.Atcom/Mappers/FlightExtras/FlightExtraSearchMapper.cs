using System.Globalization;
using Amazon.Runtime.Internal.Transform;
using easyJet.Holidays.Api.Domain.Data.Booking.Extras;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Luggage;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Mappers.Guests;
using easyJet.Holidays.External.Atcom.Mappers.Utils;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.Atcom.Utils;
using easyJet.Holidays.External.B2B.Models.Seats;

namespace easyJet.Holidays.External.Atcom.Mappers.FlightExtras;

/// <summary>
/// Maps requests and responses for the FlightExtraSearch Atcom call
/// </summary>
public static class FlightExtraSearchMapper
{
    private const string ZeroString = "0";

    public static Models.Internal.FlightExtraSearchRequest MapRequest(
        Holidays.Api.Domain.Data.PackageOffers.Offer offer,
        IEnumerable<Holidays.Api.Domain.Data.Guests.Person> guests,
        CltInfo cltInfo,
        string promoCode)
    {
        ArgumentNullException.ThrowIfNull(offer);
        ArgumentNullException.ThrowIfNull(guests);
        ArgumentNullException.ThrowIfNull(cltInfo);

        if (offer.Transport?.Routes?.IsNullOrEmpty() ?? true)
        {
            throw new ArgumentException("Offer routes should not be empty", nameof(offer));
        }

        var nonInfants = guests.Where(guest => guest.Type is PersonType.Adult or PersonType.Child).ToArray();
        var subServPaxs = nonInfants.Select((guest, idx) => new SubServPax
        {
            Pax_Id = (idx + 1).ToString(),
            Pax_Tp = GuestsMapper.MapType(guest.Type)
        }).ToArray();

        return new Models.Internal.FlightExtraSearchRequest
        {
            Adm = VrpRequestUtils.BuildAdm(),
            CltInfo = cltInfo,
            Occs = nonInfants.Select((pax, idx) => new Occ
            {
                Pax = new[]
                {
                    new Pax
                    {
                        Index = (idx + 1).ToString(),
                        Pax_Tp = GuestsMapper.MapType(pax.Type),
                        Age = pax.Age.ToString()
                    }
                }
            }).ToArray(),
            Base_Prd = new FlightExtraSearchRequestBase_Prd
            {
                Route_List = new[]
                {
                    new Routing
                    {
                        Routing_Id = "1",
                        ItemsElementName = offer.Transport?.Routes.Select(_ => ItemsChoiceType.Route).ToArray(),
                        Items = offer.Transport?.Routes.Select((route, idx) =>
                            {
                                var atcomRoute = RouteMapper.BuildRoute(route, promoCode, subServPaxs, route.Direction == Direction.Outbound);
                                atcomRoute.Route_Id = (idx + 1).ToString();
                                atcomRoute.Ext_Ref_Id = new Ext_Ref_Id
                                {
                                    System = AtcomConstants.SystemCode,
                                    Sub_System = AtcomConstants.SubSystemCode,
                                    Alt_Ref = new Alt_Ref
                                    {
                                        System = AtcomConstants.SystemCode
                                    }
                                };
                                return (object) atcomRoute;
                            }

                        ).ToArray()
                    }
                }
            }
        };
    }

    public static IList<FlightExtraCategoryList> MapResponse(
        Models.FlightExtraSearch.FlightExtraSearchResponse response,
        Luggage luggageConfiguration,
        LuggageSettings luggageSettings,
        bool isPostBooking)
    {
        ArgumentNullException.ThrowIfNull(luggageConfiguration);

        var result = new List<FlightExtraCategoryList>();

        if (!(response?.Payload?.Body?.Offers?.Any() ?? false))
        {
            return result;
        }

        foreach (var offer in response.Payload.Body.Offers)
        {
            foreach (var fltExtraCatList in offer.Flt_Extra_Cat_List.EmptyIfNull())
            {
                (List<PackageResult> zeroQuantityCodes, List<PackageItem> availableCodes) = GetLuggageCodes(luggageConfiguration, fltExtraCatList);

                var combineLuggageCodes = LuggageService.CombineLuggageCodes(availableCodes, luggageConfiguration);
                //Add also codes without quantity to show all luggage options
                var allAvailableLuggageCodes = combineLuggageCodes.Concat(zeroQuantityCodes);

                var flightNumber = offer.Route_List
                    .SelectMany(rl => rl.Items.Cast<Route_Tp>())
                    .FirstOrDefault(r => r.Flt_Inv_Id == fltExtraCatList.Flt_Inv_Id)?
                    .Flt_No;

                FlightExtraCategoryList categoryList = new()
                {
                    RouteId = fltExtraCatList.Flt_Inv_Id,
                    FlightNumber = flightNumber
                };

                var allAtcomCategories = fltExtraCatList.Flt_Extra_Cat.Select(i => i.Code).ToHashSet();
                var allCategories = allAvailableLuggageCodes.GroupBy(i => i.LuggageCategory);
                foreach (var luggageCategory in allCategories)
                {
                    if(!allAtcomCategories.Contains(luggageCategory.Key.Code))
                        continue;

                    FlightExtraCategory category = new()
                    {
                        CategoryCode = luggageCategory.Key.Code,
                        CategoryName = luggageCategory.Key.Name,
                        CategoryType = luggageCategory.Key.Type
                    };

                    if (!IsFlightExtraCategoryEnabled(category, luggageSettings, isPostBooking))
                    {
                        continue;
                    }

                    foreach (PackageResult packageResult in luggageCategory)
                    {
                        FlightExtra flightExtra = new()
                        {
                            FlightExtraCode = packageResult.Code,
                            Name = packageResult.LuggageItem.Name,
                            Description = packageResult.LuggageItem.Description,
                            Icon = packageResult.LuggageItem.Icon,
                            LimitPerPax = (int)packageResult.AdditionalParameters["Limit_Per_Pax"],
                            AdultPrice = packageResult.Price,
                            ChildPrice = packageResult.AdditionalPrice,
                            AvailableQuantity = packageResult.Quantity
                        };

                        category.FlightExtras.Add(flightExtra);
                    }

                    if (category.FlightExtras.Any())
                    {
                        categoryList.FlightExtraCategories.Add(category);
                    }
                }

                result.Add(categoryList);
            }
        }

        return result;
    }

    private static (List<PackageResult> zeroQuantityCodes, List<PackageItem> availableCodes) GetLuggageCodes(Luggage luggageConfiguration,
        Flt_Extra_Cat_List fltExtraCatList)
    {
        List<PackageResult> zeroQuantityCodes = new List<PackageResult>();
        List<PackageItem> availableCodes = new List<PackageItem>();

        var luggageConfigIndex = LuggageService.GetLuggageCategoriesMappingIndex(luggageConfiguration);

        foreach (var fltExtraCat in fltExtraCatList.Flt_Extra_Cat)
        {
            foreach (var fltExtra in fltExtraCat.Flt_Extra)
            {
                _ = int.TryParse(fltExtra.Qty.FirstOrDefault()?.Num ?? ZeroString, out var quantity);
                _ = decimal.TryParse(fltExtra.Adt_Prc?.Value ?? ZeroString, CultureInfo.InvariantCulture, out var adultPrice);
                _ = decimal.TryParse(fltExtra.Chd_Prc?.Value ?? ZeroString, CultureInfo.InvariantCulture, out var childPrice);

                if (quantity == 0)
                {
                    if(!luggageConfigIndex.TryGetValue(fltExtra.Code, out var luggage))
                    {
                        continue;
                    }

                    zeroQuantityCodes.Add(new PackageResult()
                    {
                        Code = fltExtra.Code,
                        AdditionalPrice = childPrice,
                        Price = adultPrice,
                        PassengerId = "0",
                        Quantity = quantity,
                        LuggageCategory = luggage.LuggageCategory,
                        LuggageItem = luggage.LuggageItem,
                        AdditionalParameters = new Dictionary<string, object>()
                        {
                            { nameof(fltExtra.Limit_Per_Pax), fltExtra.Limit_Per_Pax }
                        }
                    });
                    continue;
                }

                var packageItem = new PackageItem
                {
                    Code = fltExtra.Code,
                    Quantity = quantity,
                    PassengerId = "0",
                    Price = adultPrice,
                    AdditionalPrice = childPrice,
                    AdditionalParameters = new Dictionary<string, object>()
                    {
                        { nameof(fltExtra.Limit_Per_Pax), fltExtra.Limit_Per_Pax }
                    }
                };

                availableCodes.Add(packageItem);
            }
        }

        return (zeroQuantityCodes, availableCodes);
    }

    private static bool IsFlightExtraCategoryEnabled(FlightExtraCategory category, LuggageSettings luggageSettings, bool isPostBooking)
    {
        if (isPostBooking)
        {
            return true;
        }

        var categoryTypeWithoutWhitespace = category.CategoryType?.Replace(" ", "");

        if (Enum.TryParse(categoryTypeWithoutWhitespace, out LuggageType categoryType))
        {
            switch (categoryType)
            {
                case LuggageType.Bag: return luggageSettings.EnableHoldLuggageBookingFlow;
                case LuggageType.SportsEquipment: return luggageSettings.EnableSportsEquipmentBookingFlow;
                case LuggageType.CabinBags: return luggageSettings.EnableCabinBagsBookingFlow;
            }
        }

        return true;
    }
}
