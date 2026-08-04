export interface ISeatMapSeat {
    currency: string;
    isAisleSeat: boolean;
    isAvailable: boolean;
    isAvailableForChild: boolean;
    isAvailableForInfant: boolean;
    isExitRow: boolean;
    isMiddleSeat: boolean;
    isWindowSeat: boolean;
    number: string;
    passengerId: number;
    price: number;
    priceBandId: number;
    priceWithCreditCardFee: number;
}
