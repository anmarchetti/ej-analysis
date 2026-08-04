import React, { useState } from 'react';
import classNames from 'classnames';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import AdvancedSearchContent from 'frontend/components/renderings/TradePortalFindBooking/components/AdvancedSearchContent';
import SimpleSearchContent from 'frontend/components/renderings/TradePortalFindBooking/components/SimpleSearchContent';

export interface ITradePortalFindBookingFields {
    AdvancedSearchName: ISitecoreField<string>;
    PopupButton: ISitecoreField<string>;
    PopupMessage: ISitecoreField<string>;
    PopupTitle: ISitecoreField<string>;
    SimpleSearchButton: ISitecoreField<string>;
    SimpleSearchLabel: ISitecoreField<string>;
    SimpleSearchName: ISitecoreField<string>;
    SimpleSearchSubtitle: ISitecoreField<string>;
    SimpleSearchTooltip: ISitecoreField<string>;
}

export type TTradePortalFindBookingProps = ISitecoreComponent<ITradePortalFindBookingFields>;

export const TradePortalFindBooking = (props: TTradePortalFindBookingProps) => {
    const [activeTab, setActiveTab] = useState(props.fields?.SimpleSearchName?.value);

    const handleClick = tabName => setActiveTab(tabName);

    const checkActiveTab = tabName => (activeTab === tabName ? 'active' : '');

    if (!props.fields) {
        return null;
    }

    const { SimpleSearchName, AdvancedSearchName } = props.fields;
    const tabsNames = [SimpleSearchName?.value];

    return (
        <div className='find-booking' data-tid='find-booking'>
            <div className='tabs'>
                {tabsNames.map(tabsName => (
                    <button
                        key={tabsName}
                        className={classNames('tab', checkActiveTab(tabsName))}
                        onClick={() => handleClick(tabsName)}
                    >
                        {tabsName}
                    </button>
                ))}
            </div>
            <div className='panels'>
                {!!SimpleSearchName?.value && (
                    <div className={classNames('panel', checkActiveTab(SimpleSearchName.value))}>
                        <SimpleSearchContent fields={props.fields} />
                    </div>
                )}
                {!!AdvancedSearchName?.value && (
                    <div className={classNames('panel', checkActiveTab(AdvancedSearchName.value))}>
                        <AdvancedSearchContent fields={props.fields} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TradePortalFindBooking;
