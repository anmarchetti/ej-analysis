import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockHoldLuggageFields } from 'frontend/components/renderings/HoldLuggage/__mocks__/mockHoldLuggageFields';

import HoldLuggageBanners from './HoldLuggageBanners';

const createProps = () => ({
    internalFlightDescription: mockHoldLuggageFields.InternalFlightDescription,
    internalFlightHeader: mockHoldLuggageFields.InternalFlightHeader,
    requestFailureDescription: mockHoldLuggageFields.RequestFailureDescription,
    requestFailureHeader: mockHoldLuggageFields.RequestFailureHeader,
    unavailableMessageDescription: mockHoldLuggageFields.UnavailableMessageDescription,
    unavailableMessageHeader: mockHoldLuggageFields.UnavailableMessageHeader,
});

const createStores = () => ({
    bookingStore: {
        isFlightExtrasFailed: false,
        isFlightExternal: true,
        extraLuggageCategoriesExist: true,
    },
    layoutStore: {
        isExtraLuggageEnabled: true,
    },
    viewBookingStore: {
        isFlightExternal: true,
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockInfoBlock = jest.fn();
jest.mock('frontend/components/common/InfoBlock/InfoBlock.tsx', () => ({
    __esModule: true,
    default: props => {
        mockInfoBlock(props);

        return <div data-tid={props.dataTid} />;
    },
}));

describe('Hold Luggage Banners Component', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render any banner when all conditions are met for a normal external flight with luggage enabled', () => {
        render(<HoldLuggageBanners {...mockProps} />);
        expect(screen.queryByTestId('hold-luggage-disable')).not.toBeInTheDocument();
        expect(screen.queryByTestId('banner-internal')).not.toBeInTheDocument();
        expect(screen.queryByTestId('banner-disabled')).not.toBeInTheDocument();
        expect(mockInfoBlock).not.toHaveBeenCalled();
    });

    it('should render Disable Luggage Component when extra luggage is disabled', () => {
        mockStores.layoutStore.isExtraLuggageEnabled = false;

        render(<HoldLuggageBanners {...mockProps} />);

        expect(screen.queryByTestId('hold-luggage-disable')).toBeInTheDocument();
        expect(mockInfoBlock).toHaveBeenCalledWith(
            expect.objectContaining({
                text: mockProps.unavailableMessageDescription,
                title: mockProps.unavailableMessageHeader,
                className: 'failureBanner',
                dataTid: 'hold-luggage-disable',
            }),
        );
    });

    it('should render Internal Flight Banner when flight is internal', () => {
        mockStores.bookingStore.isFlightExternal = false;
        mockStores.viewBookingStore.isFlightExternal = false;

        render(<HoldLuggageBanners {...mockProps} />);

        expect(screen.queryByTestId('banner-internal')).toBeInTheDocument();
        expect(mockInfoBlock).toHaveBeenCalledWith(
            expect.objectContaining({
                text: mockProps.internalFlightDescription,
                title: mockProps.internalFlightHeader,
                className: 'failureBanner',
                dataTid: 'banner-internal',
            }),
        );
    });

    describe('Request Failure Banner', () => {
        it('should render Request Failure Banner when API call fails', () => {
            mockStores.bookingStore.isFlightExtrasFailed = true;
            render(<HoldLuggageBanners {...mockProps} />);

            expect(screen.queryByTestId('banner-disabled')).toBeInTheDocument();
            expect(mockInfoBlock).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: mockProps.requestFailureDescription,
                    title: mockProps.requestFailureHeader,
                    withWarningIcon: true,
                    className: 'failureBanner',
                    dataTid: 'banner-disabled',
                }),
            );
        });

        it('should render Request Failure Banner when extraLuggageCategoriesExist is false', () => {
            mockStores.bookingStore.extraLuggageCategoriesExist = false;
            render(<HoldLuggageBanners {...mockProps} />);

            expect(screen.queryByTestId('banner-disabled')).toBeInTheDocument();
            expect(mockInfoBlock).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: mockProps.requestFailureDescription,
                    title: mockProps.requestFailureHeader,
                    withWarningIcon: true,
                    className: 'failureBanner',
                    dataTid: 'banner-disabled',
                }),
            );
        });
    });

    it('should render ONLY Internal Flight Banner when flight is internal and other conditions do not trigger banners', () => {
        mockStores.bookingStore.isFlightExternal = false;
        mockStores.viewBookingStore.isFlightExternal = false;
        mockStores.layoutStore.isExtraLuggageEnabled = true;
        mockStores.bookingStore.isFlightExtrasFailed = false;
        mockStores.bookingStore.extraLuggageCategoriesExist = true;

        render(<HoldLuggageBanners {...mockProps} />);

        expect(screen.queryByTestId('banner-internal')).toBeInTheDocument();
        expect(screen.queryByTestId('banner-disabled')).not.toBeInTheDocument();
        expect(screen.queryByTestId('hold-luggage-disable')).not.toBeInTheDocument();
        expect(mockInfoBlock).toHaveBeenCalledWith(
            expect.objectContaining({
                text: mockProps.internalFlightDescription,
                title: mockProps.internalFlightHeader,
                className: 'failureBanner',
                dataTid: 'banner-internal',
            }),
        );
    });

    it('should render Disable Luggage Component when luggage is disabled, even when other conditions would trigger other banners', () => {
        mockStores.layoutStore.isExtraLuggageEnabled = false;
        mockStores.bookingStore.isFlightExternal = false;
        mockStores.bookingStore.isFlightExtrasFailed = true;

        render(<HoldLuggageBanners {...mockProps} />);

        expect(screen.queryByTestId('hold-luggage-disable')).toBeInTheDocument();
        expect(screen.queryByTestId('banner-internal')).not.toBeInTheDocument();
        expect(screen.queryByTestId('banner-disabled')).not.toBeInTheDocument();
        expect(mockInfoBlock).toHaveBeenCalledWith(
            expect.objectContaining({
                text: mockProps.unavailableMessageDescription,
                title: mockProps.unavailableMessageHeader,
                className: 'failureBanner',
                dataTid: 'hold-luggage-disable',
            }),
        );
    });

    it('should render nothing when all conditions are met correctly for an external flight with enabled luggage', () => {
        render(<HoldLuggageBanners {...mockProps} />);

        const { container } = render(<HoldLuggageBanners {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
    });
});
