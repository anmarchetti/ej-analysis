import { FunctionComponent, useEffect } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { RouteDirection } from 'models/enum/RouteDirection';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import AmendSummaryAccordion from 'frontend/components/common/AmendSummary/AmendSummaryAccordion/AmendSummaryAccordion';
import EditButton from 'frontend/components/common/AmendSummary/EditButton/EditButton';
import InfoBlock from 'frontend/components/common/InfoBlock/InfoBlock';
import { IAmendDatesSummaryFields } from 'frontend/components/renderings/AmendDatesSummary/AmendDatesSummary';
import WarningPopup from 'frontend/components/renderings/WarningPopup/WarningPopup';

import AmendDatesSummarySeatMap from './components/AmendDatesSummarySeatMap/AmendDatesSummarySeatMap';
import AmendDatesSummarySeatsBags from './components/AmendDatesSummarySeatsBags/AmendDatesSummarySeatsBags';
import AmendDatesSummarySeatsDirection from './components/SeatsSummary/SeatsSummary';
import { getSelectedSeats } from './AmendDatesSummarySeats.utils';

import styles from './AmendDatesSummarySeats.module.scss';

export interface IAmendDatesSummarySeatsProps {
    fields: IAmendDatesSummaryFields;
    rendering: ISitecoreComponent['rendering'];
}

const AmendDatesSummarySeats: FunctionComponent<IAmendDatesSummarySeatsProps> = ({ fields, rendering }) => {
    const {
        booking,
        checkForSeatsAvailability,
        fetchSeatMapsRequest,
        isAmendCTAVisible,
        setIsSeatMapShown,
        isSeatMapShown,
        offerWithPrices,
        clearStore,
        isDisabledBySitecore,
        isSeatNoLongerAvailable,
        setIsSeatNoLongerAvailable,
        hasSeatsPriceChanged,
        setHasSeatsPriceChanged,
    } = useStore(({ amendDatesStore }: IHolidaysStores) => ({
        checkForSeatsAvailability: amendDatesStore.seats.checkForSeatsAvailability,
        isAmendCTAVisible: amendDatesStore.seats.isAmendCTAVisible,
        booking: amendDatesStore.booking,
        fetchSeatMapsRequest: amendDatesStore.seats.fetchSeatMapsRequest,
        setIsSeatMapShown: amendDatesStore.seats.setIsSeatMapShown,
        isSeatMapShown: amendDatesStore.seats.isSeatMapShown,
        offerWithPrices: amendDatesStore.offerWithPrices,
        clearStore: amendDatesStore.seats.clearStore,
        isSeatNoLongerAvailable: amendDatesStore.seats.isSeatNoLongerAvailable,
        isDisabledBySitecore: amendDatesStore.seats.isDisabledBySitecore,
        setIsSeatNoLongerAvailable: amendDatesStore.seats.setIsSeatNoLongerAvailable,
        hasSeatsPriceChanged: amendDatesStore.seats.hasSeatsPriceChanged,
        setHasSeatsPriceChanged: amendDatesStore.seats.setHasSeatsPriceChanged,
    }));

    const onToggleSeatMap = () => {
        setIsSeatMapShown(!isSeatMapShown);
    };

    useEffect(() => {
        checkForSeatsAvailability();

        return clearStore;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!booking) {
        return null;
    }

    const {
        SeatsTitle,
        AddSeatsCTA,
        SeatsIcon,
        InboundLabel,
        OutboundLabel,
        BagsLabel,
        SeatsPopupTitle,
        SeatsNotAvailableDescription,
        SeatsPriceChangedDescription,
        SeatsPopupPrimaryCTA,
        SeatsPopupSecondaryCTA,
        PopupIcon,
    } = fields;

    const {
        seatSelection,
        transport: { routes },
    } = offerWithPrices?.offer || { transport: { routes: [] } };
    const { guests } = booking;

    const { outboundSeats, inboundSeats } = getSelectedSeats(routes, guests, seatSelection || []);
    const isShowInfoMessage = !isAmendCTAVisible;

    const { outbound, inbound } = getRouteByDirection(routes);

    const onReturnToSummaryClick = () => {
        isSeatNoLongerAvailable ? setIsSeatNoLongerAvailable(false) : setHasSeatsPriceChanged(false);
        setIsSeatMapShown(false);
    };

    return (
        <>
            <AmendSummaryAccordion
                dataTid='amend-summary-seats'
                icon={SeatsIcon}
                title={SeatsTitle.value}
                expanderClassName={classNames({
                    [styles.withInfo]: isShowInfoMessage,
                })}
            >
                <div className={styles.seats}>
                    <AmendDatesSummarySeatsDirection
                        fields={fields}
                        key={RouteDirection.Outbound}
                        title={OutboundLabel?.value}
                        route={outbound}
                        chosenSeats={outboundSeats}
                    />
                    <AmendDatesSummarySeatsDirection
                        fields={fields}
                        key={RouteDirection.Inbound}
                        title={InboundLabel?.value}
                        route={inbound}
                        chosenSeats={inboundSeats}
                    />
                    <div className={styles.bags}>
                        <AmendDatesSummarySeatsBags fields={fields} title={BagsLabel?.value} />

                        {isAmendCTAVisible && (
                            <div className={styles.editBtn}>
                                <EditButton
                                    onClick={onToggleSeatMap}
                                    dataTid='amend-dates-summary-seats-button'
                                    isPlaceholderShimmer={fetchSeatMapsRequest?.isPending}
                                    isCapitalize
                                >
                                    {AddSeatsCTA?.value}
                                </EditButton>
                            </div>
                        )}
                    </div>
                </div>
                {isShowInfoMessage && (
                    <InfoBlock
                        title={fields.SeatsUnavailableTitle}
                        text={fields.SeatsUnavailableDescription}
                        dataTid='amend-dates-seats-unavailable-message'
                        withWarningIcon={!isDisabledBySitecore}
                        className={styles.warningMessage}
                        textClass={styles.warningMessageText}
                    />
                )}
            </AmendSummaryAccordion>

            {isSeatNoLongerAvailable && (
                <WarningPopup
                    title={SeatsPopupTitle}
                    description={SeatsNotAvailableDescription}
                    icon={PopupIcon}
                    ctaText={SeatsPopupPrimaryCTA}
                    secondaryCtaText={SeatsPopupSecondaryCTA}
                    onClose={() => setIsSeatNoLongerAvailable(false)}
                    onSecondaryCtaClick={onReturnToSummaryClick}
                />
            )}

            {hasSeatsPriceChanged && (
                <WarningPopup
                    title={SeatsPopupTitle}
                    description={SeatsPriceChangedDescription}
                    icon={PopupIcon}
                    ctaText={SeatsPopupPrimaryCTA}
                    secondaryCtaText={SeatsPopupSecondaryCTA}
                    onClose={() => setHasSeatsPriceChanged(false)}
                    onSecondaryCtaClick={onReturnToSummaryClick}
                />
            )}
            {isSeatMapShown && <AmendDatesSummarySeatMap rendering={rendering} onClose={onToggleSeatMap} />}
        </>
    );
};

export default observer(AmendDatesSummarySeats);
