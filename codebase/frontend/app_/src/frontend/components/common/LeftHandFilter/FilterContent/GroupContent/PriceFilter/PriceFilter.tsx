import React, { Component, ReactNode } from 'react';
import classNames from 'classnames';
import { action, computed, makeObservable, observable, runInAction, toJS } from 'mobx';
import { inject, observer } from 'mobx-react';

import { CurrencyCode, TrailingZeroDisplay } from 'code/currency';
import { MarketStore } from 'frontend/store/base';
import { sortPrice } from 'frontend/utils/sort.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Checkbox from 'frontend/components/common/Checkbox';
import { priceFilterStore } from 'frontend/components/common/LeftHandFilter/FilterContent/GroupContent/PriceFilter/priceFilterStore/priceFilterStore';

import CompoundSlider from './CompoundSlider';

import styles from './PriceFilter.module.scss';

export interface IPriceFilterProps extends IComponentWithDictionary {
    currency: CurrencyCode | undefined;
    formatMoney: MarketStore['formatMoney'];
    getCurrencySymbol: MarketStore['getCurrencySymbol'];
    getFormattedNumber: MarketStore['getFormattedNumber'];
    guests: number;

    isAmendHotelPage: boolean;
    isPricePerPerson: boolean;
    maxPrice: number;

    maxPricePp: number;

    minPrice: number;
    minPricePp: number;

    numberOfHotels: number;
    onChange: () => void;
    onChangeOffersPriceView: () => void;
    setPriceFiltersValue: (
        priceFrom: number | null,
        priceTo: number | null,
        isPricePerPerson: boolean | null,
        needToTrack?: boolean,
    ) => void;
    valueFrom: number | null;
    valueTo: number | null;
    isCountHidden?: boolean;
}

export class PriceFilter extends Component<IPriceFilterProps> {
    constructor(props: IPriceFilterProps) {
        super(props);
        makeObservable(this);
    }

    private readonly input0Ref: React.RefObject<HTMLInputElement> = React.createRef();
    private readonly input1Ref: React.RefObject<HTMLInputElement> = React.createRef();

    @observable isPricePerPerson = this.isPricePPShown ? this.props.isPricePerPerson : false;

    get isPricePPShown(): boolean {
        return this.props.guests > 1;
    }

    @computed get minPrice(): number {
        return this.isPricePerPerson ? this.props.minPricePp : this.props.minPrice;
    }

    @computed get maxPrice(): number {
        return this.isPricePerPerson ? this.props.maxPricePp : this.props.maxPrice;
    }

    @computed get roundedMinPrice(): number {
        return Math.floor(this.minPrice);
    }

    @computed get roundedMaxPrice(): number {
        return Math.ceil(this.maxPrice);
    }

    @observable values: (number | null)[] = [
        this.props.valueFrom ? Math.ceil(this.props.valueFrom) : null,
        this.props.valueTo ? Math.floor(this.props.valueTo) : null,
    ];

    @observable sliderValues: number[] = [
        Math.floor(this.props.valueFrom || this.roundedMinPrice),
        Math.ceil(this.props.valueTo || this.roundedMaxPrice),
    ];

    componentDidMount(): void {
        this.updateInputsValues(this.values);
    }

    private lastValueFrom: number | null = this.props.valueFrom;
    private lastValueTo: number | null = this.props.valueTo;
    private lastIsPricePerPerson: boolean | null = this.props.isPricePerPerson;

    componentDidUpdate(prevProps: IPriceFilterProps): void {
        if (
            this.lastValueFrom !== this.props.valueFrom ||
            this.lastValueTo !== this.props.valueTo ||
            (this.isPricePPShown && this.props.isPricePerPerson !== this.lastIsPricePerPerson)
        ) {
            runInAction(() => {
                this.isPricePerPerson = this.isPricePPShown ? this.props.isPricePerPerson : false;
                this.lastIsPricePerPerson = this.props.isPricePerPerson;
                this.lastValueFrom = this.props.valueFrom;
                this.lastValueTo = this.props.valueTo;
                this.updateBaseValues([this.props.valueFrom, this.props.valueTo]);
                this.updateInputsValues([this.props.valueFrom, this.props.valueTo]);
                this.updateSliderValues([this.props.valueFrom, this.props.valueTo]);
            });
        }

        // update slider after min max props has been changed
        if (prevProps.maxPrice !== this.props.maxPrice || prevProps.minPrice !== this.props.minPrice) {
            this.updateSliderValues([this.props.valueFrom, this.props.valueTo]);
            this.updateInputsValues([this.props.valueFrom, this.props.valueTo]);
        }
    }

