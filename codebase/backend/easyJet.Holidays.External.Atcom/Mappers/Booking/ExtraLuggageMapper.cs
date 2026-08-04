using easyJet.Holidays.Api.Common.Exceptions;
using System.Globalization;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Logging;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.Atcom.Utils;
using Microsoft.Extensions.Logging;
using ExtraLuggageItem = easyJet.Holidays.Api.Domain.Data.Booking.ExtraLuggageItem;

namespace easyJet.Holidays.External.Atcom.Mappers.Booking;

/// <summary>
/// Extra luggage mapper.
/// </summary>
public class ExtraLuggageMapper
{

    private readonly IReferenceDataService _referenceDataService;
    private readonly ILuggageService _luggageService;
    private readonly IFlightExtraService _flightExtraService;
    private readonly ILogger<ExtraLuggageMapper> _logger;
    
    // EEA-543: Remove this static logger when Jira ticket is fixed - DG
    private static ILogger<ExtraLuggageMapper> Logger => LoggerFactoryProvider.CreateLogger<ExtraLuggageMapper>();

    /// <summary>
    /// Constructor of Extra Luggage Mapper
    /// </summary>
    /// <param name="referenceDataService"></param>
    /// <param name="luggageService"></param>
    /// <param name="flightExtraService"></param>
    /// <param name="logger"></param>
    public ExtraLuggageMapper(IReferenceDataService referenceDataService, ILuggageService luggageService, IFlightExtraService flightExtraService, ILogger<ExtraLuggageMapper> logger)
    {
        _referenceDataService = referenceDataService;
        _luggageService = luggageService;
        _flightExtraService = flightExtraService;
        _logger = logger;
    }

