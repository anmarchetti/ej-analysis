import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import ComparePriceModuleContentType from 'models/enum/ComparePriceModuleContentType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import Weekdays from 'frontend/components/common/Weekdays/Weekdays';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';

import styles from './PriceGraphDrawer.module.scss';

interface IPriceGraphDrawerProps {
    activeDate: Date;
    children: React.ReactNode;
    currentContentType: ComparePriceModuleContentType | null;
    drawerRef: React.RefObject<HTMLDivElement>;
    drawerTabs: JSX.Element | null;
    holidayDurationLabel: string;
    onClickCancel: () => void;
    onConfirmClick: () => void;
    seatsReservationNotification: JSX.Element | null;
    selectedDate: Date;
}

const PriceGraphDrawer: React.FC<IPriceGraphDrawerProps> = function ({
    selectedDate,
    drawerRef,
    holidayDurationLabel,
    activeDate,
    drawerTabs,
    currentContentType,
    seatsReservationNotification,
    children,
    onClickCancel,
    onConfirmClick,
}) {
    const { getPhrase, getSetting, isExternalHotel, isExpanded } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        getSetting: stores.layoutStore.getSetting,
        isExternalHotel: stores.bookingStore.isExternalHotel,
        isExpanded: stores.priceGraphStore.priceGraphPopupVisible,
    }));

    const isDisabled = selectedDate.getTime() === activeDate.getTime();

    const drawerClasses = classNames(
        'price-graph-drawer',
        currentContentType === ComparePriceModuleContentType.Calendar && 'calendar-widget',
        currentContentType === ComparePriceModuleContentType.Graph && 'price-graph-widget',
    );

    return (
        <Drawer open={isExpanded} containerRef={drawerRef} isInDrawer>
            {/* Don't render graph/calendar if drawer is closed.
                Because it requires api calls and no sense to do it on page load, since user may not open it at all. */}
            {isExpanded && (
                <>
                    <div className={drawerClasses}>
                        {!!drawerTabs && (
                            <div className={styles.popupTabs} data-tid='popup-tabs'>
                                {drawerTabs}
                            </div>
                        )}

                        <div className='drawer-labels'>
                            <p className='duration'>{holidayDurationLabel}</p>
                        </div>

                        {seatsReservationNotification}

                        {currentContentType === ComparePriceModuleContentType.Calendar && (
                            <Weekdays className='week-days' weekStart={1} />
                        )}

                        <div className='price-graph-drawer__content'>{children}</div>

                        {isExternalHotel && !getSetting(SiteSettings.PriceGraphHideInfoMessage) && (
                            <ErrorMessage
                                message={getPhrase(SitecoreDictionary.PriceGraphLabelsInfoMessage)}
                                icon={<IconInfoCircle />}
                                IsNotification
                                IsDesc
                            />
                        )}
                    </div>

                    <div className='drawer__actions'>
                        <Button isTransparent onClick={onClickCancel} dataTid='cancel-btn'>
                            {getPhrase(SitecoreDictionary.GlobalsButtonsCancel)}
                        </Button>
                        <Button onClick={onConfirmClick} dataTid='apply-btn' disabled={isDisabled}>
                            {getPhrase(SitecoreDictionary.PriceGraphButtonsApply)}
                        </Button>
                    </div>
                </>
            )}
        </Drawer>
    );
};

export default observer(PriceGraphDrawer);
