import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { PromoBlocksThemes } from 'models/enum/PromoBlocksThemes';

import PromoBlocksTitle from './PromoBlocksTitle';

jest.mock(
    'frontend/components/renderings/HotelDetails/HotelFacilities/components/FeaturedFacilities/FeaturedFacilitiesTitle',
    () => () => <div data-tid='featured-facilities' />,
);

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: () => <div />,
}));
const resetMocks = () =>
    ({
        theme: PromoBlocksThemes.Big,
        rendering: {
            placeholders: {
                [PlaceholderNames.TitleBlock]: 'title',
            },
        },
    } as any);

let mockStores = createMockStores();
let mockProps = resetMocks();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PromoBlocks />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = resetMocks();
    });

    it('Should standard render', () => {
        render(<PromoBlocksTitle {...mockProps} />);
        expect(screen.getByTestId('promo-block-title')).toBeInTheDocument();
    });

    it('Should not render anything', () => {
        mockProps.rendering = undefined;
        const { container } = render(<PromoBlocksTitle {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('Should render FeaturedFacilities instead of normal title', () => {
        mockProps.theme = PromoBlocksThemes.FeaturedFacilities;

        render(<PromoBlocksTitle {...mockProps} />);
        expect(screen.getByTestId('featured-facilities')).toBeInTheDocument();
    });
});
