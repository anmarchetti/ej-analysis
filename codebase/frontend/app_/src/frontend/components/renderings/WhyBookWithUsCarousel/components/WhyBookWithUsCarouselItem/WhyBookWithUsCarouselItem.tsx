import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';
import { RichTextWithLinks } from 'frontend/components/common/RichTextWithLinks';
import styles from 'frontend/components/renderings/WhyBookWithUsCarousel/WhyBookWithUsCarousel.module.scss';

export interface IInformationTilesItemFields {
    Icon: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
    Description?: ISitecoreField<string>;
}

interface IInformationTilesItemProps {
    fields: IInformationTilesItemFields;
    id: string;
}

const WhyBookWithUsCarouselItem = ({ fields, id }: IInformationTilesItemProps) => {
    const { isScreenMedium } = useStore(stores => ({
        isScreenMedium: stores.appStore.isScreenMedium,
    }));

    if (!fields) {
        return null;
    }

    const { Icon, Title, Description } = fields;
    const hasIcon = !!Icon && !!Icon?.value?.src;
    const tooltipId = `tooltip_id_${id}`;

    return (
        <div>
            <div className={styles.carouselItem}>
                <div className={styles.header}>
                    {hasIcon && (
                        <i className={styles.icon}>
                            <JSSImage field={Icon} alt='' role='presentation' />
                        </i>
                    )}
                </div>
                <div className={classNames(styles.content, isScreenMedium && styles['content--underlined'])}>
                    <div id={tooltipId}>
                        <Text
                            field={Title}
                            tag='h3'
                            className={styles.title}
                            data-tooltip-id='tooltip'
                            data-tooltip-content={Description?.value}
                        />
                    </div>
                    {!isScreenMedium && Description && (
                        <RichTextWithLinks field={Description} tag='div' className={styles.description} />
                    )}
                </div>
            </div>
        </div>
    );
};
export default WhyBookWithUsCarouselItem;
