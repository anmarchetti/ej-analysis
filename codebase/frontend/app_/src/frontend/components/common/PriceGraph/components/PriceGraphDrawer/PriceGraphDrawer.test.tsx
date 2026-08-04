/* eslint-disable react/function-component-definition */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ComparePriceModuleContentType from 'models/enum/ComparePriceModuleContentType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import PriceGraphDrawer from './PriceGraphDrawer';

const createProps = () => ({
    activeDate: new Date(),
    selectedDate: new Date(),
    drawerRef: null as any,
    holidayDurationLabel: 'holidayDurationLabel',
    drawerTabs: null,
    currentContentType: ComparePriceModuleContentType.Calendar,
    seatsReservationNotification: null,
    onClickCancel: jest.fn(),
    onConfirmClick: jest.fn(),
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p), getSetting: jest.fn(() => false) },
    bookingStore: { isExternalHotel: false },
    priceGraphStore: { priceGraphPopupVisible: true },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Drawer', () => ({ children }) => <div data-tid='drawer'>{children}</div>);

jest.mock('frontend/components/common/ErrorMessage', () => ({ children }) => <div data-tid='error'>{children}</div>);

jest.mock('frontend/components/common/Weekdays/Weekdays', () => () => <div data-tid='weekdays' />);

describe('<PriceGraphDrawer />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    describe('Closed Drawer', () => {
        it('should render empty Drawer when is NOT expanded', () => {
            mockStores.priceGraphStore.priceGraphPopupVisible = false;
            render(<PriceGraphDrawer {...mockProps} />);

            expect(screen.queryByTestId('drawer')).toBeEmptyDOMElement();
        });
    });

    describe('Opened Drawer', () => {
        it('should render drawer content when is expanded', () => {
            render(
                <PriceGraphDrawer {...mockProps}>
                    <div data-tid='children' />
                </PriceGraphDrawer>,
            );

            expect(screen.queryByTestId('popup-tabs')).not.toBeInTheDocument();
            expect(screen.getByTestId('drawer')).toBeInTheDocument();
            expect(screen.getByText('holidayDurationLabel')).toBeInTheDocument();
            expect(screen.getByTestId('children')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsCancel })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: SitecoreDictionary.PriceGraphButtonsApply })).toBeInTheDocument();
        });

        it('should render tabs', () => {
            mockProps.drawerTabs = <div data-tid='tabs' />;
            render(<PriceGraphDrawer {...mockProps} />);

            expect(screen.getByTestId('tabs')).toBeInTheDocument();
            expect(screen.getByTestId('popup-tabs')).toBeInTheDocument();
        });

        it('should render seats notification', () => {
            mockProps.seatsReservationNotification = <div data-tid='seats-notification' />;
            render(<PriceGraphDrawer {...mockProps} />);

            expect(screen.getByTestId('seats-notification')).toBeInTheDocument();
        });

        describe('error message', () => {
            it('should render error message when isExternalHotel and PriceGraphHideInfoMessage is false', () => {
                mockStores.bookingStore.isExternalHotel = true;
                render(<PriceGraphDrawer {...mockProps} />);

                expect(screen.getByTestId('error')).toBeInTheDocument();
            });

            it('should NOT render error message when is NOT ExternalHotel', () => {
                render(<PriceGraphDrawer {...mockProps} />);

                expect(screen.queryByTestId('error')).not.toBeInTheDocument();
            });

            it('should NOT render error message when PriceGraphHideInfoMessage is true', () => {
                mockStores.layoutStore.getSetting = jest.fn(() => true);
                mockStores.bookingStore.isExternalHotel = true;
                render(<PriceGraphDrawer {...mockProps} />);

                expect(screen.queryByTestId('error')).not.toBeInTheDocument();
            });
        });

        describe('weekdays', () => {
            it('should render weekdays when currentContentType is calendar', () => {
                mockProps.currentContentType = ComparePriceModuleContentType.Calendar;
                render(<PriceGraphDrawer {...mockProps} />);

                expect(screen.getByTestId('weekdays')).toBeInTheDocument();
            });

            it('should NOT render weekdays when currentContentType is NOT calendar', () => {
                mockProps.currentContentType = ComparePriceModuleContentType.Graph;
                render(<PriceGraphDrawer {...mockProps} />);

                expect(screen.queryByTestId('weekdays')).not.toBeInTheDocument();
            });
        });

        it('should call onClickCancel when cancel button is clicked', async () => {
            render(<PriceGraphDrawer {...mockProps} />);

            await userEvent.click(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsCancel }));

            expect(mockProps.onClickCancel).toHaveBeenCalled();
        });

        it('should not call onConfirmClick when click on disabled apply button', async () => {
            const date = new Date();
            mockProps.selectedDate = date;
            mockProps.activeDate = date;

            render(<PriceGraphDrawer {...mockProps} />);

            const button = screen.getByRole('button', { name: SitecoreDictionary.PriceGraphButtonsApply });

            expect(button).toBeDisabled();

            await userEvent.click(button);

            expect(mockProps.onConfirmClick).not.toHaveBeenCalled();
        });

        it('should call onConfirmClick when click on enabled apply button', async () => {
            mockProps.selectedDate = new Date();
            mockProps.activeDate = new Date(mockProps.selectedDate.getDate() + 1);
            render(<PriceGraphDrawer {...mockProps} />);

            const button = screen.getByRole('button', { name: SitecoreDictionary.PriceGraphButtonsApply });

            expect(button).toBeEnabled();

            await userEvent.click(button);

            expect(mockProps.onConfirmClick).toHaveBeenCalled();
        });
    });
});
