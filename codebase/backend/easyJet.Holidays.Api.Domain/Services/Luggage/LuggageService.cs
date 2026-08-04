using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Extras;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Luggage;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators.Utils;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;
using System.Collections.Immutable;
using LuggageConfiguration = easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage.Luggage;

namespace easyJet.Holidays.Api.Domain.Services.Luggage;

/// <inheritdoc />
public class LuggageService : ILuggageService
{
    private readonly IReferenceDataService _referenceDataService;
    private readonly ILuggageValidatorService _luggageValidatorService;
    private readonly IPassengerIndexCalculator _indexCalculator;
    private readonly IFlightExtraService _flightExtraService;
    private readonly ILogger<LuggageService> _logger;

    /// <summary>
    /// Creates instance with all dependencies resolved. 
    /// </summary>
    public LuggageService(IReferenceDataService referenceDataService,
        ILuggageValidatorService luggageValidatorService,
        IPassengerIndexCalculator indexCalculator,
        IFlightExtraService flightExtraService,
        ILogger<LuggageService> logger)
    {
        _referenceDataService = referenceDataService;
        _luggageValidatorService = luggageValidatorService;
        _indexCalculator = indexCalculator;
        _flightExtraService = flightExtraService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<ExtraLuggageItem>> GetComplimentaryLuggage(Offer offer)
    {
        return await GetComplimentaryLuggage(
            offer.Accom.Prom,
            offer.BuildGuests().ToArray(),
            offer.Transport.Routes.ToArray()
        );
    }

    /// <inheritdoc />
    public async Task<IEnumerable<ExtraLuggageItem>> GetComplimentaryLuggage(BookingPackage package)
    {
        return await GetComplimentaryLuggage(
            package.Accom.Prom,
            package.BuildGuests().ToArray(),
            package.Transport.Routes.ToArray()
        );
    }

    private async Task<IEnumerable<ExtraLuggageItem>> GetComplimentaryLuggage(
        string accommodationPromoCode,
        PersonWithDetails[] guests,
        Route[] routes)
    {
        if (accommodationPromoCode is null || guests.IsNullOrEmpty() || routes.IsNullOrEmpty())
            return [];

        var complimentarySettings = await _referenceDataService.GetComplimentarySettings();
        var promCode = accommodationPromoCode;

        if (complimentarySettings.ComplimentaryIndex.TryGetValue(promCode, out var promotionComplement) is false)
        {
            _logger.LogWarning("External route, missed SC complimentary settings for promotion code: {PromoCode}", promCode);
            return [];
        }

        // If the promotion is internal, we provide beach-holiday complimentary luggage, setup in the sitecore
        if (routes.All(x => x.IsExternal is false))
        {
            promCode = promotionComplement.InternalFallbackCode;
            if (promCode is null)
            {
                throw new LuggageException($"Internal route promotion fallback not found, origin promCode: {promCode}");
            }

            if (complimentarySettings.ComplimentaryIndex.TryGetValue(promCode, out promotionComplement) is false)
            {
                _logger.LogWarning("Internal route, missed SC complimentary settings for promotion code: {PromoCode}", promCode);
                return [];
            }
        }

        _logger.LogTrace("Got promotion complimentary setting: {ComplimentarySetting}, by code: {PromoCode}", promotionComplement.ToJsonString(), promCode);

        var luggageConfig = await _referenceDataService.GetLuggage();
        return GenerateComplementLuggage();

        IEnumerable<ExtraLuggageItem> GenerateComplementLuggage()
        {
            foreach (var route in routes)
            {
                List<PackageItem> codes = promotionComplement.Luggage.SelectMany(complementLuggage =>
                {
                    var returnList = new List<PackageItem>();
                    foreach (var guest in guests)
                    {
                        var quantity = guest.Type switch
                        {
                            PersonType.Adult => complementLuggage.Quantity.Adult,
                            PersonType.Child => complementLuggage.Quantity.Child,
                            PersonType.Infant => complementLuggage.Quantity.Infant,
                            _ => 0
                        };

                        if (quantity is 0)
                            continue;

                        returnList.Add(new PackageItem
                        {
                            Code = complementLuggage.Code,
                            Quantity = quantity,
                            PassengerId = guest.Index,
                            Price = 0
                        });
                    }

                    return returnList;
                }).Where(i => i != null).ToList();

                var combineLuggageCodes = CombineLuggageCodes(codes, luggageConfig);
                foreach (var combineLuggageCode in combineLuggageCodes)
                {
                    yield return new ExtraLuggageItem
                    {
                        ItemCode = combineLuggageCode.Code,
                        ItemCategoryCode = combineLuggageCode.LuggageCategory.Code,
                        PassengerId = combineLuggageCode.PassengerId,
                        Quantity = combineLuggageCode.Quantity,
                        RouteId = route.RouteId,
                        IsComplimentary = true,
                        Name = combineLuggageCode.LuggageItem.Name,
                        Description = combineLuggageCode.LuggageItem.Description,
                        Icon = combineLuggageCode.LuggageItem.Icon
                    };
                }
            }
        }
    }

    /// <inheritdoc />
    public async Task<IEnumerable<ExtraLuggageItem>> GetHoldLuggageOffer(Offer offer, AccommodationOfferRequest request)
    {
        // Extra luggage (hold luggage) is not available for internal routes
        if (offer.Transport.Routes.All(x => x.IsExternal is false))
            return [];

        var guests = offer.BuildGuests().ToArray();
        var extras = await _flightExtraService.GetFlightExtras(offer, guests);
        var configuration = await _referenceDataService.GetLuggage();

        if (extras.IsNullOrEmpty())
            return [];

        var luggageConfigIndex = GetLuggageCategoriesIndex(configuration);
        var (adults, children, infants) = CalculateGuestCounts(guests);
        var parsedLuggages = request
            .ParseLuggage()
            .Select(codeAndPerson =>
            {
                var (code, person) = codeAndPerson;
                var passengerId = _indexCalculator.CalculatePassengerIndex(person, adults, children, infants);

                return (code, person, passengerId); // luggage code, person (guest) and passengerId (index)
            })
            .ToArray();

        var inboundRoute =
            offer.Transport.Routes.FirstOrDefault(x => x.Direction == Direction.Inbound && x.IsExternal)
            ?? throw new LuggageException($"Missed inbound external route, offer accom code: {offer.Accom.Code}");
        var inboundExtra =
            extras.FirstOrDefault(x => x.RouteId == inboundRoute.RouteId)
            ?? throw new LuggageException($"Missed extras for inbound route, offer accom code: {offer.Accom.Code}");
        var inboundLuggage = CreateHoldLuggage(inboundRoute, inboundExtra);

        var outboundRoute =
            offer.Transport.Routes.FirstOrDefault(x => x.Direction == Direction.Outbound && x.IsExternal)
            ?? throw new LuggageException($"Missed outbound external route, offer accom code: {offer.Accom.Code}");
        var outboundExtra =
            extras.FirstOrDefault(x => x.RouteId == outboundRoute.RouteId)
            ?? throw new LuggageException($"Missed extras for outbound route, offer accom code: {offer.Accom.Code}");
        var outboundLuggage = CreateHoldLuggage(outboundRoute, outboundExtra);

        return inboundLuggage.Concat(outboundLuggage);

        IEnumerable<ExtraLuggageItem> CreateHoldLuggage(Route route, FlightExtraCategoryList extra)
        {
            foreach (var (code, person, passengerId) in parsedLuggages)
            {
                if (luggageConfigIndex.TryGetValue(code, out var config) is false)
                {
                    throw new LuggageException(
                        $"There are no SC complimentary luggage configuration for the luggage code: {code}"
                    );
                }
                var luggageExtra = GetLuggageExtra(extra, (code, config.CategoryCode));
                var luggagePrice = GetLuggagePrice(luggageExtra, person);

                yield return new ExtraLuggageItem
                {
                    ItemCode = code,
                    ItemCategoryCode = config.CategoryCode,
                    PassengerId = passengerId.ToString(),
                    Price = luggagePrice,
                    Quantity = 1,
                    RouteId = route.RouteId,
                    Name = config.Name,
                    Description = config.Description,
                    Icon = config.Icon
                };
            }
        }
    }

    /// <inheritdoc />
    public async Task<IEnumerable<ExtraLuggageItem>> GetLargeCabinBagLuggageOffer(Offer offer, AccommodationOfferRequest request)
    {
        // Extra luggage (LCB) is not available for internal routes
        if (offer.Transport.Routes.All(x => x.IsExternal is false))
            return Enumerable.Empty<ExtraLuggageItem>();

        var guests = offer.BuildGuests().ToArray();
        var extras = await _flightExtraService.GetFlightExtras(offer, guests);
        var settings = await _referenceDataService.GetLuggageSettings();
        var configuration = await _referenceDataService.GetLuggage();
        var promotionCollections = await _referenceDataService.GetPromotionCollections();

        if (extras.IsNullOrEmpty())
            return Enumerable.Empty<ExtraLuggageItem>();

        var (adults, children, infants) = CalculateGuestCounts(guests);
        var luggageConfigIndex = GetLuggageCategoriesIndex(configuration);
        var lcbItemCode = settings.LargeCabinBagCode;
        var config = luggageConfigIndex[lcbItemCode];

        var inboundRoute = offer.Transport.Routes.First(x => x.Direction == Direction.Inbound);
        var inboundExtra = extras.First(x => x.RouteId == inboundRoute.RouteId);
        var inboundLcb = CreateLcbLuggageItems(request.LcbIn, inboundRoute.RouteId, inboundExtra);

        var outboundRoute = offer.Transport.Routes.First(x => x.Direction == Direction.Outbound);
        var outboundExtra = extras.First(x => x.RouteId == outboundRoute.RouteId);
        var outboundLcb = CreateLcbLuggageItems(request.LcbOut, outboundRoute.RouteId, outboundExtra);

        return inboundLcb.Concat(outboundLcb);

        IEnumerable<ExtraLuggageItem> CreateLcbLuggageItems(string lcbQuery, string routeId, FlightExtraCategoryList extra)
        {
            if (string.IsNullOrEmpty(lcbQuery))
                yield break;

            const char lcbQueryDelimiter = '|';

            var lcbExtra = GetLuggageExtra(extra, (lcbItemCode, config.CategoryCode));
            var passengerIds = lcbQuery.Split(lcbQueryDelimiter).Select(int.Parse).ToArray();

            ValidatePassengersWithLcb(passengerIds);

            foreach (var passengerId in passengerIds)
            {
                yield return new ExtraLuggageItem
                {
                    ItemCode = lcbItemCode,
                    PassengerId = passengerId.ToString(),
                    Quantity = 1,
                    Price = GetPrice(lcbExtra, promotionCollections, offer, IsAdult(passengerId)),
                    RouteId = routeId,
                    ItemCategoryCode = config.CategoryCode,
                    Name = config.Name,
                    Description = config.Description,
                    Icon = config.Icon
                };
            }
        }
        bool IsAdult(int passengerId) => passengerId <= adults;

        void ValidatePassengersWithLcb(int[] passengerIds)
        {
            foreach (var passengerId in passengerIds)
                if (passengerId < 1 || passengerId > adults + children + infants)
                    throw new ArgumentException("Wrong passenger for LCB received");
        }
    }

    static double GetPrice(FlightExtra lcbExtra, PromotionCollections promotionCollections, Offer offer, bool isAdult)
    {
        var price = isAdult ? (double)lcbExtra.ChildPrice : (double)lcbExtra.AdultPrice;

        if (promotionCollections == null || (promotionCollections.Promotions == null || promotionCollections.Promotions.Count == 0 || offer.PromotionCollections == null))
        {
            return price;
        }

        return promotionCollections.Promotions.Any(p => offer.PromotionCollections.Contains(p.Key)) ? 0 : price;
    }

    /// <inheritdoc />
    public async Task ValidateBookingLuggage(ValidateBookingRequest request)
    {
        if (request == null)
            return;

        var guests = request.Guests?
            .Select(guest => new PersonWithDetails { Type = guest.Type })
            .ToArray();
        var routes = request.Offer?.Transport?.Routes?.ToArray() ?? Array.Empty<Route>();
        var routeIds = routes.Select(x => x.RouteId).ToArray();
        var luggage = request.ExtraLuggageInfo?.Items?.ToList() ?? new List<ExtraLuggageItem>();

        await _luggageValidatorService.Validate(luggage, guests, routeIds);
        await _luggageValidatorService.ValidateComplimentaryLuggage(request.Offer?.Accom?.Prom, luggage, guests, routes);
    }

    /// <inheritdoc />
    public async Task<bool> ContainsSportEquipment(IEnumerable<ExtraLuggageItem> luggageItems)
    {
        if (luggageItems is null)
            return false;

        var luggageSettings = await _referenceDataService.GetLuggageSettings();
        var sportEquipmentCodes = luggageSettings
            .SportsEquipmentCategoryCodes
            .Split(",")
            .Select(x => x.Trim())
            .ToArray();

        return luggageItems.Any(luggage => sportEquipmentCodes.Contains(luggage.ItemCategoryCode));
    }

    /// <summary>
    /// Combine atcom luggage codes to a new list of luggage codes based on the luggage configuration. For example 23 kg + 3 kg new luggage is 26 kg 
    /// </summary>
    /// <param name="atcomLuggageCodes"></param>
    /// <param name="luggage"></param>
    /// <returns></returns>
    public static IReadOnlyCollection<PackageResult> CombineLuggageCodes(IReadOnlyCollection<PackageItem> atcomLuggageCodes, LuggageConfiguration luggage)
    {
        ArgumentNullException.ThrowIfNull(luggage);
        
        if (atcomLuggageCodes == null || atcomLuggageCodes.Count == 0)
            return new List<PackageResult>();
        
        var allResults = new List<PackageResult>();
        var customerGroups = atcomLuggageCodes.GroupBy(item => item.PassengerId);

        var luggageConfigIndex = GetLuggageCategoriesMappingIndex(luggage);

        foreach (var customerGroup in customerGroups)
        {
            var customerId = customerGroup.Key;
            var customerItems = customerGroup.ToList();

            var customerResults = OptimizePackagesForCustomer(customerItems, luggage, customerId, luggageConfigIndex);
            foreach (var result in customerResults)
            {
                allResults.Add(result.Value);
            }
        }

        return allResults;
    }

    /// <summary>
    /// Split Combined Luggage Codes
    /// </summary>
    /// <param name="code"></param>
    /// <returns></returns>
    public static IReadOnlyCollection<string> SplitCombinedCodes(string code)
    {
        return LuggageUtils.ExtractCodes(code);
    }

    private static Dictionary<string, PackageResult> OptimizePackagesForCustomer(IReadOnlyCollection<PackageItem> atcomLuggageCodes,
        LuggageConfiguration luggage, string customerId, Dictionary<string, (LuggageItemBase LuggageItem, LuggageCategory LuggageCategory)> luggageConfigIndex)
    {
        var availableCodes = BuildAvailableCodesMap(atcomLuggageCodes);
        var codePrices = BuildCodePricesMap(atcomLuggageCodes);
        var codeMetadata = BuildCodeMetadataMap(atcomLuggageCodes);
        var resultCounts = new Dictionary<string, PackageResult>();

        ProcessCombinations(luggage, customerId, availableCodes, codePrices, codeMetadata, luggageConfigIndex, resultCounts);
        ProcessRemainingCodes(availableCodes, codePrices, codeMetadata, customerId, luggageConfigIndex, resultCounts);

        return resultCounts;
    }

    private static Dictionary<string, int> BuildAvailableCodesMap(IReadOnlyCollection<PackageItem> atcomLuggageCodes)
    {
        return atcomLuggageCodes
            .GroupBy(item => item.Code)
            .ToDictionary(group => group.Key, group => group.Sum(item => item.Quantity));
    }

    private static Dictionary<string, (decimal Price, decimal AdditionalPrice)> BuildCodePricesMap(IReadOnlyCollection<PackageItem> atcomLuggageCodes)
    {
        return atcomLuggageCodes
            .GroupBy(item => item.Code)
            .ToDictionary(group => group.Key, group => new ValueTuple<decimal, decimal>(group.First().Price, group.First().AdditionalPrice));
    }

    private static Dictionary<string, PackageItem> BuildCodeMetadataMap(IReadOnlyCollection<PackageItem> atcomLuggageCodes)
    {
        return atcomLuggageCodes
            .GroupBy(item => item.Code)
            .ToDictionary(group => group.Key, group => group.First());
    }
    
    private static IEnumerable<dynamic> GetSortedCombinations(LuggageConfiguration luggage,
        Dictionary<string, (LuggageItemBase LuggageItem, LuggageCategory LuggageCategory)> luggageConfigIndex)
    {
        return luggage.LuggageCategories
            .SelectMany(luggageCategory => luggageCategory.LuggageItems
                .Where(luggageItem => luggageItem.GetType() == typeof(CombinedLuggageItem) && luggageItem.IsLuggageItemEnabled)
                .Select(combinedLuggageItem => combinedLuggageItem as CombinedLuggageItem)
                .Where(combinedLuggageItem => combinedLuggageItem != null)
                .Select(combinedLuggageItem =>
                {
                    var categoryCodeList = combinedLuggageItem!.Codes
                        .Select(luggageCode => GetLuggageCategory(luggageCode, luggageConfigIndex))
                        .Where(luggageItemCategory => luggageItemCategory != null)
                        .Select(luggageItemCategory => luggageItemCategory.Code)
                        .ToList();

                    var categoryCode = LuggageUtils.CombineCodes(categoryCodeList);

                    var combinedLuggageCategory = new LuggageCategory()
                    {
                        LuggageItems = luggageCategory.LuggageItems,
                        Name = luggageCategory.Name,
                        Type = luggageCategory.Type,
                        Code = categoryCode
                    };
                    return new
                    {
                        CombinedLuggageItem = combinedLuggageItem, 
                        LuggageCategory = combinedLuggageCategory
                    };
                }))
            .OrderByDescending(mapping => mapping.CombinedLuggageItem.Codes.Count);
    }

    private static LuggageCategory GetLuggageCategory(string luggageCode,
        Dictionary<string, (LuggageItemBase LuggageItem, LuggageCategory LuggageCategory)> luggageConfigIndex)
    {
        if (!luggageConfigIndex.TryGetValue(luggageCode, out var luggageCategoryMapping))
        {
            return null;
        }

        return luggageCategoryMapping.LuggageCategory;
    }

    private static void ProcessCombinations(LuggageConfiguration luggage, string customerId,
        Dictionary<string, int> availableCodes, Dictionary<string, (decimal Price, decimal AdditionalPrice)> codePrices,
        Dictionary<string, PackageItem> codeMetadata, Dictionary<string, (LuggageItemBase LuggageItem, LuggageCategory LuggageCategory)> luggageConfigIndex, Dictionary<string, PackageResult> resultCounts)
    {
        var sortedCombinations = GetSortedCombinations(luggage, luggageConfigIndex);

        foreach (var combination in sortedCombinations)
        {
            if (combination.CombinedLuggageItem == null)
                continue;

            ProcessSingleCombination(combination, customerId, availableCodes, codePrices, codeMetadata, resultCounts);
        }
    }

    private static void ProcessSingleCombination(dynamic combination, string customerId,
        Dictionary<string, int> availableCodes, Dictionary<string, (decimal Price, decimal AdditionalPrice)> codePrices,
        Dictionary<string, PackageItem> codeMetadata, Dictionary<string, PackageResult> resultCounts)
    {
        int maxPossible = CalculateMaxCombinations(availableCodes, combination.CombinedLuggageItem);

        for (int i = 0; i < maxPossible; i++)
        {
            var combinationPrice = DeductCodesAndCalculatePrice(combination.CombinedLuggageItem, availableCodes, codePrices);
            PackageItem packageItem;
            var additionalParameters = codeMetadata.TryGetValue(combination.CombinedLuggageItem.Code, out packageItem)
                ? packageItem.AdditionalParameters
                : null;
            AddOrUpdatePackageResult(resultCounts, combination.CombinedLuggageItem.Code, customerId,
                combinationPrice, combination.CombinedLuggageItem, combination.LuggageCategory, 1, additionalParameters);
        }
    }

    private static (decimal Price, decimal AdditionalPrice) DeductCodesAndCalculatePrice(CombinedLuggageItem combinedLuggageItem,
        Dictionary<string, int> availableCodes, Dictionary<string, (decimal Price, decimal AdditionalPrice)> codePrices)
    {
        var combinationPrice = new ValueTuple<decimal, decimal>(0, 0);
        var codeRequirements = GetCodeRequirements(combinedLuggageItem);

        foreach (var requirement in codeRequirements)
        {
            availableCodes[requirement.Key] -= requirement.Value;
            combinationPrice.Item1 += codePrices[requirement.Key].Price * requirement.Value;
            combinationPrice.Item2 += codePrices[requirement.Key].AdditionalPrice * requirement.Value;
        }

        return combinationPrice;
    }

    private static void ProcessRemainingCodes(Dictionary<string, int> availableCodes,
        Dictionary<string, (decimal Price, decimal AdditionalPrice)> codePrices, Dictionary<string, PackageItem> codeMetadata, string customerId,
        Dictionary<string, (LuggageItemBase LuggageItem, LuggageCategory LuggageCategory)> luggageConfigIndex,
        Dictionary<string, PackageResult> resultCounts)
    {
        foreach (var remaining in availableCodes.Where(x => x.Value > 0))
        {
            var luggageItemLuggageCategoryMapping = GetLuggageCategoryByLuggageCode(luggageConfigIndex, remaining.Key);
            if(luggageItemLuggageCategoryMapping.LuggageCategory == null || luggageItemLuggageCategoryMapping.LuggageItem == null)
                continue;

            var totalPrice = codePrices[remaining.Key];
            var additionalParameters = codeMetadata.TryGetValue(remaining.Key, out var packageItem)
                ? packageItem.AdditionalParameters
                : null;
            AddOrUpdatePackageResult(resultCounts, remaining.Key, customerId, totalPrice,
                luggageItemLuggageCategoryMapping.LuggageItem, luggageItemLuggageCategoryMapping.LuggageCategory, remaining.Value, additionalParameters);
        }
    }

    private static (LuggageItemBase LuggageItem, LuggageCategory LuggageCategory) GetLuggageCategoryByLuggageCode(Dictionary<string, (LuggageItemBase LuggageItem, LuggageCategory LuggageCategory)> luggageConfigIndex, string code)
    {
        var codes = LuggageUtils.ExtractCodes(code);
        if (!luggageConfigIndex.TryGetValue(code, out var luggageItemLuggageCategoryMapping))
            return new ValueTuple<LuggageItemBase, LuggageCategory>(null, null);

        if (codes.Count < 2)
        {
            return luggageItemLuggageCategoryMapping;
        }
        
        var categoryList = codes.Select(i =>
        {
            if (!luggageConfigIndex.TryGetValue(i, out var mapping))
                return null;

            return mapping.LuggageCategory;
        }).Where(luggageCategory => luggageCategory != null).ToList();

        var firstCategory = categoryList.FirstOrDefault();
        if (firstCategory == null)
            return new ValueTuple<LuggageItemBase, LuggageCategory>(null, null);

        var newCategoryCode = LuggageUtils.CombineCodes(categoryList.Where(luggageCategory => luggageCategory != null).Select(luggageCategory => luggageCategory!.Code).ToList());
        var combinedLuggageCategory = new LuggageCategory()
        {
            Name = firstCategory.Name,
            LuggageItems = firstCategory.LuggageItems,
            Type = firstCategory.Type,
            Code = newCategoryCode
        };

        return new ValueTuple<LuggageItemBase, LuggageCategory>(luggageItemLuggageCategoryMapping.LuggageItem, combinedLuggageCategory);
    }

    private static void AddOrUpdatePackageResult(Dictionary<string, PackageResult> resultCounts,
        string code, string customerId, (decimal Price, decimal AdditionalPrice) price, LuggageItemBase luggageItem,
        LuggageCategory luggageCategory, int quantity = 1, Dictionary<string, object> additionalParameters = null)
    {
        if (resultCounts.TryGetValue(code, out PackageResult packageResult))
        {
            packageResult.Quantity += quantity;
            // Merge additional parameters if they don't exist yet
            if (additionalParameters != null && packageResult.AdditionalParameters == null)
            {
                packageResult.AdditionalParameters = additionalParameters;
            }
        }
        else
        {
            resultCounts[code] = new PackageResult
            {
                Code = code,
                Quantity = quantity,
                PassengerId = customerId,
                Price = price.Price,
                AdditionalPrice = price.AdditionalPrice,
                LuggageItem = luggageItem,
                LuggageCategory = luggageCategory,
                AdditionalParameters = additionalParameters
            };
        }
    }

    private static int CalculateMaxCombinations(Dictionary<string, int> availableCodes, CombinedLuggageItem combination)
    {
        int maxPossible = int.MaxValue;

        var codeRequirements = GetCodeRequirements(combination);

        foreach (var requirement in codeRequirements)
        {
            var availableCount = availableCodes.GetValueOrDefault(requirement.Key, 0);
            var requiredCount = requirement.Value;

            if (requiredCount > 0)
            {
                maxPossible = Math.Min(maxPossible, availableCount / requiredCount);
            }
        }

        return Math.Max(0, maxPossible);
    }

    private static Dictionary<string, int> GetCodeRequirements(CombinedLuggageItem combination)
    {
        return combination.Codes.GroupBy(i => i)
            .ToDictionary(g => g.Key, g => g.Count());
    }

    private FlightExtra GetLuggageExtra(FlightExtraCategoryList extras, (string code, string category) luggage)
    {
        if (extras is null)
            throw new ArgumentNullException(nameof(extras));

        var flightLuggageExtra = extras.FlightExtraCategories
            ?.FirstOrDefault(category => category.CategoryCode == luggage.category)
            ?.FlightExtras
            ?.FirstOrDefault(extra => extra.FlightExtraCode == luggage.code);

        if (flightLuggageExtra is null)
            throw new ArgumentException($"No FlightExtra for (code:{luggage.code}, category:{luggage.category}",
                nameof(extras));

        return flightLuggageExtra;
    }

    private double GetLuggagePrice(FlightExtra luggageExtra, PersonType owner)
    {
        const int defaultPrice = 0;

        if (luggageExtra is null)
            throw new ArgumentNullException(nameof(luggageExtra));

        return owner switch
        {
            PersonType.Adult => (double)luggageExtra.AdultPrice,
            PersonType.Child => (double)luggageExtra.ChildPrice,
            PersonType.Infant => defaultPrice,
            _ => defaultPrice
        };
    }

    private (int, int, int) CalculateGuestCounts(PersonWithDetails[] guests)
    {
        var adults = guests.Count(x => x.Type == PersonType.Adult);
        var children = guests.Count(x => x.Type == PersonType.Child);
        var infants = guests.Count(x => x.Type == PersonType.Infant);

        return (adults, children, infants);
    }
    
    /// <inheritdoc />
    public IDictionary<string, LuggageConfigurationItem> GetLuggageCategoriesIndex(LuggageConfiguration luggage)
    {
        return luggage?.LuggageCategories?
            .SelectMany(
                category => category.LuggageItems.Where(i => i.GetType() == typeof(LuggageItem)).Select(item =>
                    new
                    {
                        ItemCategoryCode = category.Code,
                        Item = (LuggageItem)item
                    }
                )
            )
            .ToDictionary(
                i => i.Item.Code,
                i => new LuggageConfigurationItem(i.Item.Code, i.ItemCategoryCode, i.Item.Name, i.Item.Description, i.Item.Icon)
            ) ?? new Dictionary<string, LuggageConfigurationItem>();
    }

    /// <summary>
    /// Returns a mapping from luggage code to luggage item and luggage category
    /// </summary>
    /// <param name="luggage"></param>
    /// <returns></returns>
    public static Dictionary<string, (LuggageItemBase LuggageItem, LuggageCategory LuggageCategory)> GetLuggageCategoriesMappingIndex(LuggageConfiguration luggage)
    {
        ArgumentNullException.ThrowIfNull(luggage);

        var luggageConfigIndex = luggage.LuggageCategories
            .SelectMany(
                category => category.LuggageItems.Select(luggageItem =>
                    {
                        if (!luggageItem.IsLuggageItemEnabled)
                            return null;

                        return new { Category = category, Item = luggageItem };
                    }
                ).Where(combination => combination != null)
            )
            .ToDictionary(
                i => i!.Item.Code,
                i => (LuggageItem: i!.Item, LuggageCategory: i.Category)
            );
        return luggageConfigIndex;
    }

    /// <summary>
    /// Builds promotion code based on market and theme type.
    /// </summary>
    public static string BuildPromCode(string market, string theme, ComplimentaryLuggageSettings settings)
    {
        if (settings?.MarketPromoCodeMapping is null || settings.ThemePromoCodeMapping is null)
            return null;

        market ??= String.Empty;
        theme ??= String.Empty;

        if (theme.Length > 1)
            theme = theme.Substring(0, 1);

        var marketPart = settings.MarketPromoCodeMapping.TryGetValue(market, out var mPart)
            ? mPart
            : settings.DefaultMarketPart;
        var promPart = settings.ThemePromoCodeMapping.TryGetValue(theme, out var pPart)
            ? pPart
            : settings.DefaultPromoPart;

        return $"{marketPart}{promPart}";
    }
}

/// <summary>
/// Package Item for the Package Optimization
/// </summary>
public class PackageItem
{
    /// <summary>
    /// Code of the Luggage Item
    /// </summary>
    public string Code { get; set; }

