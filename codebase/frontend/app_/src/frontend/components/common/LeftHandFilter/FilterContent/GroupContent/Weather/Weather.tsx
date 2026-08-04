import { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import CompoundSlider from 'frontend/components/common/LeftHandFilter/FilterContent/GroupContent/PriceFilter/CompoundSlider';
import TextWithTooltip from 'frontend/components/common/TextWithTooltip/TextWithTooltip';
import { CELSIUS_DEGREES } from 'frontend/components/renderings/WeatherDataCarousel/constants';

import useWeather from './Weather.utils';

import styles from './Weather.module.scss';

export const Weather: FC = () => {
    const {
        getPhrase,
        getFormattedTemperature,
        minAvailableTemp,
        maxAvailableTemp,
        slider: sliderProps,
        fromField,
        toField,
        isDisabled,
    } = useWeather();

    const message = getPhrase(SitecoreDictionary.SearchPodFiltersLabelsWeatherFilterSubtitle);
    const tooltipMessage = getPhrase(SitecoreDictionary.SearchPodFiltersLabelsWeatherTooltip);

    return (
        <div
            className={classNames(styles.wrapper, { [styles.disabled]: isDisabled })}
            data-tid='weather-filter-content'
        >
            <TextWithTooltip
                message={message}
                tooltipMessage={tooltipMessage}
                wrapperClassName={styles.info}
                tooltipTriggerClassName={styles.tooltipTrigger}
                dataTid='weather-filter-info-wrapper'
            />

            <div className={styles.sliderWrapper} data-tid='weather-filter-slider-wrapper'>
                <CompoundSlider getPhrase={getPhrase} isDisabled={isDisabled} {...sliderProps} />
                <div className={styles.range} data-tid='weather-filter-range-wrapper'>
                    <div data-tid='weather-filter-min-temp' className={styles.rangeItem}>
                        {getFormattedTemperature(minAvailableTemp)}
                    </div>
                    <div data-tid='weather-filter-max-temp' className={styles.rangeItem}>
                        {getFormattedTemperature(maxAvailableTemp)}
                    </div>
                </div>
            </div>

            <div data-tid='weather-filter-fields-wrapper'>
                <span className={styles.fieldsLabel} data-tid='weather-filter-fields-label'>
                    {getPhrase(SitecoreDictionary.SearchPodFiltersLabelsWeatherFieldsLabel)}:
                </span>

                <div>
                    <form autoComplete='off'>
                        {/* <!-- Prevent implicit submission of the form --> */}
                        <button
                            type='submit'
                            disabled={true}
                            style={{ display: 'none' }}
                            aria-hidden='true'
                            tabIndex={-1}
                        />
                        <div className={styles.fieldsWrapper} data-tid='weather-filter-fields'>
                            <div className='form-field' data-tid='weather-filter-min-field'>
                                <input
                                    aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsWeatherMinInput)}
                                    disabled={isDisabled}
                                    {...fromField}
                                />
                                <span className='form-control__label' data-tid='weather-filter-min-field-label'>
                                    {CELSIUS_DEGREES}
                                </span>
                            </div>
                            <span data-tid='weather-filter-between-fields-text' className={styles.betweenFields}>
                                {getPhrase(SitecoreDictionary.GlobalConjunctionsAnd)}
                            </span>
                            <div className='form-field' data-tid='weather-filter-max-field'>
                                <input
                                    aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsWeatherMaxInput)}
                                    disabled={isDisabled}
                                    {...toField}
                                />
                                <span className='form-control__label' data-tid='weather-filter-max-field-label'>
                                    {CELSIUS_DEGREES}
                                </span>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default observer(Weather);
