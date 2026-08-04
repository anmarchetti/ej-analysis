import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { TCreditTypeItem } from 'models/data/IBalanceHistory';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { mockBalanceHistoryItem } from 'frontend/components/renderings/HolidayCredit/__mocks__/balanceHistory.mocks';
import { mockBalanceHistoryFields } from 'frontend/components/renderings/HolidayCredit/__mocks__/balanceHistoryFields.mocks';
import * as HolidayCreditUtils from 'frontend/components/renderings/HolidayCredit/utils';

import BalanceHistoryItemDrawer, { TBalanceHistoryItemDrawerProps } from './BalanceHistoryItemDrawer';

const createProps = (): TBalanceHistoryItemDrawerProps => ({
    creditItem: mockBalanceHistoryItem,
    fields: mockBalanceHistoryFields,
    isDrawerExpanded: true,
    defaultCreditTypeContent: { Title: mockSitecoreField('Test Name') } as TCreditTypeItem,
    onCloseDrawer: jest.fn(),
});

const createStores = () => createMockStores();

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/HolidayCredit/utils', () => ({
    __esModule: true,
    getCreditStatus: jest.fn(() => 'active'),
    getMetaDataValueByKey: jest.fn((metadata, key) => {
        if (key === 'hotel_name') return 'Test Hotel';

        return metadata.find(item => item.key === key)?.value;
    }),
    getRedemptionOrigin: jest.fn(() => 'Redemption Origin'),
}));

jest.mock('frontend/utils/date.utils', () => ({
    ...jest.requireActual('frontend/utils/date.utils'),
    formatDateL10n: jest.fn(d => d),
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return <button data-tid={props.dataTid} onClick={props.onClick} />;
    },
}));

const mockDrawerProps = jest.fn();
jest.mock('frontend/components/common/Drawer', () => ({
    __esModule: true,
    default: props => {
        mockDrawerProps(props);

        return <div data-tid='drawer'>{props.children}</div>;
    },
}));

const mockBalanceHistoryItemProps = jest.fn();
jest.mock('frontend/components/renderings/HolidayCredit/components/BalanceHistoryItem/BalanceHistoryItem', () => ({
    __esModule: true,
    default: props => {
        mockBalanceHistoryItemProps(props);

        return <div data-tid='balance-history-item' />;
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='sitecore-jss-text' />;
    },
}));

describe('<BalanceHistoryItemDrawer />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render with correct structure, description, and child components', () => {
        render(<BalanceHistoryItemDrawer {...mockProps} />);

        expect(screen.getByTestId('drawer')).toBeInTheDocument();
        expect(mockDrawerProps).toHaveBeenCalledWith({
            open: mockProps.isDrawerExpanded,
            className: 'drawer',
            children: expect.anything(),
            dataTid: 'balance-history-drawer',
        });

        expect(screen.getByTestId('sitecore-jss-text')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.fields.Title,
            tag: 'h2',
            className: 'title',
        });

        expect(jest.mocked(HolidayCreditUtils.getRedemptionOrigin)).toHaveBeenCalledWith(
            mockProps.creditItem.metadata,
            expect.any(Function),
        );
        expect(screen.getByText(`Test Name - Redemption Origin`)).toBeInTheDocument();

        expect(screen.getByTestId('balance-history-item')).toBeInTheDocument();
        expect(mockBalanceHistoryItemProps).toHaveBeenCalledWith({
            creditItem: mockProps.creditItem,
            fields: mockProps.fields,
            isDrawerExpanded: mockProps.isDrawerExpanded,
            defaultCreditTypeContent: mockProps.defaultCreditTypeContent,
            isInsideDrawer: true,
        });

        expect(mockButtonProps).toHaveBeenCalledWith({
            isTransparent: true,
            isFullWidth: true,
            onClick: expect.any(Function),
            dataTid: 'cancel-btn',
            children: SitecoreDictionary.GlobalsButtonsClose,
        });
    });

    it('should call onCloseDrawer when close button clicked', async () => {
        render(<BalanceHistoryItemDrawer {...mockProps} />);

        await userEvent.click(screen.getByTestId('cancel-btn'));

        expect(mockProps.onCloseDrawer).toHaveBeenCalled();
    });
});
