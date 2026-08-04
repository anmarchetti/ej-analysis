import React from 'react';
import { render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import OtherRoutesTableHeader, { IOtherRoutesTableHeaderProps } from './OtherRoutesTableHeader';

jest.mock('frontend/components/common/Callout/Callout', () => ({ content }) => <div data-tid='tooltip'>{content}</div>);

const createProps = () =>
    ({
        hasPricePerPerson: false,
        priceDisclaimer: '',
    } as IOtherRoutesTableHeaderProps);
const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<TableHeader />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should render columns', () => {
        const { container } = render(<OtherRoutesTableHeader {...mockProps} />);

        expect(container.getElementsByClassName('table-col')).toHaveLength(5);
        expect(screen.getByText(SitecoreDictionary.SearchResultsLabelsDepartureAirport)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.SearchResultsLabelsDepartingTime)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.SearchResultsLabelsReturnTime)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.SearchResultsLabelsPriceTotal)).toBeInTheDocument();
    });

    it('Should render price per person column', () => {
        mockProps.hasPricePerPerson = true;

        render(<OtherRoutesTableHeader {...mockProps} />);

        expect(screen.getByTestId('price-per-person')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.SearchResultsLabelsPricePerPerson)).toBeInTheDocument();
    });

    describe('Price Tooltip', () => {
        it('Should not render price tooltip', () => {
            render(<OtherRoutesTableHeader {...mockProps} />);

            expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
        });

        it('Should render price tooltip', () => {
            mockProps.priceDisclaimer = 'price tooltip';

            render(<OtherRoutesTableHeader {...mockProps} />);

            expect(screen.getByTestId('tooltip')).toHaveTextContent(mockProps.priceDisclaimer);
        });
    });
});
