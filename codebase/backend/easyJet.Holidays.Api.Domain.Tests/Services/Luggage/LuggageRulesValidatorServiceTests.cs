using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Luggage
{
    public class LuggageRulesValidatorServiceTests
    {
        private const string HoldLuggageCategoryCode = "BAGE";
        private const string Bag23KgCode = "LUG";
        private const string Bag15KgCode = "LUS";
        private const string LargeSportsEquipmentCategoryCode = "SEO";
        private const string BikeCode = "BIKE";
        private const string CanoeCode = "CANO";
        private const string CabinBagsCategoryCode = "CABI";
        private const string LargeCabinBagCode = "SCB1";

        private readonly Mock<IReferenceDataService> _referenceDataService = new();
        private readonly IFixture _fixture = FixtureUtils.AutoMoqFixture();
        private readonly LuggageValidatorService _sut;

        public LuggageRulesValidatorServiceTests()
        {
            _sut = new LuggageValidatorService(_referenceDataService.Object, _fixture.Create<ILogger<LuggageValidatorService>>());
        }

        [Fact]
        public async Task Validate_ParametersAreNullOrEmpty_SkipValidation()
        {
            // Arrange
            var luggageInfo = CreateLuggageInfo();

            // Act & Assert
            await _sut.Validate(luggageInfo.Items, null, null);
            await _sut.Validate(null, null, null);
            await _sut.Validate(new List<ExtraLuggageItem>(), null, Array.Empty<string>());
        }

        [Fact]
        public void ValidateHoldLuggagePerPassenger_LuggageItemsAreEmpty_ValidationIsValid()
        {
            // Arrange
            var luggageSettings = GetDefaultLuggageSettings();
            var luggageInfo = CreateLuggageInfo();
            var routeIds = CreateRoutes();
            var guests = CreateGuests();

            // Act & Assert
            _sut.ValidateHoldLuggagePerPassenger(luggageInfo.Items, guests, routeIds, luggageSettings);
        }

        [Fact]
        public void ValidateHoldLuggagePerPassenger_AddTwoExtraHoldLuggageItemForAdultPassenger_ValidNumberOfLuggage()
        {
            // Arrange
            var luggageSettings = new LuggageSettings
            {
                DefaultFreeBagsPerNonInfantPassenger = new Dictionary<string, int> { { Bag23KgCode, 1 } },
                HoldLuggageCategoryCodes = "BAGE",
                HoldLuggageMaxPerPassenger = 2,
            };

            var luggageInfo = CreateLuggageInfo();
            var routeIds = CreateRoutes();
            var guests = new List<PersonWithDetails> { new() { Type = PersonType.Adult } };

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[0], passengerId: 1);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[1], passengerId: 1);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag15KgCode, routeId: routeIds[0], passengerId: 1, price: 100);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag15KgCode, routeId: routeIds[1], passengerId: 1, price: 100);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag15KgCode, routeId: routeIds[0], passengerId: 1, price: 100);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag15KgCode, routeId: routeIds[1], passengerId: 1, price: 100);

            // Act
            _sut.ValidateHoldLuggagePerPassenger(luggageInfo.Items, guests, routeIds, luggageSettings);
        }

        [Fact]
        public void ValidateHoldLuggagePerPassenger_AddTooMuchExtraHoldLuggageItemForAdultPassenger_ThrownExceptionExceedBagItems()
        {
            // Arrange
            var luggageSettings = new LuggageSettings
            {
                DefaultFreeBagsPerNonInfantPassenger = new Dictionary<string, int> { { Bag23KgCode, 1 } },
                HoldLuggageCategoryCodes = "BAGE",
                HoldLuggageMaxPerPassenger = 1,
            };

            var luggageInfo = CreateLuggageInfo();
            var routeIds = CreateRoutes();
            var guests = new List<PersonWithDetails> { new() { Type = PersonType.Adult }, new() { Type = PersonType.Adult } };

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[0], passengerId: 1);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[1], passengerId: 1);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[0], passengerId: 2);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[1], passengerId: 2);

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag15KgCode, routeId: routeIds[0], passengerId: 1, quantity: 3, price: 100);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag15KgCode, routeId: routeIds[1], passengerId: 1, quantity: 3, price: 100);

            // Act
            var apiException = Assert.Throws<ApiException>(() => _sut.ValidateHoldLuggagePerPassenger(luggageInfo.Items, guests, routeIds, luggageSettings));

            // Assert
            Assert.Equal(ApiExceptionCodes.BookingExtraLuggageItemsExceedNumberOfHoldBags, apiException.Code);
        }

        [Fact]
        public void ValidateHoldLuggagePerBooking_LuggageItemsAreEmpty_ValidationIsValid()
        {
            // Arrange
            var luggageSettings = GetDefaultLuggageSettings();
            var luggageInfo = CreateLuggageInfo();
            var routeIds = CreateRoutes();
            var guests = CreateGuests();

            // Act & Assert
            _sut.ValidateHoldLuggagePerBooking(luggageInfo.Items, guests, routeIds, luggageSettings);
        }

        [Fact]
        public void ValidateHoldLuggagePerBooking_AddExtraHoldLuggageItemForInfant_ThrownExceptionExceedBagItems()
        {
            // Arrange
            var luggageSettings = new LuggageSettings
            {
                DefaultFreeBagsPerNonInfantPassenger = new Dictionary<string, int> { { Bag23KgCode, 1 } },
                HoldLuggageCategoryCodes = "BAGE",
                HoldLuggageMaxPerPassenger = 1,
            };

            var luggageInfo = CreateLuggageInfo();
            var routeIds = CreateRoutes();
            var guests = new List<PersonWithDetails> { new() { Type = PersonType.Adult }, new() { Type = PersonType.Infant } };

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[0], passengerId: 1);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[1], passengerId: 1);

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag15KgCode, routeId: routeIds[0], passengerId: 1, price: 100);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag15KgCode, routeId: routeIds[1], passengerId: 1, price: 100);

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag15KgCode, routeId: routeIds[0], passengerId: 2, quantity: 2, price: 100);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag15KgCode, routeId: routeIds[0], passengerId: 2, quantity: 2, price: 100);

            // Act
            var apiException = Assert.Throws<ApiException>(() => _sut.ValidateHoldLuggagePerBooking(luggageInfo.Items, guests, routeIds, luggageSettings));

            // Assert
            Assert.Equal(ApiExceptionCodes.BookingExtraLuggageItemsExceedNumberOfHoldBags, apiException.Code);
        }

        [Fact]
        public void ValidateHoldLuggagePerBooking_AddInvalidNumberOfExtraLuggage_ThrownExceptionExceedBagItems()
        {
            // Arrange
            var luggageSettings = new LuggageSettings
            {
                DefaultFreeBagsPerNonInfantPassenger = new Dictionary<string, int> { { Bag23KgCode, 1 } },
                HoldLuggageCategoryCodes = "BAGE",
                HoldLuggageMaxPerPassenger = 1,
            };

            var luggageInfo = CreateLuggageInfo();
            var routeIds = CreateRoutes();
            var guests = CreateGuests();

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[0], passengerId: 1);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[1], passengerId: 1);

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag15KgCode, routeId: routeIds[0], passengerId: 1, quantity: 2, price: 100);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag15KgCode, routeId: routeIds[1], passengerId: 1, quantity: 2, price: 100);

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[0], passengerId: 2);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[1], passengerId: 2);

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag15KgCode, routeId: routeIds[0], passengerId: 2, quantity: 2, price: 100);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag15KgCode, routeId: routeIds[1], passengerId: 2, quantity: 2, price: 100);

            // Act
            var apiException = Assert.Throws<ApiException>(() => _sut.ValidateHoldLuggagePerBooking(luggageInfo.Items, guests, routeIds, luggageSettings));

            // Assert
            Assert.Equal(ApiExceptionCodes.BookingExtraLuggageItemsExceedNumberOfHoldBags, apiException.Code);
        }

        [Fact]
        public void ValidateSportsEquipmentPerPassenger_EmptyLuggageItems_ValidationIsValid()
        {
            // Arrange
            var luggageSettings = new LuggageSettings
            {
                DefaultFreeBagsPerNonInfantPassenger = new Dictionary<string, int> { { Bag23KgCode, 1 } },
                SportsEquipmentCategoryCodes = "SEO,SEC",
                SportsEquipmentMaxPerPassenger = 1,
            };

            var luggageInfo = CreateLuggageInfo();
            var routeIds = CreateRoutes();
            var guests = CreateGuests();

            // Act & Assert
            _sut.ValidateSportsEquipmentPerPassenger(luggageInfo.Items, guests, routeIds, luggageSettings);
        }

        [Fact]
        public void ValidateSportsEquipmentPerPassenger_ExceedSportsEquipmentPerPassenger_ThrownExceptionExceedSportItems()
        {
            // Arrange
            var luggageSettings = new LuggageSettings
            {
                DefaultFreeBagsPerNonInfantPassenger = new Dictionary<string, int> { { Bag23KgCode, 1 } },
                SportsEquipmentCategoryCodes = "SEO,SEC",
                SportsEquipmentMaxPerPassenger = 1,
            };

            var luggageInfo = CreateLuggageInfo();
            var routeIds = CreateRoutes();
            var guests = CreateGuests();

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[0], passengerId: 1);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[1], passengerId: 1);

            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, routeId: routeIds[0], passengerId: 1, quantity: 2);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, routeId: routeIds[1], passengerId: 1, quantity: 2);

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[0], passengerId: 2);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[1], passengerId: 2);

            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, routeId: routeIds[0], passengerId: 2, quantity: 2);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, routeId: routeIds[1], passengerId: 2, quantity: 2);

            // Act
            var apiException = Assert.Throws<ApiException>(() => _sut.ValidateSportsEquipmentPerPassenger(luggageInfo.Items, guests, routeIds, luggageSettings));

            // Assert
            Assert.Equal(ApiExceptionCodes.BookingExtraLuggageItemsExceedSportItems, apiException.Code);
        }

        [Fact]
        public void ValidateSportsEquipmentPerPassenger_ExceedSportsEquipmentForOnePassenger_ThrownExceptionExceedSportItems()
        {
            // Arrange
            var luggageSettings = new LuggageSettings
            {
                SportsEquipmentCategoryCodes = "SEO,SEC",
                SportsEquipmentMaxPerPassenger = 1,
            };

            var luggageInfo = CreateLuggageInfo();
            var routeIds = CreateRoutes();
            var guests = CreateGuests();

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[0], passengerId: 1);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[1], passengerId: 1);

            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, routeId: routeIds[0], passengerId: 1, quantity: 2);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, routeId: routeIds[1], passengerId: 1, quantity: 2);

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[0], passengerId: 2);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[1], passengerId: 2);

            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, routeId: routeIds[0], passengerId: 2);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, routeId: routeIds[1], passengerId: 2);

            // Act
            var apiException = Assert.Throws<ApiException>(() => _sut.ValidateSportsEquipmentPerPassenger(luggageInfo.Items, guests, routeIds, luggageSettings));

            // Assert
            Assert.Equal(ApiExceptionCodes.BookingExtraLuggageItemsExceedSportItems, apiException.Code);
        }

        [Fact]
        public void ValidateSportsEquipmentPerPassenger_CorrectNumberOfSportsEquipmentPerPassenger_ValidationIsValid()
        {
            // Arrange
            var luggageSettings = new LuggageSettings
            {
                SportsEquipmentCategoryCodes = "SEO,SEC",
                SportsEquipmentMaxPerPassenger = 2,
            };

            var luggageInfo = CreateLuggageInfo();
            var routeIds = CreateRoutes();
            var guests = CreateGuests();

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[0], passengerId: 1);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[1], passengerId: 1);

            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, routeId: routeIds[0], passengerId: 1, quantity: 2);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, routeId: routeIds[1], passengerId: 1, quantity: 2);

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[0], passengerId: 2);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[1], passengerId: 2);

            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, routeId: routeIds[0], passengerId: 2);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, routeId: routeIds[1], passengerId: 2);

            // Act & Assert
            _sut.ValidateSportsEquipmentPerPassenger(luggageInfo.Items, guests, routeIds, luggageSettings);
        }

        [Fact]
        public void ValidateSportsEquipmentPerBooking_ExceedNumberOfLargeSportsEquipmentPerBooking_ThrownExceptionExceedSportItems()
        {
            // Arrange
            var luggageSettings = new LuggageSettings
            {
                SportsEquipmentLargeCategoryCodes = "SEO",
                SportsEquipmentLargeMaxPerBooking = 1
            };

            var luggageInfo = CreateLuggageInfo();
            var routeIds = CreateRoutes();

            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, routeId: routeIds[0], passengerId: 1, quantity: 2);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, routeId: routeIds[1], passengerId: 1, quantity: 2);

            // Act
            var apiException = Assert.Throws<ApiException>(() => _sut.ValidateSportsEquipmentPerBooking(luggageInfo.Items, routeIds, luggageSettings));

            // Assert
            Assert.Equal(ApiExceptionCodes.BookingExtraLuggageItemsExceedSportItems, apiException.Code);
        }

        [Fact]
        public void ValidateSportsEquipmentPerBooking_ExceedNumberOfLargeSportsEquipmentOfDifferentTypePerBooking_ThrownExceptionExceedSportItems()
        {
            // Arrange
            GetDefaultLuggageSettings();

            var luggageSettings = new LuggageSettings
            {
                SportsEquipmentLargeCategoryCodes = "SEO",
                SportsEquipmentLargeMaxPerBooking = 2
            };

            var luggageInfo = CreateLuggageInfo();
            var routeIds = CreateRoutes();

            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, routeId: routeIds[0], passengerId: 1);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, CanoeCode, routeId: routeIds[0], passengerId: 2);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, CanoeCode, routeId: routeIds[0], passengerId: 3);

            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, routeId: routeIds[1], passengerId: 1);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, CanoeCode, routeId: routeIds[1], passengerId: 2);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, CanoeCode, routeId: routeIds[1], passengerId: 3);

            // Act
            var apiException = Assert.Throws<ApiException>(() => _sut.ValidateSportsEquipmentPerBooking(luggageInfo.Items, routeIds, luggageSettings));

            // Assert
            Assert.Equal(ApiExceptionCodes.BookingExtraLuggageItemsExceedSportItems, apiException.Code);
        }

        [Fact]
        public void ValidateSportsEquipmentPerBooking_CorrectNumberOfSportsEquipmentPerBooking_ValidationIsValid()
        {
            // Arrange
            GetDefaultLuggageSettings();

            var luggageSettings = new LuggageSettings
            {
                SportsEquipmentLargeCategoryCodes = "SEO,",
                SportsEquipmentLargeMaxPerBooking = 3,
            };

            _referenceDataService.Setup(x => x.GetLuggageSettings()).ReturnsAsync(luggageSettings);

            var luggageInfo = CreateLuggageInfo();
            var routeIds = CreateRoutes();

            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, routeId: routeIds[0], passengerId: 1);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, CanoeCode, routeId: routeIds[0], passengerId: 2);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, CanoeCode, routeId: routeIds[0], passengerId: 3);

            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, routeId: routeIds[1], passengerId: 1);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, CanoeCode, routeId: routeIds[1], passengerId: 2);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, CanoeCode, routeId: routeIds[1], passengerId: 3);

            // Act & Assert
            _sut.ValidateSportsEquipmentPerBooking(luggageInfo.Items, routeIds, luggageSettings);
        }

        [Fact]
        public void ValidateLuggageItems_ExtraLuggageInfoIsNotValid_ExceptionIsThrown()
        {
            // Arrange
            var luggageSettings = new LuggageSettings
            {
                EnableHoldLuggageBookingFlow = false,
                EnableSportsEquipmentBookingFlow = false,
                EnableCabinBagsBookingFlow = false
            };
            var luggageConfiguration = GetLuggageConfiguration();
            var luggageInfo = CreateLuggageInfo();

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, price: 100);

            // Act
            var apiException = Assert.Throws<ApiException>(() => _sut.ValidateLuggageItems(luggageInfo.Items, luggageSettings, luggageConfiguration));

            // Assert
            Assert.Equal(ApiExceptionCodes.BookingExtraLuggageDisabled, apiException.Code);
        }

        [Fact]
        public void ValidateLuggageItems_ExtraLuggageInfoIsEmpty_IsValidExtraLuggageInfo()
        {
            // Arrange
            var luggageConfiguration = GetLuggageConfiguration();
            var luggageSettings = GetDefaultLuggageSettings();

            // Act & Assert
            _sut.ValidateLuggageItems(null, luggageSettings, luggageConfiguration);
        }

        [Fact]
        public void ValidateLuggageItems_LuggageSettingsAreDisabled_IsValidForEmptyLuggageItems()
        {
            // Arrange
            var luggageSettings = new LuggageSettings
            {
                EnableHoldLuggageBookingFlow = false,
                EnableSportsEquipmentBookingFlow = false
            };
            var luggageConfiguration = GetLuggageConfiguration();
            var luggageInfo = CreateLuggageInfo();

            // Act & Assert
            _sut.ValidateLuggageItems(luggageInfo.Items, luggageSettings, luggageConfiguration);
        }

        [Fact]
        public void ValidateLuggageItems_LuggageSettingsAreDisabled_IsNotValidForHoldLuggageItem()
        {
            // Arrange
            var luggageSettings = new LuggageSettings
            {
                EnableHoldLuggageBookingFlow = false,
                EnableSportsEquipmentBookingFlow = false,
                EnableCabinBagsBookingFlow = false
            };
            var luggageConfiguration = GetLuggageConfiguration();
            var luggageInfo = CreateLuggageInfo();

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, price: 100);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, price: 100);
            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, price: 100);

            // Act
            var apiException = Assert.Throws<ApiException>(() => _sut.ValidateLuggageItems(luggageInfo.Items, luggageSettings, luggageConfiguration));

            // Assert
            Assert.Equal(ApiExceptionCodes.BookingExtraLuggageDisabled, apiException.Code);
        }

        [Fact]
        public void ValidateLuggageItems_LuggageSettingsAreEnabled_IsValidForNotHoldLuggageOrSportsEquipmentLuggageItem()
        {
            // Arrange
            var luggageSettings = new LuggageSettings
            {
                EnableHoldLuggageBookingFlow = true,
                EnableSportsEquipmentBookingFlow = true
            };

            var luggageConfiguration = GetLuggageConfiguration();
            var luggageInfo = CreateLuggageInfo();

            AddLuggageItem(luggageInfo, "WGT", "WGT");

            // Act & Assert
            _sut.ValidateLuggageItems(luggageInfo.Items, luggageSettings, luggageConfiguration);
        }

        [Fact]
        public void ValidateLuggageItems_LuggageSettingsAreEnabled_ValidationPassedForAllLuggage()
        {
            // Arrange
            var luggageSettings = new LuggageSettings
            {
                EnableHoldLuggageBookingFlow = true,
                EnableSportsEquipmentBookingFlow = true,
                EnableCabinBagsBookingFlow = true
            };

            var luggageConfiguration = GetLuggageConfiguration();
            var luggageInfo = CreateLuggageInfo();

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, price: 100);
            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, price: 100);

            // Act & Assert
            _sut.ValidateLuggageItems(luggageInfo.Items, luggageSettings, luggageConfiguration);
        }

        [Fact]
        public void ValidateLuggageItems_HoldLuggageSettingIsDisabled_IsInvalidForHoldLuggageItems()
        {
            // Arrange
            var luggageSettings = new LuggageSettings
            {
                EnableHoldLuggageBookingFlow = false,
                EnableSportsEquipmentBookingFlow = true,
                EnableCabinBagsBookingFlow = true
            };

            var luggageConfiguration = GetLuggageConfiguration();
            var luggageInfo = CreateLuggageInfo();

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag15KgCode, price: 100);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, price: 100);
            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, price: 100);

            // Act
            var apiException = Assert.Throws<ApiException>(() => _sut.ValidateLuggageItems(luggageInfo.Items, luggageSettings, luggageConfiguration));

            // Assert
            Assert.Equal(ApiExceptionCodes.BookingExtraLuggageDisabled, apiException.Code);
        }

        [Fact]
        public void ValidateLuggageItems_SportsEquipmentSettingIsDisabled_IsInvalidForSportsEquipment()
        {
            // Arrange
            var luggageSettings = new LuggageSettings
            {
                EnableHoldLuggageBookingFlow = true,
                EnableSportsEquipmentBookingFlow = false,
                EnableCabinBagsBookingFlow = true
            };

            var luggageConfiguration = GetLuggageConfiguration();
            var luggageInfo = CreateLuggageInfo();

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, price: 100);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, price: 100);
            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, price: 100);

            // Act
            var apiException = Assert.Throws<ApiException>(() => _sut.ValidateLuggageItems(luggageInfo.Items, luggageSettings, luggageConfiguration));

            // Assert
            Assert.Equal(ApiExceptionCodes.BookingExtraLuggageDisabled, apiException.Code);
        }

        [Fact]
        public void ValidateLuggageItems_CabinBagsAreDisabled_ShouldThrowBookingExtraLuggageDisabledException()
        {
            // Arrange
            var luggageSettings = new LuggageSettings
            {
                EnableHoldLuggageBookingFlow = true,
                EnableSportsEquipmentBookingFlow = true,
                EnableCabinBagsBookingFlow = false
            };

            var luggageConfiguration = GetLuggageConfiguration();
            var luggageInfo = CreateLuggageInfo();

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag15KgCode, price: 100);
            AddLuggageItem(luggageInfo, LargeSportsEquipmentCategoryCode, BikeCode, price: 100);
            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, price: 100);

            // Act
            var apiException = Assert.Throws<ApiException>(() => _sut.ValidateLuggageItems(luggageInfo.Items, luggageSettings, luggageConfiguration));

            // Assert
            Assert.Equal(ApiExceptionCodes.BookingExtraLuggageDisabled, apiException.Code);
        }

        [Fact]
        public void ValidateLuggageItemsAvailability_LuggageItemsAreEnabled_IsValidLuggageInfo()
        {
            // Arrange
            var luggageConfiguration = new Domain.Data.ReferenceData.Luggage.Luggage
            {
                LuggageCategories = new List<LuggageCategory>
                {
                    new()
                    {
                        LuggageItems = new List<LuggageItemBase>
                        {
                            new LuggageItem()
                            {
                                Name = "Hold Baggage 15kg",
                                Code = Bag15KgCode,
                                IsLuggageItemEnabled = true,
                            },
                            new LuggageItem()
                            {
                                Name = "Hold Baggage 23kg",
                                Code = Bag23KgCode,
                                IsLuggageItemEnabled = true
                            }
                        }
                    },
                }
            };

            var luggageInfo = CreateLuggageInfo();

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag15KgCode);

            // Act & Assert
            _sut.ValidateLuggageItemsAvailability(luggageInfo.Items, luggageConfiguration);
        }

        [Fact]
        public void ValidateLuggageItemsAvailability_Luggage23KgIsDisabled_IsInvalidLuggageInfo()
        {
            // Arrange
            var luggageConfiguration = new Domain.Data.ReferenceData.Luggage.Luggage
            {
                LuggageCategories = new List<LuggageCategory>
                {
                    new()
                    {
                        LuggageItems = new List<LuggageItemBase>
                        {
                            new LuggageItem()
                            {
                                Name = "Hold Baggage 15kg",
                                Code = Bag15KgCode,
                                IsLuggageItemEnabled = true,
                            },
                            new LuggageItem()
                            {
                                Name = "Hold Baggage 23kg",
                                Code = Bag23KgCode,
                                IsLuggageItemEnabled = false
                            }
                        }
                    },
                }
            };

            var luggageInfo = CreateLuggageInfo();

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, price: 100);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag15KgCode, price: 100);

            // Act
            var apiException = Assert.Throws<ApiException>(() => _sut.ValidateLuggageItemsAvailability(luggageInfo.Items, luggageConfiguration));

            // Assert
            Assert.Equal(ApiExceptionCodes.BookingExtraLuggageItemsAreDisabled, apiException.Code);
        }

        [Fact]
        public void ValidateLuggageItemsAvailability_Luggage23KgIsDisabled_ExceptionIsThrown()
        {
            // Arrange
            var luggageConfiguration = new Domain.Data.ReferenceData.Luggage.Luggage
            {
                LuggageCategories = new List<LuggageCategory>
                {
                    new()
                    {
                        LuggageItems = new List<LuggageItemBase>
                        {
                            new LuggageItem()
                            {
                                Name = "Hold Baggage 23kg",
                                Code = Bag23KgCode,
                                IsLuggageItemEnabled = false
                            }
                        }
                    },
                }
            };

            var luggageInfo = CreateLuggageInfo();

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, price: 100);

            // Act
            var apiException = Assert.Throws<ApiException>(() => _sut.ValidateLuggageItemsAvailability(luggageInfo.Items, luggageConfiguration));

            // Assert
            Assert.Equal(ApiExceptionCodes.BookingExtraLuggageItemsAreDisabled, apiException.Code);
        }

        [Fact]
        public void ValidateLargeCabinBagsPerPassenger_CorrectInput_DoesNotThrowExceptions()
        {
            var luggageSettings = new LuggageSettings
            {
                LargeCabinBagCode = LargeCabinBagCode,
                LargeCabinBagMaxPerPassenger = 1
            };

            var luggageInfo = CreateLuggageInfo();
            var routeIds = CreateRoutes();
            var guests = CreateGuests();

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[0], passengerId: 1);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[1], passengerId: 1);

            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, routeId: routeIds[0], passengerId: 1, quantity: 1);
            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, routeId: routeIds[1], passengerId: 1, quantity: 1);

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[0], passengerId: 2);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[1], passengerId: 2);

            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, routeId: routeIds[0], passengerId: 2, quantity: 1);
            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, routeId: routeIds[1], passengerId: 2, quantity: 1);

            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[0], passengerId: 3);
            AddLuggageItem(luggageInfo, HoldLuggageCategoryCode, Bag23KgCode, routeId: routeIds[1], passengerId: 3);

            var act = () => _sut.ValidateLargeCabinBagsPerPassenger(luggageInfo.Items, luggageSettings, guests);

            act.Should().NotThrow();
        }

        [Fact]
        public void ValidateLargeCabinBagsPerPassenger_MoreThanAllowedCabinBagsPerPassenger_ThrowsException()
        {
            var luggageSettings = new LuggageSettings
            {
                LargeCabinBagCode = LargeCabinBagCode,
                LargeCabinBagMaxPerPassenger = 1
            };

            var luggageInfo = CreateLuggageInfo();
            var routeIds = CreateRoutes();
            var guests = CreateGuests();

            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, routeId: routeIds[0], passengerId: 1, quantity: 1);
            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, routeId: routeIds[0], passengerId: 1, quantity: 1);
            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, routeId: routeIds[1], passengerId: 1, quantity: 1);
            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, routeId: routeIds[1], passengerId: 1, quantity: 1);

            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, routeId: routeIds[0], passengerId: 2, quantity: 1);
            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, routeId: routeIds[1], passengerId: 2, quantity: 1);

            var act = () => _sut.ValidateLargeCabinBagsPerPassenger(luggageInfo.Items, luggageSettings, guests);

            act.Should().Throw<ApiException>().Which.Code
                .Should().Be(ApiExceptionCodes.BookingExtraLuggageExceedNumberOfLargeCabinBags);
        }

        [Fact]
        public void ValidateLargeCabinBagsPerPassenger_InfantHasLCB_ThrowsException()
        {
            var luggageSettings = new LuggageSettings
            {
                LargeCabinBagCode = LargeCabinBagCode,
                LargeCabinBagMaxPerPassenger = 1
            };

            var luggageInfo = CreateLuggageInfo();
            var routeIds = CreateRoutes();
            var guests = CreateGuests();

            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, routeId: routeIds[0], passengerId: 1, quantity: 1);
            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, routeId: routeIds[1], passengerId: 1, quantity: 1);

            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, routeId: routeIds[0], passengerId: 3, quantity: 1);
            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, routeId: routeIds[1], passengerId: 3, quantity: 1);

            var act = () => _sut.ValidateLargeCabinBagsPerPassenger(luggageInfo.Items, luggageSettings, guests);

            act.Should().Throw<ApiException>().Which.Code
                .Should().Be(ApiExceptionCodes.BookingExtraLuggageExceedNumberOfLargeCabinBags);
        }

        [Fact]
        public void ValidateLargeCabinBagsPerPassenger_DifferentLCBForInOutFlights_ThrowsException()
        {
            var luggageSettings = new LuggageSettings
            {
                LargeCabinBagCode = LargeCabinBagCode,
                LargeCabinBagMaxPerPassenger = 1
            };

            var luggageInfo = CreateLuggageInfo();
            var routeIds = CreateRoutes();
            var guests = CreateGuests();

            AddLuggageItem(luggageInfo, CabinBagsCategoryCode, LargeCabinBagCode, routeId: routeIds[0], passengerId: 1, quantity: 1);

            var act = () => _sut.ValidateLargeCabinBagsPerPassenger(luggageInfo.Items, luggageSettings, guests);

            act.Should().Throw<ApiException>().Which.Code
                .Should().Be(ApiExceptionCodes.FailedQuantityPerRoutesOfLargeCabinBags);
        }

        private static ExtraLuggageInfo CreateLuggageInfo()
        {
            return new ExtraLuggageInfo
            {
                Items = new List<ExtraLuggageItem>()
            };
        }

        private IList<PersonWithDetails> CreateGuests()
        {
            return new List<PersonWithDetails>
            {
                new() { Type = PersonType.Adult, Index = "1" },
                new() { Type = PersonType.Child, Index = "2" },
                new() { Type = PersonType.Infant, Index = "3" }
            };
        }

        private string[] CreateRoutes()
        {
            return new[] { "1", "2" };
        }

        private static void AddLuggageItem(ExtraLuggageInfo luggageInfo, string itemCategoryCode, string itemCode, string routeId = "1", int passengerId = 1, int quantity = 1, double price = 0)
        {
            luggageInfo.Items.Add(new ExtraLuggageItem
            {
                RouteId = routeId,
                ItemCode = itemCode,
                ItemCategoryCode = itemCategoryCode,
                PassengerId = passengerId.ToString(),
                Quantity = quantity,
                Price = price
            });
        }

        private LuggageSettings GetDefaultLuggageSettings()
        {
            var luggageSettings = new LuggageSettings
            {
                DefaultFreeBagsPerNonInfantPassenger = new Dictionary<string, int> { { Bag23KgCode, 1 } },
                EnableHoldLuggageBookingFlow = true,
                EnableSportsEquipmentBookingFlow = true
            };


            return luggageSettings;
        }

        private Domain.Data.ReferenceData.Luggage.Luggage GetLuggageConfiguration()
        {
            return new()
            {
                LuggageCategories = new List<LuggageCategory>
                {
                    new()
                    {
                        Code = HoldLuggageCategoryCode,
                        Type = "BAG",
                        Name = "Hold Luggage",
                        LuggageItems = new List<LuggageItemBase>
                        {
                            new LuggageItem()
                            {
                                Name = "Hold Baggage 15kg",
                                Code = Bag15KgCode
                            },
                            new LuggageItem()
                            {
                                Name = "Hold Baggage 23kg",
                                Code = Bag23KgCode
                            }
                        }
                    },
                    new()
                    {
                        Code = LargeSportsEquipmentCategoryCode,
                        Type = "Sports Equipment",
                        Name = "Large Sports Equipment",
                        LuggageItems = new List<LuggageItemBase>
                        {
                            new LuggageItem()
                            {
                                Name = "Bicycle",
                                Code = BikeCode
                            },
                            new LuggageItem()
                            {
                                Name = "Canoe",
                                Code = "CANO"
                            }
                        }
                    },
                    new()
                    {
                        Code = "SEC",
                        Type = "Sports Equipment",
                        Name = "Small Sports Equipment",
                        LuggageItems = new List<LuggageItemBase>
                        {
                            new LuggageItem()
                            {
                                Name = "Golf Bag",
                                Code = "GBAG"
                            }
                        }
                    },
                    new()
                    {
                        Code = LargeSportsEquipmentCategoryCode,
                        Type = "Cabin Bags",
                        Name = "Cabin Bags",
                        LuggageItems = new List<LuggageItemBase>
                        {
                            new LuggageItem()
                            {
                                Name = "Large Cabin Bag",
                                Code = LargeCabinBagCode
                            }
                        }
                    }
                }
            };
        }
    }
}
