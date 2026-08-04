using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    public enum AmendBookingStatus
    {
        [EnumMember(Value = "amendFlightsDisabledByTimeBound")]
        AmendFlightsDisabledByTimeBound,

        [EnumMember(Value = "amendFlightsDisabledOnSite")]
        AmendFlightsDisabledOnSite,

        [EnumMember(Value = "amendFlightsDisabled")]
        AmendFlightsDisabledByAtcom,

        /// <summary>
        /// Amend flights disabled by booking with airport parking
        /// </summary>
        [EnumMember(Value = "amendFlightsDisabledByAirportParking")]
        AmendFlightsDisabledByAirportParking,

        [EnumMember(Value = "amendTransfersDisabledByTimeBound")]
        AmendTransfersDisabledByTimeBound,

        [EnumMember(Value = "amendTransfersDisabledOnSite")]
        AmendTransfersDisabledOnSite,

        [EnumMember(Value = "amendTransfersDisabled")]
        AmendTransfersDisabledByAtcom,

        /// <summary>
        /// Amend transfers disabled for booking with sport equipment
        /// </summary>
        [EnumMember(Value = "amendTransfersDisabledBySportEquipment")]
        AmendTransfersDisabledBySportEquipment,

        [EnumMember(Value = "downgradeTransfersDisabled")]
        DowngradeTransfersDisabledByAtcom,

        [EnumMember(Value = "notLoggedAsBookingLeadPassenger")]
        NotLoggedAsBookingLeadPassenger,

        [EnumMember(Value = "notLoggedAsTradeAgent")]
        NotLoggedAsTradeAgent,

        [EnumMember(Value = "amendTransfersDisabledAsMultipleFlightsPackage")]
        AmendTransfersDisabledAsMultipleFlightsPackage,

        [EnumMember(Value = "amendFlightsDisabledAsMultipleFlightsPackage")]
        AmendFlightsDisabledAsMultipleFlightsPackage,

        [EnumMember(Value = "sSRAmendDepartureDate")]
        SSRAmendDepartureDate,

        [EnumMember(Value = "amendSpecialRequestDisabledByChangeCountLimit")]
        AmendSpecialRequestDisabledByChangeCountLimit,

        [EnumMember(Value = "amendMemoDisabled")]
        AmendMemoDisabled,

        [EnumMember(Value = "sSRAmmendNotAllowedForHBG")]
        SSRAmmendNotAllowedForHBG,

        [EnumMember(Value = "sSRAmendNotAllowedForDC")]
        SSRAmendNotAllowedForDC,

        [EnumMember(Value = "sSRAmendAllowedOnyForActiveBookings")]
        SSRAmendAllowedOnyForActiveBookings,

        [EnumMember(Value = "sSRAmendIsDisabled")]
        SSRAmendIsDisabled,

        [EnumMember(Value = "amendFlightDisabledByChangeCountLimit")]
        AmendFlightDisabledByChangeCountLimit,

        [EnumMember(Value = "amendTransferDisabledByChangeCountLimit")]
        AmendTransferDisabledByChangeCountLimit,

        [EnumMember(Value = "amendSeatsDisabledOnSite")]
        AmendSeatsDisabledOnSite,

        [EnumMember(Value = "amendSeatsDisabled")]
        AmendSeatsDisabledByAtcom,

        [EnumMember(Value = "amendPassengerDisabledOnSite")]
        AmendPassengerDisabledOnSite,

        [EnumMember(Value = "amendPassengerDisabledByAtcom")]
        AmendPassengerDisabledByAtcom,

        /// <summary>
        /// Amend passenger disabled by booking with airport parking
        /// </summary>
        [EnumMember(Value = "amendPassengerDisabledByAirportParking")]
        AmendPassengerDisabledByAirportParking,

        [EnumMember(Value = "sSRAmendIsDisabledOnSiteForDIHotels")]
        SSRAmendIsDisabledOnSiteForDIHotels,

        [EnumMember(Value = "amendPassengerDisabledOnSiteForDIHotels")]
        AmendPassengerDisabledOnSiteForDIHotels,

        [EnumMember(Value = "amendPassengerDisabledByInventoryError")]
        AmendPassengerDisabledByInventoryError,

        [EnumMember(Value = "amendPassengerDisabledByTimeBound")]
        AmendPassengersDisabledByTimeBound,

        [EnumMember(Value = "changeDateDisabledByTimeBound")]
        ChangeDateDisabledByTimeBound,

        [EnumMember(Value = "changeDateDisabledBySitecore")]
        ChangeDateDisabledBySitecore,

        [EnumMember(Value = "changeDateDisabledBySitecoreForDCHotels")]
        ChangeDateDisabledBySitecoreForDCHotels,

        [EnumMember(Value = "changeDateDisabledByChangeCountLimit")]
        ChangeDateDisabledByChangeCountLimit,

        [EnumMember(Value = "changeDateDisabledByAtcom")]
        ChangeDateDisableByAtcom,

        /// <summary>
        /// Change date disabled for booking with sport equipment
        /// </summary>
        [EnumMember(Value = "changeDateDisabledBySportEquipment")]
        ChangeDateDisabledBySportEquipment,

        /// <summary>
        /// Change date disabled by booking with airport parking
        /// </summary>
        [EnumMember(Value = "changeDateDisabledByAirportParking")]
        ChangeDateDisabledByAirportParking,

        [EnumMember(Value = "amendPassengerDisabledByFlightDisruption")]
        AmendPassengerDisabledByFlightDisruption,

        [EnumMember(Value = "amendSeatsDisabledByFlightDisruption")]
        AmendSeatsDisabledByFlightDisruption,

        [EnumMember(Value = "amendFlightsDisabledByFlightDisruption")]
        AmendFlightsDisabledByFlightDisruption,

        [EnumMember(Value = "changeDateDisabledByFlightDisruption")]
        ChangeDateDisabledByFlightDisruption,

        [EnumMember(Value = "amendDateDisabledByOutOfSync")]
        AmendDateDisabledByOutOfSync,

        [EnumMember(Value = "amendFlightsDisabledByOutOfSync")]
        AmendFlightsDisabledByOutOfSync,

        [EnumMember(Value = "amendPassengerDisabledByOutOfSync")]
        AmendPassengerDisabledByOutOfSync,

        [EnumMember(Value = "amendRoomAndBoardDisabledByFlightDisruption")]
        AmendRoomAndBoardDisabledByFlightDisruption,

        [EnumMember(Value = "amendRoomAndBoardDisabledByAtcom")]
        AmendRoomAndBoardDisabledByAtcom,

        [EnumMember(Value = "amendRoomAndBoardDisabledOnSite")]
        AmendRoomAndBoardDisabledOnSite,

        [EnumMember(Value = "amendRoomAndBoardDisabledByTimeBound")]
        AmendRoomAndBoardDisabledByTimeBound,

        [EnumMember(Value = "amendRoomAndBoardDisabledByHavingMultipleRooms")]
        AmendRoomAndBoardDisabledByHavingMultipleRooms,

        [EnumMember(Value = "amendRoomAndBoardDisabledByChangeCountLimit")]
        AmendRoomAndBoardDisabledByChangeCountLimit,

        /// <summary>
        /// Cancellation disabled by time bound
        /// </summary>
        [EnumMember(Value = "cancellationDisabledByTimeBound")]
        CancellationDisabledByTimeBound,

        /// <summary>
        /// Change hotel disabled in ATCOM
        /// </summary>
        [EnumMember(Value = "amendHotelDisabledByAtcom")]
        AmendHotelDisabledByAtcom,

        /// <summary>
        /// Change hotel disabled in Sitecore
        /// </summary>
        [EnumMember(Value = "amendHotelDisabledOnSite")]
        AmendHotelDisabledOnSite,

        /// <summary>
        /// Change hotel disabled because outbound flight departs too soon
        /// </summary>
        [EnumMember(Value = "amendHotelDisabledByTimeBound")]
        AmendHotelDisabledByTimeBound,

        /// <summary>
        /// Change hotel disabled because booking has multiple rooms
        /// </summary>
        [EnumMember(Value = "amendHotelDisabledByHavingMultipleRooms")]
        AmendHotelDisabledByHavingMultipleRooms,

        /// <summary>
        /// Change hotel disabled for booking with sport equipment
        /// </summary>
        [EnumMember(Value = "amendHotelDisabledBySportEquipment")]
        AmendHotelDisabledBySportEquipment,

        /// <summary>
        /// Change hotel disabled because of reaching limit on how many times a hotel can be changed
        /// </summary>
        [EnumMember(Value = "amendHotelDisabledByChangeCountLimit")]
        AmendHotelDisabledByChangeCountLimit,
    }
}