    /// <summary>
    /// Maps Luggage Info
    /// </summary>
    /// <param name="flightExtraCategoryLists"></param>
    /// <param name="routes"></param>
    /// <param name="package"></param>
    /// <param name="mapRealExtraLuggageInfoForInternalFlightsWhenConfiguredInCms"></param>
    /// <returns></returns>
#pragma warning disable S3776
    public async Task<ExtraLuggageInfo> MapLuggageInfo(Flt_Extra_Cat_List[] flightExtraCategoryLists,
#pragma warning restore S3776
        List<Route> routes,
        BookingPackage package, bool mapRealExtraLuggageInfoForInternalFlightsWhenConfiguredInCms = false)
    {
        ExtraLuggageInfo luggage = new()
        {
            Items = new List<ExtraLuggageItem>()
        };

        if (flightExtraCategoryLists.IsNullOrEmpty() || routes.IsNullOrEmpty())
            return luggage;
        ArgumentNullException.ThrowIfNull(package);

        var needToMapDataFromBooking = await _flightExtraService.NeedToAddExtraFlightInformationIntoAtcomRequest(package.Accom?.Prom) && mapRealExtraLuggageInfoForInternalFlightsWhenConfiguredInCms;
        // No extras for internal flights if we don't need to map data from booking
        if (!needToMapDataFromBooking && routes.All(route => !route.IsExternal))
        {
            var complimentaryLuggage = await _luggageService.GetComplimentaryLuggage(package);
            luggage.Items.AddRange(complimentaryLuggage);

            _logger.LogInformation("Got {LuggageCount} complimentary bags for internal flight", luggage.Items.Count);

            // Some internal Atcom flights have routeId as flight number, not index
            NormalizeInternalRouteIds(luggage, routes);

            // Add complimentary luggage for external flights only
            return luggage;
        }

        var promotionCode = package.Accom?.Prom;
        if (string.IsNullOrEmpty(promotionCode))
            return luggage;

        var luggageConfig = await _referenceDataService.GetLuggage();
        var luggageSettings = await _referenceDataService.GetLuggageSettings();
        const string comma = ",";
        var nonComplimentaryCategories = string.Join(
                comma,
                luggageSettings.HoldLuggageCategoryCodes ?? string.Empty,
                luggageSettings.SportsEquipmentCategoryCodes ?? string.Empty,
                luggageSettings.SportsEquipmentLargeCategoryCodes ?? string.Empty,
                luggageSettings.LargeCabinBagCategoryCode ?? string.Empty
            )
            .Split(comma)
            .Select(x => x.Trim().ToUpper())
            .Where(x => !string.IsNullOrEmpty(x))
            .ToArray();

        _logger.LogInformation("Mapped {CategoriesLength} non complimentary categories from SC luggage settings", nonComplimentaryCategories.Length);
        
        foreach (var flightExtraCategoryList in flightExtraCategoryLists)
        {
            List<PackageItem> codes = flightExtraCategoryList.Flt_Extra_Cat.SelectMany(extraCategory => extraCategory.Flt_Extra.SelectMany(i => i.SubServPaxs.Select(b =>
            {
                double.TryParse(i.Bkg_Qty, CultureInfo.InvariantCulture, out var quantity);
                if (quantity == 0)
                    quantity = 1;

                decimal.TryParse(b.Pax_Srv_Prc_Ex?.Value, CultureInfo.InvariantCulture, out var price);

                return new PackageItem
                {
                    Code = i.Code,
                    Quantity = (int)quantity,
                    PassengerId = b.Pax_Id,
                    Price = price,
                };
            }))).ToList();
            
            var combineLuggageCodes = LuggageService.CombineLuggageCodes(codes, luggageConfig);
            foreach (var combineLuggageCode in combineLuggageCodes)
            {
                var categoryCode = combineLuggageCode.LuggageCategory.Code;
                var isComplimentary = nonComplimentaryCategories.Contains(categoryCode) is false;
                var routeId = flightExtraCategoryList.Flt_Inv_Id;
                var config = combineLuggageCode.LuggageItem;

                var price = combineLuggageCode.Price;
                var quantity = combineLuggageCode.Quantity;

                var luggageItem = new ExtraLuggageItem
                {
                    RouteId = routeId,
                    ItemCategoryCode = categoryCode,
                    ItemCode = combineLuggageCode.Code,
                    PassengerId = combineLuggageCode.PassengerId,
                    Quantity = quantity,
                    Price = (double)price / quantity,
                    Name = config.Name,
                    Description = config.Description,
                    Icon = config.Icon,
                    IsComplimentary = isComplimentary
                };

                luggage.Items.Add(luggageItem);
            }
        }

        _logger.LogInformation("Mapped {LuggageCount} bags for external flight", luggage.Items.Count);

        return luggage;

        // NOTE:
        // External flights have a flight index as routeId, internal flights have flight number as routeId (not all).
        // A lot of logic based on the assumption that routeId has an index, 1 - outbound, 2 - inbound.
        // Setting index as routeId for internal flights to have consistent values for all flights.
        void NormalizeInternalRouteIds(ExtraLuggageInfo luggageInfo, List<Route> innerRoutes)
        {
            _logger.LogTrace("Normalizing internal route Ids");

            if (innerRoutes is null
                || innerRoutes.Count != 2
                || innerRoutes.Any(route => route.IsExternal)
                || !innerRoutes.Any(route => route.Direction is Direction.Outbound)
                || !innerRoutes.Any(route => route.Direction is Direction.Inbound))
                return;

            var outboundIndex = 1;
            var inboundIndex = 2;

            var groupedLuggages = luggageInfo?.Items?
                .GroupBy(x => x.RouteId)
                .ToArray() ?? Array.Empty<IGrouping<string, ExtraLuggageItem>>();

            var outboundRoute = innerRoutes.First(x => x.Direction == Direction.Outbound);
            var outboundLuggage = groupedLuggages.FirstOrDefault();

            var inboundRoute = innerRoutes.First(x => x.Direction == Direction.Inbound);
            var inboundLuggage = groupedLuggages.Skip(1).FirstOrDefault();

            // Assumption, that luggage for inbound and outbound are the same
            outboundRoute.RouteId = outboundIndex.ToString();
            if (outboundLuggage != null)
                foreach (var luggageItem in outboundLuggage)
                    luggageItem.RouteId = outboundRoute.RouteId;

            inboundRoute.RouteId = inboundIndex.ToString();
            if (inboundLuggage != null)
                foreach (var luggageItem in inboundLuggage)
                    luggageItem.RouteId = inboundRoute.RouteId;
        }

    }
    
