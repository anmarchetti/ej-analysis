import React, { FC, useState } from 'react';

import { ONE_SECOND } from 'code/commonNumbers';
import { shareUrls } from 'code/endpoints';
import { useIsMounted } from 'frontend/hooks/useIsMounted';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { removeUTMParamsFromUrl } from 'frontend/utils/utm.utils';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import ShareHolidayButtonOptions from 'models/enum/ShareHolidayButtonOptions';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Callout from 'frontend/components/common/Callout/Callout';
import { Popup } from 'frontend/components/common/Popup';
import SvgInfoFilled from 'frontend/components/icons-new/InfoFilled';
import SvgShare from 'frontend/components/icons-new/Share';

interface IShareOptionFields {
    AlertMessage: ISitecoreField<string>;
    Link: ISitecoreField<ISitecoreLink>;
    Name: ISitecoreField<string>;
    Type: ISitecoreField<ShareHolidayButtonOptions>;
}

interface IShareHolidayButtonFields {
    DesktopOptions: ISitecoreCompositeField<IShareOptionFields>[];
    MobileOptions: ISitecoreCompositeField<IShareOptionFields>[];
    ShareBtnEnabledInDesktop: ISitecoreField<boolean>;
    ShareBtnEnabledInMobile: ISitecoreField<boolean>;
}

type TShareHolidayButtonProps = ISitecoreComponent<IShareHolidayButtonFields>;