    /// <summary>
    /// Quantity of the Luggage Item
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// Passenger Id, which is used to identify the passenger in the booking
    /// </summary>
    public string PassengerId { get; set; }

    /// <summary>
    /// The price of the Luggage Item
    /// </summary>
    public decimal Price { get; set; }

    /// <summary>
    /// The additional price of the Luggage Item
    /// </summary>
    public decimal AdditionalPrice { get; set; }

    /// <summary>
    /// Additional parameters that can be passed through to the result
    /// </summary>
#pragma warning disable CA2227
    public Dictionary<string, object> AdditionalParameters { get; set; }
#pragma warning restore CA2227
}

/// <summary>
/// Result of the Package Optimization
/// </summary>
public class PackageResult
{
    /// <summary>
    /// Code of the Luggage Item
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Quantity of the Luggage Item
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// Passenger Id, which is used to identify the passenger in the booking
    /// </summary>
    public string PassengerId { get; set; } = string.Empty;

    /// <summary>
    /// Price of the Luggage Item
    /// </summary>
    public decimal Price { get; set; }

    /// <summary>
    /// Additional Price of the Luggage Item
    /// </summary>
    public decimal AdditionalPrice { get; set; }

    /// <summary>
    /// The sitecore luggage item
    /// </summary>
    public LuggageItemBase LuggageItem { get; set; }

    /// <summary>
    /// The sitecore luggage category item
    /// </summary>
    public LuggageCategory LuggageCategory { get; set; }

    /// <summary>
    /// Additional parameters passed through from the PackageItem
    /// </summary>
#pragma warning disable CA2227
    public Dictionary<string, object> AdditionalParameters { get; set; }
#pragma warning restore CA2227
}