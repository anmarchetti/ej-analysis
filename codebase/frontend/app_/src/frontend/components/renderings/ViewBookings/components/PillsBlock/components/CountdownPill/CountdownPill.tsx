import React, { FC } from 'react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ITimeUnitConfig, TimeUnitsDictionary } from 'models/enum/TimeUnitsDictionary';
import PricePill from 'frontend/components/common/Pills/PricePill/PricePill';

interface ICountdownPillProps {
    departureDate: string;
    className?: string;
}

const CountdownPill: FC<ICountdownPillProps> = ({ departureDate, className }) => {
    const { getPhrase, getTimeUnitLabel } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        getTimeUnitLabel: stores.layoutStore.getTimeUnitLabel,
    }));

    const getTimeLabel = (value: number, config: ITimeUnitConfig): string => {
        const roundValue = Math.floor(value);
        const label = getTimeUnitLabel(roundValue, config);

        return `${roundValue} ${label}`;
    };

    const getCountdownTime = () => {
        /** Don't use getDate() from date.utils because it ignores timezone  */
        const depDate = new Date(departureDate);
        const now = new Date();
        const diff = depDate.getTime() - now.getTime();

        if (diff < 0) {
            return;
        }

        const hours = diff / (1000 * 60 * 60);

        if (hours < 24) {
            return getTimeLabel(hours, TimeUnitsDictionary.hours);
        }

        const days = hours / 24;

        if (days <= 31) {
            return getTimeLabel(days, TimeUnitsDictionary.days);
        }

        const months = days / 30;

        return getTimeLabel(months, TimeUnitsDictionary.months);
    };

    const countdownTime = getCountdownTime();

    return countdownTime ? (
        <PricePill isLightGreen isFullWidth className={className}>
            {Tokenizer.replaceToken(
                getPhrase(SitecoreDictionary.ViewBookingsLabelsTimeDurationToGo),
                Tokens.Duration,
                countdownTime,
            )}
        </PricePill>
    ) : null;
};

export default CountdownPill;
