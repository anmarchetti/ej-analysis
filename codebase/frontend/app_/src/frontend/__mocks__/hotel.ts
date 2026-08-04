import { IBoardType, IHotel, ITheme, IThemeType } from 'models/data/IHotel';
import { IAltBoard } from 'models/data/IOffer';
import { PackageIconTypes } from 'models/enum/PackageIconTypes';

import { roomTypeMock } from './room';

export const mockThemeType: IThemeType = {
    code: 'beach',
    name: 'Beach',
    itemName: 'Beach',
    description: 'Enjoy a beach vacation',
    icon: 'https://example.com/beach-icon.png',
    filledIcon: 'https://example.com/filled-beach-icon.png',
    typeAndThemeTitle: 'Beach Vacation',
};

export const mockTheme: ITheme = {
    code: 'beach',
    name: 'Beach',
    itemName: 'Beach',
    packageIcons: [
        {
            key: PackageIconTypes.Bags,
            name: 'Sun',
            iconUrl: 'https://example.com/sun-icon.png',
        },
        {
            key: PackageIconTypes.Hotel,
            name: 'Water',
            iconUrl: 'https://example.com/water-icon.png',
        },
    ],
};

export const mockBoardType: IBoardType = {
    code: 'HB',
    title: 'Half Board',
    name: 'Half Board',
    content: 'Breakfast and dinner included',
    description: 'Enjoy a delicious breakfast and dinner during your stay',
    iconUrl: 'https://example.com/hb-icon.png',
    price: 150,
    pricePP: 50,
};

export const mockAltBoard1: IAltBoard = {
    ...mockBoardType,
    name: 'Half Board1',
    itemId: '1234',
    price: 150,
    pricePP: 75,
    priceExcludingTouristTax: 80,
    pricePPExcludingTouristTax: 40,
    unitCodes: {
        unit1: 'HB',
        unit2: 'HB',
    },
    isExt: false,
    roomAlterations: {},
};
export const mockAltBoard2: IAltBoard = {
    ...mockBoardType,
    code: 'FB',
    name: 'Full Board2',
    itemId: '5678',
    price: 200,
    pricePP: 100,
    priceExcludingTouristTax: 110,
    pricePPExcludingTouristTax: 55,
    unitCodes: {
        unit3: 'FB',
    },
    isExt: false,
    roomAlterations: {},
};

export const mockAltBoards = [mockAltBoard1, mockAltBoard2];

export const luggagePackageIcon = {
    key: PackageIconTypes.Bags,
    luggageCode: 'LUG',
    name: 'Sunbed Package',
    iconUrl: 'sunbed_icon_url',
};

export const mockHotel: IHotel = {
    city: 'New York',
    country: {
        code: 'US',
        name: 'United States',
        itemName: 'United States',
    },
    location: {
        code: 'US',
        name: 'United States',
        itemName: 'United States',
    },
    giataCode: '12345',
    images: [
        {
            id: '1',
            small: 'small_image_url.jpg',
            medium: 'medium_image_url.jpg',
            large: 'large_image_url.jpg',
            selected: true,
            description: 'Hotel exterior',
        },
        {
            id: '2',
            small: 'small_image_url.jpg',
            medium: 'medium_image_url.jpg',
            large: 'large_image_url.jpg',
            selected: false,
            description: 'Hotel lobby',
        },
    ],
    code: 'H123',
    name: 'Hotel Example',
    ecoFacility: {
        name: 'Eco Facility',
        tooltip: 'This hotel has eco-friendly facilities.',
    },
    description: 'Welcome to Hotel Example!',
    longitude: '40.7128',
    latitude: '-74.0060',
    starRating: '4.5',
    facilities: [
        {
            id: '1',
            code: 'F001',
            name: 'Swimming Pool',
            iconUrl: 'pool_icon_url',
            items: [],
            title: 'Facilities',
            description: 'Enjoy our swimming pool.',
            image: {
                id: '1',
                small: 'small_image_url.jpg',
                medium: 'medium_image_url.jpg',
                large: 'large_image_url.jpg',
                selected: true,
                description: 'Swimming pool',
            },
        },
    ],
    boardTypes: [mockBoardType],
    roomTypes: [roomTypeMock],
    address: '123 Main Street',
    resort: {
        code: 'R001',
        name: 'Resort Example',
        itemName: 'Resort Example',
    },
    rating: 4.8,
    numberOfReviews: 500,
    closestFacility: {
        code: 'CF001',
        groupCode: 'CG001',
        name: 'Nearest Restaurant',
        distance: 0.5,
    },
    closestFacilities: {
        code: 'CF002',
        groupCode: 'CG001',
        name: 'Nearest Coffee Shop',
        distance: 0.3,
    },
    strapline: 'Your home away from home',
    ksp1: 'Free Wi-Fi',
    ksp2: '24-hour room service',
    keySellingPoint1: 'Enjoy complimentary Wi-Fi throughout your stay.',
    keySellingPoint2: 'Indulge in our 24-hour room service for ultimate convenience.',
    theme: {
        code: 'T001',
        name: 'Beach Getaway',
        itemName: 'Beach Getaway EN',
        packageIcons: [
            {
                key: PackageIconTypes.Hotel,
                name: 'Beach Package',
                iconUrl: 'beach_icon_url',
            },
            luggagePackageIcon,
            {
                key: PackageIconTypes.UnderSeatBag,
                name: 'Under seat bag',
                iconUrl: 'sunbed_icon_url',
            },
        ],
    },
    hotelTheme: {
        code: 'T002',
        name: 'Family-Friendly',
    },
    type: {
        code: 'TT001',
        itemName: 'Resort',
        name: 'Resort',
        description: 'A luxurious resort destination',
        icon: 'resort_icon_url',
        filledIcon: 'filled_resort_icon_url',
        typeAndThemeTitle: 'Resort Themes',
    },
    tripAdvisorId: '123456',
    errataFacilities: [
        {
            code: 'EF001',
            name: 'Parking',
        },
        {
            code: 'EF002',
            name: 'Fitness Center',
        },
    ],
    isGreatDeal: true,
    fullHotelAddress: {
        city: 'New York',
        country: 'US',
        countryCode: '+1',
        postalCode: '444',
        region: 'US',
        street: 'Wall Street',
    },
    hotelType: {
        code: 'adu',
        name: 'Adult',
        description: 'Adult-Only Hotel',
        icon: 'adult_icon_url',
    },
};
