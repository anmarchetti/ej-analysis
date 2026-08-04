import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { AmendmentType } from 'models/data/IBookingInfo';
import SitePath from 'models/enum/SitePath';

import AmendPaymentHeader, { IAmendPaymentHeaderFields } from './AmendPaymentHeader';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/OverlaySpinner', () => ({
    __esModule: true,
    default: () => <div>OverlaySpinner</div>,
}));

let mockGetAmendPaymentConfigReturnValue = {};
jest.mock('frontend/components/renderings/AmendPayment/AmendPayment.utils', () => ({
    getAmendPaymentConfig: () => mockGetAmendPaymentConfigReturnValue,
}));

const mockRouter = {
    back: jest.fn(),
};
jest.mock('next/router', () => ({
    __esModule: true,
    useRouter: () => mockRouter,
}));

describe('<AmendPaymentHeader />', () => {
    const resetMocks = () => ({
        fields: {
            PayTitle: mockSitecoreField('PayTitle'),
            RefundTitle: mockSitecoreField('RefundTitle'),
            SpinnerDescription: mockSitecoreField('SpinnerDescription'),
            SpinnerTitle: mockSitecoreField('SpinnerTitle'),
            Subtitle: mockSitecoreField('Subtitle'),
        } as IAmendPaymentHeaderFields,
        params: {} as any,
        rendering: {} as any,
    });
    let mocks = resetMocks();

    beforeEach(() => {
        jest.resetAllMocks();
        mocks = resetMocks();
        mockStores = createMockStores({
            amendPaymentStore: {
                isRefund: false,
                isLoadingDataError: false,
                goBackToPreviousPage: jest.fn(),
            },
            layoutStore: {
                getBreadcrumb: jest.fn(item => ({ value: item, key: item })),
                currentPath: 'currentPath',
                pageName: 'pageName',
            },
        });
    });

    it('should redirect to referrer in case of micro app', async () => {
        mockStores.amendPaymentStore.amendmentType = AmendmentType.Flight;
        mockStores.layoutStore.getBreadcrumb = jest.fn(() => ({ value: 'value', key: 'key' }));
        Object.defineProperty(document, 'referrer', {
            value: '/en/manage',
            configurable: true,
        });

        render(<AmendPaymentHeader {...mocks} />);

        await userEvent.click(screen.getByTestId('link-to-previous-page'));

        expect(mockRouter.back).toHaveBeenCalled();
        expect(mockStores.amendPaymentStore.goBackToPreviousPage).not.toHaveBeenCalled();
    });

    it('should render title and subtitle', () => {
        render(<AmendPaymentHeader {...mocks} />);

        expect(screen.getByText(mocks.fields.PayTitle.value)).toBeInTheDocument();
        expect(screen.getByText(mocks.fields.Subtitle.value)).toBeInTheDocument();
    });

    it('should render title and subtitle when isRefund is set', () => {
        mockStores.amendPaymentStore.isRefund = true;
        render(<AmendPaymentHeader {...mocks} />);

        expect(screen.getByText(mocks.fields.RefundTitle.value)).toBeInTheDocument();
        expect(screen.getByText(mocks.fields.Subtitle.value)).toBeInTheDocument();
    });

    it('should not render breadcrumbs', () => {
        render(<AmendPaymentHeader {...mocks} />);

        expect(screen.queryByText(SitePath.AmendFlights)).not.toBeInTheDocument();
        expect(screen.queryByText(SitePath.AmendTransfer)).not.toBeInTheDocument();
        expect(screen.queryByText(SitePath.ViewBooking)).not.toBeInTheDocument();
    });

    it('should render breadcrumbs based on amendPaymentConfig', () => {
        mockStores.amendPaymentStore.amendmentType = AmendmentType.Flight;
        mockGetAmendPaymentConfigReturnValue = {
            prevPage: SitePath.AmendFlights,
        };

        render(<AmendPaymentHeader {...mocks} />);

        expect(screen.getByText(SitePath.AmendFlights)).toBeInTheDocument();
    });

    describe('OverlaySpinner', () => {
        it('should render spinner when it is TradePortal and booking is loading', () => {
            mockStores.layoutStore.isTradePortal = true;
            mockStores.viewBookingStore.isLoading = true;

            const { getByText } = render(<AmendPaymentHeader {...mocks} />);

            expect(getByText('OverlaySpinner')).toBeInTheDocument();
        });

        it('should render spinner when it is TradePortal and booking is loading', () => {
            mockStores.layoutStore.isTradePortal = true;
            mockStores.viewBookingStore.isLoading = true;

            const { getByText } = render(<AmendPaymentHeader {...mocks} />);

            expect(getByText('OverlaySpinner')).toBeInTheDocument();
        });

        it('should NOT render spinner when it is TradePortal and booling is not loading', () => {
            mockStores.layoutStore.isTradePortal = true;

            render(<AmendPaymentHeader {...mocks} />);

            expect(screen.queryByText('OverlaySpinner')).not.toBeInTheDocument();
        });

        it('should NOT render spinner when it is NOT TradePortal', () => {
            render(<AmendPaymentHeader {...mocks} />);

            expect(screen.queryByText('OverlaySpinner')).not.toBeInTheDocument();
        });
    });
});
