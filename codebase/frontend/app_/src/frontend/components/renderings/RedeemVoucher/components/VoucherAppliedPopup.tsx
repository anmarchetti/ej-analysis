import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { IViewBookingsSitecoreFields } from 'frontend/components/renderings/RedeemVoucher/RedeemVoucher';

interface IVoucherAppliedPopupProps {
    fields: IViewBookingsSitecoreFields;
}

const VoucherAppliedPopup = ({ fields }: IVoucherAppliedPopupProps) => {
    const {
        getPhrase,
        redirectToHolidayCreditPage,
        userData,
        isScreenMedium,
        voucher,
        setAppliedVoucherPopupVisible,
        isAppliedVoucherPopupVisible,
        lastRedeemedVoucherCode,
        isRedeemVoucherPage,
        isExtrasPage,
        setIsCreditRedeemedOnExtrasPage,
        formatMoney,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        redirectToHolidayCreditPage: stores.routerStore.redirectToHolidayCreditPage,
        userData: stores.userStore.userData,
        isScreenMedium: stores.appStore.isScreenMedium,
        voucher: stores.redeemVoucherStore.voucher,
        setAppliedVoucherPopupVisible: stores.redeemVoucherStore.setAppliedVoucherPopupVisible,
        isAppliedVoucherPopupVisible: stores.redeemVoucherStore.isAppliedVoucherPopupVisible,
        lastRedeemedVoucherCode: stores.redeemVoucherStore.lastRedeemedVoucherCode,
        isRedeemVoucherPage: stores.layoutStore.isRedeemVoucherPage,
        isExtrasPage: stores.layoutStore.isExtrasPage,
        setIsCreditRedeemedOnExtrasPage: stores.redeemVoucherStore.setIsCreditRedeemedOnExtrasPage,
        formatMoney: stores.marketStore.formatMoney,
    }));

    if (!voucher) {
        return null;
    }

    const onContinueClick = () => {
        if (isRedeemVoucherPage) {
            redirectToHolidayCreditPage();
        } else if (isExtrasPage) {
            sessionStorage.setItem(WebStorageKeys.IsVoucherRedeemedBookingFlow, JSON.stringify(true));
            setIsCreditRedeemedOnExtrasPage(true);
        }

        setAppliedVoucherPopupVisible(false);
    };

    const content = (
        <>
            {fields.TitleAppliedPopup.value && <Text tag='h3' className='title' field={fields.TitleAppliedPopup} />}
            <div className='content'>
                {fields.VoucherWorthPopupLabel?.value && (
                    <RichTextWithLinks
                        tag='p'
                        className='text'
                        field={{
                            ...fields.VoucherWorthPopupLabel,
                            value: Tokenizer.replaceToken(
                                fields.VoucherWorthPopupLabel.value,
                                Tokens.Voucher,
                                lastRedeemedVoucherCode || '',
                            ),
                        }}
                    />
                )}

                {fields.VoucherCostPopupLabel?.value && (
                    <Text
                        tag='p'
                        className='voucher-cost'
                        field={{
                            ...fields.VoucherCostPopupLabel,
                            value: Tokenizer.replaceToken(
                                fields.VoucherCostPopupLabel.value,
                                Tokens.Price,
                                formatMoney(voucher.amount, {
                                    currency: voucher.currency,
                                    maximumFractionDigits: 0,
                                }),
                            ),
                        }}
                    />
                )}

                {fields.VoucherAdded?.value && (
                    <Text
                        tag='p'
                        className='text'
                        field={{
                            ...fields.VoucherAdded,
                            value: Tokenizer.replaceToken(
                                fields.VoucherAdded.value,
                                Tokens.Email,
                                userData?.email || '',
                            ),
                        }}
                    />
                )}
            </div>
            <div className='instruction'>
                {fields.InstructionsTitle?.value && <Text tag='h4' field={fields.InstructionsTitle} />}
                {fields.Instruction1?.value && <Text tag='p' className='text' field={fields.Instruction1} />}
                {fields.Instruction2?.value && <Text tag='p' className='text' field={fields.Instruction2} />}
            </div>
            <div className='credit-summary'>
                <div className='credit-summary__row credit-summary__total'>
                    {fields.CurrentCreditBalance?.value && <Text tag='span' field={fields.CurrentCreditBalance} />}
                    <span className='credit-summary__amount'>
                        {formatMoney(voucher.userCurrentBalance, {
                            currency: voucher.currency,
                            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                        })}
                    </span>
                </div>
            </div>
        </>
    );
    const button = (
        <Button onClick={onContinueClick} className='continue-btn'>
            {getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
        </Button>
    );

    return isScreenMedium ? (
        isAppliedVoucherPopupVisible ? (
            <Popup containerClass='redeem-popup voucher-applied-popup' footerContent={button}>
                {content}
            </Popup>
        ) : null
    ) : (
        <Drawer open={isAppliedVoucherPopupVisible} className='redeem-popup voucher-applied-popup'>
            <div className='drawer__content'>{content}</div>
            <div className='drawer__actions'>{button}</div>
        </Drawer>
    );
};

export default observer(VoucherAppliedPopup);
