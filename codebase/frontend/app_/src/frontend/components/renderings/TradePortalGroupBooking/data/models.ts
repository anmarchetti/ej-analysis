interface IGroupBookingRoomInfo extends IGroupBookingPassengersInfo {
    childAges: number[];
    roomNumber: number;
}

interface IGroupBookingPassengersInfo {
    adults: number;
    children: number;
    infants: number;
}

interface IGroupBookingDepartureAirportInfo {
    airport: string;
    iAmFlexible: boolean;
}

export interface IGroupBookingInfo {
    abtaNumber: string;
    additionalDetails: string;
    agentName: string;
    boardBasis: string;
    departureAirport: IGroupBookingDepartureAirportInfo;
    departureDate: string;
    destinationHotelOrRegion: string;
    durationOfHoliday: number;
    email: string;
    numberOfRooms: number;
    rooms: IGroupBookingRoomInfo[];
    totalPassengers: IGroupBookingPassengersInfo;
}
