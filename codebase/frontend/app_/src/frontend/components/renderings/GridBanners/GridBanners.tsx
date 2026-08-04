import classNames from 'classnames';

import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import BannerCard, { TBannerCardFields } from 'frontend/components/common/BannerCard/BannerCard';

import styles from './GridBanners.module.scss';

type TGridBannersFields = {
    Children: ISitecoreChildren<TBannerCardFields>[];
};

type TGridBannersParams = {
    ClassName?: string;
};

export type TGridBannersProps = ISitecoreComponent<TGridBannersFields, TGridBannersParams>;

export const GridBanners = ({ fields, params }: TGridBannersProps) => {
    const { ClassName } = params;
    const { Children } = fields || {};
    const cardsToShow = Children?.filter(e => !!e.fields) || [];
    const cardsToShowCount = cardsToShow.length;

    if (!fields || !cardsToShowCount) {
        return null;
    }

    const containerExtraClassName = ClassName && styles[ClassName];

    return (
        <div className={classNames(styles.container, containerExtraClassName ?? '')} data-tid='grid-banners-container'>
            {cardsToShow.map(({ id, fields }, index) => (
                <div key={id} className={styles.item} data-tid='grid-banners-item'>
                    <BannerCard
                        index={index}
                        fields={fields}
                        childrenCount={cardsToShowCount}
                        isGridBanner
                        isSingleGridItemOnRow={!cardsToShow[index + 1] && index % 2 === 0}
                    />
                </div>
            ))}
        </div>
    );
};

export default GridBanners;
