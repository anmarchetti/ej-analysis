import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { MediaSize } from 'models/data/MediaSizeParams';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

export interface IInformationTilesItemFields {
    Icon: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
    Description?: ISitecoreField<string>;
}

export interface IInformationTilesItemProps {
    fields: IInformationTilesItemFields;
    className?: string;
    iconSize?: number;
    isDefaultTheme?: boolean;
    isTitleUnderIcon?: boolean;
}

const InformationTilesItem: React.FC<IInformationTilesItemProps> = ({
    fields,
    isTitleUnderIcon,
    isDefaultTheme,
    iconSize = 55,
    className,
}) => {
    const { isEditMode } = useStore(stores => ({
        isEditMode: stores.layoutStore.isEditMode,
    }));

    if (!fields) {
        return null;
    }

    const { Icon, Title, Description } = fields;

    const hasIcon = isEditMode ? !!fields.Icon : !!fields.Icon?.value?.src;

    return (
        <div className={classNames('information-tiles-item', className)}>
            <div className={classNames('item-header', isTitleUnderIcon && 'item-header--title-under-icon')}>
                {hasIcon && (
                    <i className='item-icon'>
                        <JSSImageNext field={Icon} width={iconSize} height={iconSize} mediaSize={MediaSize.Small} />
                    </i>
                )}
                {!isDefaultTheme && <Text field={Title} tag='h3' className='item-title' />}
            </div>
            <div className='content'>
                {isDefaultTheme && <Text field={Title} tag='h3' className='item-title' />}
                {!!Description && <RichTextWithLinks field={Description} tag='div' className='item-description' />}
            </div>
        </div>
    );
};

export default InformationTilesItem;
