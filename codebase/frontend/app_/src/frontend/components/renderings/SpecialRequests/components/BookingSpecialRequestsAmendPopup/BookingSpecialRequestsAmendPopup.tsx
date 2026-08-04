import React, { useEffect, useMemo, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { getAllSpecialRequests, getIgnoredCodes, updateIgnoreCodes } from 'frontend/hooks/useSpecialRequests';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IBookingInfo, IBookingSpecialRequest, ISpecialRequestAlert } from 'models/data/IBookingInfo';
import { IContradictoryOptionsPayload, IFlattenedSpecialRequest } from 'models/data/SpecialRequest';
import { GuestType } from 'models/enum/GuestType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import { ContradictorySpecialRequestPopup } from 'frontend/components/renderings/SpecialRequests/components/ContradictorySpecialRequestPopup/ContradictorySpecialRequestPopup';
import ExtrasSpecialRequestsDrawerAlerts from 'frontend/components/renderings/SpecialRequests/components/ExtrasSpecialRequestsDrawer/ExtrasSpecialRequestsDrawerAlerts/ExtrasSpecialRequestsDrawerAlerts';
import SpecialRequestItem from 'frontend/components/renderings/SpecialRequests/components/SpecialRequestItem/SpecialRequestItem';
import { ISpecialRequestsFields } from 'frontend/components/renderings/SpecialRequests/SpecialRequests';
import {
    getContradictingItems,
    getSelectedRequestsCodes,
    isSelectedRequestsDifferFromOriginal,
} from 'frontend/components/renderings/SpecialRequests/specialRequests.utils';
import { useSRLocalStore } from 'frontend/components/renderings/SpecialRequests/stores/createLocalStore';

import styles from './BookingSpecialRequestsAmendPopup.module.scss';

export interface IBookingSpecialRequestsAmendPopup {
    booking: IBookingInfo;
    bookingRequests: IBookingSpecialRequest[];
    fields: ISpecialRequestsFields | undefined;
    isAmendSSRFailed: boolean;
    isAmendSSRLoading: boolean;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (codes: string[]) => void;
}

