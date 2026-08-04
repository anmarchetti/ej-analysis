import { render, screen } from '@testing-library/react';

import { CELSIUS_DEGREES } from 'frontend/components/renderings/WeatherDataCarousel/constants';

import WeatherDataCard, { IWeatherDataCardProps } from './WeatherDataCard';

const createProps = () => ({
    daysOfRain: '4 days of rain',
    degree: 22,
    month: 'January',
});

let mockProps: IWeatherDataCardProps = createProps();

describe('<WeatherDataCard />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render component', () => {
        render(<WeatherDataCard {...mockProps} />);

        expect(screen.getByTestId('weather-data-card-month')).toHaveTextContent(mockProps.month);
        expect(screen.getByTestId('weather-data-card-degree')).toHaveTextContent(mockProps.degree.toString());
        expect(screen.getByTestId('weather-data-card-days-of-rain')).toHaveTextContent(mockProps.daysOfRain as string);
        expect(screen.getByText(CELSIUS_DEGREES)).toBeInTheDocument();
    });
});
