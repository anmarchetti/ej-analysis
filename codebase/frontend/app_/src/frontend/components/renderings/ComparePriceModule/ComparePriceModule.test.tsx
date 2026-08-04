import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { comparePriceFieldsMock } from 'frontend/__mocks__/comparePrice';
import { NewOfferState } from 'frontend/store/base/comparePricesCalendar/ComparePricesCalendarStore';
import * as dateUtils from 'frontend/utils/date.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import ComparePriceModuleVariant from 'models/enum/ComparePriceModuleVariant';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import { IComparePriceModuleFields } from './components/ComparePriceContent/ComparePriceContent.utils';
import ComparePrice from './ComparePriceModule';

jest.mock('./components/ComparePriceButton/ComparePriceButton', () => ({
    __esModule: true,
    default: ({ onClick }) => <button data-tid='compare-price-button' onClick={onClick} onKeyDown={jest.fn()} />,
}));

const mockComparePriceContentProps = jest.fn();
jest.mock('./components/ComparePriceContent/ComparePriceContent', () => ({
    __esModule: true,
    default: ({ onClose, resetSelectedOffer, ...props }) => {
        mockComparePriceContentProps(props);

        return (
            <div>
                <button onClick={() => onClose()} onKeyDown={jest.fn()} data-tid='compare-price-content' />
                <button onClick={() => resetSelectedOffer()} data-tid='compare-price-content-reset' />
            </div>
        );
    },
}));

jest.mock('frontend/components/common/OverlaySpinner', () => ({
    __esModule: true,
    default: () => <div data-tid='overlay-spinner' />,
}));

const mockComparePriceInfoPopupProps = jest.fn();
jest.mock(
    'frontend/components/renderings/ComparePriceModule/components/ComparePriceInfoPopup/ComparePriceInfoPopup',
    () => ({
        __esModule: true,
        default: ({ onClose, ...props }) => {
            mockComparePriceInfoPopupProps(props);

            return <button onClick={onClose} onKeyDown={jest.fn()} data-tid='compare-price-info-popup' />;
        },
    }),
);

