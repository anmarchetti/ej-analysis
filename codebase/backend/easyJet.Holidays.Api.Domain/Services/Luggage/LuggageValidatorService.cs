using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Luggage;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.Api.Domain.Services.Luggage
{
    /// <inheritdoc />
    public class LuggageValidatorService : ILuggageValidatorService
    {
        private const double DefaultLuggageItemPrice = 0;

        private readonly IReferenceDataService _referenceDataService;
        private readonly ILogger<LuggageValidatorService> _logger;

        /// <summary>
        /// DI constructor, initializes all dependencies.
        /// </summary>
        public LuggageValidatorService(IReferenceDataService referenceDataService, ILogger<LuggageValidatorService> logger)
        {
            _referenceDataService = referenceDataService;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task ValidateAccommodationOffer(Offer offer)
        {
            var luggage = offer.ExtraLuggageInfo.Items.ToList();
            var guests = offer.BuildGuests().ToArray();
            var routeIds = offer.Transport.Routes.Select(r => r.RouteId).ToArray();

            await Validate(luggage, guests, routeIds);
        }

        /// <inheritdoc />
        public async Task ValidateComplimentaryLuggage(
            string promotionCode,
            List<ExtraLuggageItem> luggageItems,
            PersonWithDetails[] guests,
            Route[] routes)
        {
            if (string.IsNullOrEmpty(promotionCode)
                || luggageItems is null
                || routes.IsNullOrEmpty()
                || guests.IsNullOrEmpty())
                return;

            var routeIds = routes.Select(x => x.RouteId).ToArray();
            var settings = await _referenceDataService.GetComplimentarySettings();
            if (settings.ComplimentaryIndex.TryGetValue(promotionCode, out var promotionSettings) is false)
            {
                _logger.LogWarning("External route, missed SC complimentary settings configuration for promotion code: {PromoCode}, skip complimentary luggage validation", promotionCode);
                return;
            }

            if (routes.All(x => x.IsExternal) is false)
            {
                var fallBackPromotionCode = promotionSettings.InternalFallbackCode;
                if (settings.ComplimentaryIndex.TryGetValue(fallBackPromotionCode, out promotionSettings) is false)
                {
                    _logger.LogWarning("Internal route, missed SC complimentary settings configuration for promotion code: {PromoCode}, skip complimentary luggage validation", fallBackPromotionCode);
                    return;
                }
            }

            foreach (var routeId in routeIds)
                foreach (var guest in guests)
                    foreach (var complimentarySetting in promotionSettings.Luggage)
                    {
                        var guestLuggage = luggageItems
                            .Where(x => x.PassengerId == guest.Index && x.RouteId == routeId)
                            .ToArray();

                        var complimentaryLuggage = guestLuggage.Count(x => x.ItemCode == complimentarySetting.Code);
                        var quantity = guest.Type switch
                        {
                            PersonType.Adult => complimentarySetting.Quantity.Adult,
                            PersonType.Child => complimentarySetting.Quantity.Child,
                            PersonType.Infant => complimentarySetting.Quantity.Infant,
                            _ => 0
                        };

                        if (complimentaryLuggage != quantity)
                        {
                            _logger.LogError($"Validation failed for luggage items. Mismatch found: " +
                                             "Promotion Code: {PromoCode}, " +
                                             "RouteId: {RouteId}, " +
                                             "Guest Type: {GuestType}, " +
                                             "Complimentary Item Code: {ItemCode}, " +
                                             "Allowed Bags for Adults: {AdultQuantity}, " +
                                             "Allowed Bags for Children: {ChildQuantity}, " +
                                             "Allowed Bags for Infants: {InfantQuantity}, " +
                                             "Expected Quantity: {ExpectedQuantity}, " +
                                             "Actual Quantity: {ActualQuantity}, " +
                                             "ExceptionCode: {ExceptionCode}",
                                promotionCode,
                                routeId,
                                guest.Type,
                                complimentarySetting.Code,
                                complimentarySetting.Quantity.Adult,
                                complimentarySetting.Quantity.Child,
                                complimentarySetting.Quantity.Infant,
                                quantity,
                                complimentaryLuggage,
                                ApiExceptionCodes.BookingExtraLuggageItemsMissingDefaultBags);
                            throw new ApiException(ApiExceptionCodes.BookingExtraLuggageItemsMissingDefaultBags);
                        }
                    }
        }

        /// <inheritdoc />
        public async Task Validate(List<ExtraLuggageItem> luggageItems, PersonWithDetails[] guests, string[] routeIds)
        {
            if (luggageItems.IsNullOrEmpty() || routeIds.IsNullOrEmpty() || guests.IsNullOrEmpty())
                return;

            var orderedGuests = GuestUtils.SortGuests(guests, x => x.Type);
            GuestUtils.IndexGuests(orderedGuests);

            var luggageSettings = await _referenceDataService.GetLuggageSettings();
            var luggageConfiguration = await _referenceDataService.GetLuggage();

            ValidateLuggageItems(luggageItems, luggageSettings, luggageConfiguration);
            ValidateLuggageItemsAvailability(luggageItems, luggageConfiguration);

            ValidateHoldLuggagePerBooking(luggageItems, orderedGuests, routeIds, luggageSettings);
            ValidateHoldLuggagePerPassenger(luggageItems, orderedGuests, routeIds, luggageSettings);

            ValidateSportsEquipmentPerPassenger(luggageItems, orderedGuests, routeIds, luggageSettings);
            ValidateSportsEquipmentPerBooking(luggageItems, routeIds, luggageSettings);

            ValidateLargeCabinBagsPerPassenger(luggageItems, luggageSettings, orderedGuests);
        }

        /// <summary>
        /// Validates whether luggage items are valid.
        /// </summary>
        internal void ValidateLuggageItems(IEnumerable<ExtraLuggageItem> extraLuggageItems, LuggageSettings luggageSettings, Data.ReferenceData.Luggage.Luggage luggageConfiguration)
        {
            extraLuggageItems = SkipDefaultLuggageItems(extraLuggageItems);

            if (extraLuggageItems.IsNullOrEmpty())
            {
                return;
            }

            var holdLuggageCategoryCodes = LuggageUtils.GetLuggageCategoryByType(luggageConfiguration.LuggageCategories.ToList(), LuggageType.Bag).Select(x => x.Code);
            var sportsEquipmentCategoryCodes = LuggageUtils.GetLuggageCategoryByType(luggageConfiguration.LuggageCategories.ToList(), LuggageType.SportsEquipment).Select(x => x.Code);
            var cabinBagsCategoryCodes = LuggageUtils.GetLuggageCategoryByType(luggageConfiguration.LuggageCategories.ToList(), LuggageType.CabinBags).Select(x => x.Code);

            var isHoldLuggageUsed = extraLuggageItems.Any(x => holdLuggageCategoryCodes.Contains(x.ItemCategoryCode));
            var isSportsEquipmentUsed = extraLuggageItems.Any(x => sportsEquipmentCategoryCodes.Contains(x.ItemCategoryCode));
            var isCabinBagsUsed = extraLuggageItems.Any(x => cabinBagsCategoryCodes.Contains(x.ItemCategoryCode));

            var isInvalidHoldLuggage = isHoldLuggageUsed && !luggageSettings.EnableHoldLuggageBookingFlow;
            var isInvalidSportsEquipment = isSportsEquipmentUsed && !luggageSettings.EnableSportsEquipmentBookingFlow;
            var isInvalidCabinBags = isCabinBagsUsed && !luggageSettings.EnableCabinBagsBookingFlow;

            if (isInvalidHoldLuggage || isInvalidSportsEquipment || isInvalidCabinBags)
            {
                throw new ApiException(ApiExceptionCodes.BookingExtraLuggageDisabled);
            }
        }

        /// <summary>
        /// Validates whether luggage items are enabled.
        /// </summary>
        internal void ValidateLuggageItemsAvailability(IEnumerable<ExtraLuggageItem> extraLuggageItems, Data.ReferenceData.Luggage.Luggage luggageConfiguration)
        {
            extraLuggageItems = SkipDefaultLuggageItems(extraLuggageItems);

            if (extraLuggageItems.IsNullOrEmpty())
            {
                return;
            }

            var luggageConfigurationItems = luggageConfiguration.LuggageCategories.SelectMany(x => x.LuggageItems.Select(x => x));
            var extraLuggageItemIsDisabled = extraLuggageItems.Any(x => luggageConfigurationItems.Any(y => x.ItemCode == y.Code && !y.IsLuggageItemEnabled));

            if (extraLuggageItemIsDisabled)
            {
                throw new ApiException(ApiExceptionCodes.BookingExtraLuggageItemsAreDisabled);
            }
        }

        /// <summary>
        /// Validates whether hold luggage is capped at passenger level. There's a limit of extra hold bags to be added per passenger (BR-HL-3).
        /// </summary>
        internal void ValidateHoldLuggagePerPassenger(IEnumerable<ExtraLuggageItem> extraLuggageItems, IList<PersonWithDetails> guests, IEnumerable<string> routeIds, LuggageSettings luggageSettings)
        {
            var holdLuggageCategoryCodes = GetSettings(luggageSettings?.HoldLuggageCategoryCodes);
            var maximalAdditionalBagsNumberPerNonInfant = luggageSettings?.HoldLuggageMaxPerPassenger;
            var holdBagItems = SkipDefaultLuggageItems(extraLuggageItems.Where(x => holdLuggageCategoryCodes.Contains(x.ItemCategoryCode)));

            if (!holdBagItems.Any())
            {
                return;
            }

            foreach (var routeId in routeIds)
            {
                var routeHoldBagItemsByPassenger = holdBagItems
                    .Where(x => x.RouteId == routeId)
                    .GroupBy(x => x.PassengerId);

                foreach (var holdBagItem in routeHoldBagItemsByPassenger)
                {
                    var numberOfHoldLuggagePerPassenger = holdBagItem.Sum(x => x.Quantity);
                    if (numberOfHoldLuggagePerPassenger > maximalAdditionalBagsNumberPerNonInfant)
                    {
                        throw new ApiException(ApiExceptionCodes.BookingExtraLuggageItemsExceedNumberOfHoldBags);
                    }
                }
            }
        }

        /// <summary>
        /// Validates whether hold luggage is capped at booking level. There's a limit of extra hold bags to be added per passenger (BR-HL-3).
        /// </summary>
        internal void ValidateHoldLuggagePerBooking(IEnumerable<ExtraLuggageItem> extraLuggageItems, IList<PersonWithDetails> guests, IEnumerable<string> routeIds, LuggageSettings luggageSettings)
        {
            var nonInfantsPassengersNumber = GuestUtils.GetNonInfants(guests).Count();
            var holdLuggageCategoryCodes = GetSettings(luggageSettings?.HoldLuggageCategoryCodes);
            var maximalAdditionalBagsNumberPerNonInfant = luggageSettings?.HoldLuggageMaxPerPassenger;
            var holdBagItems = SkipDefaultLuggageItems(extraLuggageItems.Where(x => holdLuggageCategoryCodes.Contains(x.ItemCategoryCode)));
            var additionalBagsLimitPerBooking = nonInfantsPassengersNumber * maximalAdditionalBagsNumberPerNonInfant;

            if (!holdBagItems.Any())
            {
                return;
            }

            foreach (var routeId in routeIds)
            {
                var routeHoldLuggageItems = holdBagItems.Where(x => x.RouteId == routeId).Sum(x => x.Quantity);
                if (routeHoldLuggageItems > additionalBagsLimitPerBooking)
                {
                    throw new ApiException(ApiExceptionCodes.BookingExtraLuggageItemsExceedNumberOfHoldBags);
                }
            }
        }

        /// <summary>
        /// Validates whether sport equipment is capped per passenger (BR-SE-1).
        /// </summary>
        internal void ValidateSportsEquipmentPerPassenger(IEnumerable<ExtraLuggageItem> extraLuggageItems, IList<PersonWithDetails> guests, IEnumerable<string> routeIds, LuggageSettings luggageSettings)
        {
            var maximalItemPerNonInfantPassengerCategoryCodes = GetSettings(luggageSettings?.SportsEquipmentCategoryCodes);
            var maximalNumberOfSportEquipmentPerPassenger = luggageSettings?.SportsEquipmentMaxPerPassenger;
            var sportEquipmentItems = extraLuggageItems.Where(x => maximalItemPerNonInfantPassengerCategoryCodes.Contains(x.ItemCategoryCode));

            if (!sportEquipmentItems.Any())
            {
                return;
            }

            foreach (var routeId in routeIds)
            {
                var routeSportsEquipmentItemsByPassenger = sportEquipmentItems
                    .Where(x => x.RouteId == routeId)
                    .GroupBy(x => x.PassengerId);

                foreach (var sportItems in routeSportsEquipmentItemsByPassenger)
                {
                    var numberOfSportItemPerPassenger = sportItems.Sum(x => x.Quantity);
                    if (numberOfSportItemPerPassenger > maximalNumberOfSportEquipmentPerPassenger)
                    {
                        throw new ApiException(ApiExceptionCodes.BookingExtraLuggageItemsExceedSportItems);
                    }
                }
            }
        }

        /// <summary>
        /// Validates whether large cabin bags are capped per passenger (BR-CB-5).
        /// </summary>
        internal void ValidateLargeCabinBagsPerPassenger(IEnumerable<ExtraLuggageItem> extraLuggageItems, LuggageSettings luggageSettings, IList<PersonWithDetails> guests)
        {
            var largeCabinBagCode = luggageSettings.LargeCabinBagCode;
            var maxLargeCabinBagsPerPassenger = luggageSettings.LargeCabinBagMaxPerPassenger;
            var largeCabinBags = extraLuggageItems?.Where(item => item.ItemCode == largeCabinBagCode).EmptyIfNull();

            foreach (var passengerLargeCabinBags in largeCabinBags.GroupBy(item => item.PassengerId))
            {
                var routeSums = passengerLargeCabinBags
                    .GroupBy(item => item.RouteId)
                    .Select(item => new
                    {
                        Route = item.Key,
                        Sum = item.Sum(y => y.Quantity)
                    })
                    .ToArray();

                var outboundBagsQuantity = routeSums.FirstOrDefault()?.Sum ?? 0;
                var inboundBagsQuantity = routeSums.Skip(1).FirstOrDefault()?.Sum ?? 0;

                if (inboundBagsQuantity != outboundBagsQuantity)
                    throw new ApiException(ApiExceptionCodes.FailedQuantityPerRoutesOfLargeCabinBags);

                var passenger = guests.First(person => person.Index == passengerLargeCabinBags.Key);
                if (passenger.Type == PersonType.Infant)
                    throw new ApiException(ApiExceptionCodes.BookingExtraLuggageExceedNumberOfLargeCabinBags);

                foreach (var routeLargeCabinBagsByPax in passengerLargeCabinBags.GroupBy(x => x.RouteId))
                {
                    var passengerLargeCabinBagsQuantity = routeLargeCabinBagsByPax.Sum(item => item.Quantity);
                    if (passengerLargeCabinBagsQuantity > maxLargeCabinBagsPerPassenger)
                        throw new ApiException(ApiExceptionCodes.BookingExtraLuggageExceedNumberOfLargeCabinBags);
                }
            }
        }

        /// <summary>
        /// Validates whether sport large item is capped per booking. (BR-SE-1).
        /// </summary>
        internal void ValidateSportsEquipmentPerBooking(IEnumerable<ExtraLuggageItem> extraLuggageItems, IEnumerable<string> routeIds, LuggageSettings luggageSettings)
        {
            var maximalNumberOfLargeSportEquipmentPerBooking = luggageSettings?.SportsEquipmentLargeMaxPerBooking;
            var largeSportSportsEquipmentCategoryCodes = GetSettings(luggageSettings?.SportsEquipmentLargeCategoryCodes);
            var largeSportEquipmentItems = extraLuggageItems.Where(x => largeSportSportsEquipmentCategoryCodes.Contains(x.ItemCategoryCode));

            if (!largeSportEquipmentItems.Any())
            {
                return;
            }

            foreach (var routeId in routeIds)
            {
                var largeSportEquipmentItemsNUmber = largeSportEquipmentItems.Where(x => x.RouteId == routeId).Sum(x => x.Quantity);
                if (largeSportEquipmentItemsNUmber > maximalNumberOfLargeSportEquipmentPerBooking)
                {
                    throw new ApiException(ApiExceptionCodes.BookingExtraLuggageItemsExceedSportItems);
                }
            }
        }

        /// <summary>
        /// Skips luggage items for zero price or quantity.
        /// </summary>
        private IEnumerable<ExtraLuggageItem> SkipDefaultLuggageItems(IEnumerable<ExtraLuggageItem> luggageItems)
        {
            if (luggageItems.IsNullOrEmpty())
            {
                return Enumerable.Empty<ExtraLuggageItem>();
            }

            return luggageItems?.Where(x => x.Price != DefaultLuggageItemPrice && x.Quantity != 0);
        }

        private string[] GetSettings(string settingsValue)
        {
            if (string.IsNullOrEmpty(settingsValue))
            {
                return Array.Empty<string>();
            }

            return settingsValue.Split(',').Where(x => !string.IsNullOrWhiteSpace(x)).ToArray() ?? Array.Empty<string>();
        }
    }
}
