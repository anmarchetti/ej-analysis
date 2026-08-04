import React, { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { containsSubstring } from 'frontend/utils/string.utils';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import FilterCheckControl from 'frontend/components/common/LeftHandFilter/FilterContent/GroupContent/BaseCheckboxGroup/FilterCheckControl';

import styles from './FlightTimes.module.scss';

const FlightTimes: FC = () => {
    const { getPhrase, content, onChange, isOptionDisabled, isFilterGroupSelected } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        onChange: stores.searchFiltersStore.onChange,
        isOptionDisabled: stores.searchFiltersStore.isOptionDisabled,
        isFilterGroupSelected: stores.searchFiltersStore.isFilterGroupSelected,
        content: stores.searchFiltersStore.getPreparedGroupContent(FilterGroupCodes.FlightTimes),
    }));

    const inboundFilterOptions = content
        .find(el => containsSubstring(el.name, RouteDirection.Inbound))
        ?.children?.map(el => ({
            ...el,
            groupCode: FilterGroupCodes.InboundDepartureTime,
        }));

    const outboundFilterOptions = content
        .find(el => containsSubstring(el.name, RouteDirection.Outbound))
        ?.children?.map(el => ({ ...el, groupCode: FilterGroupCodes.OutboundDepartureTime }));

    return (inboundFilterOptions && !!inboundFilterOptions.length) ||
        (outboundFilterOptions && !!outboundFilterOptions.length) ? (
        <div className={styles.flightTimesContainer}>
            {outboundFilterOptions && !!outboundFilterOptions.length && (
                <div>
                    <p data-tid='flights-group-header-departure'>
                        {getPhrase(SitecoreDictionary.SearchPodFiltersTitlesOutboundDepartureTimeSubtitle)}
                    </p>
                    <div data-tid='outbound-departure-time'>
                        {outboundFilterOptions.map((option: any) => (
                            <FilterCheckControl
                                key={option.code}
                                option={option}
                                checked={isFilterGroupSelected(option)}
                                onChange={() =>
                                    onChange({
                                        ...option,
                                        name:
                                            RouteDirection.Outbound[0].toUpperCase() +
                                            RouteDirection.Outbound.slice(1) +
                                            ' ' +
                                            option.name.toLowerCase(),
                                    })
                                }
                                disabled={isOptionDisabled(option.count, FilterGroupCodes.FlightTimes)}
                                label={option.pillLabel}
                                hideLabelCount
                            />
                        ))}
                    </div>
                </div>
            )}

            {inboundFilterOptions && !!inboundFilterOptions.length && (
                <div>
                    <p data-tid='flights-group-header-return'>
                        {getPhrase(SitecoreDictionary.SearchPodFiltersTitlesInboundDepartureTimeSubtitle)}
                    </p>
                    <div data-tid='inbound-departure-time'>
                        {inboundFilterOptions.map((option: any) => (
                            <FilterCheckControl
                                key={option.code}
                                option={option}
                                checked={isFilterGroupSelected(option)}
                                onChange={() =>
                                    onChange({
                                        ...option,
                                        name:
                                            RouteDirection.Inbound[0].toUpperCase() +
                                            RouteDirection.Inbound.slice(1) +
                                            ' ' +
                                            option.name.toLowerCase(),
                                    })
                                }
                                disabled={isOptionDisabled(option.count, FilterGroupCodes.FlightTimes)}
                                label={option.pillLabel}
                                hideLabelCount
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    ) : null;
};

export default observer(FlightTimes);