    /// <summary>
    /// Map ExtraLuggageInfo to Atcom model
    /// </summary>
    /// <param name="luggage"></param>
    /// <param name="routes"></param>
    /// <param name="needToAddExtraFlightInformationIntoAtcomRequest"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
#pragma warning disable S3776
    public static Flt_Extra_Cat_List[] MapToAtcomModel(ExtraLuggageInfo luggage, IList<Route> routes, bool needToAddExtraFlightInformationIntoAtcomRequest = false)
#pragma warning restore S3776
    {
        List<Flt_Extra_Cat_List> result = new();

        if ((luggage?.Items.IsNullOrEmpty() ?? true) ||
            routes.IsNullOrEmpty() ||
            // No extras for internal flights for Atcom
            (routes.All(route => !route.IsExternal) && !needToAddExtraFlightInformationIntoAtcomRequest))
        {
            return null;
        }

        var luggageGroupByRoute = luggage.Items.SelectMany(CollapseCombinedLuggageItems).GroupBy(item => item.RouteId);

        foreach (var luggageByRoute in luggageGroupByRoute)
        {
            if (routes.All(route => route.RouteId != luggageByRoute.Key))
            {
                throw new Exception($"Cannot find route with routeId {luggageByRoute.Key}");
            }

            var routeLuggageGroupByCategory = luggageByRoute.GroupBy(item => item.ItemCategoryCode).ToList();

            Flt_Extra_Cat_List flightExtraCategoryList = new()
            {
                Flt_Inv_Id = luggageByRoute.Key,
                Ser_Sts = Ser_Sts.FIX
            };

            List<Flt_Extra_Cat> flightExtraCategories = new();
            bool isBagIncluded = IsBagIncluded(routeLuggageGroupByCategory);

            foreach (var luggageByCategory in routeLuggageGroupByCategory)
            {
                Flt_Extra_Cat flightExtraCategory = new()
                {
                    Code = luggageByCategory.Key,
                    Method = Flt_Extra_CatMethod.OTH
                };

                var isBag = IsBag(luggageByCategory);
                if (isBag)
                {
                    flightExtraCategory.Method = Flt_Extra_CatMethod.BAG;
                }

                var categoryLuggageGroupByItemCode = luggageByCategory.GroupBy(item => item.ItemCode);
                List<Flt_Extra> flightExtras = new();
                foreach (var categoryLuggageByItemCode in categoryLuggageGroupByItemCode)
                {
                    var sameCodeLuggageGroupByPassenger = categoryLuggageByItemCode.GroupBy(item => item.PassengerId);
                    var itemQuantityByPassenger = sameCodeLuggageGroupByPassenger
                        .Select(sameCodeLuggageByPassenger => new
                        {
                            PassengerId = sameCodeLuggageByPassenger.Key,
                            Quantity = sameCodeLuggageByPassenger.Sum(item => item.Quantity)
                        })
                        .Where(item => item.Quantity > 0)
                        .ToList();

                    AddFlightExtrasGroupedByQuantity();

                    // Combines passengers with the same luggage quantity into one Flt_Extra item, otherwise booking amendment won't work later
                    void AddFlightExtrasGroupedByQuantity()
                    {
                        if (!itemQuantityByPassenger.Any())
                        {
                            return;
                        }

                        int minimalQuantityAvailableForAllPassengers = itemQuantityByPassenger.Min(item => item.Quantity);

                        // Create one Flt_Extra item for all passengers

                        var fltExtra = new Flt_Extra
                        {
                            Code = categoryLuggageByItemCode.Key,
                            SubServPaxs = itemQuantityByPassenger
                                .Select(item => new SubServPax { Pax_Id = item.PassengerId }).ToArray(),
                            Bkg_Qty = minimalQuantityAvailableForAllPassengers.ToString(),
                            SrcData = new[] { new SrcData { System = AtcomConstants.SystemCode } }
                        };

                        if (isBagIncluded && needToAddExtraFlightInformationIntoAtcomRequest)
                        {
                            fltExtra.Atol_Mth = Atol_Mth.APP;
                            fltExtra.Class = "Y";
                            if (isBag)
                            {
                                fltExtra.SrcData = null;
                                fltExtra.Baggage = new Baggage()
                                {
                                    Weight = new Weight[]
                                    {
                                        new Weight()
                                        {
                                            Cd = "23",
                                            Piece = new Piece[]
                                            {
                                                new Piece()
                                                {
                                                    Cd = "1",
                                                    Value = "0"
                                                }
                                            }
                                        }
                                    }
                                };
                                fltExtra.Atol_Mth = Atol_Mth.NONE;
                            }
                            fltExtra.Atol_MthSpecified = true;
                        }
                        
                        flightExtras.Add(fltExtra);
                        
                        // Reduce all quantities by the value for which the Flt_Extra item has been created
                        itemQuantityByPassenger = itemQuantityByPassenger
                            .Where(item => item.Quantity > minimalQuantityAvailableForAllPassengers)
                            .Select(item => item with { Quantity = item.Quantity - minimalQuantityAvailableForAllPassengers })
                            .ToList();

                        // Repeat until no luggage left
                        AddFlightExtrasGroupedByQuantity();
                    }
                }

                flightExtraCategory.Flt_Extra = flightExtras.ToArray();
                flightExtraCategories.Add(flightExtraCategory);
            }

            flightExtraCategoryList.Flt_Extra_Cat = flightExtraCategories.ToArray();
            result.Add(flightExtraCategoryList);
        }

        LogHoldBagErrors(result);
        return result.ToArray();
    }