    private readonly onType = (e, isFrom): void => {
        const strVal: string = e.target.value;
        const newValues: (number | null)[] = toJS(this.values);
        const sliderValues: (number | null)[] = toJS(this.sliderValues);

        const idx = isFrom ? 0 : 1;
        newValues[idx] = null;
        sliderValues[idx] = null;

        if (strVal.length > 0) {
            const intVal = parseInt(strVal);

            if (intVal) {
                sliderValues[idx] = intVal;
            }

            if (intVal && intVal >= this.roundedMinPrice && intVal <= this.roundedMaxPrice) {
                newValues[idx] = intVal;
            }
        }

        this.updateSliderValues(sliderValues);
        this.updateBaseValues(newValues);
    };

    private readonly onBlur = (): void => {
        this.updateStoreValue(this.values);
    };

    private readonly onSlide = (values: number[]): void => {
        this.updateBaseValues(values);
        this.updateStoreValue(this.values);

        this.updateInputsValues(values);
        this.updateSliderValues(values);
    };

    private readonly onSliding = (values: number[]): void => {
        this.updateInputsValues(values);
    };

    @action onSwitch = (e: React.ChangeEvent<HTMLInputElement>): void => {
        if (this.isPricePerPerson == e.target.checked) {
            return;
        }

        this.isPricePerPerson = e.target.checked;
        this.props.onChangeOffersPriceView();

        const newValues: (number | null)[] = [];
        const val0 = this.values[0];
        const val1 = this.values[1];

        if (this.isPricePerPerson) {
            newValues.push(val0 === null ? null : Math.round(val0 / this.props.guests));
            newValues.push(val1 === null ? null : Math.round(val1 / this.props.guests));
        } else {
            newValues.push(val0 === null ? null : Math.round(val0 * this.props.guests));
            newValues.push(val1 === null ? null : Math.round(val1 * this.props.guests));
        }

        sortPrice(newValues);

        this.updateSliderValues(newValues);
        this.updateInputsValues(newValues);

        this.updateBaseValues(newValues);
        this.updateStoreValue(this.values, true);
    };

    @action updateBaseValues = (values: (number | null)[]): void => {
        const val0 = values[0];
        const val1 = values[1];

        if (val0 && (val0 <= this.minPrice || val0 >= this.maxPrice)) {
            values[0] = null;
        }

        if (val1 && (val1 <= this.minPrice || val1 >= this.maxPrice)) {
            values[1] = null;
        }

        this.values = values;
    };

    @action updateSliderValues = (values: (number | null)[]): void => {
        const sliderValues: number[] = [];
        const val0 = values[0];
        const val1 = values[1];

        sliderValues[0] = val0 === null ? this.roundedMinPrice : val0;
        sliderValues[1] = val1 === null ? this.roundedMaxPrice : val1;

        this.sliderValues = sliderValues;
    };

    @computed get normalizedSliderValues(): number[] {
        const values = [...this.sliderValues];
        sortPrice(values);

        const val0 = values[0];
        const val1 = values[1];

        if (val0 < this.roundedMinPrice) {
            values[0] = this.roundedMinPrice;
        } else if (val0 > this.roundedMaxPrice) {
            values[0] = this.roundedMaxPrice;
        } else {
            values[0] = val0;
        }

        if (val1 < this.roundedMinPrice) {
            values[1] = this.roundedMinPrice;
        } else if (val1 > this.roundedMaxPrice) {
            values[1] = this.roundedMaxPrice;
        } else {
            values[1] = val1;
        }

        return values;
    }

    private readonly updateInputsValues = (values: (number | null)[]): void => {
        const sortedValues = sortPrice([...values]);
        const val0 = sortedValues[0];
        const val1 = sortedValues[1];

        if (this.input0Ref.current) {
            const val = val0 === null ? this.roundedMinPrice : val0;
            this.input0Ref.current.value = val.toString();
        }

        if (this.input1Ref.current) {
            const val = val1 === null ? this.roundedMaxPrice : val1;
            this.input1Ref.current.value = val.toString();
        }
    };

    private updateStoreValue(values: (number | null)[], noUpdate?: boolean): void {
        const sortedValues = sortPrice([...values]);

        if (this.props.valueFrom === sortedValues[0] && this.props.valueTo === sortedValues[1]) {
            noUpdate = true;
        }

        this.lastValueFrom = sortedValues[0];
        this.lastValueTo = sortedValues[1];

        this.props.setPriceFiltersValue(sortedValues[0], sortedValues[1], this.isPricePerPerson, true);

        if (!noUpdate) {
            this.props.onChange();
        }
    }

