import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { HelpLinksVariant } from 'models/enum/HelpLinksVariant';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import HelpLink, { IHelpLinkProps } from './components/HelpLink';

import styles from './HelpLinks.module.scss';

export interface IHelpLinks extends IHelpLinkProps {
    id: string;
}

export interface IHelpLinksFields {
    Links: IHelpLinks[];
    Title: ISitecoreField<string>;
}

interface IHelpLinksParams {
    Variant: HelpLinksVariant;
}

export type THelpLinksProps = ISitecoreComponent<IHelpLinksFields, IHelpLinksParams>;

export const HelpLinks: FC<THelpLinksProps> = ({ fields, params }: THelpLinksProps) => {
    if (!fields) {
        return null;
    }

    const { Variant } = params;
    const { Title, Links } = fields;
    const isBordered = Variant === HelpLinksVariant.CardWithBorder;

    return (
        <div className={classNames(styles.helpLinks, isBordered && styles.bordered)} data-tid='help-links'>
            <Text field={Title} className={styles.title} tag='h2' data-tid='help-links-title' />
            <div className={styles.container}>
                {Links.map(item => (
                    <HelpLink {...item} key={item.id} Variant={Variant} />
                ))}
            </div>
        </div>
    );
};

export default HelpLinks;
