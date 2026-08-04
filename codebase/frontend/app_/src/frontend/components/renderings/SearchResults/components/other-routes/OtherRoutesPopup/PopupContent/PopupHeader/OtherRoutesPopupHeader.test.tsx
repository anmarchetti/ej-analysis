import React from 'react';
import { render, screen } from '@testing-library/react';

import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import OtherRoutesPopupHeader from './OtherRoutesPopupHeader';

jest.mock('frontend/utils/date.utils', () => ({ formatDateL10n: jest.fn(d => d) }));
jest.mock('frontend/utils/guestsValidation', () => ({
    getNumberOfGuestsByCategory: jest.fn((_, a, c, i) => `${a} adults ${c} children ${i} infants`),
}));
jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: {
        replaceToken: jest.fn((s, _, v) => `${s}${v}`),
        replaceTokens: jest.fn((s, v) => `${s}${Object.values(v)}`),
    },
}));

const mockAmendmentSortProps = jest.fn();
jest.mock('frontend/components/common/Amend/AmendmentSort/AmendmentSort', () => ({
    __esModule: true,
    default: props => {
        mockAmendmentSortProps(props);

        return <div data-tid='amendment-sort' />;
    },
}));

const createProps = () => ({
    offer: {
        date: '2025-01-01',
        hotel: { resort: { name: 'Paphos' } },
        accom: {
            unit: [
                { occupation: { adults: 2, children: 1, infants: 0 } },
                { occupation: { adults: 1, children: 1, infants: 1 } },
            ],
        },
    },
    onFlightsSort: jest.fn(),
    selectedSortOption: {
        label: 'default code',
        value: 'default sort',
    },
    sortBy: AlternativeFlightsSortBy.PriceHightToLow,
    sortOptions: [
        {
            label: 'default code',
            value: 'default sort',
        },
        {
            label: 'default code 1 ',
            value: 'default sort 1',
        },
    ],
});
const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<OtherRoutesPopupHeader />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should render header', () => {
        render(<OtherRoutesPopupHeader {...mockProps} />);

        expect(screen.getByRole('heading')).toHaveTextContent(
            `${SitecoreDictionary.SearchResultsLabelsOtherRoutesTo}Paphos`,
        );

        expect(screen.getByTestId('other-routes-subtitle')).toHaveTextContent(
            `${SitecoreDictionary.SearchResultsLabelsMoreAvailableFlightsTo}Paphos,2025-01-01,3 adults 2 children 1 infant`,
        );
    });

    it('Should render header without resort', () => {
        mockProps.offer.hotel = null;

        render(<OtherRoutesPopupHeader {...mockProps} />);

        expect(screen.getByRole('heading')).toHaveTextContent(`${SitecoreDictionary.SearchResultsLabelsOtherRoutesTo}`);

        expect(screen.getByTestId('other-routes-subtitle')).toHaveTextContent(
            `${SitecoreDictionary.SearchResultsLabelsMoreAvailableFlightsTo},2025-01-01,3 adults 2 children 1 infant`,
        );
    });

    it('Should render header without guests', () => {
        mockProps.offer.accom = null;

        render(<OtherRoutesPopupHeader {...mockProps} />);

        expect(screen.getByTestId('other-routes-subtitle')).toHaveTextContent(
            `${SitecoreDictionary.SearchResultsLabelsMoreAvailableFlightsTo}Paphos,2025-01-01`,
        );
    });

    it('Should render AlternativeFlightsSort', () => {
        render(<OtherRoutesPopupHeader {...mockProps} />);

        expect(screen.getByTestId('amendment-sort')).toBeInTheDocument();
        expect(mockAmendmentSortProps).toHaveBeenCalledWith({
            onChangeSortBy: expect.any(Function),
            options: mockProps.sortOptions,
            selectedSortOption: mockProps.selectedSortOption,
            sortBy: mockProps.sortBy,
            selectClassName: 'sort-order-select',
            wrapperClassName: 'alternative-flights__sort',
        });
    });

    it('Should NOT render AlternativeFlightsSort when sortOptions are NOT provided', () => {
        mockProps.sortOptions = undefined;
        render(<OtherRoutesPopupHeader {...mockProps} />);

        expect(screen.queryByTestId('amendment-sort')).not.toBeInTheDocument();
    });

    it('Should NOT render AlternativeFlightsSort when sortBy is NOT provided', () => {
        mockProps.sortBy = undefined;
        render(<OtherRoutesPopupHeader {...mockProps} />);

        expect(screen.queryByTestId('amendment-sort')).not.toBeInTheDocument();
    });
});
