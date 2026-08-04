import { FC } from 'react';
import classNames from 'classnames';

import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import ExpandableBanner from 'frontend/components/common/ExpandableBanner/ExpandableBanner';
import RouterLink from 'frontend/components/common/RouterLink';

import styles from './ExpandableMobileBanner.module.scss';

interface IExpandableMobileBannerProps {
    fields: IExpandableMobileBannerFields;
}

export interface IExpandableMobileBannerFields {
    CTA: ISitecoreField<ISitecoreLink>;
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Title: ISitecoreField<string>;
}

export const ExpandableMobileBanner: FC<IExpandableMobileBannerProps> = ({ fields }) => {
    if (!fields) return null;

    const { Title, Description, Icon, CTA } = fields;

    return (
        <ExpandableBanner
            Title={Title}
            Description={Description}
            button={
                <RouterLink link={CTA} className={classNames('btn btn--outlined', styles.cta)} data-tid='easyjet-link'>
                    {CTA?.value?.text}
                </RouterLink>
            }
            Icon={Icon}
            dataTidPrefix='expandable-mobile-banner'
            isMobileView
            mobileClassName={styles.expandableBanner}
            descriptionClassName={styles.expandableBannerDescription}
            titleClassName={styles.expandableBannerTitle}
            iconClassName={styles.expandableBannerIcon}
            isDefaultOpened
        />
    );
};
export default ExpandableMobileBanner;
