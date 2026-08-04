import { IRoomType } from 'models/data/IHotel';

export const defaultRoom = {
    code: 'B01',
    price: 803,
    pricePP: 402,
    board: 'AS',
    roomType: {
        code: 'B01',
        title: {
            value: 'Double standard',
        },
    },
    originalCode: 'B01',
    requireBoardAlteration: '',
    isFreeForKids: false,
    occupation: {
        adults: 2,
        children: 1,
    },
};

export const nextMostExpensiveToSelectedRoom = {
    code: 'B02',
    price: 840,
    pricePP: 420,
    board: 'AS',
    roomType: {
        code: 'B02',
        title: {
            value: 'Double with balcony',
        },
    },
    originalCode: 'B02',
    requireBoardAlteration: 'AI',
    isFreeForKids: false,
    occupation: {
        adults: 2,
        children: 1,
    },
};

export const mostExpensiveRoom = {
    code: 'B03',
    price: 892,
    pricePP: 446,
    board: 'AS',
    roomType: {
        code: 'B03',
        title: {
            value: 'Superior Bungalow with Sea View',
        },
    },
    originalCode: 'B03',
    requireBoardAlteration: '',
    isFreeForKids: true,
    occupation: {
        adults: 2,
        children: 1,
    },
};

export const roomWithFacilitiesAndPhotos = {
    code: 'DB01',
    price: 866,
    pricePP: 433,
    board: 'AS',
    roomType: {
        code: 'DB01',
        title: {
            value: 'Double Room with Sea View',
        },
        facilities: [
            {
                code: 'code',
                name: 'name',
                number: 'number',
            },
        ],
        images: [
            {
                small: 'small',
                medium: 'medium',
                large: 'large',
            },
        ],
    } as IRoomType,
    originalCode: 'DB01',
    occupation: {
        adults: 2,
        children: 1,
    },
};
