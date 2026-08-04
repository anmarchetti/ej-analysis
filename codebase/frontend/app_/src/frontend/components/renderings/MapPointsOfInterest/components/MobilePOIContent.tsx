import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import Button from 'frontend/components/common/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';
import SvgArrow from 'frontend/components/icons-new/Arrow';
import { IMapPOIContentProps } from 'frontend/components/renderings/MapPointsOfInterest/IMapPointsOfInterest';

import MobilePOIDrawerContent from './MobilePOIDrawerContent';
import SinglePointCard from './SinglePointCard';

import styles from './MapPOIContent.module.scss';

const MobilePOIContent: FC<IMapPOIContentProps> = ({
    categoriesWithItems,
    disclaimerText,
    disclaimerTooltip,
    showMoreText,
    drawerTitle,
    handleCategoryClick,
}) => {
    const defaultItems = categoriesWithItems[0]?.items ?? [];

    return (
        <>
            {defaultItems.map(item => (
                <SinglePointCard
                    key={item.name}
                    distance={item.distance}
                    name={item.name}
                    categoryName={item.categoryName}
                />
            ))}
            <div className={styles.disclaimerWrapper}>
                {disclaimerTooltip && (
                    <Tooltip>
                        <TooltipTrigger className={styles.tooltipTrigger} />
                        <TooltipContent text={disclaimerTooltip} />
                    </Tooltip>
                )}
                <Text
                    field={{ value: disclaimerText }}
                    data-tid='map-points-of-interest-disclaimer-text'
                    tag='p'
                    className={styles.disclaimer}
                />
            </div>
            <div className={styles.buttonWrapper}>
                <Tooltip>
                    <TooltipTrigger>
                        <Button dataTid='map-points-of-interest-show-more' className={styles.showMore} isLabel>
                            {showMoreText}
                            <div className={styles.arrowWrapper}>
                                <SvgArrow className={classNames(styles.arrow, styles.priority)} />
                            </div>
                        </Button>
                    </TooltipTrigger>

                    <TooltipContent isMobileFullScreenFixed>
                        <MobilePOIDrawerContent
                            categoriesWithItems={categoriesWithItems}
                            title={drawerTitle}
                            handleCategoryClick={handleCategoryClick}
                        />
                    </TooltipContent>
                </Tooltip>
            </div>
        </>
    );
};

export default observer(MobilePOIContent);
