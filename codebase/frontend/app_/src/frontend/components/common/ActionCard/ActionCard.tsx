import { FC, ReactElement, ReactNode } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './ActionCard.module.scss';

export interface IActionCardProps {
    children: ReactNode;
    dataTid: string;
    title: ISitecoreField<string>;
    description?: ISitecoreField<string>;
    icon?: ReactElement;
    iconClassName?: string;
}

const ActionCard: FC<IActionCardProps> = ({ icon, iconClassName, title, description, dataTid, children }) => (
    <div className={styles.container} data-tid={dataTid}>
        {icon && <div className={iconClassName}>{icon}</div>}
        <div className={styles.content}>
            <Text field={title} className={styles.title} tag='h3' data-tid={`${dataTid}-title`} />
            {description && (
                <RichTextWithLinks
                    className={styles.description}
                    field={description}
                    dataId={`${dataTid}-description`}
                />
            )}
        </div>
        {children}
    </div>
);

export default ActionCard;
