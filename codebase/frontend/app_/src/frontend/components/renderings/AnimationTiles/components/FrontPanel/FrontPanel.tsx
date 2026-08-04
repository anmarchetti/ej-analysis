import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { MediaSize } from 'models/data/MediaSizeParams';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import SvgChevronUp from 'frontend/components/icons-new/ChevronUp';

import styles from './FrontPanel.module.scss';

export interface IFrontPanelProps {
    Icon: ISitecoreField<ISitecoreImage>;
    Image: ISitecoreField<ISitecoreImage>;
    MoreText: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    onClick: () => void;
}

const ICONS_SIZE = 90;

const FrontPanel: FC<IFrontPanelProps> = ({ Title, Image, Icon, MoreText, onClick }) => {
    const { isEditMode } = useStore(stores => ({
        isEditMode: stores.layoutStore.isEditMode,
    }));

    return (
        <button className={styles.container} onClick={onClick} data-tid='front-panel'>
            {Image?.value && (
                <div className={styles.backgroundImage} data-tid='front-panel-background-image'>
                    {!isEditMode && <JSSImageNext field={Image} mediaSize={MediaSize.Medium} fill />}
                </div>
            )}
            <div className={styles.content} data-tid='front-panel-content'>
                {Icon?.value && (
                    <JSSImageNext
                        field={Icon}
                        mediaSize={MediaSize.Small}
                        data-tid='front-panel-icon'
                        width={ICONS_SIZE}
                        height={ICONS_SIZE}
                    />
                )}
                {Title?.value && <Text tag='div' field={Title} className={styles.title} data-tid='front-panel-title' />}
                {MoreText?.value && (
                    <div className={styles.moreDetails} data-tid='front-panel-more-text'>
                        <Text field={MoreText} />
                        <SvgChevronUp />
                    </div>
                )}
            </div>
        </button>
    );
};

export default observer(FrontPanel);