const createProps = (): ISitecoreComponent<IComparePriceModuleFields> => ({
    params: {},
    rendering: {},
    fields: comparePriceFieldsMock,
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let props;
let mockStores;

jest.spyOn(dateUtils, 'getDate').mockImplementation(p => new Date(p));

describe('<ComparePrice />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            comparePricesCalendarStore: {
                setNewOfferState: jest.fn(),
                newOfferState: NewOfferState.NoChange,
                isDisplayed: true,
                setIsDisplayed: jest.fn(),
                isLoadingError: false,
                isLoadingOfferForNewDate: false,
                selectOfferOnPriceGraph: jest.fn(),
            },
            layoutStore: { setIsPriceToggleHidden: jest.fn(), isTradePortal: false },
            bookingStore: { selectedOffer: { accom: { stay: 6 }, date: '2023-10-01' } },
        });
    });

    it('should NOT render when fields are NOT provided', () => {
        props.fields = undefined;

        const { container } = render(<ComparePrice {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when variant is nothing-variant', () => {
        const { container } = render(<ComparePrice {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when variant is undefined', () => {
        props.fields.Variant = mockSitecoreField(undefined);

        const { container } = render(<ComparePrice {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render content when variant is NOT nothing-variant', async () => {
        props.fields.Variant = mockSitecoreField(ComparePriceModuleVariant.CalendarFirstVariant);

        render(<ComparePrice {...props} />);

        const button = screen.getByTestId('compare-price-button');

        await userEvent.click(button);

        expect(button).toBeInTheDocument();
        expect(screen.getByTestId('compare-price-content')).toBeInTheDocument();
        expect(screen.getByTestId('compare-price-info-popup')).toBeInTheDocument();
        expect(screen.queryByTestId('overlay-spinner')).not.toBeInTheDocument();
        expect(mockComparePriceInfoPopupProps).toHaveBeenCalledWith(
            expect.objectContaining({
                shouldShow: false,
            }),
        );

        expect(mockComparePriceContentProps).toHaveBeenCalledWith({
            fields: props.fields,
            params: props.params,
            rendering: props.rendering,
            holidayDuration: 6,
            isResetingSelectedOffer: false,
            selectedDate: new Date(mockStores.bookingStore.selectedOffer.date),
        });
    });

    it('should render overlay when isLoadingOfferForNewDate is true', async () => {
        props.fields.Variant = mockSitecoreField(ComparePriceModuleVariant.CalendarFirstVariant);
        mockStores.comparePricesCalendarStore.isLoadingOfferForNewDate = true;

        render(<ComparePrice {...props} />);

        const button = screen.getByTestId('compare-price-button');

        await userEvent.click(button);

        expect(button).toBeInTheDocument();
        expect(screen.getByTestId('compare-price-content')).toBeInTheDocument();
        expect(screen.getByTestId('overlay-spinner')).toBeInTheDocument();
    });

    it('should render ComparePriceContent on ComparePriceButton click and hide it onClose click', async () => {
        props.fields.Variant = mockSitecoreField(ComparePriceModuleVariant.CalendarFirstVariant);

        render(<ComparePrice {...props} />);

        const button = screen.getByTestId('compare-price-button');
        await userEvent.click(button);

        const content = screen.getByTestId('compare-price-content');
        expect(content).toBeInTheDocument();

        await userEvent.click(content);

        expect(mockStores.comparePricesCalendarStore.setIsDisplayed).toHaveBeenCalledWith(false);
    });

    it('should call selectOfferOnPriceGraph on reset selected offer', async () => {
        render(<ComparePrice {...props} />);

        const content = screen.getByTestId('compare-price-content-reset');

        await userEvent.click(content);

        expect(mockStores.comparePricesCalendarStore.selectOfferOnPriceGraph).toHaveBeenCalled();
    });

    it('should show confirm popup when isLoading is false and newOfferState is accepted', () => {
        props.fields.Variant = mockSitecoreField(ComparePriceModuleVariant.CalendarFirstVariant);
        mockStores.comparePricesCalendarStore.newOfferState = NewOfferState.Accepted;

        render(<ComparePrice {...props} />);

        expect(mockComparePriceInfoPopupProps).toHaveBeenCalledWith({
            icon: mockSitecoreField({
                src: 'confirm icon',
            }),
            shouldShow: true,
            subtitle: mockSitecoreField('ConfirmationPopupSubtitle'),
            title: mockSitecoreField('ConfirmationPopupTitle'),
            type: 'confirm',
        });
    });

    it('should show error popup when isLoading is false and newOfferState is error', () => {
        props.fields.Variant = mockSitecoreField(ComparePriceModuleVariant.CalendarFirstVariant);
        mockStores.comparePricesCalendarStore.newOfferState = NewOfferState.Error;

        render(<ComparePrice {...props} />);

        expect(mockComparePriceInfoPopupProps).toHaveBeenCalledWith({
            icon: mockSitecoreField({ src: 'error icon' }),
            isSmall: true,
            shouldShow: true,
            subtitle: mockSitecoreField('ErrorPopupSubtitle'),
            title: mockSitecoreField('ErrorPopupTitle'),
            type: 'error',
        });
    });

    it('should call setNewOfferState with NewOfferState.NoChange on confirm popup close', async () => {
        props.fields.Variant = mockSitecoreField(ComparePriceModuleVariant.CalendarFirstVariant);
        mockStores.comparePricesCalendarStore.newOfferState = NewOfferState.Accepted;

        render(<ComparePrice {...props} />);

        const closeButton = screen.getAllByTestId('compare-price-info-popup')[0];

        await userEvent.click(closeButton);

        expect(mockStores.comparePricesCalendarStore.setNewOfferState).toHaveBeenCalledWith(NewOfferState.NoChange);
    });

    it('should call setNewOfferState with NewOfferState.NoChange on error popup close', async () => {
        props.fields.Variant = mockSitecoreField(ComparePriceModuleVariant.CalendarFirstVariant);
        mockStores.comparePricesCalendarStore.newOfferState = NewOfferState.Error;

        render(<ComparePrice {...props} />);

        const closeButton = screen.getByTestId('compare-price-info-popup');

        await userEvent.click(closeButton);

        expect(mockStores.comparePricesCalendarStore.setNewOfferState).toHaveBeenCalledWith(NewOfferState.NoChange);
    });

    describe('useEffect', () => {
        beforeEach(() => {
            mockStores.layoutStore.isTradePortal = true;
        });

        it('should NOT call setIsPriceToggleHidden when isTradePortal is false', () => {
            mockStores.layoutStore.isTradePortal = false;

            render(<ComparePrice {...props} />);

            expect(mockStores.layoutStore.setIsPriceToggleHidden).not.toHaveBeenCalled();
        });

        it('should call setIsPriceToggleHidden with false when isLoading and isDisplayed are false', () => {
            mockStores.comparePricesCalendarStore.isDisplayed = false;

            render(<ComparePrice {...props} />);

            expect(mockStores.layoutStore.setIsPriceToggleHidden).toHaveBeenCalledWith(false);
        });

        it('should call setIsPriceToggleHidden with true when isLoading is true', () => {
            props.isResetingSelectedOffer = true;

            render(<ComparePrice {...props} />);

            expect(mockStores.layoutStore.setIsPriceToggleHidden).toHaveBeenCalledWith(true);
        });

        it('should call setIsPriceToggleHidden with true when isOpen is true', async () => {
            render(<ComparePrice {...props} />);

            const button = screen.getByTestId('compare-price-button');

            await userEvent.click(button);

            expect(mockStores.layoutStore.setIsPriceToggleHidden).toHaveBeenCalledWith(true);
        });

        it('should call setIsPriceToggleHidden on unmount', () => {
            const { unmount } = render(<ComparePrice {...props} />);

            unmount();

            expect(mockStores.layoutStore.setIsPriceToggleHidden).toHaveBeenCalledTimes(2);
        });

        it('should call setIsDisplayed when isLoadingError is true', async () => {
            mockStores.comparePricesCalendarStore.isLoadingError = true;

            render(<ComparePrice {...props} />);

            expect(mockStores.comparePricesCalendarStore.setIsDisplayed).toHaveBeenCalledWith(false);
        });

        it('should NOT call setIsDisplayed when isLoadingError is false', async () => {
            render(<ComparePrice {...props} />);

            expect(mockStores.comparePricesCalendarStore.setIsDisplayed).not.toHaveBeenCalled();
        });
    });
});
