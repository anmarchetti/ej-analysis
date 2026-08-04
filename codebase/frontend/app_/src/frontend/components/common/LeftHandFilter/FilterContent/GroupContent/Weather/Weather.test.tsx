import { createRef } from 'react';
import { render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import * as weatherUtils from 'frontend/components/common/LeftHandFilter/FilterContent/GroupContent/Weather/Weather.utils';
import { CELSIUS_DEGREES } from 'frontend/components/renderings/WeatherDataCarousel/constants';

import { Weather } from './Weather';

const mockTextWithTooltip = jest.fn();
jest.mock('frontend/components/common/TextWithTooltip/TextWithTooltip', () => ({
    __esModule: true,
    default: props => {
        mockTextWithTooltip(props);

        return <div data-tid='text-with-tooltip' />;
    },
}));

jest.mock('frontend/components/common/LeftHandFilter/FilterContent/GroupContent/PriceFilter/CompoundSlider', () => ({
    __esModule: true,
    default: () => <div data-tid='compound-slider' />,
}));

const mockUseWeatherData = jest.spyOn(weatherUtils, 'default');

const weatherData = {
    getPhrase: jest.fn(p => p),
    getFormattedTemperature: jest.fn(p => p.toString()),
    minAvailableTemp: 10,
    maxAvailableTemp: 30,
    slider: {
        step: 1,
        min: 10,
        max: 30,
        values: [],
        onSlide: jest.fn(),
        onSliding: jest.fn(),
        getValue: jest.fn(),
    },
    fromField: {
        ref: createRef<HTMLInputElement>(),
        type: 'number',
        className: '',
        autoComplete: 'off',
        min: 10,
        max: 30,
        onChange: jest.fn(),
        onKeyDown: jest.fn(),
        onBlur: jest.fn(),
    },
    toField: {
        ref: createRef<HTMLInputElement>(),
        type: 'number',
        className: '',
        autoComplete: 'off',
        min: 10,
        max: 30,
        onChange: jest.fn(),
        onKeyDown: jest.fn(),
        onBlur: jest.fn(),
    },
    isDisabled: false,
};

describe('Weather', () => {
    it('should standard render', () => {
        mockUseWeatherData.mockReturnValue(weatherData);

        render(<Weather />);

        expect(screen.getByTestId('text-with-tooltip')).toBeInTheDocument();
        expect(screen.getByTestId('compound-slider')).toBeInTheDocument();
        expect(screen.getByTestId('weather-filter-min-temp')).toHaveTextContent('10');
        expect(screen.getByTestId('weather-filter-max-temp')).toHaveTextContent('30');
        expect(screen.getByTestId('weather-filter-fields-label')).toHaveClass('fieldsLabel');
        expect(screen.getByTestId('weather-filter-fields-label')).toHaveTextContent(
            SitecoreDictionary.SearchPodFiltersLabelsWeatherFieldsLabel,
        );
        expect(screen.getAllByText(CELSIUS_DEGREES)).toHaveLength(2);
        expect(screen.getByText(SitecoreDictionary.GlobalConjunctionsAnd)).toBeInTheDocument();
        expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
        expect(screen.getByLabelText(SitecoreDictionary.AccessibilityAriaLabelsWeatherMinInput)).toBeInTheDocument();
        expect(screen.getByLabelText(SitecoreDictionary.AccessibilityAriaLabelsWeatherMaxInput)).toBeInTheDocument();
        expect(mockTextWithTooltip).toHaveBeenCalledWith({
            message: SitecoreDictionary.SearchPodFiltersLabelsWeatherFilterSubtitle,
            tooltipMessage: SitecoreDictionary.SearchPodFiltersLabelsWeatherTooltip,
            wrapperClassName: 'info',
            tooltipTriggerClassName: 'tooltipTrigger',
            dataTid: 'weather-filter-info-wrapper',
        });
    });

    it('should render disabled weather filter when isDisabled is true', () => {
        mockUseWeatherData.mockReturnValue({ ...weatherData, isDisabled: true });

        render(<Weather />);

        expect(screen.getByTestId('weather-filter-content')).toHaveClass('wrapper disabled');
    });
});
