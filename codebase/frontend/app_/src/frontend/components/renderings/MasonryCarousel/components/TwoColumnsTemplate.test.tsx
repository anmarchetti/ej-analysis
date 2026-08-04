import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreCompositeField, mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IHotelThemeFields, IHotelThemeTypeFields } from 'models/data/IHotelInfoFields';
import {
    IDestinationWithPrice,
    IMasonryTemplateProps,
} from 'frontend/components/renderings/MasonryCarousel/MasonryCarousel';

import TwoColumnsTemplate from './TwoColumnsTemplate';

jest.mock('./MasonryItem/MasonryItem', () => ({
    __esModule: true,
    default: () => <div data-tid='masonry-item' />,
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

const resetMocks = (): IMasonryTemplateProps =>
    ({
        items: [
            createMockMasonryItem('item1'),
            createMockMasonryItem('item2'),
            createMockMasonryItem('item3'),
            createMockMasonryItem('item4'),
            createMockMasonryItem('item5'),
        ],
    } as IMasonryTemplateProps);

let mocks: IMasonryTemplateProps = resetMocks();

describe('<TwoColumnsTemplate />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('Should render with classname x5-items and MasonryItem', () => {
        const { container } = render(<TwoColumnsTemplate {...mocks} />);

        expect(screen.getByTestId('two-columns-template-container')).toBeInTheDocument();
        // remove once className is deleted
        expect(container.getElementsByClassName('x5-items')).toHaveLength(1);
        expect(container.getElementsByClassName('x7-items')).toHaveLength(0);
        expect(screen.getAllByTestId('masonry-item')).toHaveLength(5);
    });

    it('Should render with classname x7-items and MasonryItem', () => {
        mocks.items = [...mocks.items, createMockMasonryItem('item6'), createMockMasonryItem('item7')];
        const { container } = render(<TwoColumnsTemplate {...mocks} />);

        expect(screen.getByTestId('two-columns-template-container')).toBeInTheDocument();
        // remove once className is deleted
        expect(container.getElementsByClassName('x5-items')).toHaveLength(0);
        expect(container.getElementsByClassName('x7-items')).toHaveLength(1);
        expect(screen.getAllByTestId('masonry-item')).toHaveLength(7);
    });
});
