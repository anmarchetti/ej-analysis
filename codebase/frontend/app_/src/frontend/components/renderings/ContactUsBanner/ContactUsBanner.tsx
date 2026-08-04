import { FC, useState } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, TSitecoreMultiList } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import ActionCard from 'frontend/components/common/ActionCard/ActionCard';
import Button from 'frontend/components/common/Button';
import SvgSupport from 'frontend/components/icons-new/Support';

import ContactUsPopup from './components/ContactUsPopup/ContactUsPopup';

import styles from './ContactUsBanner.module.scss';

export interface IContactUsBannerRenderingParameters {
    ShowButtonOnly: TSitecoreCheckboxValue;
}

export interface IContactChannelFields {
    Description: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    DisplayCountries?: ISitecoreField<string>;
    Key?: ISitecoreField<string>;
    OpenChatBot?: ISitecoreField<boolean>;
}

export interface IContactUsBannerFields {
    CTACloseButtonLabel: ISitecoreField<string>;
    CTACloseButtonScreenReaderLabel: ISitecoreField<string>;
    CTAOpenButtonLabel: ISitecoreField<string>;
    CTAOpenButtonScreenReaderLabel: ISitecoreField<string>;
    CTATitle: ISitecoreField<string>;
    ContactChannels: TSitecoreMultiList<IContactChannelFields>;
    ContactChannelsAgency: TSitecoreMultiList<IContactChannelFields>;
    ContactChannelsLuxury: TSitecoreMultiList<IContactChannelFields>;
    Title: ISitecoreField<string>;
}

export type TContactUsBannerProps = ISitecoreComponent<IContactUsBannerFields, IContactUsBannerRenderingParameters> & {
    isOutlined?: boolean;
};

const ContactUsBanner: FC<TContactUsBannerProps> = ({ fields, params, isOutlined = true }) => {
    const { booking, isLuxuryPackage, isCancelledBookingPage, isTradePortal } = useStore((stores: IHolidaysStores) => ({
        booking: stores.viewBookingStore.booking,
        isLuxuryPackage: stores.viewBookingStore.isLuxuryPackage,
        isCancelledBookingPage: stores.viewBookingStore.isCancelledBookingPage,
        isTradePortal: stores.layoutStore.isTradePortal,
    }));

    const [isPopupShown, toggleShowPopup] = useState(false);

    const togglePopup = (): void => toggleShowPopup(value => !value);
    const hideOnCancelledBookingPage = isCancelledBookingPage && !booking?.isExternalAgency;

    if (!fields || !booking || hideOnCancelledBookingPage) {
        return null;
    }

    const {
        CTATitle,
        CTAOpenButtonLabel,
        CTAOpenButtonScreenReaderLabel,
        CTACloseButtonLabel,
        CTACloseButtonScreenReaderLabel,
        Title,
        ContactChannels,
        ContactChannelsLuxury,
        ContactChannelsAgency,
    } = fields;

    const getContactChannel = (): TSitecoreMultiList<IContactChannelFields> => {
        if (booking.isExternalAgency && !isTradePortal && isLuxuryPackage) {
            return ContactChannelsAgency.length ? ContactChannelsAgency : ContactChannelsLuxury;
        }

        if (isLuxuryPackage) {
            return ContactChannelsLuxury;
        }

        return ContactChannels;
    };

    return (
        <>
            {isSitecoreCheckboxSelected(params.ShowButtonOnly) ? (
                <Button
                    isOutlined={isOutlined}
                    onClick={togglePopup}
                    dataTid='contact-us-banner-btn-only'
                    aria-label={CTAOpenButtonScreenReaderLabel?.value}
                    className={styles.btn}
                >
                    {CTAOpenButtonLabel?.value}
                </Button>
            ) : (
                <ActionCard
                    icon={<SvgSupport />}
                    iconClassName={styles.icon}
                    title={CTATitle}
                    dataTid='contact-us-banner'
                >
                    {CTAOpenButtonLabel?.value && (
                        <Button
                            isFullWidth
                            onClick={togglePopup}
                            dataTid='contact-us-banner-open-btn'
                            aria-label={CTAOpenButtonScreenReaderLabel?.value}
                        >
                            {CTAOpenButtonLabel?.value}
                        </Button>
                    )}
                </ActionCard>
            )}
            <ContactUsPopup
                isPopupShown={isPopupShown}
                ctaCloseButtonLabel={CTACloseButtonLabel}
                ctaCloseButtonScreenReaderLabel={CTACloseButtonScreenReaderLabel}
                title={Title}
                contactChannels={getContactChannel()}
                onClose={togglePopup}
            />
        </>
    );
};

export default observer(ContactUsBanner);
