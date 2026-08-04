import React, { useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import { JSSImage } from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import LateCheckoutPopup, { ILateCheckoutPopupFields } from './components/LateCheckoutPopup';

interface ILateCheckoutPostBookBannerFields extends ILateCheckoutPopupFields {
    CTA: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
}

type TLateCheckoutPostBookBannerProps = ISitecoreComponent<ILateCheckoutPostBookBannerFields>;

const LateCheckoutPostBookBanner = (props: TLateCheckoutPostBookBannerProps) => {
    const [isLateCheckoutPopupShown, setLateCheckoutPopupShown] = useState<boolean>(false);
    const { isConfirmationPage, isLateCheckoutEnabledBySitecore } = useStore(stores => ({
        isConfirmationPage: stores.layoutStore.isConfirmationPage,
        isLateCheckoutEnabledBySitecore: stores.layoutStore.isLateCheckoutEnabledBySitecore,
    }));

    if (!props.fields || !isLateCheckoutEnabledBySitecore) {
        return null;
    }

    return (
        <div className='late-checkout-post-book-banner'>
            {props.fields.Icon?.value?.src && <JSSImage field={props.fields.Icon} className='icon' />}
            <div>
                {props.fields.Title?.value && <Text tag='h2' field={props.fields.Title} className='title' />}
                <div className='content'>
                    {props.fields.Description?.value && (
                        <RichTextWithLinks tag='div' field={props.fields.Description} className='description' />
                    )}
                    {props.fields.CTA?.value && !isConfirmationPage && (
                        <Button className='link' removeDefaultClass onClick={() => setLateCheckoutPopupShown(true)}>
                            {props.fields.CTA.value}
                        </Button>
                    )}
                </div>
            </div>
            <LateCheckoutPopup
                isLateCheckoutPopupShown={isLateCheckoutPopupShown}
                closePopup={() => setLateCheckoutPopupShown(false)}
                {...props.fields}
            />
        </div>
    );
};

export default LateCheckoutPostBookBanner;
