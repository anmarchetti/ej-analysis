import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { PillSizeVariants } from 'frontend/components/common/Pills/PillWithVariants/PillSizeVariants';
import PillWithVariants from 'frontend/components/common/Pills/PillWithVariants/PillWithVariants';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import SvgCup from 'frontend/components/icons-new/Cup';

import styles from './FreeBoardUpgradePill.module.scss';

interface IFreeBoardUpgradePillProps {
    isFreeBoardUpgrade: boolean;
    pillSize?: PillSizeVariants;
    tooltipClass?: string;
}

export const FreeBoardUpgradePill: FC<IFreeBoardUpgradePillProps> = ({
    isFreeBoardUpgrade,
    tooltipClass,
    pillSize,
}) => {
    const { getPhrase, getSetting } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        getSetting: stores.layoutStore.getSetting,
    }));

    if (!getSetting(SiteSettings.IsFreeBoardUpgradePillEnabled) || !isFreeBoardUpgrade) {
        return null;
    }

    const content = {
        text:
            pillSize === PillSizeVariants.Big
                ? getPhrase(SitecoreDictionary.FreeUpgradesLabelsFreeBoardUpgradePillBig)
                : getPhrase(SitecoreDictionary.FreeUpgradesLabelsFreeBoardUpgradePillSmall),
        tooltipMessage: getPhrase(SitecoreDictionary.FreeUpgradesLabelsFreeBoardUpgradeTooltip),
        icon: pillSize ? <IconInfoCircle /> : <SvgCup />,
    };

    return (
        <PillWithVariants
            content={content}
            dataIdPrefix='free-board-upgrade'
            pillSize={pillSize}
            tooltipClass={tooltipClass}
            pillClass={styles.pill}
        />
    );
};

export default observer(FreeBoardUpgradePill);
