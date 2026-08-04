import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IDestinationWithPrice } from 'frontend/components/renderings/MasonryCarousel/MasonryCarousel';

import { IMasonryItemNameProps, MasonryItemName } from './MasonryItemName';

let mockProps;
let mockStores;

const createStores = () => createMockStores();

const createProps = (): IMasonryItemNameProps => ({
    item: {
        fields: {
            Name: mockSitecoreField('Item name'),
        },
        pricePP: 100,
    } as IDestinationWithPrice,
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<MasonryItemName />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should standard render when is type of holiday', () => {
        render(<MasonryItemName {...mockProps} />);

        expect(screen.getByTestId('masonry-item-name-title')).toHaveTextContent('Item name');
    });

    describe('isFeaturedHotelVariant', () => {
        beforeEach(() => {
            mockProps.isFeaturedHotelVariant = true;
        });

        it('should render the region holidays phrase as title', () => {
            render(<MasonryItemName {...mockProps} />);

            expect(screen.getByTestId('masonry-item-name-title')).toHaveTextContent(
                SitecoreDictionary.GlobalsTitlesRegionHolidays,
            );
        });

        it('should apply featured title class instead of masonry-item__title', () => {
            render(<MasonryItemName {...mockProps} />);

            expect(screen.getByTestId('masonry-item-name-title')).toHaveClass('title');
            expect(screen.getByTestId('masonry-item-name-title')).not.toHaveClass('masonry-item__title');
        });
    });
});
