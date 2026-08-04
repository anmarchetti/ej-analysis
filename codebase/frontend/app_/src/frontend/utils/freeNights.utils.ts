import { IOffer, IOfferWithoutAltBoards } from 'models/data/IOffer';

export function getFreeNightsIncludedInOffer(offer?: IOffer | IOfferWithoutAltBoards | null): number {
    const rooms = offer?.accom?.unit || [];

    if (rooms.length > 0) {
        const nightsInFirstRoom = rooms[0].freeNights?.freeNightsIncluded ?? 0;

        if (!nightsInFirstRoom) return 0;

        //  All rooms should include the same number of free nights
        if (rooms.every(room => (room.freeNights?.freeNightsIncluded ?? 0) === nightsInFirstRoom)) {
            return nightsInFirstRoom;
        }
    }

    return 0;
}
