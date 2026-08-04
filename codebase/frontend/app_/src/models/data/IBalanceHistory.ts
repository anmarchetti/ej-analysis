import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

import { ISitecoreChildren } from './ISitecoreChildren';

export interface IBalanceHistoryItem {
    createdAt: string;
    expires: string;
    id: string;
    metadata: IMetadata[];
    order: IOrder;
    redemptions: IRedemption[];
}

export interface IBalanceHistory {
    [key: string]: IBalanceHistoryItem[];
}

interface IRedemption {
    id: string;
    order: IOrder;
    result: string;
    voucherId: string;
    metadata?: IMetadata[];
}

export interface IOrder {
    amount: number;
    date: string;
    id?: string;
    status?: string;
}

export interface IMetadata {
    key: string;
    value: any;
}

export type TCreditTypeItem = {
    Key: ISitecoreField<string>;
    LogoImage: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
};

export interface IExpireStates {
    ExpireStateActive: ISitecoreField<string>;
    ExpireStateExpired: ISitecoreField<string>;
    ExpireStateExpiresSoon: ISitecoreField<string>;
    ExpireStateUsed: ISitecoreField<string>;
}

export interface IBalanceHistoryFields extends IExpireStates {
    BalanceChangeOnLabel: ISitecoreField<string>;
    Children: ISitecoreChildren<TCreditTypeItem>[];
    CollapseButtonScreenReaderLabel: ISitecoreField<string>;
    CreditLabel: ISitecoreField<string>;
    CreditTypeColumnTitle: ISitecoreField<string>;
    ExpandButtonScreenReaderLabel: ISitecoreField<string>;
    ExpireSoonWithinDays: ISitecoreField<number>;
    ExpiredOnLabel: ISitecoreField<string>;
    ExpiresInLabel: ISitecoreField<string>;
    ExpiresInShortLabel: ISitecoreField<string>;
    ExpiresOnLabel: ISitecoreField<string>;
    ExpiryColumnTitle: ISitecoreField<string>;
    FailureLabel: ISitecoreField<string>;
    IssuedOnLabel: ISitecoreField<string>;
    PurchaseLabel: ISitecoreField<string>;
    RedeemVoucherButtonLabel: ISitecoreField<string>;
    RemainingAmountLabel: ISitecoreField<string>;
    RemainingColumnTitle: ISitecoreField<string>;
    ShowLogos: ISitecoreField<boolean>;
    StatusColumnTitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}