    private readonly getFormattedPrice = (value: number): string =>
        this.props.formatMoney(value, {
            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        });

    render(): ReactNode {
        const { getCurrencySymbol, currency, getPhrase } = this.props;

        const currencySymbol = getCurrencySymbol(currency);

        const pricePerPersonLabel = `${currencySymbol} ${getPhrase(
            SitecoreDictionary.SearchPodFiltersLabelsPricePerPerson,
        )}`;
        const totalPriceLabel = `${currencySymbol} ${getPhrase(SitecoreDictionary.SearchPodFiltersLabelsPriceTotal)}`;

        return (
            <div className={styles.priceRangeFilterContainer} data-tid='price-range-filter-container'>
                {this.isPricePPShown && (
                    <div className={styles.priceSwitcher} data-tid='price-switcher'>
                        <Checkbox
                            toggle={true}
                            label={pricePerPersonLabel}
                            label2={totalPriceLabel}
                            onChange={this.onSwitch}
                            checked={this.isPricePerPerson}
                        />
                    </div>
                )}
                <div className={styles.priceRangeRow} data-tid='price-range-row'>
                    <div className={styles.priceRangeFilter}>
                        <CompoundSlider
                            min={this.roundedMinPrice}
                            max={this.roundedMaxPrice}
                            values={this.normalizedSliderValues}
                            onSlide={this.onSlide}
                            onSliding={this.onSliding}
                            getValue={this.getFormattedPrice}
                        />
                        <div className={classNames(styles.priceRangeTxt, 'min')}>
                            {this.getFormattedPrice(this.minPrice)}
                        </div>
                        <div className={classNames(styles.priceRangeTxt, 'max')}>
                            {this.getFormattedPrice(this.maxPrice)}
                        </div>
                    </div>
                </div>

                <div className={styles.priceRangeFieldsRow}>
                    <form autoComplete='off'>
                        {/* <!-- Prevent implicit submission of the form --> */}
                        <button
                            type='submit'
                            disabled={true}
                            style={{ display: 'none' }}
                            aria-hidden='true'
                            tabIndex={-1}
                        />
                        <span>
                            {getPhrase(
                                SitecoreDictionary[
                                    `SearchPodFiltersLabelsPriceShow${
                                        this.props.isAmendHotelPage ? 'Hotels' : 'Holidays'
                                    }Between`
                                ],
                            )}
                        </span>
                        <div className={styles.priceRangeFieldsBox} data-tid='price-range-fields-box'>
                            <div className='form-field'>
                                <input
                                    ref={this.input0Ref}
                                    aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsPriceMinInput)}
                                    type='number'
                                    className='form-control__input'
                                    autoComplete='off'
                                    min={this.roundedMinPrice}
                                    max={this.roundedMaxPrice}
                                    onChange={e => this.onType(e, true)}
                                    onKeyDown={e => e.key === 'Enter' && this.onBlur()}
                                    onBlur={this.onBlur}
                                />
                                <span className='form-control__label'>{currencySymbol}</span>
                            </div>
                            <span>{getPhrase(SitecoreDictionary.GlobalConjunctionsAnd)}</span>
                            <div className='form-field'>
                                <input
                                    ref={this.input1Ref}
                                    aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsPriceMaxInput)}
                                    type='number'
                                    className='form-control__input'
                                    autoComplete='off'
                                    min={this.roundedMinPrice}
                                    max={this.roundedMaxPrice}
                                    onChange={e => this.onType(e, false)}
                                    onKeyDown={e => e.key === 'Enter' && this.onBlur()}
                                    onBlur={this.onBlur}
                                />
                                <span className='form-control__label'>{currencySymbol}</span>
                            </div>
                        </div>
                        <span>
                            {this.isPricePerPerson ? (
                                <span className='price-per-person'>
                                    {getPhrase(SitecoreDictionary.SearchPodFiltersLabelsPricePerPerson)}
                                </span>
                            ) : (
                                <span className='price-per-person'>
                                    {getPhrase(SitecoreDictionary.SearchPodFiltersLabelsPriceTotal)}
                                </span>
                            )}
                            {!this.props.isCountHidden && (
                                <>
                                    {' '}
                                    ({this.props.getFormattedNumber(this.props.numberOfHotels)}{' '}
                                    {getPhrase(SitecoreDictionary.SearchPodFiltersLabelsPriceResults)})
                                </>
                            )}
                        </span>
                    </form>
                </div>
            </div>
        );
    }
}

export default inject(priceFilterStore)(observer(class WrappedPriceFilter extends PriceFilter {}));
