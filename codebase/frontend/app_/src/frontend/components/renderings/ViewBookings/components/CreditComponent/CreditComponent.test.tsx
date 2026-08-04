import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import CreditComponent, { ICreditComponentProps } from './CreditComponent';
import { marketCredit, multipleCreditBalance } from './mocks';

jest.mock('frontend/components/common/Link', () => ({ children }) => <>{children}</>);

const createStores = () =>
    createMockStores({
        layoutStore: {
            isGiftCardRedemptionEnabled: true,
        },
        routerStore: {
            redirectToHolidayCreditPage: jest.fn(),
        },
        holidayCreditStore: {
            isCreditEnabledApiSettings: true,
            creditBalance: multipleCreditBalance,
            marketCredit: marketCredit,
        },
    });

let mockStores = createStores();
const props: ICreditComponentProps = {
    MultipleCreditsInfo: mockSitecoreField('MultipleCreditsInfo'),
};

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('CreditComponent', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should redirectToHolidayCredit if viewCreditsCard is clicked', () => {
        render(<CreditComponent {...props} />);

        fireEvent.click(screen.getByTestId('view-credit-button'));

        expect(mockStores.routerStore.redirectToHolidayCreditPage).toBeCalled();
    });

    it('should show error message when credit is not enabled', () => {
        mockStores.holidayCreditStore.isCreditEnabledApiSettings = false;
        render(<CreditComponent {...props} />);

        expect(screen.getByText('HolidayCredit.ErrorMessages.CreditIsDisabled')).toBeInTheDocument();
    });

    it('should show credit content when credit enabled', () => {
        mockStores.holidayCreditStore.isCreditEnabledApiSettings = false;
        render(<CreditComponent {...props} />);

        expect(screen.getByTestId('view-credits-card')).toBeInTheDocument();
    });

    it('should show multiple currencies info when there are multiple credits', () => {
        mockStores.layoutStore.isGiftCardRedemptionEnabled = false;

        render(<CreditComponent {...props} />);
        expect(screen.getByTestId('multiple-currencies-info')).toBeInTheDocument();
        expect(screen.getByText('MultipleCreditsInfo')).toBeInTheDocument();
    });
});
