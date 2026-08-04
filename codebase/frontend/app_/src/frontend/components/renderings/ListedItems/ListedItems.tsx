import { FC } from 'react';
import classNames from 'classnames';

import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

import ListedItem from './ListedItem';

import styles from './Listeditems.module.scss';

export interface IListItemsProps {
    className?: string;
    customItems?: {
        icon: { alt: string; src: string };
        label: string;
    }[];
    fields?: {
        Items: ISitecoreChildren<{
            Icon: ISitecoreField<ISitecoreImage>;
            Label: ISitecoreField<string>;
        }>[];
    };
    isMultiColumn?: boolean;
    itemClassName?: string;
}

const MAX_PER_COLUMN = 5;
const MAX_ITEMS = 10;

const ListedItems: FC<IListItemsProps> = ({ fields, customItems, className, itemClassName, isMultiColumn = false }) => {
    const resolvedItems = customItems?.length
        ? customItems
        : fields?.Items?.map(item => ({
              icon: item.fields?.Icon?.value,
              label: item.fields?.Label?.value,
          })) ?? [];

    if (!resolvedItems.length) return null;

    const items = isMultiColumn ? resolvedItems.slice(0, MAX_ITEMS) : resolvedItems;

    if (isMultiColumn) {
        const firstColumn = items.slice(0, MAX_PER_COLUMN);
        const secondColumn = items.slice(MAX_PER_COLUMN);

        return (
            <div className={classNames(styles.multiColumnWrapper, className)} data-tid='listed-items-multi-column'>
                <ul className={styles.column}>
                    {firstColumn.map(({ id, icon, label }) => (
                        <ListedItem key={id} className={itemClassName} icon={icon} text={label} />
                    ))}
                </ul>

                {secondColumn.length > 0 && (
                    <ul className={styles.column}>
                        {secondColumn.map(({ id, icon, label }) => (
                            <ListedItem key={id} className={itemClassName} icon={icon} text={label} />
                        ))}
                    </ul>
                )}
            </div>
        );
    }

    return (
        <ul className={classNames(styles.wrapper, className)} data-tid='listed-items'>
            {items.map(({ icon, label }) => (
                <ListedItem key={label} className={itemClassName} icon={icon} text={label} />
            ))}
        </ul>
    );
};

export default ListedItems;
