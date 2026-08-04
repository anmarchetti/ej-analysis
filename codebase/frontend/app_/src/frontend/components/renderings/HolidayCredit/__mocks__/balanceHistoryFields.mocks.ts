import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IBalanceHistoryFields } from 'models/data/IBalanceHistory';

import { mockCreditTypeItems } from './creditTypeItems.mocks';

export const mockBalanceHistoryFields: IBalanceHistoryFields = {
    Title: mockSitecoreField('Balance History'),
    RedeemVoucherButtonLabel: mockSitecoreField('Redeem a gif card'),
    CreditTypeColumnTitle: mockSitecoreField('Credit Type'),
    StatusColumnTitle: mockSitecoreField('Status'),
    RemainingColumnTitle: mockSitecoreField('Remaining'),
    ExpiryColumnTitle: mockSitecoreField('Expiry'),

    ExpireStateActive: mockSitecoreField('Active'),
    ExpireStateUsed: mockSitecoreField('Used'),
    ExpireStateExpired: mockSitecoreField('Expired'),
    ExpireStateExpiresSoon: mockSitecoreField('Expires Soon'),
    PurchaseLabel: mockSitecoreField('Purchase'),
    FailureLabel: mockSitecoreField('Failure'),
    CreditLabel: mockSitecoreField('Credit'),
    ShowLogos: mockSitecoreField(false),
    Children: mockCreditTypeItems,
    ExpandButtonScreenReaderLabel: mockSitecoreField('Expand credit history'),
    CollapseButtonScreenReaderLabel: mockSitecoreField('Collapse credit history'),
    BalanceChangeOnLabel: mockSitecoreField('on'),
    ExpiredOnLabel: mockSitecoreField('Expired on'),
    ExpiresOnLabel: mockSitecoreField('Expires on'),
    ExpiresInLabel: mockSitecoreField('Expires in'),
    ExpiresInShortLabel: mockSitecoreField('in'),
    ExpireSoonWithinDays: mockSitecoreField(28),
    IssuedOnLabel: mockSitecoreField('Issued on'),
    RemainingAmountLabel: mockSitecoreField('Remaining amount'),
};
