import { CurrencyCode } from 'code/currency';
import {
    OrderCheckoutPayment,
    PURCHASED_STATUS,
    SitecoreChannel,
} from 'frontend/store/base/tracking/sitecore/constants';
import { IOrderCheckoutEventData } from 'models/data/ISitecorePersonalize';
import { CardType } from 'models/enum/CardType';

export const loggerStrings = [
    'CONFIRMATION PAGE: parse payload{"channel":"WEB","currency":"GBP","language":"EN","page":"Test Title","pointOfSale":"default","order":{"date":"2025-08-07","referenceId":"test-reference","orderedAt":"2020-01-01T00:00:00.000Z","status":"PURCHASED","currencyCode":"GBP","price":100},"eventType":"CUSTOM_EVENT_","bookingReference":"test-reference","selectionAttr":"value-1"}',
    'CONFIRMATION PAGE: parse payload{"channel":"WEB","currency":"GBP","language":"EN","page":"Test Title","pointOfSale":"default","order":{"date":"2025-08-07","referenceId":"test-reference","orderedAt":"2020-01-01T00:00:00.000Z","status":"PURCHASED","currencyCode":"GBP","price":100},"eventType":"CUSTOM_EVENT_","bookingReference":"test-reference","selectionAttr":"value-2"}',
    'EngageStore sendPersonalizeOrderData experiences: [{"uniqueId":"60b60241-3c24-46dd-988a-5f742593ca59","friendlyId":"experience-1","selectionAttr":"value-1","ctas":[]},{"uniqueId":"60b60241-3c24-46dd-988a-5f742593ca59","friendlyId":"experience-2","selectionAttr":"value-2","ctas":[]},{"uniqueId":"60b60241-3c24-46dd-988a-5f742593ca59","friendlyId":"","selectionAttr":"value-2","ctas":[]},{"uniqueId":"60b60241-3c24-46dd-988a-5f742593ca59","friendlyId":"experience-3","selectionAttr":"","ctas":[]}]',
    'EngageStore sendPersonalizeOrderData NOT empty expObject: {"experience-1":"value-1","experience-2":"value-2"}',
];

export const eventData = {
    channel: SitecoreChannel.Desktop,
    currency: CurrencyCode.GBP,
    language: 'EN',
    page: 'Test Title',
    pointOfSale: 'default',
    price: 100,
};

export const baseHolidayMock = {
    price: 1224,
    name: 'baseHoliday name',
    productId: 'baseHoliday id',
    quantity: 4,
    id: 'hotel id',
};

export const orderCheckoutEventDataMock = (): IOrderCheckoutEventData => ({
    channel: SitecoreChannel.Desktop,
    currency: CurrencyCode.GBP,
    language: 'EN',
    page: 'Test Title',
    order: {
        cardType: CardType.Mastercard,
        orderedAt: '2020-01-01T00:00:00.000Z',
        paymentType: OrderCheckoutPayment.Card,
        price: 100,
        referenceId: 'test-reference',
        status: PURCHASED_STATUS,
        currencyCode: CurrencyCode.GBP,
        date: '2025-08-07',
    },
    pointOfSale: 'default',
});

export const contentOrder = {
    uid: 'mock-wrapper-uid',
    groupName: 'mock-grouping-name',
    placeholders: {
        'sorter-wrapper-inner': [
            {
                componentName: 'Cabin Bags',
                uid: 'uid-cabin-bags',
            },
            {
                componentName: 'Seats And Bags',
                uid: 'uid-seats-and-bags',
            },
        ],
    },
};

export const orderData = {
    referenceId: 'test-reference',
    orderedAt: '2020-01-01T00:00:00.000Z',
    status: PURCHASED_STATUS,
    currencyCode: CurrencyCode.GBP,
    price: 100,
    paymentType: 'Card',
    cardType: CardType.Mastercard,
    date: '2025-08-07',
};

export const logData = {
    channel: SitecoreChannel.Desktop,
    currency: CurrencyCode.GBP,
    language: 'EN',
    page: 'Test Title',
    pointOfSale: 'default',
    order: {
        date: '2025-08-07',
        referenceId: 'test-reference',
        orderedAt: '2020-01-01T00:00:00.000Z',
        status: PURCHASED_STATUS,
        currencyCode: 'GBP',
        price: 100,
    },
    eventType: 'CUSTOM_EVENT_',
    bookingReference: 'test-reference',
};
