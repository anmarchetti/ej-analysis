import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import SwipeableContent from 'frontend/components/common/FloatingPopup/components/SwipeableContent/SwipeableContent';
import FloatingPopup from 'frontend/components/common/FloatingPopup/FloatingPopup';

import styles from './CalloutDrawer.module.scss';

export interface ICalloutDrawerProps {
    onClose: () => void;
    title: ISitecoreField<string>;
    children?: React.ReactNode;
    footerClassName?: string;
    isCTAOutlined?: boolean;
    titleClassName?: string;
}

const CalloutDrawer: FC<ICalloutDrawerProps> = ({
    onClose,
    title,
    children,
    titleClassName,
    isCTAOutlined,
    footerClassName,
}) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <FloatingPopup
            footerClass={classNames(styles.footer, footerClassName)}
            swipeable
            onClose={onClose}
            footerContent={
                <Button
                    onClick={onClose}
                    isFullWidth
                    isOutlined={isCTAOutlined}
                    className={classNames({ [styles.outlined]: isCTAOutlined })}
                >
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>
            }
        >
            <SwipeableContent>
                <Text
                    field={title}
                    tag='h3'
                    className={classNames(styles.drawerTitle, titleClassName)}
                    data-tid='callout-drawer-title'
                />
            </SwipeableContent>

            <div className={styles.drawerContent} data-tid='callout-drawer-content'>
                {children}
            </div>
        </FloatingPopup>
    );
};

export default CalloutDrawer;
