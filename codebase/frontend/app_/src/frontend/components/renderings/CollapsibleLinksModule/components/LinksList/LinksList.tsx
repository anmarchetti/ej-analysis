import { FC } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { buildSitecoreLinkFullUrl } from 'frontend/utils/url.utils';
import { MediaSize } from 'models/data/MediaSizeParams';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import JSSImageNext from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RouterLink from 'frontend/components/common/RouterLink';
import {
    ICollapsibleLinksModuleFields,
    ICollapsibleLinksModuleParams,
} from 'frontend/components/renderings/CollapsibleLinksModule/CollapsibleLinksModule';

import styles from './LinksList.module.scss';

export interface ILinksListProps {
    fields: ICollapsibleLinksModuleFields;
    links: ISitecoreField<ISitecoreLink>[];
    listIndex: number;
    maxLinksInColumn: number;
    params: ICollapsibleLinksModuleParams;
    rendUid: string;
    additionalClass?: string;
}

const LINK_ICON_SIZE = 16;

export const LinksList: FC<ILinksListProps> = ({
    links,
    listIndex,
    maxLinksInColumn,
    fields,
    rendUid,
    params,
    additionalClass,
}) => {
    const { trackModuleClick, trackHomepageAction, sitePath } = useStore(({ trackingStore, layoutStore }: TStores) => ({
        trackModuleClick: trackingStore.trackModuleClick,
        trackHomepageAction: trackingStore.trackHomepageAction,
        sitePath: layoutStore.sitePath,
    }));
    const { Icon, Title } = fields;
    const { IsModuleClickTrackingEnabled, ModuleLocation } = params;
    const onLinkClick = (index: number, link: ISitecoreField<ISitecoreLink>): void => {
        trackHomepageAction(EventTypes.HolidayWithUs, {
            location: Title?.value || 'Holiday with us',
            name: link.value?.text || '',
            destination: buildSitecoreLinkFullUrl(link, sitePath),
        });

        if (isSitecoreCheckboxSelected(IsModuleClickTrackingEnabled)) {
            trackModuleClick({
                moduleId: rendUid,
                name: Title?.value || '',
                location: ModuleLocation,
                selection: link.value.text,
                position: index + 1,
                destinationPath: link.value.href,
            });
        }
    };

    return (
        <ul className={classNames('list', additionalClass)}>
            {links.map((link, i) => (
                <li key={link.value.id || i}>
                    <RouterLink
                        link={link}
                        className={styles.link}
                        onClick={(): void => onLinkClick(maxLinksInColumn * listIndex + i, link)}
                    >
                        <JSSImageNext
                            field={Icon}
                            className={styles.icon}
                            width={LINK_ICON_SIZE}
                            height={LINK_ICON_SIZE}
                            mediaSize={MediaSize.Small}
                        />
                        {link.value.text}
                    </RouterLink>
                </li>
            ))}
        </ul>
    );
};

export default LinksList;
