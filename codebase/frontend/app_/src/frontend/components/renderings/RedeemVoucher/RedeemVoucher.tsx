import React, { FunctionComponent } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import LoginToRedeemPopup from './components/LoginToRedeemPopup';
import RedeemVoucherForm from './components/RedeemVoucherForm';
import ValidatedVoucherPopup from './components/ValidatedVoucherPopup';
import VoucherAppliedPopup from './components/VoucherAppliedPopup';

export type TRedeemVoucherProps = ISitecoreComponent<IViewBookingsSitecoreFields>;

export interface IViewBookingsSitecoreFields {
    AddCredit: ISitecoreField<string>;
    CurrentCreditBalance: ISitecoreField<string>;
    FieldPlaceholder: ISitecoreField<string>;
    Instruction1: ISitecoreField<string>;
    Instruction2: ISitecoreField<string>;
    InstructionsTitle: ISitecoreField<string>;

    MessageForVoucherWithDifferentCurrency: ISitecoreField<string>;
    PreviousCredit: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
    SubtitleLoginToRedeemPopup: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    TitleAppliedPopup: ISitecoreField<string>;
    TitleLoginToRedeemPopup: ISitecoreField<string>;

    TitleValidatedPopup: ISitecoreField<string>;
    Tooltip: ISitecoreField<string>;
    TooltipValidatedPopup: ISitecoreField<string>;
    TotalCredit: ISitecoreField<string>;
    VoucherAdded: ISitecoreField<string>;
    VoucherCostPopupLabel: ISitecoreField<string>;

    VoucherName: ISitecoreField<string>;
    VoucherWorthPopupLabel: ISitecoreField<string>;
}

export const RedeemVoucher: FunctionComponent<TRedeemVoucherProps> = props => {
    const { isRedeemVoucherPage, isGiftCardRedemptionEnabled } = useStore((stores: IHolidaysStores) => ({
        isRedeemVoucherPage: stores.layoutStore.isRedeemVoucherPage,
        isGiftCardRedemptionEnabled: stores.layoutStore.isGiftCardRedemptionEnabled,
    }));

    const { fields, rendering } = props;

    if (!fields || (!isGiftCardRedemptionEnabled && !isRedeemVoucherPage)) {
        return null;
    }

    return (
        <div className='redeem-voucher'>
            {isRedeemVoucherPage && <RedeemVoucherForm fields={fields} />}

            <ValidatedVoucherPopup fields={fields} />

            <VoucherAppliedPopup fields={fields} />

            <LoginToRedeemPopup title={fields.TitleLoginToRedeemPopup} subtitle={fields.SubtitleLoginToRedeemPopup} />

            <Placeholder name={PlaceholderNames.CreateAccountPopup} rendering={rendering} />
        </div>
    );
};

export default observer(RedeemVoucher);
