export interface IAirportParking {
    address: string;
    bookingDetails: IAirportParkingBookingDetails;
    brandImage: string;
    description: string;
    isMeetAndGreet: boolean;
    isParkAndRide: boolean;
    isParkAndStroll: boolean;
    title: string;
    transferTip: string;
}

export interface IAirportParkingBookingDetails {
    endDate: string;
    endTime: string;
    extRefId: string;
    keyData: string;
    productCode: string;
    promotionCode: string;
    startDate: string;
    startTime: string;
    totalPrice: number;
    type: string;
}
