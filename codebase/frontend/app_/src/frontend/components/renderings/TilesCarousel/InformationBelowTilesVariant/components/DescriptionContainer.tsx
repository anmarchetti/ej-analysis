import React, { FC, useEffect, useRef } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './DescriptionContainer.module.scss';

export interface IDescriptionContainerProps {
    Description: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
    selectedIndex?: number;
}

const DescriptionContainer: FC<IDescriptionContainerProps> = ({ Subtitle, Description, selectedIndex }) => {
    const descriptionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedIndex !== undefined && descriptionRef.current) {
            descriptionRef.current.scrollTop = 0;
        }
    }, [selectedIndex]);

    return (
        <div className={styles.wrapper}>
            <div className={styles.content} ref={descriptionRef} data-tid='tiles-carousel-description-container'>
                <Text field={Subtitle} className={styles.subtitle} tag='p' data-tid='tiles-carousel-subtitle' />
                <RichTextWithLinks
                    field={Description}
                    className={styles.description}
                    tag='div'
                    dataId='tiles-carousel-description'
                />
            </div>
        </div>
    );
};

export default DescriptionContainer;
