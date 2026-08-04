import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgEmailWithCard from 'frontend/components/icons-new/EmailWithCard';

import styles from './PricePromiseSuccessMessage.module.scss';

export interface IPricePromiseSuccessProps {
    SuccessMessagesRequestText: ISitecoreField<string>;
    SuccessMessagesRequestTitle: ISitecoreField<string>;
    isSuccessMessageShown: boolean;
    toggleSuccessMessage: (state: boolean) => void;
}

export const PricePromiseSuccessMessage: FC<IPricePromiseSuccessProps> = ({
    isSuccessMessageShown,
    toggleSuccessMessage,
    SuccessMessagesRequestTitle,
    SuccessMessagesRequestText,
}) => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const isXSMobileViewport = useXSMobileViewport();

    const renderBody = (): JSX.Element => (
        <div className={styles.body}>
            <SvgEmailWithCard className={styles.icon} />
            <Text
                className={styles.title}
                tag='h5'
                field={SuccessMessagesRequestTitle}
                data-tid='success-message-title'
            />
            <RichTextWithLinks field={SuccessMessagesRequestText} tag='p' dataId='success-message-text' />
        </div>
    );

    const renderCloseButton = (): JSX.Element => (
        <Button isMedium onClick={(): void => toggleSuccessMessage(false)}>
            {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
        </Button>
    );

    const commonProps = {
        contentClass: styles.content,
        bodyClass: styles.drawerBody,
        footerClass: styles.footer,
    };

    if (isXSMobileViewport) {
        return (
            <Drawer
                open={isSuccessMessageShown}
                className={styles.successDrawer}
                {...commonProps}
                dataTid='success-drawer'
            >
                {renderBody()}
                <div className='drawer__actions'>{renderCloseButton()}</div>
            </Drawer>
        );
    }

    if (isSuccessMessageShown)
        return (
            <Popup
                isContentCentered
                containerClass={styles.successDrawer}
                footerContent={renderCloseButton()}
                {...commonProps}
            >
                {renderBody()}
            </Popup>
        );

    return null;
};

export default observer(PricePromiseSuccessMessage);
