import React, { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ICabinBagsFields } from 'models/data/ICabinBagsFields';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import JSSImage from 'frontend/components/common/JSSImage';
import ReadMoreButton from 'frontend/components/common/ReadMoreButton';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import CabinBagsPricePanel from 'frontend/components/renderings/CabinBags/components/CabinBagsPricePanel/CabinBagsPricePanel';

import styles from './CabinBagsDropdown.module.scss';

export interface ICabinBagsDropdownProps {
    fields: ICabinBagsFields;
    isExpanded: boolean;
    onExpandChange: (isExpanded: boolean) => void;
}

export const CabinBagsDropdown: FC<ICabinBagsDropdownProps> = ({ fields, isExpanded, onExpandChange }) => {
    const { passengersByQueue, isPostBookingPages, isLuxuryPackage } = useStore((stores: TStores) => ({
        passengersByQueue: stores.flightsPassengersStore.passengersByQueue,
        isPostBookingPages: stores.layoutStore.isPostBookingPages,
        isLuxuryPackage: stores.bookingStore.isLuxuryPackage,
    }));

    const { CollapseClose, CollapseOpen, OutboundIcon, CollapseOpenViewOnly } = fields;

    const onReadMoreButtonClick = (): void => {
        onExpandChange(!isExpanded);
    };
    const isTablet = useTabletViewport();

    return (
        <div
            data-tid='lcb-dropdown-wrapper'
            className={classNames(styles.wrapper, isPostBookingPages && styles.wrapperPostBooking)}
        >
            <div className={styles.container} data-tid='lcb-dropdown'>
                <div
                    data-tid='lcb-dropdown-header'
                    className={classNames(isExpanded && styles.header, isPostBookingPages && styles.headerAlt)}
                >
                    <div
                        data-tid='open-lcb-dropdown-action'
                        className={classNames(
                            'read-more-box read-more-box-alt',
                            styles.readMoreButton,
                            isTablet && isPostBookingPages && 'd-none',
                        )}
                    >
                        {!isPostBookingPages && (
                            <ReadMoreButton
                                isReadLess={isExpanded}
                                onClick={onReadMoreButtonClick}
                                readLessText={CollapseClose?.value}
                                readMoreText={isLuxuryPackage ? CollapseOpenViewOnly?.value : CollapseOpen?.value}
                            />
                        )}
                    </div>

                    <div data-tid='routes-title' className={classNames(styles.routesTitle, !isExpanded && 'd-none')}>
                        <div className={styles.text}>
                            <JSSImage data-tid='outbound-icon' className={styles.icon} field={OutboundIcon} />
                            <RichTextDictionary tag='span' dictionaryKey={SitecoreDictionary.SeatMapLabelsOutbound} />
                            <span className={styles.ampersand}>&</span>
                            <RichTextDictionary tag='span' dictionaryKey={SitecoreDictionary.SeatMapLabelsReturn} />
                        </div>
                    </div>
                </div>
                <div data-tid='lcb-dropdown-collapsing-part' className={classNames(!isExpanded && 'd-none')}>
                    {passengersByQueue.map((passenger, index) => (
                        <CabinBagsPricePanel
                            key={passenger.outboundPassenger.passengerId}
                            passenger={passenger}
                            fields={fields}
                            passengerIndex={index + 1}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default observer(CabinBagsDropdown);
