import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, destinationMock } from 'frontend/__mocks__';
import { mockReplaceTokens } from 'frontend/__mocks__/utils/tokenizer';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IHeroBannerHeadingFields } from 'models/data/IHeroBanner';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import UnavailableBanner from './StaticUnavailableBanner';

jest.mock('frontend/components/icons-new/WarningFilled', () => () => <svg data-tid='warning-filled' />);

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

let mockProps;
let mockStores;

const createMockProps = (): IHeroBannerHeadingFields => ({
    Title: mockSitecoreField('Title'),
    Name: mockSitecoreField('Name'),
});
const createStores = () =>
    createMockStores({
        layoutStore: {
            destinationParents: [destinationMock],
            getDestinationParentBreadcrumb: jest.fn().mockReturnValue('parent_breadcrumb_href'),
        },
    });

describe('StaticUnavailableBanner', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createStores();
    });

    it('should renders correctly', () => {
        render(<UnavailableBanner {...mockProps} />);

        expect(screen.getByTestId('unavailable-banner')).toBeInTheDocument();
        expect(screen.getByTestId('warning-filled')).toBeInTheDocument();
        expect(
            screen.getByText(
                `${SitecoreDictionary.DestinationsButtonsUnavailableDestinationBannerLink} destination_name`,
            ),
        ).toHaveAttribute('href', 'parent_breadcrumb_href');
        expect(
            screen.getByText(
                `${SitecoreDictionary.DestinationsLabelsHeroBannerUnavailableDestinationBanner} destination_name,${mockProps.Title.value}`,
            ),
        ).toBeInTheDocument();
    });

    it('should replace resort token by Name field when Title is absent', () => {
        mockProps.Title = undefined;

        render(<UnavailableBanner {...mockProps} />);

        expect(
            screen.getByText(
                `${SitecoreDictionary.DestinationsLabelsHeroBannerUnavailableDestinationBanner} destination_name,${mockProps.Name.value}`,
            ),
        ).toBeInTheDocument();
    });

    it('should replace resort with empty string when Name and Title are absent', () => {
        mockProps.Title = undefined;
        mockProps.Name = undefined;

        render(<UnavailableBanner {...mockProps} />);

        expect(
            screen.getByText(
                `${SitecoreDictionary.DestinationsLabelsHeroBannerUnavailableDestinationBanner} destination_name,`,
            ),
        ).toBeInTheDocument();
    });

    it('should replace region with empty string when destinationParents is empty', () => {
        mockStores.layoutStore.destinationParents = [];
        render(<UnavailableBanner {...mockProps} />);

        expect(
            screen.getByText(`${SitecoreDictionary.DestinationsButtonsUnavailableDestinationBannerLink}`),
        ).toBeInTheDocument();
    });
});
