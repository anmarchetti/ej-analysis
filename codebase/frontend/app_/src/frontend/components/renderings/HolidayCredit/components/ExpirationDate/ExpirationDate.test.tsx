import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import * as mediaQueryHooks from 'frontend/hooks/useMediaQuery';
import { mockBalanceHistoryFields } from 'frontend/components/renderings/HolidayCredit/__mocks__/balanceHistoryFields.mocks';
import * as creditUtils from 'frontend/components/renderings/HolidayCredit/utils';

import ExpirationDate from './ExpirationDate';

const createProps = (expirationDate: string = '2024-12-31') => ({
    expirationDate,
    fields: mockBalanceHistoryFields,
});

const createStores = () => createMockStores();

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <span data-tid='text'>{props.field?.value}</span>;
    },
}));

jest.mock('frontend/utils/date.utils', () => ({
    formatDateL10n: jest.fn(date => `Formatted: ${date}`),
}));

describe('<ExpirationDate />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(true);
        jest.spyOn(creditUtils, 'getExpireSoonLabel').mockReturnValue('Expires soon');
        jest.spyOn(creditUtils, 'isCreditExpired').mockReturnValue(false);
    });

    it('should render expiration date correctly on desktop', () => {
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(true);

        render(<ExpirationDate {...mockProps} />);

        expect(screen.getByTestId('balance-history-mobile-item-expire-date')).toBeInTheDocument();
        expect(screen.getByText('Formatted: 2024-12-31')).toBeInTheDocument();
    });

    it('should render "Expires on" label on mobile when not expired', () => {
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(false);
        jest.spyOn(creditUtils, 'isCreditExpired').mockReturnValue(false);

        render(<ExpirationDate {...mockProps} />);

        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockBalanceHistoryFields.ExpiresOnLabel,
            component: 'span',
        });
    });

    it('should render "Expired on" label on mobile when expired', () => {
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(false);
        jest.spyOn(creditUtils, 'isCreditExpired').mockReturnValue(true);

        render(<ExpirationDate {...mockProps} />);

        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockBalanceHistoryFields.ExpiredOnLabel,
            component: 'span',
        });
    });

    it('should display expire soon label', () => {
        jest.spyOn(creditUtils, 'getExpireSoonLabel').mockReturnValue('Expires in 5 days');

        render(<ExpirationDate {...mockProps} />);

        expect(screen.getByText('Expires in 5 days')).toBeInTheDocument();
    });

    it('should call getExpireSoonLabel with correct parameters on mobile', () => {
        const getExpireSoonLabelSpy = jest.spyOn(creditUtils, 'getExpireSoonLabel');
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(false);

        render(<ExpirationDate {...mockProps} />);

        expect(getExpireSoonLabelSpy).toHaveBeenCalledWith(
            '2024-12-31',
            mockBalanceHistoryFields,
            expect.any(Function),
            true,
        );
    });

    it('should call getExpireSoonLabel with correct parameters on desktop', () => {
        const getExpireSoonLabelSpy = jest.spyOn(creditUtils, 'getExpireSoonLabel');
        jest.spyOn(mediaQueryHooks, 'useMoreThenTabletViewport').mockReturnValue(true);

        render(<ExpirationDate {...mockProps} />);

        expect(getExpireSoonLabelSpy).toHaveBeenCalledWith(
            '2024-12-31',
            mockBalanceHistoryFields,
            expect.any(Function),
            false,
        );
    });
});
