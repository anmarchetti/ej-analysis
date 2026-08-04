export enum AmendBookingStatus {
    // Global
    NotLoggedAsBookingLeadPassenger = 'notLoggedAsBookingLeadPassenger',
    // Flights
    AmendFlightsDisabled = 'amendFlightsDisabled',
    AmendFlightsDisabledByTimeBound = 'amendFlightsDisabledByTimeBound',
    AmendFlightsDisabledManifestedFlights = 'amendFlightsDisabledManifestedFlights',
    AmendFlightsDisabledOnSite = 'amendFlightsDisabledOnSite',
    AmendFlightsDisabledSeriesFlights = 'amendFlightsDisabledSeriesFlights',
    AmendFlightsDisabledByFlightDisruption = 'amendFlightsDisabledByFlightDisruption',
    AmendFlightsDisabledByOutOfSync = 'amendFlightsDisabledByOutOfSync',
    AmendFlightsDisabledByAirportParking = 'amendFlightsDisabledByAirportParking',
    // Transfer
    AmendTransfersDisabled = 'amendTransfersDisabled',
    AmendTransfersDisabledByTimeBound = 'amendTransfersDisabledByTimeBound',
    AmendTransfersDisabledOnSite = 'amendTransfersDisabledOnSite',
    DowngradeTransfersDisabled = 'downgradeTransfersDisabled',
    // Seats
    AmendSeatsDisabled = 'amendSeatsDisabled',
    AmendSeatsDisabledOnSite = 'amendSeatsDisabledOnSite',
    AmendSeatsDisabledByFlightDisruption = 'amendSeatsDisabledByFlightDisruption',
    // Passengers
    AmendPassengerDisabledOnSite = 'amendPassengerDisabledOnSite',
    AmendPassengerDisabledOnSiteForDIHotels = 'amendPassengerDisabledOnSiteForDIHotels',
    AmendPassengerDisabledByAtcom = 'amendPassengerDisabledByAtcom',
    AmendPassengerDisabledByTimeBound = 'amendPassengerDisabledByTimeBound',
    AmendPassengerDisabledByFlightDisruption = 'amendPassengerDisabledByFlightDisruption',
    AmendPassengerDisabledByInventoryError = 'amendPassengerDisabledByInventoryError',
    AmendPassengerDisabledByOutOfSync = 'amendPassengerDisabledByOutOfSync',
    AmendPassengerDisabledByAirportParking = 'amendPassengerDisabledByAirportParking',
    // Dates
    ChangeDateDisabledByTimeBound = 'changeDateDisabledByTimeBound',
    ChangeDateDisabledBySitecore = 'changeDateDisabledBySitecore',
    ChangeDateDisabledBySitecoreForDCHotels = 'changeDateDisabledBySitecoreForDCHotels',
    ChangeDateDisabledByChangeCountLimit = 'changeDateDisabledByChangeCountLimit',
    ChangeDateDisabledByAtcom = 'changeDateDisabledByAtcom',
    ChangeDateDisabledByFlightDisruption = 'changeDateDisabledByFlightDisruption',
    AmendDateDisabledByOutOfSync = 'amendDateDisabledByOutOfSync',
    ChangeDateDisabledByAirportParking = 'changeDateDisabledByAirportParking',
    // Room and Boards
    AmendRoomAndBoardDisabledByAtcom = 'amendRoomAndBoardDisabledByAtcom',
    AmendRoomAndBoardDisabledOnSite = 'amendRoomAndBoardDisabledOnSite',
    AmendRoomAndBoardDisabledByTimeBound = 'amendRoomAndBoardDisabledByTimeBound',
    AmendRoomAndBoardDisabledByHavingMultipleRooms = 'amendRoomAndBoardDisabledByHavingMultipleRooms',
    AmendRoomAndBoardDisabledByFlightsDisruption = 'amendRoomAndBoardDisabledByFlightDisruption',
    AmendRoomAndBoardDisabledByChangeCountLimit = 'amendRoomAndBoardDisabledByChangeCountLimit',
    // Hotels
    AmendHotelDisabledOnSite = 'amendHotelDisabledOnSite',
    AmendHotelDisabledByTimeBound = 'amendHotelDisabledByTimeBound',
    AmendHotelDisabledByHavingMultipleRooms = 'amendHotelDisabledByHavingMultipleRooms',
    AmendHotelDisabledBySportEquipment = 'amendHotelDisabledBySportEquipment',
}
