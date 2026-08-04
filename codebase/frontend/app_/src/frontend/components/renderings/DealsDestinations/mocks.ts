import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { PriceMathFunction } from 'models/enum/PriceMathFunction';

import { IDealsDestinationTileFields } from './interfaces';

export const mockTileFields: IDealsDestinationTileFields = {
    Destination: [
        {
            fields: {
                Name: mockSitecoreField('DestinationName'),
                Code: mockSitecoreField('DestinationCode'),
                Image: mockSitecoreField(mockSitecoreImageField('DestinationImage')),
                PageCategory: mockSitecoreField('DestinationPageCategory'),
            },
            id: 'destination-0',
        },
    ],
    IsRequestedPriceEnabled: mockSitecoreField(true),
    IsRequestedPricePP: mockSitecoreField(true),
    IsRequestedPriceRounded: mockSitecoreField(true),
    PriceMathFunction: {
        fields: {
            Code: mockSitecoreField(PriceMathFunction.Cheapest),
            Name: mockSitecoreField('PriceMathFunctionName'),
        },
        id: 'price-math-function-id',
    },
    SortOrder: {
        fields: {
            Code: mockSitecoreField('SortOrderCode'),
            Title: mockSitecoreField('SortOrderTitle'),
        },
        id: 'sort-order-id',
    },
};
