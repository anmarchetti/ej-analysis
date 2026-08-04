import { FC } from 'react';
import { useComponentProps, withDatasourceCheck } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import offersService from 'frontend/services/offers.service';
import weatherDataService from 'frontend/services/weatherDataService/weatherData.service';
import { isHotelDetails } from 'frontend/utils/buildSitecorePath';
import { getMonthName } from 'frontend/utils/date.utils';
import { getLocationHierarchy } from 'frontend/utils/getLocationHierarchy';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IWeatherData } from 'models/data/IBookingInfo';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { TGetServerSideComponentProps } from 'models/sitecore/TGetServerSideComponentProps';
import CarouselButtonsGroup from 'frontend/components/common/CarouselButtonsGroup/CarouselButtonsGroup';
import CarouselWrapper from 'frontend/components/common/CarouselWrapper/CarouselWrapper';
import TextWithTooltip from 'frontend/components/common/TextWithTooltip/TextWithTooltip';
import { withRerender } from 'frontend/components/hoc';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';

import WeatherDataCard from './components/WeatherDataCard/WeatherDataCard';
import { responsiveConfig } from './constants';
import { getInitialCarouselSlide, getNumberOfItemsInCarouselSlide } from './weatherData.utils';

import styles from './WeatherDataCarousel.module.scss';

interface IWeatherDataCarouselFields {
    Title: ISitecoreField<string>;
}

export type TWeatherDataCarouselProps = ISitecoreComponent<IWeatherDataCarouselFields> & IComponentWithRerenderProps;

const WeatherDataCarousel: FC<TWeatherDataCarouselProps> = ({ fields, rendering, wasRerendered }) => {
    const weatherData = useComponentProps<IWeatherData>(rendering.uid);
    const {
        hotel,
        offer,
        layout,
        isHotelDetailsBookPage,
        getPhrase,
        isScreenLessMedium,
        isScreenExtraLarge,
        pathname,
    } = useStore(stores => ({
        hotel: stores.bookingStore.hotel,
        offer: stores.bookingStore.selectedOffer,
        layout: stores.layoutStore.layout,
        isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
        getPhrase: stores.layoutStore.getPhrase,
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
        isScreenExtraLarge: stores.appStore.isScreenExtraLarge,
        pathname: stores.routerStore.pathname,
    }));

    if (!weatherData?.averageTemp?.length) {
        return null;
    }

    const itemsPerSlide = getNumberOfItemsInCarouselSlide(isScreenExtraLarge, isScreenLessMedium);
    const weatherTemperatureData = weatherData.averageTemp.reduce(
        (weather: number[][], currentValue: number, currentIndex: number, array: number[]) => {
            if (currentIndex % itemsPerSlide === 0) {
                weather.push(array.slice(currentIndex, currentIndex + itemsPerSlide));
            }

            return weather;
        },
        [],
    );

    const date = isHotelDetailsBookPage ? offer?.date : '';
    const initialSlide = getInitialCarouselSlide(weatherTemperatureData, date);
    const tooltipMessage = getPhrase(SitecoreDictionary.SearchPodFiltersLabelsWeatherTooltip);
    const regionName = isHotelDetailsBookPage ? hotel?.location?.name : getLocationHierarchy(layout)?.region?.name;

    const getTitle = (): string => {
        if (fields?.Title.value && regionName) {
            return Tokenizer.replaceToken(fields.Title.value, Tokens.Region, regionName);
        }

        return '';
    };

    return (
        <div className={styles.wrapper} data-tid='weather-data-wrapper'>
            <TextWithTooltip
                message={getTitle()}
                tooltipMessage={tooltipMessage}
                wrapperClassName={styles.title}
                tooltipTriggerClassName={styles.tooltipTrigger}
                dataTid='weather-data-title'
                tag='h2'
            />
            <div className={styles.carouselWrapper}>
                <CarouselWrapper
                    key={[pathname, initialSlide].join('-')}
                    responsive={responsiveConfig}
                    showDots
                    arrows={false}
                    customButtonGroup={
                        wasRerendered && !isScreenLessMedium ? <CarouselButtonsGroup minNumberOfItems={1} /> : undefined
                    }
                    partialVisible
                    dotListClass={styles.carouselDotList}
                    initialSlide={initialSlide}
                >
                    {weatherTemperatureData.map((items, dataIndex) => (
                        <div
                            key={`weather-data-${dataIndex}`}
                            className={styles.itemsWrapper}
                            data-tid='weather-carousel-slide-wrapper'
                        >
                            {items.map((temp, tempIndex) => {
                                const currentMonthIndex = dataIndex * itemsPerSlide + tempIndex;
                                const label =
                                    weatherData.rainyDays[currentMonthIndex] === 1
                                        ? getPhrase(SitecoreDictionary.WeatherLabelsDayOfRain)
                                        : getPhrase(SitecoreDictionary.WeatherLabelsDaysOfRain);

                                return (
                                    <WeatherDataCard
                                        key={getMonthName(currentMonthIndex)}
                                        daysOfRain={
                                            weatherData.rainyDays[currentMonthIndex] === undefined
                                                ? undefined
                                                : `${weatherData.rainyDays[currentMonthIndex]} ${label}`
                                        }
                                        degree={temp}
                                        month={getMonthName(currentMonthIndex)}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </CarouselWrapper>
            </div>
        </div>
    );
};

export const getServerSideProps: TGetServerSideComponentProps<IWeatherData | null> = async (
    rendering,
    layout,
    context,
) => {
    let code;

    if (isHotelDetails(context.query)) {
        const hotelInfo = await offersService.loadHotelInfo(
            context.query[QueryParamName.AccommodationId] as string,
            undefined,
            undefined,
            context.req.headers.cookie,
        );
        code = hotelInfo?.location.code;
    } else {
        code = getLocationHierarchy(layout)?.region?.code;
    }

    if (code) {
        return await weatherDataService.getWeather(code, context.req.headers.cookie);
    }

    return null;
};

export default withDatasourceCheck()<TWeatherDataCarouselProps>(withRerender(observer(WeatherDataCarousel)));
