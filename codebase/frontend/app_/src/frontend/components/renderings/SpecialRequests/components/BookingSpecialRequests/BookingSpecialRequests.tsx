import { FC, useEffect, useRef, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { BookingStatus } from 'models/enum/BookingStatus';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ViewBookingComponentWrapper from 'frontend/components/common/ViewBookingComponentWrapper/ViewBookingComponentWrapper';
import BookingSpecialRequestsAmendPopup from 'frontend/components/renderings/SpecialRequests/components/BookingSpecialRequestsAmendPopup/BookingSpecialRequestsAmendPopup';
import SpecialRequestItem from 'frontend/components/renderings/SpecialRequests/components/SpecialRequestItem/SpecialRequestItem';
import {
    ISpecialRequestsFields,
    ISpecialRequestsParams,
} from 'frontend/components/renderings/SpecialRequests/SpecialRequests';
import { useSRLocalStore } from 'frontend/components/renderings/SpecialRequests/stores/createLocalStore';

import styles from './BookingSpecialRequests.module.scss';

export interface IBookingSpecialRequestsProps {
    booking: IBookingInfo;
    params: ISpecialRequestsParams;
    fields?: ISpecialRequestsFields;
    withAmendment?: boolean;
}

export const BookingSpecialRequests: FC<IBookingSpecialRequestsProps> = ({
    booking,
    fields,
    withAmendment,
    params,
}) => {
    const { tracking, hideAction } = useSRLocalStore();
    const {
        isAmendSSRFailed,
        isAmendSSRLoading,
        amendBookingSpecialRequests,
        resetAmendSSR,
        isConfirmationPage,
        isViewBookingPage,
    } = useStore(store => ({
        isAmendSSRFailed: store.viewBookingStore.isAmendSSRFailed,
        isAmendSSRLoading: store.viewBookingStore.isAmendSSRLoading,
        amendBookingSpecialRequests: store.viewBookingStore.amendBookingSpecialRequests,
        resetAmendSSR: store.viewBookingStore.resetAmendSSR,
        isConfirmationPage: store.layoutStore.isConfirmationPage,
        isViewBookingPage: isHolidayStore(store) ? store.viewBookingStore.isViewBookingStatusPage : false,
    }));

    const {
        AddRequestTitle,
        AddRequestDescription,
        AddRequestsCTA,
        EditRequestsCTA,
        AmendRequestIcon,
        ViewBookingContentRequestSubtitle,
        ViewBookingContentRequestTitle,
    } = fields || {};
    const bookingRequests = booking.specialRequests || [];
    const hasRequests = bookingRequests.length > 0;

    const canAmend =
        withAmendment &&
        booking.amendmentInfo?.specialRequest &&
        booking.isLoggedInAsLeadPassenger &&
        booking.bookingStatus !== BookingStatus.Canceled &&
        !isConfirmationPage;
    const amendButtonText = hasRequests ? EditRequestsCTA?.value : AddRequestsCTA?.value;

    // Create ref for isAmendSSRFailed, because it's used in onSubmit() (props are stale in event handlers)
    const isAmendSSRFailedRef = useRef(isAmendSSRFailed);

    const [isAmendPopupShown, setIsAmendPopupShown] = useState(false);
    const closeAmendPopup = () => {
        setIsAmendPopupShown(false);
        resetAmendSSR();
    };
    const openAmendPopup = () => {
        tracking.clickTrackingSRCTA(booking.bookingReference);
        setIsAmendPopupShown(true);
    };

    const onSubmitAmendedRequests = async (codes: string[]) => {
        await amendBookingSpecialRequests(codes);

        // Close popup, if amendment was successful.
        if (!isAmendSSRFailedRef.current) {
            closeAmendPopup();
        }
    };

    useEffect(() => {
        isAmendSSRFailedRef.current = isAmendSSRFailed;
    }, [isAmendSSRFailed]);

    if (!fields) {
        return null;
    }

    const { IsSleekDesign } = params;

    const isSleekDesign = isSitecoreCheckboxSelected(IsSleekDesign);

    return (
        <>
            {(canAmend || hasRequests) && (
                <>
                    <ViewBookingComponentWrapper
                        Title={isSleekDesign ? ViewBookingContentRequestTitle : AddRequestTitle}
                        SecondaryButtonText={
                            canAmend && !!amendButtonText && !hideAction && amendButtonText
                                ? { value: amendButtonText }
                                : undefined
                        }
                        onSecondaryButtonClick={openAmendPopup}
                        Icon={hasRequests ? undefined : AmendRequestIcon}
                        useMasonryStyle={isViewBookingPage}
                    >
                        <div className={styles.bannerContent}>
                            {isSleekDesign && (
                                <Text tag='h6' className={styles.subtitle} field={ViewBookingContentRequestSubtitle} />
                            )}
                            <div className={styles.details}>
                                {hasRequests ? (
                                    <div className={styles.specialRequestsList}>
                                        {bookingRequests.map(rq => (
                                            <SpecialRequestItem
                                                key={rq.code}
                                                item={{ ...rq, isSelected: true, name: rq.displayName }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    !!AddRequestDescription?.value && (
                                        <RichTextWithLinks field={AddRequestDescription} />
                                    )
                                )}
                            </div>
                        </div>
                    </ViewBookingComponentWrapper>

                    {canAmend && (
                        <BookingSpecialRequestsAmendPopup
                            bookingRequests={bookingRequests}
                            fields={fields}
                            isOpen={isAmendPopupShown}
                            isAmendSSRLoading={isAmendSSRLoading}
                            isAmendSSRFailed={isAmendSSRFailed}
                            onClose={closeAmendPopup}
                            onSubmit={onSubmitAmendedRequests}
                            booking={booking}
                        />
                    )}
                </>
            )}
        </>
    );
};

export default observer(BookingSpecialRequests);
