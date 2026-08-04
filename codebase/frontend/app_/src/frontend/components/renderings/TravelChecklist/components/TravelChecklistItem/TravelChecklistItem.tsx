import { FunctionComponent, useState } from 'react';
import classNames from 'classnames';

import { ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Checkbox from 'frontend/components/common/Checkbox';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import SvgArrow from 'frontend/components/icons-new/Arrow';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';
import SvgChevronUp from 'frontend/components/icons-new/ChevronUp';

import styles from './TravelChecklistItem.module.scss';

export type TTravelChecklistItemProps = {
    title: string;
    description?: string;
    link?: ISitecoreLink;
    subtitle?: string;
    trackingLabel?: string;
};

const TravelChecklistItem: FunctionComponent<TTravelChecklistItemProps> = ({ title, subtitle, description, link }) => {
    const [isDetailsShown, toggleShowDetails] = useState(false);

    const onCheckboxChange = ({ target }) => {
        toggleShowDetails(target.checked);
    };

    return (
        <div className={styles.item} data-tid='travel-checklist-item'>
            <div className={styles.head}>
                <div className={styles.checkboxContainer}>
                    <Checkbox onChange={onCheckboxChange} dataTid='travel-checklist-item-checkbox' id={title} />
                    {!!title && (
                        <h3 className={styles.title} data-tid='travel-checklist-item-title'>
                            {title}
                        </h3>
                    )}
                </div>
                <Button
                    isTransparent
                    className={styles.showMore}
                    onClick={() => toggleShowDetails(!isDetailsShown)}
                    aria-label={title}
                >
                    {isDetailsShown ? <SvgChevronUp /> : <SvgChevronDown />}
                </Button>
            </div>
            <div
                className={classNames(styles.content, { [styles.expanded]: isDetailsShown })}
                data-tid='travel-checklist-item-details'
            >
                {!!subtitle && (
                    <h4 className={styles.subtitle} data-tid='travel-checklist-item-subtitle'>
                        {subtitle}
                    </h4>
                )}
                {!!description && (
                    <RichTextWithLinks
                        field={{ value: description }}
                        className={styles.text}
                        dataId='travel-checklist-item-text'
                    />
                )}
                {!!link?.url && (
                    <RouterLink link={{ value: link }} className={styles.link} dataId='travel-checklist-item-link'>
                        {link.text}
                        <span className={styles.linkArrow}>
                            <SvgArrow />
                        </span>
                    </RouterLink>
                )}
            </div>
        </div>
    );
};

export default TravelChecklistItem;
