import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import Button from 'frontend/components/common/Button/Button';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import { ICarouselTile } from 'frontend/components/renderings/TilesCarousel/TilesCarouselInterfaces';

import DescriptionContainer from './DescriptionContainer';

import styles from './InformationBelowVariantTile.module.scss';

export interface IInformationBelowVariantTileProps extends ICarouselTile {
    isActive: boolean;
    onClick: () => void;
    includeDescription?: boolean;
}

const InformationBelowVariantTile: FC<IInformationBelowVariantTileProps> = ({
    Title,
    Image,
    Description,
    Subtitle,
    onClick,
    isActive,
    includeDescription,
}) => (
    <div
        className={classNames(styles.container, { [styles.active]: isActive })}
        data-tid='separate-description-tile-wrapper'
    >
        <Button data-tid='separate-description-tile' className={styles.wrapper} onClick={onClick} removeDefaultClass>
            <JSSImageNext field={Image} className={styles.image} data-tid='separate-description-tile-image' />
            {includeDescription ? (
                <DescriptionContainer Description={Description} Subtitle={Subtitle} />
            ) : (
                <Text field={Title} className={styles.title} data-tid='separate-description-tile-title' tag='p' />
            )}
        </Button>
    </div>
);

export default InformationBelowVariantTile;
