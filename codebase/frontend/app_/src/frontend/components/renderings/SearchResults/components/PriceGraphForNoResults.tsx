import * as React from 'react';
import { action, computed, makeObservable, observable } from 'mobx';
import { inject, observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IDisplayValue } from 'models/data/IDisplayValue';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import Button from 'frontend/components/common/Button';
import PriceGraph from 'frontend/components/common/PriceGraph/PriceGraph';
import { getHolidayDates } from 'frontend/components/common/PriceGraph/priceGraphUtils';

export interface IPriceGraphForNoResultsProps extends IComponentWithDictionary {
    destinationsDisplayValue: IDisplayValue;
    holidayDuration: number;
    isScreenMedium: boolean;
    loadAlternativeOffers: () => void;
    middleDate: Nullable<Date>;
    priceGraphVisible: boolean;
    resetSelectedOffer: (newDate: Date) => void;
    selectedDate: Date;
    setDestinationsDisplayValue: () => void;
}

export class PriceGraphForNoResults extends React.Component<IPriceGraphForNoResultsProps> {
    @observable activeDate: Date = new Date(this.props.selectedDate);

    constructor(props: IPriceGraphForNoResultsProps) {
        super(props);
        makeObservable(this);
    }

    componentDidMount() {
        this.props.loadAlternativeOffers();
        // set new value only if destinationsDisplayValue doesn't set yet
        // For example if price graph was opened from direct link
        !this.props.destinationsDisplayValue.main && this.props.setDestinationsDisplayValue();
    }

    @computed get searchNoResultsTitle(): string {
        return (
            Tokenizer.replaceTokens(
                this.props.getPhrase(SitecoreDictionary.PriceGraphLabelsSingleSearchNoResultsFound),
                {
                    [Tokens.Name]: this.props.destinationsDisplayValue.main,
                },
            ) || this.props.getPhrase(SitecoreDictionary.PriceGraphLabelsSingleSearchNoResultsFound)
        );
    }

    @computed get holidayDurationLabel(): string {
        const dates = getHolidayDates(this.activeDate, this.props.holidayDuration);

        return this.props.isScreenMedium
            ? Tokenizer.replaceTokens(this.props.getPhrase(SitecoreDictionary.PriceGraphLabelsHolidayDates), {
                  [Tokens.Departure]: dates.departure,
                  [Tokens.Return]: dates.return,
              })
            : `${dates.departure} -  ${dates.return}`;
    }

    @action changeActiveDate = (date: Date) => {
        this.activeDate = date;
    };

    onConfirmClick = async () => {
        if (this.activeDate.getTime() !== this.props.selectedDate.getTime()) {
            this.props.resetSelectedOffer(this.activeDate);
        }
    };

    get isDisabled() {
        return this.activeDate.getTime() === this.props.selectedDate.getTime();
    }

    render() {
        return (
            <div className='price-graph-widget'>
                <h3 className='price-graph-widget__title'>{this.searchNoResultsTitle}</h3>

                {this.activeDate.getTime() !== this.props.selectedDate.getTime() && (
                    <p className='price-graph-widget__selected-dates'>{this.holidayDurationLabel}</p>
                )}

                {this.props.selectedDate && this.props.middleDate && (
                    <PriceGraph
                        {...this.props}
                        middleDate={this.props.middleDate}
                        selectedDate={this.props.selectedDate}
                        changeActiveDate={this.changeActiveDate}
                        isLoadSingleOffers
                    />
                )}

                <div className='price-graph-widget__footer'>
                    <Button isMedium onClick={this.onConfirmClick} dataTid='confirm-button' disabled={this.isDisabled}>
                        {this.props.getPhrase(SitecoreDictionary.PriceGraphButtonsApply)}
                    </Button>
                </div>
            </div>
        );
    }
}

const ConnectedPriceGraphForNoResults = inject((stores: TStores) => ({
    loadAlternativeOffers: stores.priceGraphStore.loadAlternativeOffers,
    destinationsDisplayValue: stores.bookingStore.destinationsDisplayValue,
    setDestinationsDisplayValue: stores.bookingStore.setDestinationsDisplayValue,
    isScreenMedium: stores.appStore.isScreenMedium,
    middleDate: stores.priceGraphStore.middleDate,
    priceGraphVisible: stores.priceGraphStore.priceGraphPopupVisible,
    getPhrase: stores.layoutStore.getPhrase,
}))(observer(class WrappedPriceGraphForNoResults extends PriceGraphForNoResults {}));

export default ConnectedPriceGraphForNoResults;
