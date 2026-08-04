import React, { useState } from 'react';
import { RichText, Text } from '@sitecore-jss/sitecore-jss-react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { isTradeStore } from 'frontend/store/tradePortal';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Card from 'frontend/components/common/Card';
import JSSImage from 'frontend/components/common/JSSImage';
import SvgCross from 'frontend/components/icons-new/Cross';
import SvgExternalLink from 'frontend/components/icons-new/ExternalLink';

import LateCheckoutPopup, { ILateCheckoutPopupFields } from './components/LateCheckoutPopup';

interface ILateCheckoutComponentFields extends ILateCheckoutPopupFields {
    BannerDescription: ISitecoreField<string>;
    BannerLabel: ISitecoreField<string>;
    BannerTitle: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    LinkText: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

type TLateCheckoutComponentProps = ISitecoreComponent<ILateCheckoutComponentFields>;

const LateCheckoutComponent = (props: TLateCheckoutComponentProps) => {
    const [isLateCheckoutPopupShown, setLateCheckoutPopupShown] = useState<boolean>(false);
    const {
        getPhrase,
        selectedFlightDate,
        isLateCheckoutEnabledBySitecore,
        isLateRoomCheckoutAvailable,
        lateRoomCheckout,
        isLateCheckoutRoomSelected,
        setLateRoomCheckoutToBooking,
        isPriceVisible,
        currency,
        formatMoney,
    } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        selectedFlightDate: stores.bookingStore.selectedOffer?.transport?.routes[1].depDate,
        isLateCheckoutEnabledBySitecore: stores.layoutStore.isLateCheckoutEnabledBySitecore,
        isLateRoomCheckoutAvailable: stores.bookingStore.isLateRoomCheckoutAvailable,
        lateRoomCheckout: stores.bookingStore.lateRoomCheckout,
        setLateRoomCheckoutToBooking: stores.bookingStore.setLateRoomCheckoutToBooking,
        isLateCheckoutRoomSelected: stores.bookingStore.isLateCheckoutRoomSelected,
        isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
        currency: stores.bookingStore.currency,
        formatMoney: stores.marketStore.formatMoney,
    }));

    if (!props.fields || !isLateCheckoutEnabledBySitecore || !isLateRoomCheckoutAvailable || !lateRoomCheckout) {
        return null;
    }

    const getDescriptionField = (): Nullable<ISitecoreField<string>> => {
        if (selectedFlightDate && props.fields?.Description?.value) {
            const descriptionField = {
                value: Tokenizer.replaceToken(
                    props.fields.Description.value,
                    Tokens.Date,
                    formatDateL10n(selectedFlightDate, 'HH.mm ddd Do MMM'),
                ),
            };

            return descriptionField;
        }

        return null;
    };
    const descriptionField = getDescriptionField();

    return (
        <section className='late-checkout step'>
            <div className='step__header'>
                {props.fields.Title?.value && <Text field={props.fields.Title} tag='h2' className='step__title' />}
            </div>
            {descriptionField?.value && <RichText field={descriptionField} className='step__description' />}
            <Card selected={isLateCheckoutRoomSelected}>
                <div className='late-checkout__card'>
                    {props.fields.BannerLabel?.value && (
                        <Text field={props.fields.BannerLabel} tag='p' className='late-checkout__label' />
                    )}
                    <div className='late-checkout__wrapper'>
                        <div className='late-checkout__content'>
                            {props.fields.Icon?.value?.src && (
                                <JSSImage field={props.fields.Icon} className='late-checkout__icon' />
                            )}
                            <div>
                                {props.fields.BannerTitle?.value && (
                                    <Text tag='h3' field={props.fields.BannerTitle} className='late-checkout__title' />
                                )}
                                {props.fields.BannerDescription?.value && (
                                    <Text
                                        tag='p'
                                        field={props.fields.BannerDescription}
                                        className='late-checkout__description'
                                    />
                                )}
                                {props.fields.LinkText?.value && (
                                    <Button
                                        className='late-checkout__more-btn'
                                        removeDefaultClass
                                        onClick={() => setLateCheckoutPopupShown(true)}
                                    >
                                        {props.fields.LinkText.value}
                                        <SvgExternalLink />
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div>
                            {!isLateCheckoutRoomSelected ? (
                                <>
                                    {isPriceVisible && (
                                        <p className='late-checkout__price'>
                                            {formatMoney(lateRoomCheckout.price, {
                                                currency,
                                                maximumFractionDigits: 0,
                                            })}
                                        </p>
                                    )}
                                    <Button
                                        onClick={() => setLateRoomCheckoutToBooking(true)}
                                        className='late-checkout__select-btn'
                                    >
                                        {getPhrase(SitecoreDictionary.LateCheckoutButtonsSelect)}
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={() => setLateRoomCheckoutToBooking(false)}
                                    className='late-checkout__remove-btn'
                                >
                                    <SvgCross />
                                    {getPhrase(SitecoreDictionary.GlobalsButtonsRemove)}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
            <LateCheckoutPopup
                isLateCheckoutPopupShown={isLateCheckoutPopupShown}
                closePopup={() => setLateCheckoutPopupShown(false)}
                {...props.fields}
            />
        </section>
    );
};

export default observer(LateCheckoutComponent);
