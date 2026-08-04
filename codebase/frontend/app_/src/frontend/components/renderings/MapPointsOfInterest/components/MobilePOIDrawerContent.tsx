import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import AnimatedAccordion from 'frontend/components/common/AnimatedAccordion/AnimatedAccordion';
import JSSImage from 'frontend/components/common/JSSImage';
import { ICategoriesWithItems } from 'frontend/components/renderings/MapPointsOfInterest/IMapPointsOfInterest';

import SinglePointCard from './SinglePointCard';

import styles from './MapPOIContent.module.scss';

export interface IMobilePOIDrawerContentProps {
    categoriesWithItems: ICategoriesWithItems[];
    handleCategoryClick: (label: string) => void;
    title?: string;
}

const MobilePOIDrawerContent: FC<IMobilePOIDrawerContentProps> = ({
    categoriesWithItems,
    title,
    handleCategoryClick,
}) => (
    <div>
        <Text
            field={{ value: title }}
            data-tid='map-points-of-interest-mobile-drawer-title'
            tag='h3'
            className={styles.drawerTitle}
        />
        {categoriesWithItems.map(category => (
            <AnimatedAccordion
                key={category.key}
                buttonContent={
                    <div className={styles.categoryButtonContent} data-tid='category-content'>
                        <JSSImage field={category.icon} className={styles.categoryIcon} data-tid='category-icon' />
                        <Text
                            field={category.name}
                            data-tid='category-title'
                            tag='span'
                            className={styles.categoryName}
                        />
                        <div className={styles.categoryCount} data-tid='category-amount'>
                            {category.items.length}
                        </div>
                    </div>
                }
                buttonClass={styles.categoryButton}
                wrapperClass={styles.categoryWrapper}
                openedWrapperClass={styles.openedCategoryWrapper}
                onClick={(): void => handleCategoryClick(category.key)}
            >
                <div>
                    {category.items.map(item => (
                        <SinglePointCard
                            key={item.name}
                            distance={item.distance}
                            name={item.name}
                            categoryName={item.categoryName}
                        />
                    ))}
                </div>
            </AnimatedAccordion>
        ))}
    </div>
);

export default MobilePOIDrawerContent;
