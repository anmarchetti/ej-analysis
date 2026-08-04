import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, destinationMock } from 'frontend/__mocks__';
import { mockReplaceTokens } from 'frontend/__mocks__/utils/tokenizer';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IHeroBannerCategoryFields } from 'models/data/IHeroBanner';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import UnavailableBanner from './FloatingUnavailableBanner';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceTokens: mockReplaceTokens,
    },
}));

const createProps = (): IHeroBannerCategoryFields => ({
    PageCategory: mockSitecoreField('Country'),
});
const createStores = () =>
    createMockStores({
        layoutStore: {
            destinationParents: [destinationMock],
            getDestinationParentBreadcrumb: jest.fn().mockReturnValue('parent_breadcrumb_href'),
        },
    });

let mockProps;
let mockStores;

describe('FloatingUnavailableBanner', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render content', () => {
        render(<UnavailableBanner {...mockProps} />);

        expect(
            screen.getByText(`${SitecoreDictionary.GlobalsTitlesSorryThisXIsCurrentlyUnavailable} country`),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                `${SitecoreDictionary.DestinationsButtonsUnavailableDestinationButton} ${destinationMock.name}`,
            ),
        ).toHaveAttribute('href', 'parent_breadcrumb_href');
        expect(screen.getByTestId('unavailable-banner')).toBeInTheDocument();
    });

    it('should render link text without replacer when destination parents is absent', () => {
        mockStores.layoutStore.destinationParents = [];
        render(<UnavailableBanner {...mockProps} />);

        expect(
            screen.getByText(SitecoreDictionary.DestinationsButtonsUnavailableDestinationButton),
        ).toBeInTheDocument();
    });
});
