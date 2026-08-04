import { IHoldLuggageInfo } from 'models/data/IHoldLuggage';

export const getPassengersLuggage = (luggage: IHoldLuggageInfo, numberOfPassengers: number) => {
    // here we need to allocate each luggage item with passengers,
    // because API wait them connected, but they are not allocated on UI designs
    if (!Object.keys(luggage).length) {
        return [];
    }

    // creating array with all selected luggage codes
    const selectedLuggageCodes: string[] = [];
    for (const [itemCode, quantity] of Object.entries(luggage)) {
        selectedLuggageCodes.push(...Array(quantity).fill(itemCode));
    }

    // luggage allocation by passengers
    return selectedLuggageCodes.map((code, index) => ({
        passengerId: ((index % numberOfPassengers) + 1).toString(),
        code,
        quantity: 1,
    }));
};
