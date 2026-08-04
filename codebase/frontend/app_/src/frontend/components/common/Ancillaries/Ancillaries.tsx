import { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import OutlineBanner from 'frontend/components/common/OutlineBanner/OutlineBanner';

import AncillariesHeader from './components/AncillariesHeader/AncillariesHeader';
import AncillariesMainContent from './components/AncillariesMainContent/AncillariesMainContent';
import AncillariesRoute, { IAncillariesRouteFields } from './components/AncillariesRoute';

import styles from './Ancillaries.module.scss';

export interface IAncillariesFields extends IAncillariesRouteFields {
    Icon: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
    OutlineBannerTextContent?: ISitecoreField<string>;
}

export interface IAncillariesProps {
    actionPanel: ReactNode;
    children: ReactNode;
    fields: IAncillariesFields;
    inboundSelection: ReactNode;
    outboundSelection: ReactNode;
    Description?: ISitecoreField<string>;
    Subtitle?: ISitecoreField<string>;
    banners?: ReactNode;
    isCabinBags?: boolean;
    params?: IAncillariesParams;
}

export interface IAncillariesParams {
    Color: string;
}

export const Ancillaries: FC<IAncillariesProps> = ({
    fields,
    params,
    actionPanel,
    inboundSelection,
    outboundSelection,
    banners,
    children,
    isCabinBags = false,
    Subtitle,
    Description,
}) => {
    const {
        isViewBookingPage,
        isConfirmationPage,
        isAmendPaymentPage,
        isPostBookingPages,
        isFlightExternal,
        isExtrasPage,
    } = useStore(({ layoutStore, bookingStore }: TStores) => ({
        isViewBookingPage: layoutStore.isViewBookingPage,
        isConfirmationPage: layoutStore.isConfirmationPage,
        isAmendPaymentPage: layoutStore.isAmendPaymentPage,
        isPostBookingPages: layoutStore.isPostBookingPages,
        isExtrasPage: layoutStore.isExtrasPage,
        isFlightExternal: bookingStore.isFlightExternal,
    }));

    const { Icon, Title, OutlineBannerTextContent } = fields;
    const { Color } = params || {};

    const shouldShowHeader = !isConfirmationPage && !isAmendPaymentPage;
    const isFlightInternalOnExtras = !isFlightExternal && isExtrasPage;

    return (
        <div
            className={classNames(
                isPostBookingPages && styles.whiteWrapper,
                isCabinBags && isPostBookingPages && styles.cabinBagsMargin,
            )}
            data-tid='ancillaries'
        >
            {!isAmendPaymentPage && !isFlightInternalOnExtras && (
                <AncillariesHeader title={Title} dataTid='ancillaries' />
            )}
            {banners}

            <OutlineBanner textContent={OutlineBannerTextContent} color={Color}>
                <div
                    data-tid='content'
                    className={classNames(styles.content, {
                        [styles.noPaddings]: isPostBookingPages,
                        [styles.noBorders]: isPostBookingPages,
                        [styles.amendPayment]: isAmendPaymentPage,
                    })}
                >
                    {shouldShowHeader && (
                        <div
                            data-tid='columns-container'
                            className={classNames(
                                styles.columnsContainer,
                                isViewBookingPage && styles.columnsContainerAlt,
                            )}
                        >
                            <div className={styles.ancillariesInfo}>
                                <div className={styles.header}>
                                    <AncillariesMainContent
                                        Description={Description}
                                        Icon={Icon}
                                        Subtitle={Subtitle}
                                        dataTid='promo'
                                    />
                                </div>
                                {!isViewBookingPage && (
                                    <div className={styles.selection} data-tid='selection'>
                                        <AncillariesRoute isOutbound fields={fields}>
                                            {outboundSelection}
                                        </AncillariesRoute>
                                        <AncillariesRoute fields={fields}>{inboundSelection}</AncillariesRoute>
                                    </div>
                                )}
                            </div>

                            <div
                                data-tid='action-panel-wrapper'
                                className={classNames(
                                    styles.actionPanelWrapper,
                                    isViewBookingPage && 'd-md-block d-none',
                                )}
                            >
                                {actionPanel}
                            </div>
                        </div>
                    )}
                    {children}
                </div>
            </OutlineBanner>
        </div>
    );
};

export default observer(Ancillaries);
