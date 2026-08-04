import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import DesktopPOIContent from './components/DesktopPOIContent';
import MobilePOIContent from './components/MobilePOIContent';
import { TMapPointsOfInterestProps } from './IMapPointsOfInterest';
import { useMapPointsOfInterest } from './useMapPointsOfInterest';

import styles from './MapPointsOfInterest.module.scss';

const MapPointsOfInterest: FC<TMapPointsOfInterestProps> = ({ fields }) => {
    const { categoriesWithItems, title, isMobile, activeIndex, setActiveIndex, handleCategoryClick } =
        useMapPointsOfInterest(fields);

    if (!fields || !categoriesWithItems.length) {
        return null;
    }

    const { DisclaimerText, DisclaimerTooltip, ShowMoreButtonText } = fields;
    const disclaimerText = DisclaimerText?.value ?? '';
    const disclaimerTooltip = DisclaimerTooltip?.value ?? '';

    return (
        <div data-tid='map-points-of-interest' className={styles.wrapper}>
            <Text field={{ value: title }} data-tid='map-points-of-interest-title' className={styles.title} tag='h2' />
            {isMobile ? (
                <MobilePOIContent
                    categoriesWithItems={categoriesWithItems}
                    disclaimerText={disclaimerText}
                    disclaimerTooltip={disclaimerTooltip}
                    handleCategoryClick={handleCategoryClick}
                    showMoreText={ShowMoreButtonText?.value}
                    drawerTitle={fields.MobileDrawerTitle?.value}
                />
            ) : (
                <DesktopPOIContent
                    categoriesWithItems={categoriesWithItems}
                    disclaimerText={disclaimerText}
                    disclaimerTooltip={disclaimerTooltip}
                    handleCategoryClick={handleCategoryClick}
                    activeIndex={activeIndex}
                    setActiveIndex={setActiveIndex}
                />
            )}
        </div>
    );
};
export default observer(MapPointsOfInterest);
