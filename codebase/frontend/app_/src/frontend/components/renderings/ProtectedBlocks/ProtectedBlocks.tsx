import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './ProtectedBlocks.module.scss';

interface IProtectedBlocksFields {
    AbtaImage: ISitecoreField<ISitecoreImage>;
    AbtaText: ISitecoreField<string>;
    AbtaTitle: ISitecoreField<string>;
    AtolImage: ISitecoreField<ISitecoreImage>;
    AtolText: ISitecoreField<string>;
    AtolTitle: ISitecoreField<string>;
}

export type TProtectedBlocksProps = ISitecoreComponent<IProtectedBlocksFields>;

export const ProtectedBlocks = (props: TProtectedBlocksProps) => (
    <div className={styles.container} data-tid='protected-blocks-container'>
        {props.fields && (
            <>
                <div className={styles.block} data-tid='protected-block'>
                    <div className={styles.icon}>
                        <JSSImageNext field={props.fields.AbtaImage} fill />
                    </div>

                    <div className={styles.content}>
                        <Text field={props.fields.AbtaTitle} tag='p' className={styles.title} />
                        <RichTextWithLinks field={props.fields.AbtaText} />
                    </div>
                </div>

                <div className={styles.block} data-tid='protected-block'>
                    <div className={styles.icon}>
                        <JSSImageNext field={props.fields.AtolImage} fill />
                    </div>
                    <div className={styles.content}>
                        <Text field={props.fields.AtolTitle} tag='p' className={styles.title} />
                        <RichTextWithLinks field={props.fields.AtolText} />
                    </div>
                </div>
            </>
        )}
    </div>
);

export default ProtectedBlocks;
