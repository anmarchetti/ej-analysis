import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { ISitecoreField, TSitecoreMultiList } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import FloatingPopup from 'frontend/components/common/FloatingPopup/FloatingPopup';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';
import SvgSupport from 'frontend/components/icons-new/Support';
import ContactUsChannel from 'frontend/components/renderings/ContactUsBanner/components/ContactUsChannel/ContactUsChannel';
import { IContactChannelFields } from 'frontend/components/renderings/ContactUsBanner/ContactUsBanner';

import styles from './ContactUsPopup.module.scss';

export interface IContactUsPopupProps extends IComponentWithRerenderProps {
    contactChannels: TSitecoreMultiList<IContactChannelFields>;
    ctaCloseButtonLabel: ISitecoreField<string>;
    ctaCloseButtonScreenReaderLabel: ISitecoreField<string>;
    isPopupShown: boolean;
    onClose: () => void;
    title: ISitecoreField<string>;
}

const ContactUsPopup: FC<IContactUsPopupProps> = ({
    isPopupShown,
    onClose,
    ctaCloseButtonLabel,
    ctaCloseButtonScreenReaderLabel,
    title,
    contactChannels,
}) => {
    const { booking, isInDestinationPage } = useStore((stores: IHolidaysStores) => ({
        booking: stores.viewBookingStore.booking,
        isInDestinationPage: stores.viewBookingStore.isInDestinationPage,
    }));

    const isMobile = useMobileViewport();

    if (!isPopupShown) {
        return null;
    }

    const filteredContactChannels = contactChannels.filter(({ fields: { DisplayCountries } }) => {
        if (!DisplayCountries?.value) {
            return true;
        }

        const countries = (DisplayCountries.value || '').split(', ');

        return countries.includes(booking!.hotel?.country?.code ?? '');
    });

    return (
        <FloatingPopup
            onClose={onClose}
            containerClass={styles.container}
            hasFooterShadow={isMobile && isInDestinationPage}
            footerClass={styles.footer}
            footerContent={
                !!ctaCloseButtonLabel && (
                    <Button
                        onClick={onClose}
                        isOutlined
                        isFullWidth={isMobile}
                        type='button'
                        aria-label={ctaCloseButtonScreenReaderLabel.value}
                    >
                        <Text field={ctaCloseButtonLabel} />
                    </Button>
                )
            }
        >
            <div>
                <div className={styles.header}>
                    <SvgSupport className={styles.icon} />
                    <div className={styles.separator} />
                    <Text field={title} className={styles.title} tag='h4' data-tid='contact-us-popup-title' />
                </div>
                {filteredContactChannels.map(({ fields, id }) => (
                    <ContactUsChannel key={id} fields={fields} onClose={onClose} />
                ))}
            </div>
        </FloatingPopup>
    );
};

export default observer(ContactUsPopup);
