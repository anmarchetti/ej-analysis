namespace easyJet.Holidays.Api.Common.Exceptions
{
    public struct ExceptionCode
    {
        public string Code { get; set; }
        public string Description { get; set; }

        /// <inheritdoc />
        public override int GetHashCode()
        {
            return Code.GetHashCode() ^ Description.GetHashCode();
        }

        /// <inheritdoc/>
        public override bool Equals(object obj)
        {
            if (obj == null)
            {
                return false;
            }

            if (obj is ExceptionCode exceptionCode)
            {
                return Code == exceptionCode.Code
                    && Description == exceptionCode.Description;
            }

            return false;
        }
    }

    public static class ApiExceptionCodes
    {
        public static readonly ExceptionCode InternalServerError = new ExceptionCode() { Code = "API-ERR-000000", Description = "Internal server error" };
        public static readonly ExceptionCode InvalidModelState = new ExceptionCode() { Code = "API-ERR-000001", Description = "Invalid model state" };
        public static readonly ExceptionCode UnauthorizedAccess = new ExceptionCode() { Code = "API-ERR-000002", Description = "Unauthorized access" };
        public static readonly ExceptionCode ArgumentException = new ExceptionCode() { Code = "API-ERR-000003", Description = "Argument exception" };
        /// <summary>
        /// Exception Code for request being cancelled by the client
        /// </summary>
        public static readonly ExceptionCode RequestCancelledException = new ExceptionCode() { Code = "API-ERR-000004", Description = "Request cancelled by the client" };

        public static readonly ExceptionCode SearchPackagesError = new ExceptionCode() { Code = "API-ERR-100000", Description = "Offer is not available" };
        public static readonly ExceptionCode SearchAlternativeOffersError = new ExceptionCode() { Code = "API-ERR-100001", Description = "Available dates range was reached" };
        public static readonly ExceptionCode SearchPackagesTransferError = new ExceptionCode() { Code = "API-ERR-100002", Description = "Transfer code is not valid" };
        public static readonly ExceptionCode SearchPackagesPriceJumpError = new ExceptionCode() { Code = "API-ERR-100003", Description = "Offer is not available due to maximum allowed price jump" };
        /// <summary>
        /// Exception Code for error related with cheapest month endpoint
        /// </summary>
        public static readonly ExceptionCode SearchCheapestMonthError = new ExceptionCode() { Code = "API-ERR-100004", Description = "Failed to get cheapest month from DynamoDb." };

        public static readonly ExceptionCode SearchHotelsError = new ExceptionCode() { Code = "API-ERR-200000", Description = "Hotels data is not available" };
        public static readonly ExceptionCode SearchHotelsSummaryByParentCode = new ExceptionCode() { Code = "API-ERR-200010", Description = "Hotels summary is not available" };
        public static readonly ExceptionCode SearchHotelsMissingCodes = new ExceptionCode() { Code = "API-ERR-200020", Description = "Hotels codes data is not available" };
        /// <summary>
        /// Exception code for for CMS get accommodations endpoint
        /// </summary>
        public static readonly ExceptionCode SearchAccommodationsByGiata = new ExceptionCode() { Code = "API-ERR-200030", Description = "Accommodations data is not available for the requested Giata code" };

        public static readonly ExceptionCode CustomerNoMappedId = new ExceptionCode() { Code = "API-ERR-300001", Description = "Can not get customer id" };
        public static readonly ExceptionCode LoggedNotAsBookingLeadPassenger = new ExceptionCode() { Code = "API-ERR-300002", Description = "Customer is not logged in or is not the lead passenger for the booking" };

        public static readonly ExceptionCode BookingCreateError = new ExceptionCode() { Code = "API-ERR-300000", Description = "Can not create booking" };
        public static readonly ExceptionCode BookingValidatePriceError = new ExceptionCode() { Code = "API-ERR-300010", Description = "Price is not valid" };
        public static readonly ExceptionCode BookingPaymentInfoError = new ExceptionCode() { Code = "API-ERR-300011", Description = "Payment information is not filled" };
        public static readonly ExceptionCode BookingCommitError = new ExceptionCode() { Code = "API-ERR-300020", Description = "Can not commit booking" };
        public static readonly ExceptionCode BookingPaymentError = new ExceptionCode() { Code = "API-ERR-300021", Description = "Can not pay for the booking" };
        public static readonly ExceptionCode BookingCancelPaymentError = new ExceptionCode() { Code = "API-ERR-300022", Description = "Can not cancel payment for the booking" };
        public static readonly ExceptionCode BookingCancelError = new ExceptionCode() { Code = "API-ERR-300023", Description = "Can not cancel booking" };
        /// <summary>
        /// Booking Payment error when validation price returned differs from the price in the booking
        /// </summary>
        public static readonly ExceptionCode BookingPriceJumpError = new ExceptionCode() { Code = "API-ERR-300024", Description = "Price Validation Error" };
        /// <summary>
        /// Booking Cancellation error when fee could not be retrieved
        /// </summary>
        public static readonly ExceptionCode BookingFeeCancellationError = new ExceptionCode() { Code = "API-ERR-300024", Description = "Can not cancel booking because fee could not be retrieved" };
        /// <summary>
        /// Error will be shown when the previous calculated refund has a difference to the current calculated refund.
        /// </summary>
        public static readonly ExceptionCode BookingCancelRefundCalculationError = new ExceptionCode() { Code = "API-ERR-300025", Description = "Can not cancel booking. The previous calculated refund has a difference to the current calculated refund." }; 
        /// <summary>
        ///
        /// </summary>
        public static readonly ExceptionCode BookingCancellationRefundOptionError = new ExceptionCode() { Code = "API-ERR-300026", Description = "Can not cancel booking. The available refund option does not fit the transmitted refund option." };
        /// <summary>
        /// Error code for trade booking when trade booking has credit in the booking
        /// </summary>
        public static readonly ExceptionCode BookingCancellationTradeHasCreditInBookingError = new ExceptionCode() { Code = "API-ERR-300027", Description = "Can not cancel booking. The trade booking has credit in the booking." };
        /// <summary>
        /// Error code when cannot add rep code to the memo
        /// </summary>
        public static readonly ExceptionCode BookingCancellationRepCodeError = new ExceptionCode() { Code = "API-ERR-300028", Description = "Cannot add rep code to the memo" };
        /// <summary>
        /// Error will be shown when the amount of cancellation failure is  bigger than the allowed threshold defined in settings due
        /// </summary>
        public static readonly ExceptionCode BookingBlocked = new ExceptionCode() { Code = "API-ERR-300029", Description = "Can not cancel booking. Exceeded number of allowed cancellation failures." };
        public static readonly ExceptionCode BookingViewError = new ExceptionCode() { Code = "API-ERR-300030", Description = "Can not get booking" };
        public static readonly ExceptionCode BookingCanceledError = new ExceptionCode() { Code = "API-ERR-300031", Description = "Booking in canceled status" };
        public static readonly ExceptionCode BookingLockedError = new ExceptionCode() { Code = "API-ERR-300032", Description = "Booking in locked status" };
        public static readonly ExceptionCode BookingExternalAgencyError = new ExceptionCode() { Code = "API-ERR-300033", Description = "External agency booking" };
        public static readonly ExceptionCode BookingSearchSessionExpired = new ExceptionCode() { Code = "API-ERR-300034", Description = "Atcom search session has expired. Please, update the session id" };
        public static readonly ExceptionCode BookingStartTransactionError = new ExceptionCode() { Code = "API-ERR-300040", Description = "Can not create booking transaction" };
        public static readonly ExceptionCode BookingCommitNoTransactionError = new ExceptionCode() { Code = "API-ERR-300050", Description = "Invalid transaction" };
        public static readonly ExceptionCode BookingCommitIdempotentTimeoutError = new ExceptionCode() { Code = "API-ERR-300051", Description = "Can not commit booking" };
        public static readonly ExceptionCode BookingCommitIdempotentStatusError = new ExceptionCode() { Code = "API-ERR-300052", Description = "Unknown booking transaction status" };
        public static readonly ExceptionCode BookingFraudError = new ExceptionCode() { Code = "API-ERR-300060", Description = "Can not get booking" };
        public static readonly ExceptionCode BookingListError = new ExceptionCode() { Code = "API-ERR-300070", Description = "Can not get bookings list" };
        public static readonly ExceptionCode BookingAssignAlreadyAssigned = new ExceptionCode() { Code = "API-ERR-300081", Description = "Booking is already assigned" };
        public static readonly ExceptionCode BookingAssignUpdateCustomerId = new ExceptionCode() { Code = "API-ERR-300082", Description = "Can not assign booking" };
        public static readonly ExceptionCode BookingAssignAlreadyAssignedToAccount = new ExceptionCode() { Code = "API-ERR-300083", Description = "Booking is already assigned to your account" };
        public static readonly ExceptionCode BookingAssignInvalidEmail = new ExceptionCode() { Code = "API-ERR-300084", Description = "Can not assign booking with email different from customer email" };
        public static readonly ExceptionCode BookingModifyMemo = new ExceptionCode() { Code = "API-ERR-300085", Description = "Can not modify booking memo" };
        public static readonly ExceptionCode BookingChangeForbidden = new ExceptionCode() { Code = "API-ERR-300090", Description = "Change is forbidden for this booking" };
        public static readonly ExceptionCode BookingChangeAfterDate = new ExceptionCode() { Code = "API-ERR-300100", Description = "Departure date should not be before current booking date" };
        public static readonly ExceptionCode BookingTokenEncode = new ExceptionCode() { Code = "API-ERR-300101", Description = "Can not encode or decode token" };
        public static readonly ExceptionCode BookingNotAssignedToCustomer = new ExceptionCode() { Code = "API-ERR-300102", Description = "Booking is not assigned to customer" };
        public static readonly ExceptionCode BookingCreditForbidden = new ExceptionCode() { Code = "API-ERR-300103", Description = "Credit is forbidden for this booking" };
        public static readonly ExceptionCode BookingTransfersUnavailalbe = new ExceptionCode() { Code = "API-ERR-300104", Description = "Transfer items are not available" };
        public static readonly ExceptionCode BookingCannotPayOutstandingBalance = new ExceptionCode() { Code = "API-ERR-300105", Description = "Can not pay outstanding balance." };
        public static readonly ExceptionCode BookingCreditInconsistentError = new ExceptionCode() { Code = "API-ERR-300106", Description = "Can not decide on credit breakdown" };
        public static readonly ExceptionCode BookingCannotAddSpecialRequest = new ExceptionCode() { Code = "API-ERR-300200", Description = "Can not add special request." };
        public static readonly ExceptionCode BookingCannotHasContradictorySpecialRequest = new ExceptionCode() { Code = "API-ERR-300201", Description = "Booking can not have contradictory request." };
        public static readonly ExceptionCode BookingCannotGetPrivacy = new ExceptionCode() { Code = "API-ERR-300300", Description = "Can not get a privacy booking information. Only owner can get it." };
        public static readonly ExceptionCode BookingCannotSetPrivacy = new ExceptionCode() { Code = "API-ERR-300301", Description = "Can not change a booking privacy. Only booking owner can do this." };
        public static readonly ExceptionCode BookingSeatReservationError = new ExceptionCode() { Code = "API-ERR-300302", Description = "Can not reserve seats" };
        public static readonly ExceptionCode BookingSeatSelectionDisabled = new ExceptionCode() { Code = "API-ERR-300303", Description = "Seat selection is disabled" };
        public static readonly ExceptionCode BookingSeatSelectionIncomplete = new ExceptionCode() { Code = "API-ERR-300304", Description = "Seats should be selected for all non-infants" };
        public static readonly ExceptionCode GroupBookingPersistingFailed = new ExceptionCode() { Code = "API-ERR-300400", Description = "Group booking persisting failed" };
        public static readonly ExceptionCode GroupBookingEmailSendingFailed = new ExceptionCode() { Code = "API-ERR-300401", Description = "Group booking email sending failed" };
        public static readonly ExceptionCode BookingModifyError = new ExceptionCode() { Code = "API-ERR-300402", Description = "Can not modify booking" };
        public static readonly ExceptionCode BookingRefundEligible = new ExceptionCode() { Code = "API-ERR-300403", Description = "Refund is not eligible for this booking" };
        public static readonly ExceptionCode BookingExtraLuggageDisabled = new ExceptionCode() { Code = "API-ERR-300404", Description = "Hold Luggage or Sports Equipment are disabled for this booking." };
        public static readonly ExceptionCode BookingExtraLuggageItemsAreDisabled = new ExceptionCode() { Code = "API-ERR-300405", Description = "Hold Luggage or Sports Equipment items are disabled." };
        public static readonly ExceptionCode BookingExtraLuggageItemsMissingDefaultBags = new ExceptionCode() { Code = "API-ERR-300406", Description = "(BR-HL-1) Non-infants get default bags assigned to them and they can add extra hold luggage to the booking." };
        public static readonly ExceptionCode BookingExtraLuggageItemsExceedNumberOfHoldBags = new ExceptionCode() { Code = "API-ERR-300407", Description = "(BR-HL-3) Hold luggage is capped at booking level. Limit of extra hold bags to be added per passenger (including adults & children)." };
        public static readonly ExceptionCode BookingExtraLuggageItemsExceedSportItems = new ExceptionCode() { Code = "API-ERR-300409", Description = "(BR-SE-1) Sport equipment is capped per passenger and large sport items per booking." };
        public static readonly ExceptionCode BookingExtraLuggageItemsInvalidDefaultBagsCodes = new ExceptionCode() { Code = "API-ERR-300410", Description = "Default Free Bags settings is invalid. The code should be connected with valid bag codes." };
        public static readonly ExceptionCode BookingExtraLuggageExceedNumberOfLargeCabinBags = new ExceptionCode() { Code = "API-ERR-300411", Description = "(BR-CB-5) Large cabin bag is capped at one per adult and child passenger, excluding infants." };
        /// <summary>
        /// Exception Code for different amount of luggage codes to luggage category codes
        /// </summary>
        public static readonly ExceptionCode BookingCombinedLuggageDifference = new ExceptionCode() { Code = "API-ERR-300412", Description = "The amount of combined codes has a different to combined category codes" };

        public static readonly ExceptionCode FailedQuantityPerRoutesOfLargeCabinBags = new ExceptionCode() { Code = "API-ERR-300412", Description = "A passenger should have the same quantity of large cabin bags for inbound and outbound routes." };
        /// <summary>
        /// Exception Code for not allowed amendment of flight date or transfer for Sport Equipment luggage
        /// </summary>
        public static readonly ExceptionCode NoAmendFlightAndTransferForSportEquipment = new() { Code = "API-ERR-3004013", Description = "Not allowed to amendment flight date or transfer for Sport Equipment luggage." };
        /// <summary>
        /// Exception Code for promotion assigned to this booking is on the exclusion list
        /// </summary>
        public static readonly ExceptionCode BookingHasExcludedPromotion = new ExceptionCode() { Code = "API-ERR-300414", Description = "The promotion assigned to this booking is on the exclusion list" };

        public static readonly ExceptionCode CreditsUserInfoNotAvailable = new ExceptionCode() { Code = "API-ERR-301000", Description = "Can not get customer credits info." };
        public static readonly ExceptionCode CreditsHistoryNotAvailable = new ExceptionCode() { Code = "API-ERR-301001", Description = "Can not get customer credit history." };
        public static readonly ExceptionCode CreditsInsufficientFunds = new ExceptionCode() { Code = "API-ERR-301002", Description = "Insufficient funds in the account." };
        public static readonly ExceptionCode CreditsFailedToWithdrawFullAmmount = new ExceptionCode() { Code = "API-ERR-301003", Description = "Failed to withdraw the full amount from the account." };
        public static readonly ExceptionCode CreditsFailedToRollBackRedemption = new ExceptionCode() { Code = "API-ERR-301004", Description = "Failed to rollback redemption." };
        public static readonly ExceptionCode CreditsFailedRedeem = new ExceptionCode() { Code = "API-ERR-301005", Description = "Failed to redeem." };
        public static readonly ExceptionCode CreditsSpendFullyPaid = new ExceptionCode() { Code = "API-ERR-301006", Description = "xxxx." };
        public static readonly ExceptionCode CreditsSpendCreditsPriceNegative = new ExceptionCode() { Code = "API-ERR-301007", Description = "Credit amount should be greater than 0." };
        public static readonly ExceptionCode CreditsSpendCreditsInvalidPrice = new ExceptionCode() { Code = "API-ERR-301008", Description = "Credit amount should not be greater than due amount." };
        public static readonly ExceptionCode CreditsSpendCreditsCreditsDisabled = new ExceptionCode() { Code = "API-ERR-301009", Description = "Credit service is not available." };
        public static readonly ExceptionCode CreditsSpendCreditsFullyPaid = new ExceptionCode() { Code = "API-ERR-301010", Description = "Booking is fully paid." };
        public static readonly ExceptionCode CreditsNotEnoughCredits = new ExceptionCode() { Code = "API-ERR-301011", Description = "User has not enough credits on the balance." };
        public static readonly ExceptionCode CreditsSpendCredits = new ExceptionCode() { Code = "API-ERR-30101112", Description = "Failed to redeem credits." };

        public static readonly ExceptionCode CreditsTransferNoCustomer = new ExceptionCode() { Code = "API-ERR-30101113", Description = "Can not get customer." };
        public static readonly ExceptionCode CreditsTransferNoVouchersSubset = new ExceptionCode() { Code = "API-ERR-30101114", Description = "No credits subset for requested amount." };
        public static readonly ExceptionCode CreditsTransferNoVouchers = new ExceptionCode() { Code = "API-ERR-30101115", Description = "No vouchers to transfer." };
        public static readonly ExceptionCode InvalidReasonValue = new ExceptionCode() { Code = "API-ERR-30101116", Description = "Invalid value for reason. Should be one of the following: refund, goodwill, or incentive" };


        public static readonly ExceptionCode DiscountFailedToRollBackRedemption = new ExceptionCode() { Code = "API-ERR-301006", Description = "Failed to rollback discount redemption." };

        public static readonly ExceptionCode PaymentError = new ExceptionCode() { Code = "API-ERR-600000", Description = "Can not pay for the booking" };
        /// <summary>
        /// Exception code used in case of failed payment authorisation.
        /// </summary>
        public static readonly ExceptionCode PaymentAuthorisationError = new ExceptionCode() { Code = "API-ERR-600001", Description = "Can not Authorise payment" };
        public static readonly ExceptionCode RefundError = new ExceptionCode() { Code = "API-ERR-600010", Description = "Can not refund booking" };
        public static readonly ExceptionCode PaymentWithCreditsNonLeadPaxError = new ExceptionCode() { Code = "API-ERR-600020", Description = "Payment by credits is not allowed for not lead pax of the booking." };
        /// <summary>
        /// Exception code used in case of failed Apple Pay session creation.
        /// </summary>
        public static readonly ExceptionCode ApplePaySessionError = new ExceptionCode() { Code = "API-ERR-600030", Description = "Can not create Apple Pay session object" };
        public static readonly ExceptionCode DestinationsSearchError = new ExceptionCode() { Code = "API-ERR-700000", Description = "Destination items are not available" };
        public static readonly ExceptionCode DestinationsImageError = new ExceptionCode() { Code = "API-ERR-700001", Description = "Location image is not available" };
        public static readonly ExceptionCode DestinationsTitlesError = new ExceptionCode() { Code = "API-ERR-700002", Description = "Destination titles are not available" };
        public static readonly ExceptionCode DestinationsCodeError = new ExceptionCode() { Code = "API-ERR-700003", Description = "Can not get destination code by destination name" };
        public static readonly ExceptionCode PromoDestinationsCodeError = new ExceptionCode() { Code = "API-ERR-700003", Description = "Can not get destinations for promo" };
        public static readonly ExceptionCode ExcursionMapError = new ExceptionCode() { Code = "API-ERR-700004", Description = "Can not get excursion map for the destination" };
        public static readonly ExceptionCode ExcursionMapCoordinatesError = new ExceptionCode() { Code = "API-ERR-700005", Description = "Can not get coordinates for the destination" };
        public static readonly ExceptionCode MusementAuthError = new ExceptionCode() { Code = "API-ERR-700006", Description = "Can not authorize in musement service" };

        /// <summary>
        /// Exception code generated in case of failed CMS Destination Info request.
        /// </summary>
        public static readonly ExceptionCode DestinationInfoError = new ExceptionCode() { Code = "API-ERR-700007", Description = "Can not get destination info by destination code" };

        public static readonly ExceptionCode SearchBoardsError = new ExceptionCode() { Code = "API-ERR-800000", Description = "Board Types data is not available" };

        public static readonly ExceptionCode SearchFacilitiesError = new ExceptionCode() { Code = "API-ERR-810000", Description = "Facilities data is not available" };
        public static readonly ExceptionCode FlightFiltersError = new ExceptionCode() { Code = "API-ERR-820000", Description = "Flight filters data is not available" };

        public static readonly ExceptionCode AirportsReferenceDataError = new ExceptionCode() { Code = "API-ERR-900000", Description = "Airports reference data is not available" };
        public static readonly ExceptionCode CountriesReferenceDataError = new ExceptionCode() { Code = "API-ERR-900001", Description = "Countries reference data is not available" };
        public static readonly ExceptionCode DialingCodesReferenceDataError = new ExceptionCode() { Code = "API-ERR-900002", Description = "Dialing codes reference data is not available" };
        public static readonly ExceptionCode BoardTypesReferenceDataError = new ExceptionCode() { Code = "API-ERR-900003", Description = "Board types reference data is not available" };
        public static readonly ExceptionCode RoomTypesReferenceDataError = new ExceptionCode() { Code = "API-ERR-900004", Description = "Room types reference data is not available" };
        public static readonly ExceptionCode FilteredFacilitiesReferenceDataError = new ExceptionCode() { Code = "API-ERR-900005", Description = "Filter facilities reference data is not available" };
        public static readonly ExceptionCode PackageThemesReferenceDataError = new ExceptionCode() { Code = "API-ERR-900006", Description = "Package themes are not available" };
        public static readonly ExceptionCode TransfersReferenceDataError = new ExceptionCode() { Code = "API-ERR-900007", Description = "Transfer reference data is not available" };
        public static readonly ExceptionCode SiteFilterSettingsNotAvailable = new ExceptionCode() { Code = "API-ERR-900008", Description = "Site settings for the filters are not available" };
        public static readonly ExceptionCode SpecialRequestsReferenceDataError = new ExceptionCode() { Code = "API-ERR-900009", Description = "Special Requests are not available" };
        public static readonly ExceptionCode HotelCodesReferenceDataError = new ExceptionCode() { Code = "API-ERR-900010", Description = "Hotel codes are not available" };
        public static readonly ExceptionCode AccommodationCodeToGiataError = new ExceptionCode() { Code = "API-ERR-900011", Description = "Cannot get Accommodation code to Giata code mapping" };
        /// <summary>
        /// Luggage data is not available exception code.
        /// </summary>
        public static readonly ExceptionCode LuggageDataError = new ExceptionCode() { Code = "API-ERR-9000012", Description = "Luggage data is not available" };

        public static readonly ExceptionCode SettingsError = new ExceptionCode() { Code = "API-ERR-900500", Description = "Settings are not available" };
        public static readonly ExceptionCode CancelAndCreditSettingsError = new ExceptionCode() { Code = "API-ERR-900501", Description = "Cancel and credit settings are not available" };

        public static readonly ExceptionCode GetHealthEntryRequirementsError = new ExceptionCode() { Code = "API-ERR-900502", Description = "Could not get health entry requirements." };
        public static readonly ExceptionCode GetAllDestinationRecommendationError = new ExceptionCode() { Code = "API-ERR-900503", Description = "Could not get destination recommendation." };
        /// <summary>
        /// Trade agent feedback attached file settings are not available exception code.
        /// </summary>
        public static readonly ExceptionCode TradeAgentFeedbackAttachedFileSettingsError = new ExceptionCode() { Code = "API-ERR-900504", Description = "Trade agent feedback attached file settings are not available" };

        // Authentication and Authorization
        public static readonly ExceptionCode AuthCustomerLoginError = new ExceptionCode() { Code = "API-ERR-1000001", Description = "Failed to login" };
        public static readonly ExceptionCode AuthCustomerDetailsError = new ExceptionCode() { Code = "API-ERR-1000002", Description = "Not authorized" };
        public static readonly ExceptionCode AuthCustomerregistrationError = new ExceptionCode() { Code = "API-ERR-1000003", Description = "Can not register customer" };
        public static readonly ExceptionCode AuthCustomerCountriesError = new ExceptionCode() { Code = "API-ERR-1000004", Description = "Failed to get countries info" };
        public static readonly ExceptionCode AuthCustomerIsLocked = new ExceptionCode() { Code = "API-ERR-1000005", Description = "Customer email is locked" };
        public static readonly ExceptionCode AuthAgentLoginError = new ExceptionCode() { Code = "API-ERR-1000006", Description = "Failed to login" };
        public static readonly ExceptionCode AuthTradeAgentNameIsLocked = new ExceptionCode() { Code = "API-ERR-1000007", Description = "Trade agent name is locked" };
        public static readonly ExceptionCode FailedToRetrieveAccessToken = new ExceptionCode() { Code = "API-ERR-1000008", Description = "Failed to retrieve access token" };
        public static readonly ExceptionCode AccessTokenResponseHasErrors = new ExceptionCode() { Code = "API-ERR-1000009", Description = "Access token response contains errors" };
        public static readonly ExceptionCode RedHatApiCallFailed = new ExceptionCode() { Code = "API-ERR-1000011", Description = "Red Hat API call failed" };


        public static readonly ExceptionCode ItemSearchRequestError = new ExceptionCode() { Code = "API-ERR-1100000", Description = "Items are not available" };
        public static readonly ExceptionCode FlightExtraSearchRequestError = new ExceptionCode() { Code = "API-ERR-1110000", Description = "Flight extra search failed" };

        public static readonly ExceptionCode DfloDocumentsSearchError = new ExceptionCode() { Code = "API-ERR-1200000", Description = "Can not find documents by reference" };
        public static readonly ExceptionCode DfloGetDocumentsError = new ExceptionCode() { Code = "API-ERR-1200000", Description = "Can not get booking confirmation" };
        public static readonly ExceptionCode TripAdvisorLocationError = new ExceptionCode() { Code = "API-ERR-1300000", Description = "Can not get location details" };

        public static readonly ExceptionCode HotelsCodesSearchError = new ExceptionCode() { Code = "API-ERR-1600000", Description = "Can not get hotels codes" };
        public static readonly ExceptionCode HotelResortInfoCodeError = new ExceptionCode() { Code = "API-ERR-1600001", Description = "Can not get hotel's resort info by hotel code" };

        public static readonly ExceptionCode FeaturedFacilitiesCodeError = new ExceptionCode() { Code = "API-ERR-1600002", Description = "Can not get featured facilities by hotel code" };
        /// <summary>
        /// Hotel Highlights Error.
        /// </summary>
        public static readonly ExceptionCode HotelHighlightsError = new ExceptionCode() { Code = "API-ERR-1600003", Description = "Can not get hotel's highlights by hotel code" };

        public static readonly ExceptionCode MediaCenterArticleError = new ExceptionCode() { Code = "API-ERR-1400000", Description = "Can not get media center articles" };
        public static readonly ExceptionCode MediaCenterTopicsError = new ExceptionCode() { Code = "API-ERR-1400001", Description = "Can not get media center topics" };

        public static readonly ExceptionCode VoucherCustomerGet = new ExceptionCode() { Code = "API-ERR-1500001", Description = "Can not get voucher customer" };
        public static readonly ExceptionCode VoucherCustomerCreate = new ExceptionCode() { Code = "API-ERR-1500002", Description = "Can not create voucher customer" };
        public static readonly ExceptionCode VoucherGet = new ExceptionCode() { Code = "API-ERR-1500003", Description = "Can not get voucher" };
        public static readonly ExceptionCode VoucherCreate = new ExceptionCode() { Code = "API-ERR-1500004", Description = "Can not create voucher" };
        public static readonly ExceptionCode VoucherPublish = new ExceptionCode() { Code = "API-ERR-1500005", Description = "Can not publish voucher" };
        public static readonly ExceptionCode VoucherDelete = new ExceptionCode() { Code = "API-ERR-1500006", Description = "Can not delete voucher" };
        public static readonly ExceptionCode VoucherCustomersGet = new ExceptionCode() { Code = "API-ERR-1500007", Description = "Can not get voucher customers" };
        public static readonly ExceptionCode VoucherCustomersGetById = new ExceptionCode() { Code = "API-ERR-1500008", Description = "Can not get customer by id" };
        public static readonly ExceptionCode VoucherCustomerByEmail = new ExceptionCode() { Code = "API-ERR-1500009", Description = "Can not get voucher customer by email" };
        public static readonly ExceptionCode VoucherUpdate = new ExceptionCode() { Code = "API-ERR-1500010", Description = "Can not update voucher" };
        public static readonly ExceptionCode VoucherAddBalance = new ExceptionCode() { Code = "API-ERR-1500011", Description = "Can not add voucher balance" };
        public static readonly ExceptionCode VouchersDisabled = new ExceptionCode() { Code = "API-ERR-1500012", Description = "Vouchers functionality disabled" };
        public static readonly ExceptionCode FailedRedeemVoucher = new ExceptionCode() { Code = "API-ERR-1500013", Description = "Failed to redeem voucher" };

        public static readonly ExceptionCode VoucherFailedToGetFromCache = new ExceptionCode() { Code = "API-ERR-1500100", Description = "Failed to get credits from cache" };
        public static readonly ExceptionCode VoucherFailedToClearCache = new ExceptionCode() { Code = "API-ERR-1500101", Description = "Failed to clear cache" };

        public static readonly ExceptionCode FailedToLoadOffersPromotions = new ExceptionCode() { Code = "API-ERR-1500200", Description = "Failed To Load Offers Promotions" };

        /// <summary>
        /// Exception code generated in case of failed Discount Voucher validation
        /// </summary>
        public static readonly ExceptionCode VoucherInvalid = new ExceptionCode() { Code = "API-ERR-1500007", Description = "Can not validate voucher" };

        /// <summary>
        /// Exception code generated in case of failed Discount Voucher was not found
        /// </summary>
        public static readonly ExceptionCode VoucherNotFound = new ExceptionCode() { Code = "API-ERR-1500008", Description = "Voucher was not found" };
        /// <summary>
        /// Exception code generated in case of failed Discount Voucher was already fully redeemed
        /// </summary>
        public static readonly ExceptionCode VoucherExceeded = new ExceptionCode() { Code = "API-ERR-1500009", Description = "Voucher amount exceeded" };
        public static readonly ExceptionCode VoucherNotActiveOrExpired = new ExceptionCode() { Code = "API-ERR-1500010", Description = "The voucher has already expired or is not active" };
        public static readonly ExceptionCode VoucherRedeemedAlready = new ExceptionCode() { Code = "API-ERR-1500011", Description = "The voucher has been already redeemed" };
        public static readonly ExceptionCode VoucherRedeemedAlreadyByYou = new ExceptionCode() { Code = "API-ERR-1500012", Description = "The voucher has been already redeemed by you" };

        /// <summary>
        /// Exception code generated in case of failed Promotion code was not found.
        /// </summary>
        public static readonly ExceptionCode PromotionIsNotValid = new ExceptionCode() { Code = "API-ERR-1500200", Description = "Promotion is not valid" };


        public static readonly ExceptionCode ShortListFailedToGet = new ExceptionCode() { Code = "API-ERR-1700000", Description = "Failed to get user shortlist from dynamoDB" };
        public static readonly ExceptionCode ShortListFailedToUpdate = new ExceptionCode() { Code = "API-ERR-1700001", Description = "Failed to update user shortlist from dynamoDB" };

        public static readonly ExceptionCode LivePriceGet = new ExceptionCode() { Code = "API-ERR-1800001", Description = "Failed to get live price" };
        public static readonly ExceptionCode LivePriceSearchesGet = new ExceptionCode() { Code = "API-ERR-1800002", Description = "Failed to get live price searches" };

        public static readonly ExceptionCode PricePromiseCantCreate = new ExceptionCode() { Code = "API-ERR-1900001", Description = "Failed to create price promise request" };
        public static readonly ExceptionCode PricePromiseCantSendNotification = new ExceptionCode() { Code = "API-ERR-1900002", Description = "Failed to create price promise notification request" };
        public static readonly ExceptionCode PricePromiseToBigFileOraLotFiles = new ExceptionCode() { Code = "API-ERR-1900003", Description = "Invalid number of files or one of the files are to big" };
        public static readonly ExceptionCode PricePromiseMissingABTA = new ExceptionCode() { Code = "API-ERR-1900004", Description = "Different company with ABTA answer not provided" };


        public static readonly ExceptionCode CallCentreUserNotFound = new ExceptionCode() { Code = "API-ERR-2100000", Description = "Customer not found." };
        public static readonly ExceptionCode CallCentreSpendCredits = new ExceptionCode() { Code = "API-ERR-2100001", Description = "Failed to redeem credits from user account." };
        public static readonly ExceptionCode CallCentreSpendCreditsPriceNegative = new ExceptionCode() { Code = "API-ERR-2100002", Description = "Credit amount should be greater than 0." };
        public static readonly ExceptionCode CallCentreSpendCreditsInvalidPrice = new ExceptionCode() { Code = "API-ERR-2100003", Description = "Credit amount should not be greater than due amount." };
        public static readonly ExceptionCode CallCentreSpendCreditsCreditsDisabled = new ExceptionCode() { Code = "API-ERR-2100004", Description = "Credit service is not available." };
        public static readonly ExceptionCode CallCentreSpendCreditsFullyPaid = new ExceptionCode() { Code = "API-ERR-2100005", Description = "Booking is fully paid." };
        public static readonly ExceptionCode CallCentreNotEnoughCredits = new ExceptionCode() { Code = "API-ERR-2100006", Description = "User has not enough credits on the balance." };
        public static readonly ExceptionCode CallCentreCurrencyNotMatching = new ExceptionCode() { Code = "API-ERR-2100007", Description = "Credit currency does not match user balance currency." };

        public static readonly ExceptionCode AccommodationErrataInfoGet = new ExceptionCode() { Code = "API-ERR-2200000", Description = "Failed to get accommodation errata info for hotel" };

        public static readonly ExceptionCode SpecialRequestAmmendError = new ExceptionCode() { Code = "API-ERR-230000", Description = "Failed to amend ssr." };
        public static readonly ExceptionCode SSRAmmendNotAllowedForHBG = new ExceptionCode() { Code = "API-ERR-230001", Description = "Amend ssr does not allowed for HBG." };
        public static readonly ExceptionCode SSRAmendNotAllowedForDC = new ExceptionCode() { Code = "API-ERR-230002", Description = "Amend ssr does not allowed for DC." };
        public static readonly ExceptionCode SSRAmendIsDisabled = new ExceptionCode() { Code = "API-ERR-230003", Description = "Amend ssr is disabled." };
        public static readonly ExceptionCode SSRAmendDepartureDate = new ExceptionCode() { Code = "API-ERR-230004", Description = "Amend ssr is allowed only before departure date." };
        public static readonly ExceptionCode SSRAmendAllowedOnyForActiveBookings = new ExceptionCode() { Code = "API-ERR-230005", Description = "Amend ssr is allowed only for active bookings." };
        public static readonly ExceptionCode SSRAddNotAllowedForHBG = new ExceptionCode() { Code = "API-ERR-230006", Description = "Adding ssr is not allowed for HBG." };
        public static readonly ExceptionCode SSRAddNotAllowedForDC = new ExceptionCode() { Code = "API-ERR-230007", Description = "Adding ssr is not allowed for DC." };
        public static readonly ExceptionCode SSRAddIsDisabled = new ExceptionCode() { Code = "API-ERR-230008", Description = "Adding ssr is disabled." };
        public static readonly ExceptionCode AmendSpecialRequestDisabledByChangeCountLimit = new ExceptionCode() { Code = "API-ERR-230009", Description = "You have updated special request the allowed number of times" };
        public static readonly ExceptionCode AmendMemoDisabled = new ExceptionCode() { Code = "API-ERR-230010", Description = "Amend MEMO is disabled." };
        public static readonly ExceptionCode SSRAmendIsDisabledOnSiteForDIHotels = new ExceptionCode() { Code = "API-ERR-230011", Description = "Adding ssr is not allowed for DI Hotels." };

        //amend booking
        public static readonly ExceptionCode AmendBookingRoutes = new ExceptionCode() { Code = "API-ERR-240001", Description = "Routes modification prohibited" };
        public static readonly ExceptionCode AmendBookingTransfers = new ExceptionCode() { Code = "API-ERR-240002", Description = "Transfers modification prohibited" };
        public static readonly ExceptionCode DowngradeBookingTransfers = new ExceptionCode() { Code = "API-ERR-240003", Description = "Transfers downgrade prohibited" };
        public static readonly ExceptionCode AmendBookingPax = new ExceptionCode() { Code = "API-ERR-240004", Description = "Pax modification prohibited" };
        public static readonly ExceptionCode AmendBookingPaxName = new ExceptionCode() { Code = "API-ERR-240005", Description = "Pax name modification prohibited" };
        public static readonly ExceptionCode AmendBookingMemoUnknowOperation = new ExceptionCode() { Code = "API-ERR-240006", Description = "Can not find memo for this operation" };
        public static readonly ExceptionCode AmendBookingSeats = new ExceptionCode() { Code = "API-ERR-240007", Description = "Seats modification prohibited" };
        public static readonly ExceptionCode AmendPaxNameLimitRestriction = new ExceptionCode() { Code = "API-ERR-240008", Description = "Can not change pax name more." };
        public static readonly ExceptionCode AmendPaxNameDigitCountRestriction = new ExceptionCode() { Code = "API-ERR-240009", Description = "Can not change more than 3 digits." };
        public static readonly ExceptionCode AmendPaxNameLeadRestriction = new ExceptionCode() { Code = "API-ERR-240010", Description = "Can not change lead pax name." };
        public static readonly ExceptionCode AmendBookingSeatsUnavailable = new ExceptionCode() { Code = "API-ERR-240011", Description = "Seats unavailable" };
        public static readonly ExceptionCode AmendBookingSeatsPriceChanged = new ExceptionCode() { Code = "API-ERR-240012", Description = "Seats price changed" };
        public static readonly ExceptionCode AmendTradePortalBookingNotATradeAgent = new ExceptionCode() { Code = "API-ERR-240013", Description = "Only trade agents can amend Trade Portal bookings" };

        public static readonly ExceptionCode GetSeatsPlanError = new ExceptionCode() { Code = "API-ERR-2400001", Description = "Failed to get seat plan" };

        public static readonly ExceptionCode GetAvailableDatesSummaryInformation = new ExceptionCode { Code = "API-ERR-240014", Description = "Failed to search available packages for selected dates." };
        public static readonly ExceptionCode AmendBookingDatesLimit = new ExceptionCode { Code = "API-ERR-240015", Description = "Date modification prohibited." };

        public static readonly ExceptionCode AmendRoomSearchError = new ExceptionCode { Code = "API-ERR-240016", Description = "Can not find available room and board." };
        public static readonly ExceptionCode AmendRoomLimit = new ExceptionCode { Code = "API-ERR-240017", Description = "Room or board modification prohibited." };

        public static readonly ExceptionCode CancelBookingTimeRestriction = new ExceptionCode { Code = "API-ERR-240020", Description = "Booking cannot be canceled because of time restriction settings." };

        /// <summary>
        /// Exception code generated in case of no alternative hotels in Atcom
        /// </summary>
        public static readonly ExceptionCode NoAlernativeHotelsInAtcom = new ExceptionCode { Code = "API-ERR-240021", Description = "There are no alternative hotels in Atcom." };
        /// <summary>
        /// Exception code generated in case hotel amendment is not possible
        /// </summary>
        public static readonly ExceptionCode AmendHotelRestriction = new ExceptionCode { Code = "API-ERR-240022", Description = "Can not amend hotel." };
        /// <summary>
        /// Exception code generated in case alternative hotel cannot be validated
        /// </summary>
        public static readonly ExceptionCode CanNotValidateAlternativeHotel = new ExceptionCode { Code = "API-ERR-240023", Description = "Cannot validate alternative hotel." };

        
        //marketing errors
        public static readonly ExceptionCode GetMarketingPreferencesError = new ExceptionCode() { Code = "API-ERR-2500001", Description = "Can not get customer marketing preferences" };
        public static readonly ExceptionCode GetMarketingPreferencesValidateError = new ExceptionCode() { Code = "API-ERR-2500002", Description = "Customer email does not match the booking email" };
        public static readonly ExceptionCode MarketingUnsubscribeError = new ExceptionCode() { Code = "API-ERR-2500003", Description = "Failed to unsubscribe" };
        public static readonly ExceptionCode MarketingAddToVerifyError = new ExceptionCode() { Code = "API-ERR-2500004", Description = "Failed to add email addresses for verification" };
        public static readonly ExceptionCode GetMarketingPreferencesTradeBookingsError = new ExceptionCode() { Code = "API-ERR-2500001", Description = "CSAT is disabled for trade bookings" };
        public static readonly ExceptionCode DecryptEmailError = new ExceptionCode() { Code = "API-ERR-2500005", Description = "Failed to decrypt email address." };


        // musement errors
        public static readonly ExceptionCode GetActivitiesError = new ExceptionCode() { Code = "API-ERR-2600001", Description = "Failed to get musement activities" };
        public static readonly ExceptionCode GetCitiesError = new ExceptionCode() { Code = "API-ERR-2600002", Description = "Failed to get musement cities by coordinates" };

        //helper-center errors
        public static readonly ExceptionCode FaqSaveError = new ExceptionCode() { Code = "API-ERR-2700001", Description = "Failed to save faq in storage" };
        public static readonly ExceptionCode FeedbackSaveError = new ExceptionCode() { Code = "API-ERR-2700002", Description = "Failed to save feedback in storage" };

        // xconnect analytics services errors
        /// <summary>
        /// Failed to track customer log in exception code.
        /// </summary>
        public static readonly ExceptionCode TrackCustomerLogInError = new ExceptionCode() { Code = "API-ERR-2800001", Description = "Failed to track customer log in" };

        // xconnect standalone tracker api services errors
        /// <summary>
        /// Tracker settings api key not found exception code.
        /// </summary>
        public static readonly ExceptionCode TrackerSettingsApiKeyNotFoundError = new ExceptionCode() { Code = "API-ERR-2900000", Description = "Tracker authentication api key not found" };
        /// <summary>
        /// Tracker update marketing preferences error exception code.
        /// </summary>
        public static readonly ExceptionCode TrackerUpdateMarketingPreferencesError = new ExceptionCode() { Code = "API-ERR-2900001", Description = "Failed to update customer marketing preferences" };
        /// <summary>
        /// Tracker update communication preferences error exception code.
        /// </summary>
        public static readonly ExceptionCode TrackerUpdateCommunicationPreferencesError = new ExceptionCode() { Code = "API-ERR-2900002", Description = "Failed to update customer communication preferences" };

        // AWS
        public static readonly ExceptionCode GenericSQSError = new ExceptionCode() { Code = "API-ERR-3000000", Description = "Failed to send message to queue" };
        public static readonly ExceptionCode GenericSESError = new ExceptionCode() { Code = "API-ERR-3000001", Description = "Failed to send email" };

        // Trade Agent
        public static readonly ExceptionCode AgentValidationInternalError = new ExceptionCode() { Code = "API-ERR-3100001", Description = "Can not validate agent, internal server error" };
        public static readonly ExceptionCode AgentValidationError = new ExceptionCode() { Code = "API-ERR-3100001", Description = "Failed to validate agent" };

        //Contact Us
        public static readonly ExceptionCode CreateCaseSubmissionError = new ExceptionCode() { Code = "API-ERR-3200000", Description = "Error while submitting case." };
        
        
        //Transfer Management Platform
        /// <summary>
        /// Exception code generated in case of failed request to get transfer details from Transfer Management Platform.
        /// </summary>
        public static readonly ExceptionCode TransferManagementPlatformTransferDetailsGet = new ExceptionCode() { Code = "API-ERR-3300001", Description = "Can not get transfer details" };

        // Feefo
        /// <summary>
        /// error code for auth failures in feefo auth
        /// </summary>
        public static readonly ExceptionCode FeefoAuthError = new ExceptionCode() { Code = "API-ERR-3400001", Description = "Feefo auth failed" };
    }
}
