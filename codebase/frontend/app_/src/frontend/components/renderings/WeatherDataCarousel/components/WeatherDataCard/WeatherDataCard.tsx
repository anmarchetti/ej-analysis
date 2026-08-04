import React from 'react';

import { CELSIUS_DEGREES } from 'frontend/components/renderings/WeatherDataCarousel/constants';

import styles from './WeatherDataCard.module.scss';

export interface IWeatherDataCardProps {
    daysOfRain: string | undefined;
    degree: number;
    month: string;
}

const WeatherDataCard = ({ month, degree, daysOfRain }: IWeatherDataCardProps) => (
    <div className={styles.wrapper} data-tid='weather-data-card'>
        <p data-tid='weather-data-card-month' className={styles.month}>
            {month}
        </p>
        <p data-tid='weather-data-card-degree' className={styles.degree}>
            {degree}
            <span className={styles.degreeSymbol}>{CELSIUS_DEGREES}</span>
        </p>
        {daysOfRain && (
            <p data-tid='weather-data-card-days-of-rain' className={styles.daysOfRain}>
                {daysOfRain}
            </p>
        )}
    </div>
);

export default WeatherDataCard;
