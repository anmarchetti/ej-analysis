import { IFlightPassenger } from 'models/data/AncillariesInfo';
import { IUnit } from 'models/data/IOffer';

import { countRoomsByTitle, getBagDataById } from './utils';

describe('bagDataById', () => {
    it('should return bag data', () => {
        const passengers = [
            {
                seat: {
                    products: [
                        {
                            id: 'B0001',
                            name: 'SmallUnderSeatBag',
                            icon: 'icon src',
                        },
                    ],
                },
            },
        ] as IFlightPassenger[];
        expect(getBagDataById(passengers, 'B0001')).toMatchObject({
            count: 1,
            icon: {
                value: {
                    src: 'icon src',
                },
            },
            text: 'SmallUnderSeatBag',
        });
    });

    it('should return staked bag data', () => {
        const passengers = [
            {
                seat: {
                    products: [
                        {
                            id: 'B0001',
                            name: 'SmallUnderSeatBag',
                            icon: 'icon src',
                        },
                    ],
                },
            },
            {
                seat: {
                    products: [
                        {
                            id: 'B0001',
                            name: 'SmallUnderSeatBag',
                            icon: 'icon src',
                        },
                    ],
                },
            },
        ] as IFlightPassenger[];
        expect(getBagDataById(passengers, 'B0001')).toMatchObject({
            count: 2,
            icon: {
                value: {
                    src: 'icon src',
                },
            },
            text: 'SmallUnderSeatBag',
        });
    });
});

describe('countRoomsByTitle', () => {
    it('should stack rooms', () => {
        const rooms = [
            {
                roomType: {
                    title: 'room title 1',
                },
            },
            {
                roomType: {
                    title: 'room title 1',
                },
            },
            {
                roomType: {
                    title: 'room title 2',
                },
            },
        ];
        const COUNT_ROOMS_BY_TITLE_1 = 2;
        const COUNT_ROOMS_BY_TITLE_2 = 1;

        expect(countRoomsByTitle(rooms as unknown as IUnit[])).toMatchObject([
            ['room title 1', COUNT_ROOMS_BY_TITLE_1],
            ['room title 2', COUNT_ROOMS_BY_TITLE_2],
        ]);
    });
});
