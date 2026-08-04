import * as React from 'react';
import { action, computed, makeObservable, observable } from 'mobx';
import { inject, observer } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import {
    getDaysDifferenceRoundedFloor,
    getHoursDifference,
    getMinutesDifference,
    getSecondsDifference,
} from 'frontend/utils/date.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ITimeUnitConfig, TimeUnitsDictionary } from 'models/enum/TimeUnitsDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';

interface ITimerProps extends IComponentWithDictionary {
    date: Date;
    getTimeUnitLabel: (time: number, config: ITimeUnitConfig, useAbbreviation?: boolean) => string;
    maxDays?: number;

    useAbbreviation?: boolean;
}

@observer
export class Timer extends React.Component<ITimerProps> {
    constructor(props: ITimerProps) {
        super(props);
        makeObservable(this);
    }

    @observable now: Date = new Date();
    timer;

    componentDidMount(): void {
        this.changeTime();
        this.timer = setInterval(() => this.changeTime(), 1000);
    }

    componentWillUnmount(): void {
        window.clearInterval(this.timer);
    }

    @action changeTime(): void {
        this.now = new Date();
    }

    timeLabel(time: number, config: ITimeUnitConfig): string {
        const { getTimeUnitLabel, useAbbreviation } = this.props;
        const units = getTimeUnitLabel(time, config, useAbbreviation);

        // Use non-breaking space between time value and units
        return `${time}&nbsp;${units}`;
    }

    @computed get timeBeforeStart(): string {
        const timeDifferences = [
            this.timeLabel(getDaysDifferenceRoundedFloor(this.props.date, this.now), TimeUnitsDictionary.days),
            this.timeLabel(getHoursDifference(this.props.date, this.now), TimeUnitsDictionary.hours),
            this.timeLabel(getMinutesDifference(this.props.date, this.now), TimeUnitsDictionary.minutes),
            this.timeLabel(getSecondsDifference(this.props.date, this.now), TimeUnitsDictionary.seconds),
        ];

        return timeDifferences.join(', ');
    }

    /** Don't show timer if time left more than maxDays  */
    @computed get isTimerShown(): boolean {
        if (!this.props.maxDays) {
            return true;
        }

        const daysDiff = getDaysDifferenceRoundedFloor(this.props.date, this.now);

        return daysDiff > 0 && daysDiff < this.props.maxDays;
    }

    render(): React.ReactNode {
        const { getPhrase } = this.props;

        if (!this.isTimerShown) return null;

        return (
            <span
                dangerouslySetInnerHTML={{
                    __html: `${getPhrase(SitecoreDictionary.BookingHeaderLabelsIn)} ${this.timeBeforeStart}`,
                }}
            />
        );
    }
}

const ConnectedTimer = inject((stores: TStores) => ({
    getPhrase: stores.layoutStore.getPhrase,
    getTimeUnitLabel: stores.layoutStore.getTimeUnitLabel,
}))(Timer);

export default ConnectedTimer;
