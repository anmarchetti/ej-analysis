import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { DATE_FORMATS } from 'code/dates';
import { mockOutboundFlight } from 'frontend/__mocks__';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { RouteDirection } from 'models/enum/RouteDirection';

import Flight, { IFlightProps } from './Flight';

expect.extend(toHaveNoViolations);

const createProps = () =>
    ({
        route: { ...mockOutboundFlight },
        fields: {},
    } as IFlightProps);

const createStores = () => ({
    layoutStore: { isTerminalInformationEnabled: false, isTradePortal: false },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/date.utils', () => ({
    formatDateL10n: jest.fn(),
}));

const mockTerminalInfo = jest.fn();

jest.mock('frontend/components/common/FlightsDetails/TerminalInfo/TerminalInfo', () => ({
    __esModule: true,
    default: props => {
        mockTerminalInfo(props);

        return <div data-tid='terminal-info' />;
    },
}));

describe('Flight', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should render flight details', () => {
        (formatDateL10n as any).mockReturnValueOnce('Thu 11th May 2023');
        const { getByTestId } = render(<Flight {...mockProps} />);

        expect(getByTestId('flight-date')).toHaveTextContent('Thu 11th May 2023');
        expect(formatDateL10n).toHaveBeenCalledWith(
            mockProps.route.depDate,
            DATE_FORMATS.DayOfWeekOrdinalDayMonthYearAbbr,
        );
        expect(formatDateL10n).toHaveBeenCalledWith(mockProps.route.depDate, DATE_FORMATS.time);
        expect(formatDateL10n).toHaveBeenCalledWith(mockProps.route.arrDate, DATE_FORMATS.time);
        expect(getByTestId('dep-location')).toHaveTextContent('London Gatwick(LGW)');
        expect(getByTestId('arr-location')).toHaveTextContent('Lanzarote(ACE)');
    });

    describe('Flight Direction', () => {
        it('Should render outbound flight', () => {
            const { getByTestId } = render(<Flight {...mockProps} />);

            expect(getByTestId('outbound-flight')).toBeInTheDocument();
        });

        it('Should render inbound flight', () => {
            mockProps.route.direction = RouteDirection.Inbound;

            const { getByTestId } = render(<Flight {...mockProps} />);

            expect(getByTestId('inbound-flight')).toBeInTheDocument();
        });
    });

    describe('flight number', () => {
        beforeEach(() => {
            mockProps.route.fltNo = '1234';
        });

        it('should not show flight number when it is NOT set', () => {
            mockProps.route.fltNo = '';
            render(<Flight {...mockProps} />);

            expect(screen.queryByTestId('flight-number')).not.toBeInTheDocument();
        });

        it('should not show flight number when is not trade portal', () => {
            render(<Flight {...mockProps} />);

            expect(screen.queryByTestId('flight-number')).not.toBeInTheDocument();
        });

        it('should show flight number when is trade portal', () => {
            mockStores.layoutStore.isTradePortal = true;
            render(<Flight {...mockProps} />);

            expect(screen.getByTestId('flight-number')).toBeInTheDocument();
            expect(screen.getByTestId('flight-number')).toHaveClass('flightNumber');
        });
    });

    describe('Icon', () => {
        it('Should NOT reflect icon for outbound flight', () => {
            const { getByTestId } = render(<Flight {...mockProps} />);

            expect(getByTestId('icon').children[0]).not.toHaveClass('icon--reflect-x');
        });

        it('Should reflect icon for inbound flight', () => {
            mockProps.route.direction = RouteDirection.Inbound;

            const { getByTestId } = render(<Flight {...mockProps} />);

            expect(getByTestId('icon').children[0]).toHaveClass('icon--reflect-x');
        });

        it('Should render orange icon', () => {
            mockProps.isIconOrange = true;

            const { getByTestId } = render(<Flight {...mockProps} />);

            expect(getByTestId('icon')).toHaveClass('iconOrange');
        });

        it('Should NOT render orange icon', () => {
            const { getByTestId } = render(<Flight {...mockProps} />);

            expect(getByTestId('icon')).not.toHaveClass('iconOrange');
        });
    });

    describe('Terminal information', () => {
        beforeEach(() => {
            mockStores.layoutStore.isTerminalInformationEnabled = true;
            mockProps.shouldShowTerminal = true;
        });

        it('Should render TerminalInfo with correct props', () => {
            render(<Flight {...mockProps} />);

            expect(mockTerminalInfo).toHaveBeenCalledWith({
                fields: mockProps.fields,
                terminal: mockProps.route.depTerminal,
            });

            expect(mockTerminalInfo).toHaveBeenCalledWith({
                fields: mockProps.fields,
                terminal: mockProps.route.arrTerminal,
            });
        });

        it('should NOT render terminal information when shouldShowTerminal is false', () => {
            mockProps.shouldShowTerminal = false;

            render(<Flight {...mockProps} />);

            expect(mockTerminalInfo).not.toHaveBeenCalled();
        });

        it('Should NOT render terminal information when isTerminalInformationEnabled is false', () => {
            mockStores.layoutStore.isTerminalInformationEnabled = false;

            render(<Flight {...mockProps} />);

            expect(mockTerminalInfo).not.toHaveBeenCalled();
        });

        it('Should NOT render terminal information when there is no fields', () => {
            mockProps.fields = undefined;

            render(<Flight {...mockProps} />);

            expect(mockTerminalInfo).not.toHaveBeenCalled();
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<Flight {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
