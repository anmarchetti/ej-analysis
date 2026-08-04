import { FunctionComponent } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ICabinBagsFields } from 'models/data/ICabinBagsFields';
import { EventLabels } from 'models/enum/tracking/GenericEventParams';
import InfoBlock, { IInfoBlockProps } from 'frontend/components/common/InfoBlock/InfoBlock';

import styles from './CabinBagsBanners.module.scss';

export interface ICabinBagsBannersProps {
    fields: ICabinBagsFields;
    hasPrice: boolean;
}

export const CabinBagsBanners: FunctionComponent<ICabinBagsBannersProps> = ({ fields, hasPrice }) => {
    const {
        isFlightExtrasFailed,
        cabinBagsCategoriesExist,
        extraLuggageCategoriesExist,
        isFlightExternal,
        isCabinBagsEnabled,
        isExtraLuggageEnabled,
        isLCBFull,
        isLCBAlmostFull,
        isViewBookingPage,
        trackLCBBanners,
        isBookingOutOfSync,
        isFlightExternalViewBookingStore,
        setHoldLuggagePopupOpened,
    } = useStore(({ bookingStore, layoutStore, trackingStore, viewBookingStore }: TStores) => ({
        isFlightExtrasFailed: bookingStore.isFlightExtrasFailed,
        extraLuggageCategoriesExist: bookingStore.extraLuggageCategoriesExist,
        cabinBagsCategoriesExist: bookingStore.cabinBagsCategoriesExist,
        isFlightExternal: bookingStore.isFlightExternal,
        isCabinBagsEnabled: layoutStore.isCabinBagsEnabled,
        isExtraLuggageEnabled: layoutStore.isExtraLuggageEnabled,
        isLCBFull: bookingStore.extraLuggage.isLCBFull,
        isLCBAlmostFull: bookingStore.extraLuggage.isLCBAlmostFull,
        isViewBookingPage: layoutStore.isViewBookingPage,
        trackLCBBanners: trackingStore.trackLCBBanners,
        isBookingOutOfSync: viewBookingStore.isBookingOutOfSync,
        isFlightExternalViewBookingStore: viewBookingStore.isFlightExternal,
        setHoldLuggagePopupOpened: bookingStore.holdLuggage.setHoldLuggagePopupOpened,
    }));

    const openHLPopup = () => {
        const targetElement = document.querySelector('[data-tid="hold-luggage-title"]');

        if (targetElement) {
            targetElement.scrollIntoView();
        }

        setHoldLuggagePopupOpened(true);
    };

    if (!fields) {
        return null;
    }

    if (isBookingOutOfSync && isFlightExternalViewBookingStore) {
        const { OutOfSyncBanner } = fields;
        const { Title, Subtitle, Link } = OutOfSyncBanner?.fields || {};

        return (
            <InfoBlock
                text={Subtitle}
                title={Title}
                className={classNames(styles.banner, styles.postFlow)}
                link={Link}
                dataTid='lcb-out-of-sync-banner'
                btnClass={styles.postFlowOOSButtonClass}
            />
        );
    }

    if (isViewBookingPage) {
        const { Title, Subtitle, Link } = fields.UnavailablePostBookContent?.fields || {};
        const cabinBagsProps: IInfoBlockProps = {
            className: classNames(styles.banner, styles.postFlow),
            dataTid: 'lcb-unavailable-banner-view-booking',
            title: Title,
            text: Subtitle,
            link: Link,
            textClass: styles.postFlowTextClass,
            btnClass: styles.postFlowButtonClass,
        };

        return <InfoBlock {...cabinBagsProps} />;
    }

    if (!isCabinBagsEnabled) {
        const cabinBagsProps: IInfoBlockProps = {
            className: styles.banner,
        };

        if (!isExtraLuggageEnabled || isFlightExtrasFailed || !cabinBagsCategoriesExist) {
            const { Title, Subtitle } = fields.CabinBagsUnavailableContent?.fields || {};

            cabinBagsProps.dataTid = 'lcb-unavailable-banner';
            cabinBagsProps.title = Title;
            cabinBagsProps.text = Subtitle;
        } else {
            const { Subtitle, ButtonLabel, Title } = fields.CabinBagsUnavailableCTAContent?.fields || {};

            cabinBagsProps.dataTid = 'lcb-unavailable-banner-with-cta';
            cabinBagsProps.title = Title;
            cabinBagsProps.text = Subtitle;
            cabinBagsProps.btnLabel = ButtonLabel;
            cabinBagsProps.onClick = openHLPopup;
        }

        return <InfoBlock {...cabinBagsProps} />;
    }

    if (!isFlightExternal) {
        const { InternalFlightBanner } = fields;
        const { Title, Subtitle } = InternalFlightBanner?.fields || {};

        return (
            <InfoBlock text={Subtitle} title={Title} className={styles.banner} dataTid='lcb-internal-flight-banner' />
        );
    }

    if (isFlightExtrasFailed || !cabinBagsCategoriesExist || !hasPrice) {
        const { RequestFailureBanner } = fields;
        const { Title, Subtitle } = RequestFailureBanner?.fields || {};

        return (
            <InfoBlock
                text={Subtitle}
                title={Title}
                className={styles.banner}
                withWarningIcon
                dataTid='lcb-failure-banner'
            />
        );
    }

    if (isLCBFull) {
        const isHoldLuggageEnabled = isExtraLuggageEnabled && extraLuggageCategoriesExist;
        const { CabinBagsFullBanner, CabinBagsFullWithHLBanner } = fields;
        const bannerFields = isHoldLuggageEnabled ? CabinBagsFullWithHLBanner : CabinBagsFullBanner;
        const { Title, Subtitle, ButtonLabel } = bannerFields?.fields || {};
        const onClick = () => {
            trackLCBBanners(EventLabels.CapacityFullClick);
            openHLPopup();
        };

        trackLCBBanners(EventLabels.CapacityFull);

        return (
            <InfoBlock
                text={Subtitle}
                title={Title}
                className={styles.banner}
                btnLabel={isHoldLuggageEnabled ? ButtonLabel : undefined}
                onClick={isHoldLuggageEnabled ? onClick : undefined}
                dataTid='lcb-full-banner'
            />
        );
    }

    if (isLCBAlmostFull) {
        const { CabinBagsAlmostFullBanner } = fields;
        const { Title, Subtitle } = CabinBagsAlmostFullBanner?.fields || {};

        trackLCBBanners(EventLabels.PartialCapacityFull);

        return <InfoBlock text={Subtitle} title={Title} className={styles.banner} dataTid='lcb-almost-full-banner' />;
    }

    return null;
};

export default observer(CabinBagsBanners);
