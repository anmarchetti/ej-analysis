import { FC } from 'react';
import classNames from 'classnames';

import { MediaSize } from 'models/data/MediaSizeParams';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';

import styles from './Listeditems.module.scss';

export interface IListedItemProps {
    className?: string;
    icon?: {
        alt: string;
        src: string;
    };
    text?: string;
}

const ICON_SIZE = 24;

const ListedItem: FC<IListedItemProps> = ({ className, text, icon }) => {
    if (!icon && !text) return null;

    const { src, alt = text } = icon || {};

    return (
        <li className={classNames(styles.item, className)} data-tid='listed-item'>
            {src && (
                <JSSImageNext
                    field={{ value: { src } }}
                    mediaSize={MediaSize.Small}
                    width={ICON_SIZE}
                    height={ICON_SIZE}
                    data-tid={`${alt}_icon`}
                />
            )}

            {text && <p data-tid={`${alt}_text`}>{text}</p>}
        </li>
    );
};

export default ListedItem;
