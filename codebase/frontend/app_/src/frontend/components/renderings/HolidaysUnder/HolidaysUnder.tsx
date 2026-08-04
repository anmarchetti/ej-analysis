import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import {
    getCustomisableTitleClassName,
    getPaddingSizeClassName,
} from 'frontend/utils/componentStylesCustomisation.utils';
import { buildSitecoreLinkFullUrl } from 'frontend/utils/url.utils';
import { ICustomisableComponentParams } from 'models/data/ICustomisableComponentParams';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import RouterLink from 'frontend/components/common/RouterLink';
import IconChevronRight from 'frontend/components/icons/ChevronRight';

import styles from './HolidaysUnder.module.scss';

export interface IHolidaysUnderPillFields {
    IsPpShown: ISitecoreField<boolean>;
    Link: ISitecoreField<ISitecoreLink>;
    Price: ISitecoreField<string>;
}

export interface IHolidaysUnderPill extends ISitecoreComponent<IHolidaysUnderPillFields> {
    id: string;
}

interface IHolidaysUnderFields {
    Description: ISitecoreField<string>;
    Pills: IHolidaysUnderPill[];
    Title: ISitecoreField<string>;
}

interface IHolidaysUnderProps
    extends ISitecoreComponent<IHolidaysUnderFields, ICustomisableComponentParams>,
        IComponentWithDictionary {}

const HolidaysUnder = ({ fields, params }: IHolidaysUnderProps) => {
    if (!fields) {
        return null;
    }

    const { trackEventWithParams, sitePath } = useStore(stores => ({
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        sitePath: stores.layoutStore.sitePath,
    }));

    return (
        <div className={classNames(styles['holidays-under'], getPaddingSizeClassName(params?.PaddingSize))}>
            {fields.Title?.value && (
                <Text
                    field={fields.Title}
                    tag='h3'
                    className={getCustomisableTitleClassName(styles['holidays-under__title'], params)}
                />
            )}
            {fields.Description?.value && (
                <p className={styles['holidays-under__description']}>{fields.Description.value}</p>
            )}
            {fields.Pills && fields.Pills.length > 0 && (
                <div className={styles['holidays-under__pills']}>
                    {fields.Pills.map((pill, i) =>
                        pill.fields?.Link && pill.fields?.Price?.value ? (
                            <RouterLink
                                className={styles['holidays-under__pill']}
                                link={pill.fields.Link}
                                key={pill.id}
                                onClick={() =>
                                    trackEventWithParams(EventTypes.HolidayUnderBudgetClick, {
                                        location: 'HOLIDAYS BY BUDGET',
                                        destination: buildSitecoreLinkFullUrl(pill.fields?.Link, sitePath),
                                        position: i + 1,
                                        name: pill.fields?.Price.value || '',
                                    })
                                }
                            >
                                <PriceLabel
                                    className={styles.holidaysUnderPillPrice}
                                    tag='span'
                                    price={pill.fields.Price.value}
                                    priceDictionary={
                                        pill.fields.IsPpShown?.value
                                            ? SitecoreDictionary.GlobalsPriceLabelsPerPerson
                                            : undefined
                                    }
                                />
                                <IconChevronRight />
                            </RouterLink>
                        ) : null,
                    )}
                </div>
            )}
        </div>
    );
};

export default HolidaysUnder;
