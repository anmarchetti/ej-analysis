import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockBooking, mockLuggageBenefit, mockSeats } from 'frontend/__mocks__';
import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockResolvedObservablePromise } from 'frontend/utils/observerablePromise/mockedObservableFromPromise';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import AmendDatesSummarySeats, { IAmendDatesSummarySeatsProps } from './AmendDatesSummarySeats';

let mockProps: IAmendDatesSummarySeatsProps;
let mockStores;

jest.mock(
    'frontend/components/renderings/AmendDatesSummary/components/AmendDatesSummarySeats/AmendDatesSummarySeats.utils',
    () => ({
        getSelectedSeats: jest.fn().mockReturnValue({
            outboundSeats: mockSeats,
            inboundSeats: mockSeats,
        }),
    }),
);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockExpandProps = jest.fn();
jest.mock('frontend/components/common/AmendSummary/AmendSummaryAccordion/AmendSummaryAccordion', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockExpandProps(props);

        return <div data-tid={props.dataTid}>{children}</div>;
    },
}));

const mockAmendDatesSummaryEditBtn = jest.fn();
jest.mock('frontend/components/common/AmendSummary/EditButton/EditButton', () => ({
    __esModule: true,
    default: props => {
        mockAmendDatesSummaryEditBtn(props);

        return <button data-tid='edit-btn' onClick={props.onClick} />;
    },
}));

const mockSeatDirectionProps = jest.fn();
jest.mock('./components/SeatsSummary/SeatsSummary', () => ({
    __esModule: true,
    default: props => {
        mockSeatDirectionProps(props);

        return <div data-tid='seats-direction' />;
    },
}));

const mockSeatBagsProps = jest.fn();
jest.mock('./components/AmendDatesSummarySeatsBags/AmendDatesSummarySeatsBags', () => ({
    __esModule: true,
    default: props => {
        mockSeatBagsProps(props);

        return <div data-tid='summary-seats-bags' />;
    },
}));

const mockSeatsMapProps = jest.fn();
jest.mock('./components/AmendDatesSummarySeatMap/AmendDatesSummarySeatMap', () => ({
    __esModule: true,
    default: props => {
        mockSeatsMapProps(props);

        return <div data-tid='seats-map' onClick={props.onClose} />;
    },
}));

const mockInfoMessage = jest.fn();
jest.mock('frontend/components/common/InfoBlock/InfoBlock', () => ({
    __esModule: true,
    default: props => {
        mockInfoMessage(props);

        return <div data-tid='info-message' />;
    },
}));

const mockWarningPopupProps = jest.fn();
jest.mock('frontend/components/renderings/WarningPopup/WarningPopup', () => ({
    __esModule: true,
    default: props => {
        mockWarningPopupProps(props);

        return <div data-tid='warning-popup' />;
    },
}));