const ShareHolidayButton: FC<TShareHolidayButtonProps> = props => {
    const { title, totalPrice, getPhrase, marketCode, lang } = useStore(stores => ({
        title: stores.bookingStore.hotel?.name ?? stores.metadataStore.metaPageTitle,
        totalPrice: stores.bookingStore.totalPrice,
        getPhrase: stores.layoutStore.getPhrase,
        marketCode: stores.marketStore.marketCode,
        lang: stores.layoutStore.lang,
    }));

    const [isMenuOpened, setMenuOpened] = useState(false);
    const [isAlertShown, setAlertShown] = useState(false);
    const isMounted = useIsMounted();
    const isMobileViewport = useMobileViewport();

    const url = isMounted ? removeUTMParamsFromUrl(globalThis.location.href) : '';

    if (!props.fields) {
        return null;
    }

    const isRenderCallout =
        isMounted &&
        !isMobileViewport &&
        props.fields.ShareBtnEnabledInDesktop.value &&
        props.fields.DesktopOptions?.length;
    const isRenderMobileShareIcon =
        isMobileViewport && props.fields.ShareBtnEnabledInMobile.value && props.fields.MobileOptions?.length;
    const isRenderMobilePopup = isMobileViewport && props.fields.ShareBtnEnabledInMobile.value && isMenuOpened;

    const getUtmShareParams = (campaign: string): string =>
        `utm_source=easyjetholidays&utm_medium=share_icon&utm_campaign=${campaign}&utm_term=${lang}&utm_content=${marketCode}`;

    const isMobile = () => {
        // userAgentData is experimental, not all browsers have this
        if (navigator.userAgentData) {
            return navigator.userAgentData.mobile;
        }

        return isMobileViewport;
    };

    const onShareClick = () => {
        const copyUtm = getUtmShareParams(ShareHolidayButtonOptions.Copy);

        // on mobile always use native share if possible
        if (isMobile() && !!navigator.share) {
            navigator
                .share({
                    title,
                    url: `${url}${copyUtm}`,
                })
                .catch(e => {
                    // fallback to custom menu if native sharing is not allowed (i.e. there is share bug in iOS 14 https://developer.apple.com/forums/thread/662629)
                    if (e?.name === 'NotAllowedError') {
                        setMenuOpened(true);
                    }
                });

            return;
        }

        setMenuOpened(true);
    };

    const onCopyClick = () => {
        const copyUtm = getUtmShareParams(ShareHolidayButtonOptions.Copy);
        navigator.clipboard?.writeText(`${url}${copyUtm}`);
        setAlertShown(true);
        setTimeout(() => setAlertShown(false), ONE_SECOND);

        isMenuOpened && setMenuOpened(false);
    };

    const renderOption = (option: ISitecoreCompositeField<IShareOptionFields>) => {
        switch (option.fields.Type.value) {
            case ShareHolidayButtonOptions.Copy:
                return !!navigator.clipboard ? <button onClick={onCopyClick}>{option.fields.Name.value}</button> : null;
            case ShareHolidayButtonOptions.SMS:
                const SMSUtm = getUtmShareParams(ShareHolidayButtonOptions.SMS);
                const SMSUrl = `${url}${SMSUtm}`;

                return <a href={shareUrls.sms(SMSUrl)}>{option.fields.Name.value}</a>;
            case ShareHolidayButtonOptions.Facebook:
                const facebookUtm = getUtmShareParams(ShareHolidayButtonOptions.Facebook);
                const facebookUrl = `${url}${facebookUtm}`;

                return (
                    <a href={shareUrls.facebook(facebookUrl)} target='_blank' rel='noreferrer'>
                        {option.fields.Name.value}
                    </a>
                );
            case ShareHolidayButtonOptions.Twitter:
                const twitterUtm = getUtmShareParams(ShareHolidayButtonOptions.Twitter);
                const twitterUrl = `${url}${twitterUtm}`;

                return (
                    <a href={shareUrls.twitter(title, twitterUrl)} target='_blank' rel='noreferrer'>
                        {option.fields.Name.value}
                    </a>
                );
            case ShareHolidayButtonOptions.Email:
                const emailUtm = getUtmShareParams(ShareHolidayButtonOptions.Email);
                const emailUrl = `${url}${emailUtm}`;

                return <a href={shareUrls.email(title, emailUrl)}>{option.fields.Name.value}</a>;
            case ShareHolidayButtonOptions.WhatsApp:
                const whatsAppUtm = getUtmShareParams(ShareHolidayButtonOptions.WhatsApp);
                const whatsAppUrl = `${url}${whatsAppUtm}`;

                return (
                    <a href={shareUrls.whatsapp(`${title} ${whatsAppUrl}`)} target='_blank' rel='noreferrer'>
                        {option.fields.Name.value}
                    </a>
                );
            case ShareHolidayButtonOptions.HotUKDeals:
                const hotUKDealsUtm = getUtmShareParams(ShareHolidayButtonOptions.HotUKDeals);
                const hotUKDealsUrl = `${url}${hotUKDealsUtm}`;

                return (
                    <a href={shareUrls.hotukdeals(title, hotUKDealsUrl, totalPrice)} target='_blank' rel='noreferrer'>
                        {option.fields.Name.value}
                    </a>
                );
            default:
                return null;
        }
    };

    const renderOptions = (options: ISitecoreCompositeField<IShareOptionFields>[]) => (
        <ul className='share-holiday__menu'>
            {options.map(item => item.fields.Name?.value && <li key={item.id}>{renderOption(item)}</li>)}
        </ul>
    );

    const getAlert = () => {
        const options = !isMobileViewport ? props.fields?.DesktopOptions : props.fields?.MobileOptions;

        if (options?.length) {
            const alertText = options.find(item => item.fields.Type?.value === ShareHolidayButtonOptions.Copy)?.fields
                ?.AlertMessage?.value;

            return alertText ? (
                <div className='share-holiday__alert'>
                    <SvgInfoFilled />
                    {alertText}
                </div>
            ) : null;
        }

        return null;
    };

    return (
        <div className='share-holiday'>
            {isRenderCallout && (
                <Callout
                    content={renderOptions(props.fields.DesktopOptions)}
                    orientation={CalloutOrientation.Bottom}
                    position={CalloutPosition.Right}
                    className='share-holiday__callout'
                    isCloseWhenClickOnContent
                >
                    <i className='share-icon'>
                        <SvgShare />
                    </i>
                </Callout>
            )}

            {isRenderMobileShareIcon && (
                <button className='share-holiday__btn' onClick={onShareClick} aria-label='share-button'>
                    <SvgShare />
                </button>
            )}

            {isAlertShown && getAlert()}

            {isRenderMobilePopup && (
                <Popup
                    containerClass='share-button__popup'
                    onClose={() => setMenuOpened(false)}
                    footerContent={
                        <Button isTransparent onClick={() => setMenuOpened(false)}>
                            {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                        </Button>
                    }
                >
                    {renderOptions(props.fields.MobileOptions)}
                </Popup>
            )}
        </div>
    );
};

export default ShareHolidayButton;
