import { RefObject, useEffect, useState } from 'react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { TCarouselRef } from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import { CarouselScreenTypes } from 'frontend/components/renderings/LogoCarousel/constants';

type TUseCarouselDeviceHandlerParams = {
    carouselRef: RefObject<TCarouselRef> | null;
    wasRerendered?: boolean;
};

export const useCarouselDeviceHandler = ({
    wasRerendered,
    carouselRef,
}: TUseCarouselDeviceHandlerParams): CarouselScreenTypes => {
    const { isScreenExtraSmall } = useStore((stores: IHolidaysStores) => ({
        isScreenExtraSmall: stores.appStore.isScreenExtraSmall,
    }));

    const [deviceType, setDeviceType] = useState<CarouselScreenTypes>(CarouselScreenTypes.Desktop);

    useEffect(() => {
        wasRerendered && isScreenExtraSmall && setDeviceType(CarouselScreenTypes.Mobile);

        const changeDeviceTypeHandler = () => {
            if (!carouselRef?.current?.state) {
                return;
            }

            const { deviceType: carouselDeviceType } = carouselRef.current.state;

            if (carouselDeviceType) {
                setDeviceType(carouselDeviceType as CarouselScreenTypes);
            }
        };

        changeDeviceTypeHandler();

        window.addEventListener('resize', changeDeviceTypeHandler);
        window.addEventListener('orientationchange', changeDeviceTypeHandler);

        return () => {
            window.removeEventListener('resize', changeDeviceTypeHandler);
            window.removeEventListener('orientationchange', changeDeviceTypeHandler);
        };
    }, []);

    return deviceType;
};
