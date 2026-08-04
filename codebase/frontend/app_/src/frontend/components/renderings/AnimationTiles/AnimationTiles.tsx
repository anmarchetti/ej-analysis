import React, { FC } from 'react';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import AnimationTile, { IAnimationTile } from './components/AnimationTile/AnimationTile';

import styles from './AnimationTiles.module.scss';

interface IAnimationTilesFields {
    items: IAnimationTile[];
}

type TAnimationTilesProps = ISitecoreComponent<IAnimationTilesFields>;

const AnimationTiles: FC<TAnimationTilesProps> = (props: TAnimationTilesProps) => {
    const { items } = props.fields || {};

    if (!items?.length) {
        return null;
    }

    return (
        <div className={styles.animationTiles} data-tid='animation-tiles'>
            {items.map((item, i) => (
                <AnimationTile item={item} key={i} dataTid={`animation-tile-${i}`} />
            ))}
        </div>
    );
};

export default AnimationTiles;
