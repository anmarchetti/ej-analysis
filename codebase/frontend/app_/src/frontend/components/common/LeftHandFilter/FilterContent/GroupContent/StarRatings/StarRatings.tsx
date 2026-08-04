import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import FilterCheckControl from 'frontend/components/common/LeftHandFilter/FilterContent/GroupContent/BaseCheckboxGroup/FilterCheckControl';
import { TLeftHandFilterStoreInstance } from 'frontend/components/common/LeftHandFilter/FilterContent/models';
import TextWithTooltip from 'frontend/components/common/TextWithTooltip/TextWithTooltip';
import SvgStarFilled from 'frontend/components/icons-new/StarFilled';

import styles from './StarRatings.module.scss';

interface IStarRatingsProps {
    storeInstance: TLeftHandFilterStoreInstance;
}

const STAR_RATING_FILTER_OPTIONS = 4;
const MAX_STAR_RATING = 5;

const STARS = [...Array(MAX_STAR_RATING).keys()];

const StarRatings: React.FC<IStarRatingsProps> = ({ storeInstance }) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const { onChange, isOptionDisabled, isFilterGroupSelected, getPreparedGroupContent, isCountHidden } = storeInstance;
    const content = getPreparedGroupContent(FilterGroupCodes.StarRating);

    const starRatingListItems = Array(STAR_RATING_FILTER_OPTIONS)
        .fill('')
        .map((_: any, idx: number) => {
            const starsAmount = MAX_STAR_RATING - idx;

            return content.find((filter: Record<string, any>) => parseInt(filter.code) === starsAmount);
        })
        .filter(Boolean);

    if (starRatingListItems.length === 0) {
        return null;
    }

    const renderStarLabel = (option): React.JSX.Element => (
        <>
            <div className='star_rating full-rate'>
                {STARS.map((i: number) => (
                    <span key={i} className={parseInt(option.code) - i > 0 ? 'active' : ''} data-tid='star'>
                        <SvgStarFilled />
                    </span>
                ))}
            </div>
            {!isCountHidden && <span>({option.count})</span>}
        </>
    );

    const message = getPhrase(SitecoreDictionary.SearchPodFiltersTitlesStarRatingSubtitle);
    const tooltipMessage = getPhrase(SitecoreDictionary.SearchPodFiltersLabelsStarRatingTooltip);

    return (
        <div className={classNames(styles.starRatingContainer)}>
            <TextWithTooltip
                message={message}
                tooltipMessage={tooltipMessage}
                tooltipTriggerClassName={styles.tooltipTrigger}
                wrapperClassName={styles.ratingTitle}
                dataTid='star-rating-header'
                tag='p'
            />

            <div className='rating-block__list' data-tid='star-rating'>
                {starRatingListItems.map((option: any) => (
                    <FilterCheckControl
                        key={option.code}
                        option={option}
                        checked={isFilterGroupSelected(option)}
                        onChange={(): void => onChange(option)}
                        disabled={isOptionDisabled(option.count, FilterGroupCodes.StarRating)}
                        label={renderStarLabel(option)}
                    />
                ))}
            </div>
        </div>
    );
};

export default observer(StarRatings);
