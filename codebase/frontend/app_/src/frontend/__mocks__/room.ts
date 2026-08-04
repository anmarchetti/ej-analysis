import { ILateRoomCheckout } from 'models/data/IExtras';
import { IBoardType, IRoom, IRoomType, IUnitOccupation } from 'models/data/IHotel';
import { IUnit } from 'models/data/IOffer';
import { IQueryRoom } from 'models/data/URLQueryRooms';
import { GuestType } from 'models/enum/GuestType';

import { imageMock } from './image';

export const queryRoomMock: IQueryRoom = {
    adults: 3,
    children: 2,
    infants: 1,
    roomCode: '13HG5',
    childrenAges: [5, 7],
};

export const boardTypeMock: IBoardType = {
    code: 'boardType_code',
    title: 'boardType_title',
    itemName: 'boardType_title',
    name: 'boardType_name',
    content: 'boardType_content',
    description: 'boardType_description',
    iconUrl: 'boardType_icon',
    price: 14,
    pricePP: 7,
};

export const roomTypeMock: IRoomType = {
    code: 'roomType_code',
    title: 'roomType_title',
    itemName: 'roomType_title',
    name: 'roomType_name',
    description: 'roomType_description',
    content: 'roomType_content',
    iconUrl: 'roomType_icon',
    images: [imageMock],
    roomImagesFolderId: 'roomImagesFolderId',
    roomFacilityFolderId: 'roomFacilityFolderId',
    facilities: [
        {
            code: 'facilities_code',
            name: 'facilities_name',
            number: 'facilities_number',
            disclaimerMessage: 'facilities_disclaimerMessage',
        },
    ],
    stays: [
        {
            description: 'stays_Description',
            stayType: 'stays_stayType',
            facilities: [
                {
                    code: 'stays_facilities_code',
                    name: 'stays_facilities_name',
                    number: 'stays_facilities_number',
                },
            ],
        },
    ],
};

export const mockUnitRoom: IUnit = {
    isExt: false,
    code: 'unitRoomMock_mock',
    originalCode: 'originalCode',
    boardType: boardTypeMock,
    board: 'board_code',
    roomType: roomTypeMock,
    occupation: {
        adults: 1,
        children: 2,
        infants: 1,
        paxIds: [13, 16],
        childAges: [5, 7],
    },
    price: 20,
    pricePP: 10,
    discount: 5,
    isFreeForKids: false,
    itemId: 'itemId',
    avail: 3,
};
export const mockUnitRoomListMock: IUnit[] = [
    { ...mockUnitRoom },
    { ...mockUnitRoom, code: 'unitRoomMock_mock_2', originalCode: 'originalCode_2', board: 'board_code_2' },
];

export const mockUnitOccupation: IUnitOccupation = {
    adults: 2,
    children: 1,
    infants: 0,
    paxIds: [3, 4],
    childAges: [13],
};

export const mockRoom: IRoom = {
    code: 'R001',
    roomType: roomTypeMock,
    board: 'Full Board',
    boardType: boardTypeMock,
    isFreeForKids: false,
    occupation: mockUnitOccupation,
};

export const mockLateRoomCheckout: ILateRoomCheckout = {
    id: '123456789',
    autoInclude: true,
    code: 'LRCHCK',
    method: 'Late Room Checkout',
    paxs: ['John Doe', 'Jane Doe'],
    prom: 'LRC_PROMO',
    quantity: 1,
    rateRule: 'Standard Rate',
    serviceStates: ['Active'],
    setType: ['Late Checkout'],
    startDate: ['2023-05-25'],
    typeCode: ['LRCHCK-001'],
    name: 'Late Room Checkout Service',
    price: 10.0,
    mcMethod: 'Manual',
    isHidden: false,
    maxPax: 2,
    minPax: 1,
};

export const mockRoomAllocation = {
    id: 123456789,
    adults: [
        {
            id: '83bcd366-f426-0c34-3c06-16fbe1c068d9',
            isLead: false,
            age: 30,
            notBornYet: false,
            Sex: 'SEX_UNKNOWN',
            useSurnameAsLead: false,
            type: GuestType.Adult,
            firstName: '',
            lastName: '',
            title: '',
        },
        {
            id: '36ed37cc-523a-42b9-b76a-90523b3cdde4',
            isLead: false,
            age: 30,
            notBornYet: false,
            Sex: 'SEX_UNKNOWN',
            useSurnameAsLead: false,
            type: GuestType.Adult,
            firstName: '',
            lastName: '',
            title: '',
        },
    ],
    children: [],
    infants: [],
    roomCode: '',
};