const BookingSpecialRequestsAmendPopup = (props: IBookingSpecialRequestsAmendPopup) => {
    const { tracking } = useSRLocalStore();
    const { isScreenMedium, getPhrase, isScreenLessMedium } = useStore((stores: IHolidaysStores) => ({
        isScreenMedium: stores.appStore.isScreenMedium,
        getPhrase: stores.layoutStore.getPhrase,
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
    }));

    const {
        bookingRequests,
        isOpen,
        isAmendSSRFailed,
        isAmendSSRLoading,
        onClose,
        onSubmit: onSubmitRequests,
        booking,
    } = props;
    const { AmendmentPopupTitle, AmendmentPopupDescription, SpecialRequestsTypes, SpecialRequestsContradictoryGroups } =
        props.fields || {};
    const [requests, setRequests] = useState<IFlattenedSpecialRequest[]>([]);
    const [contradictoryOptions, setContradictoryOptions] = useState<Nullable<IContradictoryOptionsPayload>>();
    const [isDifferFromOriginal, setIsDifferFromOriginal] = useState(false);

    const initRequests = () => {
        const requests = getAllSpecialRequests(
            SpecialRequestsTypes || [],
            bookingRequests.map(r => r.code),
            props.booking?.guests?.some(guest => guest.type === GuestType.Infant),
            undefined,
            SpecialRequestsContradictoryGroups,
        );
        setRequests(requests[0]);
        setIsDifferFromOriginal(false);
    };

    const onSelectRequest = (code: string, contradictoryCode?: string) => {
        if (isAmendSSRLoading) return;

        const newRequests = requests.map(rq =>
            rq.code === code || rq.code === contradictoryCode
                ? { ...rq, isSelected: !rq.isSelected, isPreselected: false }
                : rq,
        );

        const contradictingItems = getContradictingItems(requests, code);

        if (!contradictoryCode) {
            if (contradictingItems) {
                setContradictoryOptions(contradictingItems);

                return;
            }

            // Avoid fire tracking event related to "Contradictory popup"
            const currentRequest = newRequests.find(req => req.code === code);

            if (currentRequest) {
                tracking.handleClickSpecialRequestItem(booking.bookingReference, bookingRequests, currentRequest);
            }
        }

        updateIgnoreCodes(booking.bookingReference, [code]);
        const hasDifference = isSelectedRequestsDifferFromOriginal(newRequests, bookingRequests);
        setIsDifferFromOriginal(hasDifference);
        setRequests(newRequests);
    };

    const onSubmit = (event?: React.MouseEvent | React.FormEvent) => {
        event?.preventDefault();
        const selectedCodes = getSelectedRequestsCodes(requests);
        const selectedRequests = requests.filter(({ isSelected }) => isSelected);
        onSubmitRequests(selectedCodes);

        tracking.submitSpecialRequests(booking.bookingReference, selectedRequests);
    };

    const clearContradictoryOptions = () => {
        setContradictoryOptions(null);
    };

    const alerts = useMemo(() => {
        const alerts: ISpecialRequestAlert[] = [];
        const ignoreCodes = getIgnoredCodes(booking.bookingReference);
        requests.forEach(el => {
            const isSelected =
                el.isSelected && el.isPreselected && el.preselectedAlert && !ignoreCodes.includes(el.code);

            if (isSelected) {
                alerts.push({ description: el.preselectedAlert?.value, message: el.AlertTitle?.value });
            }
        });

        return alerts;
    }, [requests]);

    useEffect(() => {
        if (isOpen) {
            initRequests();
            tracking.openSpecialRequests(booking.bookingReference, bookingRequests);
        }
    }, [isOpen]);

    const submitButtonText = getPhrase(
        isScreenMedium
            ? SitecoreDictionary.BookingSummaryButtonsSubmitSpecialRequest
            : SitecoreDictionary.GlobalsButtonsApply,
    );
    const renderForm = (contentClass?: string, buttonsClass?: string, title?: ISitecoreField<string>) => (
        <>
            <form onSubmit={onSubmit}>
                <div className={contentClass}>
                    {!!title?.value && (
                        <Text
                            field={title}
                            tag='h4'
                            className={styles.title}
                            data-tid='booking-amend-special-requests-title'
                        />
                    )}
                    {!!AmendmentPopupDescription?.value && (
                        <RichTextWithLinks
                            field={AmendmentPopupDescription}
                            tag='div'
                            className={classNames(styles.description, alerts.length > 0 && styles.alerts)}
                            dataId='booking-amend-special-requests-description'
                        />
                    )}

                    {isScreenLessMedium && isOpen && <ExtrasSpecialRequestsDrawerAlerts alerts={alerts} />}

                    <div className={styles.specialRequestsList}>
                        {requests.map(request => (
                            <SpecialRequestItem
                                key={request.code}
                                item={request}
                                onSelect={onSelectRequest}
                                isSolid={isScreenLessMedium}
                                dataTid='booking-amend-special-requests-item'
                            />
                        ))}

                        {isAmendSSRFailed && (
                            <ErrorMessage
                                message={getPhrase(SitecoreDictionary.BookingSummaryErrorsAmendSpecialRequest)}
                                description={getPhrase(
                                    SitecoreDictionary.BookingSummaryErrorsAmendSpecialRequestDescription,
                                )}
                                errorMessageClass={styles.errorMessage}
                                icon={<SvgWarningFilled />}
                            />
                        )}
                        {!isScreenLessMedium && !!alerts?.length && (
                            <div className={styles.alertsList}>
                                {alerts.map(({ description }, i) => (
                                    <ErrorMessage
                                        key={i + '_' + description}
                                        message={description}
                                        icon={<SvgWarningFilled />}
                                        errorMessageClass={styles.errorMessage}
                                        IfIsNotificationOrange
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className={buttonsClass}>
                    <Button
                        type='button'
                        isTransparent
                        disabled={isAmendSSRLoading}
                        onClick={() => onClose()}
                        dataTid='booking-amend-special-requests-cancel-button'
                    >
                        {getPhrase(SitecoreDictionary.GlobalsButtonsCancel)}
                    </Button>
                    <Button
                        type='submit'
                        disabled={!isDifferFromOriginal || isAmendSSRLoading}
                        isLoading={isAmendSSRLoading}
                        dataTid='booking-amend-special-requests-submit-button'
                    >
                        {submitButtonText}
                    </Button>
                </div>
            </form>
            <ContradictorySpecialRequestPopup
                contradictoryOptions={contradictoryOptions}
                onSubmit={onSelectRequest}
                onCancel={clearContradictoryOptions}
                fields={props.fields}
                booking={booking}
            />
        </>
    );

    if (isScreenMedium) {
        return isOpen ? (
            <Popup
                aria-label={AmendmentPopupTitle?.value}
                containerClass={styles.amendPopup}
                bodyClass={styles.popupBody}
                isFullWidth
                onClose={onClose}
                id='booking-amend-special-requests'
            >
                {renderForm(undefined, styles.footer, AmendmentPopupTitle)}
            </Popup>
        ) : null;
    }

    return (
        <Drawer open={isOpen} className={styles.amendDrawer} dataTid='booking-amend-special-requests-drawer'>
            {renderForm(styles.drawerContent, 'drawer__actions')}
        </Drawer>
    );
};

export default observer(BookingSpecialRequestsAmendPopup);
