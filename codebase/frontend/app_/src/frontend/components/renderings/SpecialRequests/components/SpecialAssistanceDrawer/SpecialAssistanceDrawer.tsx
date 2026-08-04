import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { IAddAssistanceFields } from 'frontend/components/renderings/SpecialRequests/components/SpecialAssistance/SpecialAssistance';
import WarningPopup from 'frontend/components/renderings/WarningPopup/WarningPopup';

import styles from './SpecialAssistanceDrawer.module.scss';

export interface ISpecialAssistanceDrawerProps extends IAddAssistanceFields {
    onCTAClick: () => void;
}

const SpecialAssistanceDrawer: FC<ISpecialAssistanceDrawerProps> = ({
    AddAssistanceTitle,
    AddAssistanceDescription,
    AddAssistancePhone,
    AddAssistanceExtra,
    onCTAClick,
}) => {
    const { getPhrase } = useStore(store => ({
        getPhrase: store.layoutStore.getPhrase,
    }));

    return (
        <WarningPopup
            onClose={onCTAClick}
            title={AddAssistanceTitle}
            description={AddAssistanceDescription}
            secondaryCtaText={{ value: getPhrase(SitecoreDictionary.GlobalsButtonsClose) }}
            onSecondaryCtaClick={onCTAClick}
            extraContent={
                <>
                    <Text
                        field={AddAssistancePhone}
                        tag='div'
                        className={styles.phone}
                        data-tid='warning-popup-phone'
                    />
                    <RichTextWithLinks
                        field={AddAssistanceExtra}
                        tag='p'
                        className={styles.text}
                        dataId='warning-popup-extra'
                    />
                </>
            }
        />
    );
};

export default SpecialAssistanceDrawer;
