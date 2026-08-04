import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classnames from 'classnames';

import { IPassengerFlights } from 'models/data/AncillariesInfo';
import { ISeatsAndBagsFields } from 'models/data/ISeatsAndBagsFields';
import { ScreenViews } from 'models/enum/ScreenViews';
import InboundOutboundSeatsDesktop from 'frontend/components/renderings/SeatAndBags/components/desktop/InboundOutboundSeatsDesktop';
import InboundOutboundSeatsMobile from 'frontend/components/renderings/SeatAndBags/components/mobile/InboundOutboundSeatsMobile';

interface ISeatsAndBagsContentProps {
    fields: ISeatsAndBagsFields;
    footer: JSX.Element | null;
    isScreenMedium: boolean;
    passengers: IPassengerFlights[];
    isBookingFlow?: boolean;
    isInnerTitleShown?: boolean;
    isPricesHidden?: boolean;
}

type TViewsClassNames = { [view in ScreenViews]: TContentClassNames };
type TContentClassNames = {
    bookingTitle: string;
    container: string;
    flightsWrapper: string;
    innerWrapper: string;
    wrapper: string;
};
const contentClassNames: TViewsClassNames = {
    [ScreenViews.Desktop]: {
        wrapper: 'seats-and-bags__desktop',
        innerWrapper: 'seats-and-bags-desktop',
        container: 'seats-and-bags-desktop__container',
        bookingTitle: 'seats-and-bags-desktop__title',
        flightsWrapper: 'flights-desktop',
    },
    [ScreenViews.Mobile]: {
        wrapper: 'seats-and-bags__mobile',
        innerWrapper: 'seats-and-bags-mobile',
        container: '',
        bookingTitle: 'seats-and-bags-mobile__header',
        flightsWrapper: 'flights-mobile',
    },
};

const SeatsAndBagsContent = ({
    fields,
    passengers,
    isScreenMedium,
    footer,
    isInnerTitleShown = false,
    isPricesHidden = false,
}: ISeatsAndBagsContentProps) => {
    if (!passengers.length) {
        return null;
    }

    const { SeriesSeatFlightsPageTitle } = fields;

    const getClassName = (isScreenMedium: boolean): TContentClassNames =>
        contentClassNames[isScreenMedium ? ScreenViews.Desktop : ScreenViews.Mobile];

    return (
        <div className={`${getClassName(isScreenMedium).wrapper}`}>
            <div className={`${getClassName(isScreenMedium).innerWrapper}`}>
                <div className={`${getClassName(isScreenMedium).container}`}>
                    {!isInnerTitleShown && !!SeriesSeatFlightsPageTitle && (
                        <Text
                            className={`${getClassName(isScreenMedium).bookingTitle}`}
                            field={SeriesSeatFlightsPageTitle}
                            tag='h2'
                        />
                    )}
                    <div
                        className={classnames(
                            getClassName(isScreenMedium).flightsWrapper,
                            isInnerTitleShown && 'holiday-summary-item',
                        )}
                    >
                        {isInnerTitleShown && !!SeriesSeatFlightsPageTitle && (
                            <Text className='holiday-summary-item__title' field={SeriesSeatFlightsPageTitle} tag='h3' />
                        )}
                        {isScreenMedium ? (
                            <InboundOutboundSeatsDesktop
                                fields={fields}
                                passengers={passengers}
                                isPricesHidden={isPricesHidden}
                                isTitleShown={isInnerTitleShown}
                            />
                        ) : (
                            <>
                                <InboundOutboundSeatsMobile
                                    fields={fields}
                                    passengers={passengers}
                                    isPricesHidden={isPricesHidden}
                                />
                                <InboundOutboundSeatsMobile
                                    fields={fields}
                                    passengers={passengers}
                                    isInbound
                                    isPricesHidden={isPricesHidden}
                                />
                            </>
                        )}
                        {!!footer && footer}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default SeatsAndBagsContent;
