import { FC, useCallback, useState } from 'react';
import classNames from 'classnames';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import ActivePanel from 'frontend/components/renderings/AnimationTiles/components/ActivePanel/ActivePanel';
import FrontPanel from 'frontend/components/renderings/AnimationTiles/components/FrontPanel/FrontPanel';

import styles from './AnimationTile.module.scss';

export interface IAnimationTile {
    displayName: string;
    fields: {
        ActiveDescription: ISitecoreField<string>;
        ActiveIcon: ISitecoreField<ISitecoreImage>;
        ActiveTitle: ISitecoreField<string>;
        Icon: ISitecoreField<ISitecoreImage>;
        Image: ISitecoreField<ISitecoreImage>;
        MoreText: ISitecoreField<string>;
        Title: ISitecoreField<string>;
    };
}

export interface IAnimationTileProps {
    item: IAnimationTile;
    dataTid?: string;
}

const AnimationTile: FC<IAnimationTileProps> = ({ item, dataTid }) => {
    const [shouldShowActivePanel, setShouldShowActivePanel] = useState<boolean>(false);

    const isMobile = useMobileViewport();

    const showActivePanel = useCallback(() => {
        if (isMobile) {
            return;
        }

        setShouldShowActivePanel(true);
    }, [isMobile]);

    const hideActivePanel = useCallback(() => {
        setShouldShowActivePanel(false);
    }, []);

    if (!item.fields) {
        return null;
    }

    const { Title, Image, Icon, MoreText, ActiveIcon, ActiveTitle, ActiveDescription } = item.fields;

    return (
        <div className={classNames(styles.animationTileWrapper)} data-tid={dataTid}>
            <div
                className={classNames(styles.frontPanel, {
                    [styles.hideContainer]: shouldShowActivePanel && !isMobile,
                })}
            >
                <FrontPanel Title={Title} Image={Image} Icon={Icon} MoreText={MoreText} onClick={showActivePanel} />
            </div>

            <ActivePanel
                Title={ActiveTitle}
                Icon={ActiveIcon}
                Description={ActiveDescription}
                hideContainer={!shouldShowActivePanel}
                onClick={hideActivePanel}
            />
        </div>
    );
};

export default AnimationTile;
