import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreCompositeField, mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IHotelThemeFields, IHotelThemeTypeFields } from 'models/data/IHotelInfoFields';
import {
    IDestinationWithPrice,
    IMasonryTemplateProps,
} from 'frontend/components/renderings/MasonryCarousel/MasonryCarousel';

import TwoRowsTemplate from './TwoRowsTemplate';

jest.mock('./MasonryItem/MasonryItem', () => ({
    __esModule: true,
    default: ({ item }) => <div data-tid='masonry-item' data-code={item?.fields?.Code?.value} />,
}));

const createMockMasonryItem = (id: string): IDestinationWithPrice =>
    ({
        displayName: id,
        name: id,
        id,
        fields: {
            Image: mockSitecoreField(mockSitecoreImageField('test')),
            Name: mockSitecoreField('test'),
            Code: mockSitecoreField(id),
            HotelTheme: mockSitecoreCompositeField('hotel-theme', {} as IHotelThemeFields),
            HotelThemeType: [mockSitecoreCompositeField('hotel-theme-type', {} as IHotelThemeTypeFields)],
        },
    } as IDestinationWithPrice);

const resetMocks = (): IMasonryTemplateProps => ({
    items: [
        createMockMasonryItem('item1'),
        createMockMasonryItem('item2'),
        createMockMasonryItem('item3'),
        createMockMasonryItem('item4'),
    ],
    destinationsAvailability: null,
});

let mocks: IMasonryTemplateProps = resetMocks();

describe('<TwoRowsTemplate />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('Should render with classname x4-items and MasonryItem', () => {
        render(<TwoRowsTemplate {...mocks} />);

        const container = screen.getByTestId('masonry-container');
        expect(container).toHaveClass('x4-items');
        expect(container).not.toHaveClass('x6-items');

        expect(screen.getByTestId('masonry-row-first')).toBeInTheDocument();
        expect(screen.getByTestId('masonry-row-second')).toBeInTheDocument();
        expect(screen.getAllByTestId('masonry-item')).toHaveLength(4);
    });

    it('Should render with classname x6-items and MasonryItem', () => {
        mocks.items = [...mocks.items, createMockMasonryItem('item5'), createMockMasonryItem('item6')];

        render(<TwoRowsTemplate {...mocks} />);

        const container = screen.getByTestId('masonry-container');
        expect(container).not.toHaveClass('x4-items');
        expect(container).toHaveClass('x6-items');

        expect(screen.getByTestId('masonry-row-first')).toBeInTheDocument();
        expect(screen.getByTestId('masonry-row-second')).toBeInTheDocument();
        expect(screen.getAllByTestId('masonry-item')).toHaveLength(6);
    });
});
