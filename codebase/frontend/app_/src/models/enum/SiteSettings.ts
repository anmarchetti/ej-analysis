enum SiteSettings {
    CheckInButtonHideMoreThanDays = 'CheckInButtonHideMoreThanDays',
    CheckInLink = 'CheckInLink',
    DefaultRoomNumber = 'DefaultRoomNumber',

    MaxNumberOfGuestsPerRoom = 'MaxNumberOfGuestsPerRoom',
    MaxNumberOfGuests = 'MaxNumberOfGuests',
    MaxNumberOfRooms = 'MaxNumberOfRooms',
    // Trade Portal Group Booking
    MaxNumberOfGroupBookingRooms = 'MaxNumberOfGroupBookingRooms',
    MaxGuestNumberInGroupBookingRoom = 'MaxGuestNumberInGroupBookingRoom',

    NoResultsNumberOfTilesInCarousel = 'NoResultsNumberOfTilesInCarousel',

    NumberOfFlexibleDays = 'NumberOfFlexibleDays',

    EnablePOIs = 'EnablePOIs',

    LoaderIconVariant = 'LoaderIconVariant',
    LoaderAnimationIcon = 'LoaderAnimationIcon',
    // Seat Map Settings
    MinNumberOfDaysToDeparture = 'MinNumberOfDaysToDeparture',
    SeatsMapTimeBannerAutoHide = 'TimeDisplayBannerTapSelectedSeatToRemoveIt',
    EnableSeatMapFlow = 'EnableSeatMapFlow',
    EnableSeatMapPostBookingFlow = 'EnableSeatMapPostBookingFlow',
    HideSeatMapWarningMessages = 'HideSeatMapWarningMessages',

    /* Price Graph Settings */
    ShowPriceGraph = 'ShowPriceGraph',
    PriceGraphDepartureIcon = 'PriceGraphDepartureIcon',
    PriceGraphArrivalIcon = 'PriceGraphArrivalIcon',
    PriceGraphNoFlightIcon = 'PriceGraphNoFlightIcon',
    PriceGraphDatesForLoading = 'PriceGraphDatesForLoading',
    PriceGraphAmountOfLoadingItems = 'PriceGraphAmountOfLoadingItems',
    PriceGraphHideInfoMessage = 'PriceGraphHideInfoMessage',
    /* Price Graph Settings */

    NoResultsErrorBlockTitle = 'NoResultsErrorBlockTitle',
    NoResultsErrorBlockDescription = 'NoResultsErrorBlockDescription',
    NoResultsErrorBlockIcon = 'NoResultsErrorBlockIcon',

    // Holiday Card Settings
    IsUpdatedHolidayCard = 'IsUpdatedHolidayCard',

    // Guest / account details
    DefaultCountryCode = 'DefaultCountryCode',
    DefaultDialingCode = 'DefaultDialingCode',
    PasswordProhibitedWords = 'PasswordProhibitedWords',

    CookiePolicyText = 'CookiePolicyText',

    CountryTitle = 'CountryTitle',
    CountryDescription = 'CountryDescription',

    RegionTitle = 'RegionTitle',
    RegionDescription = 'RegionDescription',

    ResortTitle = 'ResortTitle',
    ResortDescription = 'ResortDescription',

    HotelTitle = 'HotelTitle',
    HotelDescription = 'HotelDescription',

    EnableDistressedSeatsLabel = 'EnableDistressedSeatsLabel',
    FreeForKidsPill = 'FreeForKidsPill',
    DepositPill = 'DepositPill',
    DiscountPill = 'DiscountPill',
    FreeForInfantsPill = 'FreeForInfantsPill',
    GreatValuePill = 'GreatValuePill',
    SuperDealsLabel = 'SuperDealsLabel',
    WithConfidenceMoreThan28Message = 'WithConfidenceMoreThan28Message',
    WithConfidenceLessThan28Message = 'WithConfidenceLessThan28Message',
    AreStrikethroughPricesEnabled = 'AreStrikethroughPricesEnabled',
    IsFreeBoardUpgradePillEnabled = 'IsFreeBoardUpgradePillEnabled',
    IsDiscountPercentagePillEnabled = 'IsDiscountPercentagePillEnabled',
    DiscountPercentagePillIcon = 'DiscountPercentagePillIcon',

    // ChangeBooking Settings
    ChangeBookingEnabled = 'ChangeBookingEnabled',
    ChangeModeDescription = 'ChangeModeDescription',
    ChangeModeExtra = 'ChangeModeExtra',

    // Amend Dates
    IsChangeDatesEnable = 'IsChangeDatesEnable',
    AmendDatesRedirectPage = 'AmendDatesRedirectPage',
    AmendDatesSearchDuration = 'AmendDatesSearchDuration',

    // Amend Transfers
    IsAmendTransfersEnabled = 'IsAmendTransfersEnabled', // no usage
    AmendTransfersRedirectPage = 'AmendTransfersRedirectPage',
    AmendTransfersThresholdHours = 'AmendTransfersThresholdHours',
    IsAmendPriceEnabledOnViewBookingPage = 'IsAmendPriceEnabledOnViewBookingPage',
    IsAmendPriceEnabledOnChangeTransferPage = 'IsAmendPriceEnabledOnChangeTransferPage',

    // Amend Flights
    IsAmendFlightsEnabled = 'IsAmendFlightsEnabled', // no usage
    IsDepartureAirportContentEnabled = 'IsDepartureAirportContentEnabled',
    AmendFlightsRedirectPage = 'AmendFlightsRedirectPage',
    AmendFlightsThresholdHours = 'AmendFlightsThresholdHours',
    AmendPassengerNameCharacterCount = 'AmendPassengerNameCharacterCount',

    // Amend Room Adn Board
    IsAmendRoomAndBoardEnabled = 'RoomAndBoardIsEnabled',

    //Amend Passengers Settings
    IsAmendPassengerChangeCountEnabled = 'IsAmendPassengerChangeCountEnabled',
    IsRestrictionInfoEnabled = 'IsRestrictionInfoEnabled',

    // Cancel Booking Settings
    CancellationRestrictionHours = 'CancellationRestrictionHours',
    EnableCancellationTradePortal = 'EnableCancellationTradePortal',

    /* Offers And Promotions Settings */
    ShowSuperDeals = 'ShowSuperDeals',
    HideSuperDeals = 'HideSuperDeals',
    KidsGoFree = 'KidsGoFree',
    /* Offers And Promotions Settings */

    // CreditBooking Settings
    EnableCreditBooking = 'EnableCreditBooking',
    EnableGiftCardRedemption = 'EnableGiftCardRedemption',
    EnableOneTimeUseCredit = 'EnableOneTimeUseCredit',
    ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture = 'ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture',
    BookingCanBeCancelledXOrMoreDaysBeforeDeparture = 'CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture',
    ShowCreditExpiresSoonBannerWithinDays = 'ShowCreditExpiresSoonBannerWithinDays',
    ShowCreditExpiryInfoPopupBeforeCancellation = 'ShowCreditExpiryInfoPopupBeforeCancellation',

    // Filter Settings
    NewAlternativeBoardsFilterIsActive = 'NewAlternativeBoardsFilterIsActive',
    ShowFacilityFilterGroupList = 'ShowFacilityFilterGroupList',

    //Shortlist Settings
    IsShortlistEnabled = 'IsShortlistEnabled',
    CreateAccountLink = 'CreateAccountLink',

    /* Live Price Settings */
    IsLivePriceEnabled = 'IsLivePriceEnabled',
    ExcludeLivePriceForDestinations = 'ExcludeLivePriceForDestinations',
    FeaturedHotelsLivePrice = 'FeaturedHotelsLivePrice',
    MosaicComponentLivePrice = 'MosaicComponentLivePrice',
    DestinationHeroBannerLivePrice = 'DestinationHeroBannerLivePrice',
    MasonryCarouselLivePrice = 'MasonryCarouselLivePrice',
    DestinationLikeLivePrice = 'DestinationLikeLivePrice',
    HotelDetailsBrowseStateLivePrice = 'HotelDetailsBrowseStateLivePrice',
    ShowAllRegionsLivePrice = 'ShowAllRegionsLivePrice',
    ShowViewHolidaysResultsLivePrice = 'ShowViewHolidaysResultsLivePrice',
    IsSearchFlexibleOnDestinationGuide = 'isSearchFlexibleOnDestinationGuide',
    ShortlistsLivePrice = 'ShortlistsLivePrice',
    EnableNumberOfNightsLabel = 'EnableNumberOfNights',

    // Geolocation
    IsGeolocationEnabled = 'IsGeolocationEnabled',
    GeolocationBounds = 'GeolocationBounds',

    // SearchPod
    IsAnywhereShownOnSearchPod = 'IsAnywhereShownOnSearchPod',
    IsAnywhereShownInAutocomplete = 'IsAnywhereShownInAutocomplete',

    IsTooltipOnSearchPodDesktopEnabled = 'IsTooltipOnSearchPodDesktopEnabled',
    IsTooltipOnSearchPodMobileEnabled = 'IsTooltipOnSearchPodMobileEnabled',

    IsSearchToHotelMessageEnabled = 'IsSearchToHotelMessageEnabled',

    IsSearchPodMonthSearchEnabled = 'IsSearchPodMonthSearchEnabled',
    IsSearchCheapestMonthEnabled = 'IsSearchCheapestMonthEnabled',
    ShowCheapestMonthTotalPrice = 'ShowCheapestMonthTotalPrice',
    DefaultSearchPodMonthSearchDuration = 'DefaultSearchPodMonthSearchDuration',
    IsSearchPodMonthDurationPillsEnabled = 'IsSearchPodMonthDurationPillsEnabled',
    SearchPodDurationPillOptions = 'SearchPodDurationPillOptions',

    // Recent Searches
    RecentSearchesMaxAmount = 'RecentSearchesMaxAmount',
    RecentSearchesExpirationMonths = 'RecentSearchesExpirationMonths',
    RecentSearchesMaxDestinationsDisplayed = 'RecentSearchesMaxDestinationsDisplayed',

    // Calendar
    DateUnavailableMessage = 'DateUnavailableMessage',
    DateUnavailableImage = 'DateUnavailableImage',

    // SearchPod Flexibility Options
    FlexibilityOptions = 'FlexibilityOptions',

    // reCAPTCHA
    IsReCaptchaEnabled = 'IsReCaptchaEnabled',
    IsReCaptchaEnabledContactUs = 'IsRecaptchaEnabledContactUs',

    // Promo Page
    EnablePromoBannerTooltip = 'EnablePromoBannerTooltip',

    OpenRouteInNewTab = 'OpenRouteInNewTab',
    HideOtherRoutesInPages = 'HideOtherRoutesInPages',

    // Push Notifications
    IsAskToSubscribePopupEnabled = 'IsAskToSubscribePopupEnabled',
    AskToSubscribePopupDelay = 'AskToSubscribePopupDelay',
    AskNotificationsTitle = 'AskNotificationsTitle',
    AskNotificationsDescription = 'AskNotificationsDescription',

    // Promo Code
    IsPromoCodeEnabled = 'IsPromoCodeEnabled',
    IsSeatsCalculationIncluded = 'IsSeatsCalculationIncluded',
    PromoCodeVariant = 'PromoCodeVariant',

    // Errata
    IsErrataEnabled = 'IsErrataEnabled',
    IsFacilityErrataEnabled = 'IsFacilityErrataEnabled',
    ErrataTitle = 'ErrataTitle',
    ErrataIcon = 'ErrataIcon',
    ErrataFlightTitle = 'ErrataFlightTitle',
    ErrataFlightIcon = 'ErrataFlightIcon',

    // Pax Mix Settings
    IsPaxMixPopupEnabled = 'IsPaxMixPopupEnabled',

    //Map Settings
    IsMapHiddenOnDesktop = 'IsMapHiddenOnDesktop',
    IsMapHiddenOnMobile = 'IsMapHiddenOnMobile',
    IsDestinationMapHiddenOnDesktop = 'IsDestinationMapHiddenOnDesktop',

    //Media Centre Settings
    MediaCentreDarkSiteMode = 'DarkSiteMode',

    // Special Requests
    IsSSREnabled = 'IsSpecialRequestActive',
    IsEligibleToAddSSRForDC = 'IsEligibleToAddSSRForDC',
    IsEligibleToAddSSRForHBG = 'IsEligibleToAddSSRForHBG',

    // Special Assistance
    IsSpecialAssistanceEnabled = 'IsSpecialAssistanceActive',
    EnableAssistedTravelOnlineForm = 'EnableAssistedTravelOnlineForm',
    DaysBeforeDepartureTravelAssistanceCanBeRequested = 'DaysBeforeDepartureTravelAssistanceCanBeRequested',

    // Facilities
    IsHotelFacilitiesTabsDesignEnabled = 'IsHotelFacilitiesTabsDesignEnabled',
    HotelFacilitiesVariantListDesign = 'HotelFacilitiesVariantListDesign',
    HotelFacilitiesVariantTabsDesign = 'HotelFacilitiesVariantTabsDesign',
    MaxNumberOfVisibleRoomFacilities = 'MaxNumberOfVisibleRoomFacilities',

    // Free Upgrades
    IsFreeNightsEnabled = 'IsFreeNightsEnabled',
    FreeNightsIcon = 'FreeNightsIcon',

    // Transfer Duration
    TransferDurationEnabled = 'TransferDurationEnabled',
    PrivateTransferPromoEnabled = 'PrivateTransferPromoEnabled',
    PrivateTransferPromoMinDiffTime = 'PrivateTransferPromoMinDiffTime',
    TransferDurationEnabledOnViewBookingAndConfirmationPage = 'TransferDurationEnabledOnViewBookingAndConfirmationPage',

    // Transfer Instructions
    IsTransferInstructionsEnabled = 'IsTransferInstructionsEnabled',

    //Like Badge
    IsWeLovePillEnabled = 'IsWeLovePillEnabled',

    // Late room checkout settings
    IsLateCheckoutEnabled = 'IsLateCheckoutEnabled',
    TimeForLateRoomCheckout = 'TimeForLateRoomCheckout',

    // Terminal Information settings
    IsTerminalInformationEnabled = 'IsTerminalInformationEnabled',

    IsGreatDealPillEnabled = 'IsGreatDealPillEnabled',

    // Price View Toggle Settings
    IsPriceViewToggleEnabled = 'IsPriceViewToggleEnabled',
    IsPriceViewToggleTotalDefault = 'IsPriceViewToggleTotalDefault',
    ToggleTotalPriceDesktopLabel = 'ToggleTotalPriceDesktopLabel',
    ToggleTotalPriceMobileLabel = 'ToggleTotalPriceMobileLabel',
    TogglePricePPDesktopLabel = 'TogglePricePPDesktopLabel',
    TogglePricePPMobileLabel = 'TogglePricePPMobileLabel',

    IsExcursionsEnabled = 'IsExcursionsEnabled',
    ExcursionDescriptionMaxLines = 'ExcursionDescriptionMaxLines',

    //Destination page
    IsDestinationUnavailableBannerEnabled = 'IsDestinationUnavailableBannerEnabled',

    IsHolidayTypeRecommenderCarouselEnabled = 'IsHolidayTypeRecommenderCarouselEnabled',

    // Tracking
    EnableUserSearchesTracking = 'EnableUserSearchesTracking',
    EnablePersonalizationOrderTracking = 'EnablePersonalizationOrderTracking',

    // Personalize
    EnablePersonalizeOrderLogging = 'EnablePersonalizeOrderLogging',
    DisableReordering = 'DisableReordering',
    PersonalizeTimeout = 'SitecorePersonalizeTimeout',

    // Alternative Boards
    EnableAlternativeBoardsSearchResults = 'EnableAlternativeBoardsSearchResults',
    EnableAlternativeBoardsPromoPages = 'EnableAlternativeBoardsPromoPages',
    AlternativeBoardsExcludedPromoPages = 'AlternativeBoardsExcludedPromoPages',

    // SmartSeer Travel settings
    EnableNoFollowLinksOnCTA = 'EnableNoFollowLinksOnCTA',

    //Image Carousel on hotel details page
    IsFullScreenCarouselEnabledHotelDetailsDesktop = 'IsFullScreenCarouselEnabledHotelDetailsDesktop',
    IsFullScreenCarouselEnabledHotelDetailsMobile = 'IsFullScreenCarouselEnabledHotelDetailsMobile',

    IsFullScreenCarouselEnabledSearchResultsDesktop = 'IsFullScreenCarouselEnabledSearchResultsDesktop',
    IsFullScreenCarouselEnabledSearchResultsMobile = 'IsFullScreenCarouselEnabledSearchResultsMobile',

    IsFullScreenCarouselEnabledPromoMobile = 'IsFullScreenCarouselEnabledPromoMobile',
    IsFullScreenCarouselEnabledPromoDesktop = 'IsFullScreenCarouselEnabledPromoDesktop',
    HotelFallbackImage = 'HotelFallbackImage',
    HotelThumbnailFallbackImage = 'HotelThumbnailFallbackImage',

    // Eco certified settings
    IsEcoCertifiedEnabledOnSearchPage = 'IsEcoCertifiedEnabledOnSearchPage',
    IsEcoCertifiedEnabledOnHotelDetailsPage = 'IsEcoCertifiedEnabledOnHotelDetailsPage',
    IsEcoCertifiedEnabledInFacilitiesTabs = 'IsEcoCertifiedEnabledInFacilitiesTabs',
    IsEcoCertifiedEnabledOnBookingListPage = 'IsEcoCertifiedEnabledOnBookingListPage',
    IsEcoCertifiedEnabledOnHotelSummaryInViewBookingPage = 'IsEcoCertifiedEnabledOnHotelSummaryInViewBookingPage',

    // View Booking Hotel Card Settings
    AdultsIcon = 'AdultsIcon',
    MaleIcon = 'MaleIcon',
    FemaleIcon = 'FemaleIcon',
    ChildIcon = 'ChildIcon',
    ChildrenIcon = 'ChildrenIcon',
    InfantIcon = 'InfantIcon',
    InfantsIcon = 'InfantsIcon',

    // Market
    Market = 'Market',

    // Feefo
    IsFeefoEnabled = 'IsFeefoEnabled',
    ReviewsRating = 'ReviewsRating',

    ShowReviewsOnHomePage = 'ShowReviewsOnHomePage',
    ShowTitlesAndCommentsOnHomePage = 'ShowTitlesAndCommentsOnHomePage',
    ReviewsCountDesktopOnHomePage = 'ReviewsCountDesktopOnHomePage',
    ReviewsCountMobileOnHomePage = 'ReviewsCountMobileOnHomePage',

    ShowReviewsOnPromoPage = 'ShowReviewsOnPromoPage',
    ShowTitlesAndCommentsOnPromoPage = 'ShowTitlesAndCommentsOnPromoPage',
    ReviewsCountDesktopOnPromoPage = 'ReviewsCountDesktopOnPromoPage',
    ReviewsCountMobileOnPromoPage = 'ReviewsCountMobileOnPromoPage',

    ShowReviewsOnDestinationPages = 'ShowReviewsOnDestinationPages',
    ShowTitlesAndCommentsOnDestinationPages = 'ShowTitlesAndCommentsOnDestinationPages',
    ReviewsCountDesktopOnDestinationPages = 'ReviewsCountDesktopOnDestinationPages',
    ReviewsCountMobileOnDestinationPages = 'ReviewsCountMobileOnDestinationPages',

    // Contact Form
    IsFormEnabled = 'isFormEnabled',

    // Booking
    BookingPaymentReminderHideMoreThanDays = 'BookingPaymentReminderHideMoreThanDays',
    IsViewBookingRedirectsEnabled = 'IsViewBookingRedirectsEnabled',
    DaysBeforeDepartureToPay = 'DaysBeforeDepartureToPay',
    IsHotelCheckInEnabled = 'IsHotelCheckInEnabled',
    IsBundlesPageEnabled = 'IsBundlesPageEnabled',

    // Sitecore links to view booking pages
    BookingInDestinationLink = 'BookingInDestinationLink',
    BookingPreTravelLink = 'BookingPreTravelLink',
    BookingPostTravelLink = 'BookingPostTravelLink',
    BookingViewLink = 'BookingViewLink',
    CancelledBookingLink = 'CancelledBookingLink',

    // View Booking time config for page states
    BookingHoursPreTravelStarts = 'BookingHoursPreTravelStarts',
    BookingHoursPostTravelStarts = 'BookingHoursPostTravelStarts',

    // ATOL Protection
    IsATOLProtectionEnabled = 'IsATOLProtectionEnabled',

    // Chatbot
    IsChatbotEnabled = 'IsChatbotEnabled',

    // Urgency Message
    UrgencyMessageMaxRooms = 'UrgencyMessageMaxRooms',

    // Luggage
    IsHoldLuggageEnabled = 'IsHoldLuggageEnabled',
    IsSportsEquipmentEnabled = 'IsSportsEquipmentEnabled',
    FreeBagsPerPassenger = 'DefaultFreeBagsPerNonInfantPassenger',
    MaxAdditionalLuggagePerPassenger = 'HoldLuggageMaximalAdditionalBagsPerNonInfantPassenger',
    HoldLuggageCategoryCodes = 'HoldLuggageMaximalAdditionalBagsPerNonInfantPassengerCategoryCodes',
    MaxSportItemsPerPassenger = 'SportsEquipmentMaximalItemPerNonInfantPassenger',
    SportsEquipmentCategoryCodes = 'SportsEquipmentMaximalItemPerNonInfantPassengerCategoryCodes',
    MaxLargeSportItemsPerBooking = 'SportsEquipmentMaximalLargeItemsPerNonInfantPassengerPerBooking',
    LargeSportsEquipmentCategoryCode = 'SportsEquipmentMaximalLargeItemsPerNonInfantPassengerPerBookingCategoryCodes',
    SportEquipmentAccommodationNoticePeriod = 'SEAccommodationNoticePeriod',

    // Cabin bags
    IsCabinBagsEnabled = 'IsCabinBagsEnabled',
    LargeCabinBagCode = 'LargeCabinBagCode',
    LargeCabinBagCategoryCode = 'LargeCabinBagCategoryCode',
    LargeCabinBagMaxPerPassenger = 'LargeCabinBagMaxPerPassenger',

    // Bags by Promotion
    BagsPromotionUpSell = 'PromotionUpsell',

    // Meta
    MetaTypeWebsite = 'website',

    // External Extras
    IsExternalExtrasEnabled = 'IsExternalExtrasEnabled',
    IsAirportParkingHidden = 'IsAirportParkingHidden',
    IsAirportParkingFreeCancellationPillEnabled = 'IsAirportParkingFreeCancellationPillEnabled',
    IsParkingDetailsViewPageEnabled = 'IsParkingDetailsViewPageEnabled',
    MaxVisibleParkings = 'MaxVisibleParkings',

    // List of Results
    SearchResultsItemsPerPage = 'SearchResultsItemsPerPage',
    PromoPageItemsPerPage = 'PromoPageItemsPerPage',

    // Compare Deals
    IsCompareDealsEnabledOnSearchResultsPage = 'IsCompareDealsEnabledOnSearchResultsPage',
    MaxCompareItemCount = 'MaxCompareItemCount',
    MinCompareItemCount = 'MinCompareItemCount',

    //CIAM
    EnableCIAMFunctionality = 'EnableCIAMFunctionality',
    EnableCIAMForgetPasswordForm = 'EnableCIAMForgetPasswordForm',
    EmailDomainsForgetPassword = 'EmailDomainsForgetPassword',

    // Tooltip
    DisableHolidayTypeTooltipIcon = 'DisableHolidayTypeTooltipIcon',

    // Payment Methods
    IsApplePayEnabled = 'IsApplePayEnabled',
    IsApplePayEnabledOnPayBalance = 'IsApplePayEnabledOnPayBalance',
    IsApplePayEnabledOnAmendBooking = 'IsApplePayEnabledOnAmendBooking',

    //Social Proofing Settings
    IsSocialProofingEnabled = 'IsSocialProofingEnabled',
    SocialProofingTrendingIcon = 'SocialProofingTrendingIcon',
    SocialProofingTrendingText = 'SocialProofingTrendingText',

    // Cloudinary
    DisableCloudinaryPlayer = 'DisableCloudinaryPlayer',

    // Summary Bar
    IsSummaryBarEnabled = 'IsSummaryBarEnabled',
    IsSummaryBarHidden = 'IsSummaryBarHidden',

    // Feedback Form
    AllowedFileTypes = 'AllowedFileTypes',
    MaxFileCount = 'MaxFileCount',
    MaxFileSize = 'MaxFileSize',

    //Tourist Tax
    IsTouristTaxEnabled = 'IsTouristTaxEnabled',
    IsHolidayPackageCostHighlighted = 'IsHolidayPackageCostHighlighted',

    // Optimizely Feature Experimentation
    IsOptimizelyExperimentationEnabled = 'IsOptimizelyExperimentationEnabled',
    SiteSettingsExperiments = 'SiteSettingsExperiments',
    OptimizelyDecisions = 'optimizelyDecisions',
    OptimizelyUserId = 'optimizelyUserId',
    OptimizelyUserAttributes = 'optimizelyUserAttributes',

    //My Bookings
    HideBookingsWithPromotion = 'HideBookingsWithPromotion',

    // Address Lookup
    EnableAddressLookup = 'EnableAddressLookup',
}

export default SiteSettings;
