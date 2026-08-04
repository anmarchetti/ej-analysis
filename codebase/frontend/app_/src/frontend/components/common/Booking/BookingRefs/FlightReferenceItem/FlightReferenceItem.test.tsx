import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as utils from 'frontend/utils/clipboard.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IRoute } from 'models/data/IRoute';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FlightReferenceItem, { IReferenceItemProps } from './FlightReferenceItem';

jest.mock('frontend/utils/clipboard.utils', () => ({
    copyToClipboard: jest.fn(),
}));

jest.mock('frontend/utils/ui.utils', () => ({
    scrollToElement: jest.fn(),
}));

jest.mock('frontend/utils/route.utils', () => ({
    __esModule: true,
    getFlightsReferences: jest.fn(flights => flights.map(f => f.extRefId)),
}));

jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    default: ({ content }) => <div data-tid='tooltip'>{content}</div>,
}));

const mockMultipleFlightReferenceItem = jest.fn();
jest.mock('../MultipleFlightReferenceItem/MultipleFlightReferenceItem', () => ({
    __esModule: true,
    default: props => {
        mockMultipleFlightReferenceItem(props);

        return <div data-tid='multiple-flight-ref' />;
    },
}));

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
});

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const createProps = (): IReferenceItemProps => ({
    flights: [] as IRoute[],
    hasTooltips: true,
});

let props = createProps();

describe('<FlightReferenceItem />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should render NoFlightInfo when no flights', () => {
        render(<FlightReferenceItem {...props} />);

        expect(screen.getByTestId('no-flight-info-section')).toBeInTheDocument();
        expect(screen.getByTestId('no-flight-header')).toHaveTextContent(
            SitecoreDictionary.ViewBookingNoFlightInfoTitle,
        );
        expect(screen.getByTestId('no-flight-description')).toHaveTextContent(
            SitecoreDictionary.ViewBookingNoFlightInfoDescription,
        );
    });

    it("should render NoFlightInfo when single flight doesn't have ref", () => {
        props.flights = [{ extRefId: undefined } as IRoute];

        render(<FlightReferenceItem {...props} />);

        expect(screen.getByTestId('no-flight-info-section')).toBeInTheDocument();
        expect(screen.getByTestId('no-flight-header')).toHaveTextContent(
            SitecoreDictionary.ViewBookingNoFlightInfoTitle,
        );
        expect(screen.getByTestId('no-flight-description')).toHaveTextContent(
            SitecoreDictionary.ViewBookingNoFlightInfoDescription,
        );
    });

    it('should render single flight ref', () => {
        props.flights = [{ extRefId: 'ref-1' }] as IRoute[];

        render(<FlightReferenceItem {...props} />);

        expect(screen.getByTestId('flight-ref')).toBeInTheDocument();
        expect(screen.getByTestId('ref-number')).toHaveTextContent('ref-1');
        expect(screen.getByText(SitecoreDictionary.BookingHeaderLabelsFlightReference)).toBeInTheDocument();
        expect(screen.getByTestId('tooltip')).toHaveTextContent(SitecoreDictionary.BookingHeaderLabelsFlightRefTitle);
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('should call copyToClipboard when click on ref', async () => {
        props.flights = [{ extRefId: 'ref-1' }] as IRoute[];

        const { getByRole } = render(<FlightReferenceItem {...props} />);

        await userEvent.click(getByRole('button'));

        expect(utils.copyToClipboard).toHaveBeenCalledWith(props.flights[0].extRefId);
    });

    describe('multiple flights refs', () => {
        beforeEach(() => {
            props.flights = [{ extRefId: 'ref-1' }, { extRefId: 'ref-2' }] as IRoute[];
        });

        it('should render MultipleFlightReferenceItem component', () => {
            render(<FlightReferenceItem {...props} />);

            expect(screen.getByTestId('multiple-flight-ref')).toBeInTheDocument();
            expect(mockMultipleFlightReferenceItem).toHaveBeenCalledWith({
                flights: props.flights,
                scrollToSeeFullReferences: undefined,
            });
        });

        it('should pass ScrollToSeeFullReferences to MultipleFlightReferenceItem', () => {
            const scrollField = mockSitecoreField('Scroll to see full references');
            props.scrollToSeeFullReferences = scrollField;

            render(<FlightReferenceItem {...props} />);

            expect(mockMultipleFlightReferenceItem).toHaveBeenCalledWith({
                flights: props.flights,
                scrollToSeeFullReferences: scrollField,
            });
        });
    });
});
