import * as React from 'react';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreImageItem } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';

import styles from './Imagery.module.scss';

interface IImageryFields {
    items: ISitecoreImageItem[];
}

type TImageryProps = ISitecoreComponent<IImageryFields>;

const Imagery: React.FC<TImageryProps> = props =>
    props.rendering?.fields?.items?.length ? (
        <div data-tid='imagery' className={styles.container}>
            {props.rendering.fields.items.map(item => (
                <div key={item.id} className={styles.item}>
                    <JSSImage field={item.fields.Image} />
                </div>
            ))}
        </div>
    ) : null;

export default Imagery;