describe('<AmendDatesSummarySeats />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            routerStore: {
                redirectToAmendDatesSeatsAndBagsPage: jest.fn(),
            },
            amendDatesStore: {
                seats: {
                    isSeatNoLongerAvailable: false,
                    hasSeatsPriceChanged: false,
                    setIsSeatNoLongerAvailable: jest.fn(),
                    setHasSeatsPriceChanged: jest.fn(),
                    checkForSeatsAvailability: jest.fn(),
                    setIsSeatMapShown: jest.fn(),
                    isAmendCTAVisible: true,
                    fetchSeatMapsRequest: mockResolvedObservablePromise(),
                    onReturnToSummaryClick: jest.fn(),
                },
            },
        });
        mockProps = {
            fields: {
                AddSeatsCTA: mockSitecoreField('AddSeatsCTA'),
                BagsLabel: mockSitecoreField('BagsLabel'),
                FallbackBenefit: { fields: mockLuggageBenefit, id: 'benefit' },
                InboundLabel: mockSitecoreField('InboundLabel'),
                OutboundLabel: mockSitecoreField('OutboundLabel'),
                SeatsIcon: mockSitecoreField(mockSitecoreImageField('SeatsIcon')),
                SeatsTitle: mockSitecoreField('SeatsTitle'),
                SeatsUnavailableDescription: mockSitecoreField('SeatsUnavailableDescription'),
                SeatsUnavailableTitle: mockSitecoreField('SeatsUnavailableTitle'),
                SeatsPopupTitle: mockSitecoreField('SeatsPopupTitle'),
                SeatsNotAvailableDescription: mockSitecoreField('SeatsNotAvailableDescription'),
                SeatsPopupPrimaryCTA: mockSitecoreField('SeatsPopupPrimaryCTA'),
                SeatsPopupSecondaryCTA: mockSitecoreField('SeatsPopupSecondaryCTA'),
                SeatsPriceChangedDescription: mockSitecoreField('SeatsPriceChangedDescription'),
                PopupIcon: mockSitecoreField(mockSitecoreImageField('PopupIcon')),
            } as any,
            rendering: 'rendering',
        };
    });

    it('Render components', () => {
        const commonSeatDirectionProps = {
            fields: mockProps.fields,
            chosenSeats: mockSeats,
        };
        const outboundRoute = mockStores.amendDatesStore.offerWithPrices!.offer.transport.routes[0];
        const inboundRoute = mockStores.amendDatesStore.offerWithPrices!.offer.transport.routes[1];

        render(<AmendDatesSummarySeats {...mockProps} />);

        expect(screen.queryByTestId('info-message')).not.toBeInTheDocument();
        expect(screen.getByTestId('summary-seats-bags')).toBeInTheDocument();
        expect(screen.getByTestId('amend-summary-seats')).toBeInTheDocument();
        expect(mockExpandProps).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: mockProps.fields.SeatsIcon,
                title: mockProps.fields.SeatsTitle.value,
                dataTid: 'amend-summary-seats',
            }),
        );
        expect(screen.getAllByTestId('seats-direction').length).toBe(2);
        expect(mockSeatDirectionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                ...commonSeatDirectionProps,
                route: outboundRoute,
                title: 'OutboundLabel',
            }),
        );
        expect(mockSeatDirectionProps).toHaveBeenCalledWith(
            expect.objectContaining({
                ...commonSeatDirectionProps,
                route: inboundRoute,
                title: 'InboundLabel',
            }),
        );
        expect(screen.getByTestId('summary-seats-bags')).toBeInTheDocument();
        expect(mockSeatBagsProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
            title: 'BagsLabel',
        });

        expect(screen.getByTestId('edit-btn')).toBeInTheDocument();
        expect(mockAmendDatesSummaryEditBtn).toHaveBeenCalledWith(
            expect.objectContaining({
                children: mockProps.fields.AddSeatsCTA.value,
                dataTid: 'amend-dates-summary-seats-button',
                isPlaceholderShimmer: false,
            }),
        );
        expect(mockStores.amendDatesStore.seats.checkForSeatsAvailability).toHaveBeenCalled();
    });

    it('Should call setIsShowSeatMap on edit button click', async () => {
        render(<AmendDatesSummarySeats {...mockProps} />);

        const editBtn = screen.getByTestId('edit-btn');
        expect(editBtn).toBeInTheDocument();
        await userEvent.click(editBtn);

        expect(mockStores.amendDatesStore.seats.setIsSeatMapShown).toHaveBeenCalled();
    });

    it('Should not render CTA when isVisible is false', () => {
        mockStores.amendDatesStore.seats.isAmendCTAVisible = false;
        render(<AmendDatesSummarySeats {...mockProps} />);

        expect(screen.queryByTestId('edit-btn')).not.toBeInTheDocument();
    });

    it('Should render CTA with isPlaceholderShimmer when fetchSeatMapsRequest is pending', () => {
        mockStores.amendDatesStore.seats.fetchSeatMapsRequest = mockResolvedObservablePromise();
        mockStores.amendDatesStore.seats.isAmendCTAVisible = true;
        render(<AmendDatesSummarySeats {...mockProps} />);

        expect(screen.getByTestId('edit-btn')).toBeInTheDocument();
        expect(mockAmendDatesSummaryEditBtn).toHaveBeenCalledWith(
            expect.objectContaining({
                isPlaceholderShimmer: true,
            }),
        );
    });

    it('Should NOT render the component', () => {
        mockStores.amendDatesStore.booking = null;
        const { container } = render(<AmendDatesSummarySeats {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('AmendDatesSummarySeatMap', () => {
        beforeEach(() => {
            mockStores.amendDatesStore.seats.isSeatMapShown = true;
            mockStores.amendDatesStore.booking = mockBooking;
        });

        it('Should NOT render seat map when isShowSeatMap is false', () => {
            mockStores.amendDatesStore.seats.isSeatMapShown = false;
            render(<AmendDatesSummarySeats {...mockProps} />);

            expect(screen.queryByTestId('seats-map')).not.toBeInTheDocument();
        });

        it('Should render seats map when isShowSeatMap is true', () => {
            render(<AmendDatesSummarySeats {...mockProps} />);

            expect(screen.getByTestId('seats-map')).toBeInTheDocument();
            expect(mockSeatsMapProps).toHaveBeenCalledWith({
                rendering: 'rendering',
                onClose: expect.any(Function),
            });
        });

        it('Should call setIsSeatMapShown on close', async () => {
            render(<AmendDatesSummarySeats {...mockProps} />);

            const seatMap = screen.getByTestId('seats-map');

            await userEvent.click(seatMap);

            expect(mockStores.amendDatesStore.seats.setIsSeatMapShown).toHaveBeenCalledWith(false);
        });
    });

    describe('WarningPopup', () => {
        it('Should render WarningPopup when isSeatNoLongerAvailable is true', () => {
            mockStores.amendDatesStore.seats.isSeatNoLongerAvailable = true;
            render(<AmendDatesSummarySeats {...mockProps} />);

            expect(screen.getByTestId('warning-popup')).toBeInTheDocument();
            expect(mockWarningPopupProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockProps.fields.SeatsPopupTitle,
                    description: mockProps.fields.SeatsNotAvailableDescription,
                    icon: mockProps.fields.PopupIcon,
                    ctaText: mockProps.fields.SeatsPopupPrimaryCTA,
                    secondaryCtaText: mockProps.fields.SeatsPopupSecondaryCTA,
                    onClose: expect.any(Function),
                    onSecondaryCtaClick: expect.any(Function),
                }),
            );
        });

        it('Should render WarningPopup when hasSeatsPriceChanged is true', () => {
            mockStores.amendDatesStore.seats.hasSeatsPriceChanged = true;
            render(<AmendDatesSummarySeats {...mockProps} />);

            expect(screen.getByTestId('warning-popup')).toBeInTheDocument();
            expect(mockWarningPopupProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockProps.fields.SeatsPopupTitle,
                    description: mockProps.fields.SeatsPriceChangedDescription,
                    icon: mockProps.fields.PopupIcon,
                    ctaText: mockProps.fields.SeatsPopupPrimaryCTA,
                    secondaryCtaText: mockProps.fields.SeatsPopupSecondaryCTA,
                    onClose: expect.any(Function),
                    onSecondaryCtaClick: expect.any(Function),
                }),
            );
        });

        it('Should NOT render WarningPopup if both isSeatNoLongerAvailable and hasSeatsPriceChanged are false', () => {
            render(<AmendDatesSummarySeats {...mockProps} />);

            expect(screen.queryByTestId('warning-popup')).not.toBeInTheDocument();
        });
    });

    describe('Unavailable seats message info', () => {
        it('Should be rendered when isDisabledBySitecore is true', () => {
            mockStores.amendDatesStore.seats.isDisabledBySitecore = true;
            mockStores.amendDatesStore.seats.isAmendCTAVisible = false;

            render(<AmendDatesSummarySeats {...mockProps} />);

            expect(screen.getByTestId('info-message')).toBeInTheDocument();
            expect(mockInfoMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockProps.fields.SeatsUnavailableTitle,
                    text: mockProps.fields.SeatsUnavailableDescription,
                    dataTid: 'amend-dates-seats-unavailable-message',
                    withWarningIcon: false,
                    className: 'warningMessage',
                    textClass: 'warningMessageText',
                }),
            );

            expect(mockExpandProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    expanderClassName: 'withInfo',
                }),
            );
        });

        it('Should be rendered when isSeatMapFailed is true', () => {
            mockStores.amendDatesStore.seats.isDisabledBySitecore = false;
            mockStores.amendDatesStore.seats.isAmendCTAVisible = false;

            render(<AmendDatesSummarySeats {...mockProps} />);

            expect(screen.getByTestId('info-message')).toBeInTheDocument();
            expect(mockInfoMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: mockProps.fields.SeatsUnavailableTitle,
                    text: mockProps.fields.SeatsUnavailableDescription,
                    dataTid: 'amend-dates-seats-unavailable-message',
                    withWarningIcon: true,
                    className: 'warningMessage',
                    textClass: 'warningMessageText',
                }),
            );
        });
    });
});
