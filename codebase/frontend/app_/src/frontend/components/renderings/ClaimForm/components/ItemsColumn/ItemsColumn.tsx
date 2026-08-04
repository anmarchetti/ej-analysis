import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreField, TSitecoreMultiList } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import ClaimFormItem from 'frontend/components/renderings/ClaimForm/components/ClaimFormItem/ClaimFormItem';
import { IClaimFormItemFields } from 'frontend/components/renderings/ClaimForm/interfaces';

import styles from './ItemsColumn.module.scss';

export type TItemsColumnProps = {
    description: ISitecoreField<string>;
    items: TSitecoreMultiList<IClaimFormItemFields>;
    title: ISitecoreField<string>;
    isEligibleColumn?: boolean;
};
const ItemsColumn: FC<TItemsColumnProps> = ({ items, title, description, isEligibleColumn }) => (
    <div className={styles.column} data-tid={isEligibleColumn ? 'eligible-items-column' : 'not-eligible-items-column'}>
        <Text field={title} tag='h4' className={styles.title} data-tid='items-column-title' />
        <RichTextWithLinks field={description} className={styles.description} dataId='items-column-description' />
        {items.map(({ fields, id }) => (
            <ClaimFormItem key={id} {...fields} isEligibleItem={isEligibleColumn} />
        ))}
    </div>
);

export default ItemsColumn;
