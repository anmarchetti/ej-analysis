import React, { createRef, FC, ReactNode, useEffect, useState } from 'react';
import classNames from 'classnames';
import { Guid } from 'guid-typescript';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';
import ReadMoreButton from 'frontend/components/common/ReadMoreButton';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';

import { adjustHeight } from './ancillariesDropdown.utils';

import styles from './AncillariesDropdown.module.scss';

export interface IAncillariesDropdownProps {
    fields: {
        CollapseClose: ISitecoreField<string>;
        CollapseOpen: ISitecoreField<string>;
        OutboundIcon: ISitecoreField<ISitecoreImage>;
        ReturnIcon: ISitecoreField<ISitecoreImage>;
    };
    passengerTypeInfo: ReactNode[];
    pricePanelsInbound: ReactNode[] | null;
    pricePanelsOutbound: ReactNode[] | null;
    actionPanel?: ReactNode;
}

export const AncillariesDropdown: FC<IAncillariesDropdownProps> = ({
    fields,
    passengerTypeInfo,
    pricePanelsOutbound,
    pricePanelsInbound,
    actionPanel,
}) => {
    const { isConfirmationPage, isViewBookingPage, isAmendPaymentPage } = useStore((stores: TStores) => ({
        isConfirmationPage: stores.layoutStore.isConfirmationPage,
        isViewBookingPage: stores.layoutStore.isViewBookingPage,
        isAmendPaymentPage: stores.layoutStore.isAmendPaymentPage,
    }));

    const isShowBookingPage = isViewBookingPage || isConfirmationPage;
    const isPostBooking = isShowBookingPage || isAmendPaymentPage;

    const [isExpanded, setIsExpanded] = useState<boolean>(isPostBooking);
    const guestsRef = createRef<HTMLDivElement>();
    const outboundRef = createRef<HTMLDivElement>();
    const inboundRef = createRef<HTMLDivElement>();

    useEffect(() => {
        const resizeHandler = (): void => adjustHeight(guestsRef, outboundRef, inboundRef);

        resizeHandler();

        window.addEventListener('resize', resizeHandler);

        return () => {
            window.removeEventListener('resize', resizeHandler);
        };
    }, [guestsRef, outboundRef, inboundRef]);

    const { CollapseClose, CollapseOpen, OutboundIcon, ReturnIcon } = fields;

    const onReadMoreButtonClick = (): void => {
        setIsExpanded(!isExpanded);
    };

    const getColumnData = (
        pricePanels: ReactNode[] | null,
        ref: React.RefObject<HTMLDivElement>,
    ): undefined | JSX.Element => {
        if (!pricePanels) {
            return;
        }

        return (
            <>
                <div className='d-md-block d-none' ref={ref}>
                    {pricePanels}
                </div>
                {pricePanels.map((pricePanel, i) => (
                    <div key={Guid.create().toString()} className={classNames(styles.row, 'd-md-none')}>
                        {passengerTypeInfo[i]}
                        {pricePanel}
                    </div>
                ))}
            </>
        );
    };

    return (
        <div
            data-tid='ancillaries-wrapper'
            className={classNames(styles.wrapper, {
                [styles.wrapperAlt]: !pricePanelsOutbound,
                [styles.amendPayment]: isAmendPaymentPage,
            })}
        >
            <div
                className={classNames(styles.container, {
                    [styles.containerGrid]: isExpanded,
                    [styles.bookingPage]: isShowBookingPage,
                    [styles.postBookingTheme]: isPostBooking,
                })}
                data-tid='ancillaries-container'
            >
                <div data-tid='read-more-column' className={classNames(isPostBooking && styles.placeholder)}>
                    {!isPostBooking && (
                        <div
                            data-tid='read-more-box'
                            className={classNames('read-more-box read-more-box-alt', styles.readMoreButton)}
                        >
                            <ReadMoreButton
                                isReadLess={isExpanded}
                                onClick={onReadMoreButtonClick}
                                readLessText={CollapseClose?.value}
                                readMoreText={CollapseOpen?.value}
                            />
                        </div>
                    )}
                    <div
                        ref={guestsRef}
                        data-tid='passenger-type-wrapper'
                        className={classNames('d-none', isExpanded && 'd-md-block')}
                    >
                        {passengerTypeInfo}
                    </div>
                </div>
                <div className={classNames(!isExpanded && 'd-none')} data-tid='outbound-column'>
                    <div
                        data-tid='outbound-text'
                        className={classNames(styles.column, !pricePanelsOutbound && styles.noSelection)}
                    >
                        <div className={classNames(styles.text, styles.columnHeader)}>
                            <JSSImage data-tid='outbound-icon' field={OutboundIcon} />
                            <RichTextDictionary tag='span' dictionaryKey={SitecoreDictionary.SeatMapLabelsOutbound} />
                        </div>
                        {!pricePanelsOutbound && (
                            <div data-tid='no-seat-outbound' className={classNames(styles.noSeats, 'd-lg-none')}>
                                <RichTextDictionary
                                    tag='span'
                                    dictionaryKey={SitecoreDictionary.SeatMapLabelsNoSeatSelectedPlural}
                                />
                            </div>
                        )}
                    </div>
                    {getColumnData(pricePanelsOutbound, outboundRef)}
                </div>
                <div className={classNames(!isExpanded && 'd-none', styles.returnColumn)} data-tid='return-column'>
                    <div
                        className={classNames(styles.column, !pricePanelsInbound && styles.noSelection)}
                        data-tid='return-text'
                    >
                        <div className={classNames(styles.text, styles.columnHeader)}>
                            <JSSImage data-tid='return-icon' field={ReturnIcon} />
                            <RichTextDictionary tag='span' dictionaryKey={SitecoreDictionary.SeatMapLabelsReturn} />
                        </div>
                        {!pricePanelsInbound && (
                            <div className={classNames(styles.noSeats, 'd-lg-none')} data-tid='no-seat-return'>
                                <RichTextDictionary
                                    tag='span'
                                    dictionaryKey={SitecoreDictionary.SeatMapLabelsNoSeatSelectedPlural}
                                />
                            </div>
                        )}
                    </div>
                    {getColumnData(pricePanelsInbound, inboundRef)}
                </div>

                {isViewBookingPage && (
                    <div data-tid='anc-action-panel-wrap' className='d-md-none'>
                        {actionPanel}
                    </div>
                )}
            </div>
        </div>
    );
};

export default observer(AncillariesDropdown);