    private static bool IsBagIncluded(List<IGrouping<string, ExtraLuggageItem>> routeLuggageGroupByCategory)
    {
        var isBagIncluded = false;
        foreach (var category in routeLuggageGroupByCategory)
        {
            if (!IsBag(category))
            {
                continue;
            }

            isBagIncluded = true;
            break;
        }

        return isBagIncluded;
    }

    private static bool IsBag(IGrouping<string, ExtraLuggageItem> luggageByCategory)
    {
        return luggageByCategory.Key.Equals("BAG", StringComparison.Ordinal);
    }

    // EEA-543: Logs to track how many times we have to split luggage items with codes 'LUGE' and
    // 'LUSE' from category 'ADDB' into multiple 'Flt_Extra' items. Remove when Jira ticket is fixed - DG */
    private static void LogHoldBagErrors(List<Flt_Extra_Cat_List> mappedAtcomModel)
    {
        var quantityOfFltExtras = mappedAtcomModel
            .SelectMany(flightExtraCategoryList => flightExtraCategoryList.Flt_Extra_Cat)
            .Where(category => category.Code == "ADDB")
            .Count(category =>
                category.Flt_Extra.Count(fltExtra => fltExtra.Code == "LUGE" || fltExtra.Code == "LUSE") >= 2
            );

        if (quantityOfFltExtras <= 1) return;
        
        Logger.LogError("Luggage items were split into more than one ({FltExtraCount}) Flt_Extra's", quantityOfFltExtras);
    }

    private static IReadOnlyCollection<ExtraLuggageItem> CollapseCombinedLuggageItems(ExtraLuggageItem extraLuggageItem)
    {
        var code = extraLuggageItem.ItemCode;
        var splitCodes = LuggageUtils.ExtractCodes(code);
        if (splitCodes.Count < 2)
            return new List<ExtraLuggageItem>(1) { extraLuggageItem };

        var categoryCode = extraLuggageItem.ItemCategoryCode;
        var splitCategoryCodes = LuggageUtils.ExtractCodes(categoryCode);
        if (splitCodes.Count != splitCategoryCodes.Count)
            throw new ApiException(ApiExceptionCodes.BookingCombinedLuggageDifference);

        var returnList = new List<ExtraLuggageItem>();
        for (int i = 0; i < splitCodes.Count; i++)
        {
            var splitCode = splitCodes.ElementAt(i);
            var splitCategoryCode = splitCategoryCodes.ElementAt(i);

            var newExtraLuggageItem = new ExtraLuggageItem()
            {
                Quantity = extraLuggageItem.Quantity,
                IsComplimentary = extraLuggageItem.IsComplimentary,
                PassengerId = extraLuggageItem.PassengerId,
                Price = extraLuggageItem.Price,
                RouteId = extraLuggageItem.RouteId,
                ItemCode = splitCode,
                ItemCategoryCode = splitCategoryCode
            };
            returnList.Add(newExtraLuggageItem);
        }

        return returnList;
    }
}