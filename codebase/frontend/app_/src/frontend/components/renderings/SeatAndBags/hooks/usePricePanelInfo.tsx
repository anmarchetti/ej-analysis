import { ReactNode } from 'react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { RouteDirection } from 'models/enum/RouteDirection';
import SeatMapPricePanel from 'frontend/components/renderings/SeatAndBags/components/SeatMapPricePanel/SeatMapPricePanel';

export const usePricePanelInfo = (
    shouldHidePrices?: boolean,
): { inboundPricePanels: ReactNode[] | null; outboundPricePanels: ReactNode[] | null } => {
    const {
        isViewBookingPage,
        isConfirmationPage,
        haveOutboundSelectedSeats,
        haveInboundSelectedSeats,
        isScreenLessMedium,
        passengersByQueue,
    } = useStore((stores: TStores) => ({
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        haveOutboundSelectedSeats: stores.seatMapStore.haveOutboundSelectedSeats,
        haveInboundSelectedSeats: stores.seatMapStore.haveInboundSelectedSeats,
        isViewBookingPage: stores.layoutStore.isViewBookingPage,
        isConfirmationPage: stores.layoutStore.isConfirmationPage,
        passengersByQueue: stores.flightsPassengersStore.passengersByQueue,
    }));

    const isOverviewBookingPage = isConfirmationPage || isViewBookingPage;
    const shouldShowSeatsOutbound = haveOutboundSelectedSeats || !isOverviewBookingPage || !isScreenLessMedium;
    const shouldShowSeatsReturn = haveInboundSelectedSeats || !isOverviewBookingPage || !isScreenLessMedium;

    return {
        inboundPricePanels: shouldShowSeatsReturn
            ? passengersByQueue.map((passenger, index) => (
                  <SeatMapPricePanel
                      key={passenger['inboundPassenger'].passengerId}
                      isPricesHidden={shouldHidePrices}
                      seat={passenger['inboundPassenger']?.seat}
                      type={RouteDirection.Inbound}
                      isLastChild={index + 1 === passengersByQueue.length}
                  />
              ))
            : null,
        outboundPricePanels: shouldShowSeatsOutbound
            ? passengersByQueue.map((passenger, index) => (
                  <SeatMapPricePanel
                      key={passenger['outboundPassenger'].passengerId}
                      isPricesHidden={shouldHidePrices}
                      seat={passenger['outboundPassenger']?.seat}
                      type={RouteDirection.Outbound}
                      isLastChild={index + 1 === passengersByQueue.length}
                  />
              ))
            : null,
    };
};
