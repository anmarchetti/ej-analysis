import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreCompositeField, mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IHotelThemeFields, IHotelThemeTypeFields } from 'models/data/IHotelInfoFields';
import {
    IDestinationWithPrice,
    IMasonryTemplateProps,
} from 'frontend/components/renderings/MasonryCarousel/MasonryCarousel';

import OneRowTemplate from './OneRowTemplate';

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
        items: [createMockMasonryItem('item1')],
    } as IMasonryTemplateProps);

let mocks: IMasonryTemplateProps = resetMocks();

describe('<OneRowTemplate />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('Should render with one MasonryItem', () => {
        render(<OneRowTemplate {...mocks} />);

        expect(screen.getAllByTestId('one-row-template-container')).toHaveLength(1);
        expect(screen.getByTestId('masonry-item')).toBeInTheDocument();
    });

    it('Should render with classname x3-items and tree MasonryItem', () => {
        mocks.items = [createMockMasonryItem('item1'), createMockMasonryItem('item2'), createMockMasonryItem('item3')];
        const { container } = render(<OneRowTemplate {...mocks} />);

        // remove once className is deleted
        expect(container.getElementsByClassName('x3-items')).toHaveLength(1);

        expect(screen.getAllByTestId('one-row-template-container')).toHaveLength(1);
        expect(screen.getAllByTestId('masonry-item')).toHaveLength(3);
    });

    it('Should render without MasonryItem', () => {
        mocks.items = [];
        render(<OneRowTemplate {...mocks} />);

        expect(screen.queryByTestId('masonry-item')).not.toBeInTheDocument();
    });
});
