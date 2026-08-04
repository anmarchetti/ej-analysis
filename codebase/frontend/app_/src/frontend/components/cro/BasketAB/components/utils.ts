import { IFlightPassenger } from 'models/data/AncillariesInfo';
import { IUnit } from 'models/data/IOffer';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

interface IBag {
    count: number;
    icon: ISitecoreField<ISitecoreImage>;
    text: string | undefined;
}

export const getBagDataById = (passengers: IFlightPassenger[], bugsId: string): IBag => {
    const passengerWithSearchedBug = passengers.filter(passenger =>
        passenger.seat?.products.some(product => product.id === bugsId),
    );
    const product = passengerWithSearchedBug[0]?.seat?.products[0];

    return {
        count: passengerWithSearchedBug.length,
        icon: {
            value: {
                src: product?.icon || '',
            },
        },
        text: product?.name,
    };
};

export const countRoomsByTitle = (rooms: IUnit[]): [string, number][] => {
    const roomsByTitle = rooms.reduce((roomsByTitle, room) => {
        const title = room.roomType.title as unknown as string;

        if (title) {
            roomsByTitle[title] = ++roomsByTitle[title] || 1;
        }

        return roomsByTitle;
    }, {} as Record<string, number>);

    return Object.entries(roomsByTitle);
};
