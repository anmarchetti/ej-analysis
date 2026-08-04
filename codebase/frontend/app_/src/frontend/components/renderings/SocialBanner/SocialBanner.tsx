import { FC } from 'react';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import ActionCard from 'frontend/components/common/ActionCard/ActionCard';
import SvgFacebook from 'frontend/components/icons-new/Facebook';
import SvgInstagram from 'frontend/components/icons-new/Instagram';
import SvgTikTok from 'frontend/components/icons-new/TikTok';
import SvgTwitter from 'frontend/components/icons-new/Twitter';
import SvgYoutube from 'frontend/components/icons-new/Youtube';

import styles from './SocialBanner.module.scss';

export interface ISocialBannerFields {
    Facebook: ISitecoreField<string>;
    FacebookAriaLabel: ISitecoreField<string>;
    Instagram: ISitecoreField<string>;
    InstagramAriaLabel: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
    Tiktok: ISitecoreField<string>;
    TiktokAriaLabel: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    Twitter: ISitecoreField<string>;
    TwitterAriaLabel: ISitecoreField<string>;
    YouTube: ISitecoreField<string>;
    YouTubeAriaLabel: ISitecoreField<string>;
}

export type TSocialBannerProps = ISitecoreComponent<ISocialBannerFields>;

const SocialBanner: FC<TSocialBannerProps> = ({ fields }) => {
    if (!fields) {
        return null;
    }

    const {
        Title,
        Subtitle,
        Facebook,
        Twitter,
        Instagram,
        YouTube,
        Tiktok,
        FacebookAriaLabel,
        InstagramAriaLabel,
        TiktokAriaLabel,
        TwitterAriaLabel,
        YouTubeAriaLabel,
    } = fields;

    const actions = [
        { url: Facebook?.value, ariaLabel: FacebookAriaLabel?.value, icon: <SvgFacebook /> },
        { url: Twitter?.value, ariaLabel: TwitterAriaLabel?.value, icon: <SvgTwitter /> },
        { url: Instagram?.value, ariaLabel: InstagramAriaLabel?.value, icon: <SvgInstagram /> },
        { url: YouTube?.value, ariaLabel: YouTubeAriaLabel?.value, icon: <SvgYoutube /> },
        { url: Tiktok?.value, ariaLabel: TiktokAriaLabel?.value, icon: <SvgTikTok /> },
    ].filter(action => !!action.url);

    return (
        <ActionCard title={Title} description={Subtitle} dataTid='social-banner'>
            <div className={styles.actions}>
                {actions.map(({ url, icon, ariaLabel }) => (
                    <a
                        key={url}
                        href={url}
                        target='_blank'
                        rel='noopener noreferrer'
                        aria-label={ariaLabel}
                        data-tid='social-banner-action-link'
                    >
                        {icon}
                    </a>
                ))}
            </div>
        </ActionCard>
    );
};

export default SocialBanner;
