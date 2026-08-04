import { FC } from 'react';
import classNames from 'classnames';

import { useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import SVGChevronDown from 'frontend/components/icons-new/ChevronDown';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';
import { ICollapsibleLinksModuleParams } from 'frontend/components/renderings/CollapsibleLinksModule/CollapsibleLinksModule';

import styles from './ToggleButton.module.scss';

export interface IToggleButtonProps {
    drawerContentRef: React.RefObject<HTMLDivElement>;
    isBlockExpanded: boolean;
    moduleTitle: string;
    params: ICollapsibleLinksModuleParams;
    rendUid: string;
    setIsBlockExpanded: (state: boolean) => void;
    isDrawerBtn?: boolean;
}

export const ToggleButton: FC<IToggleButtonProps> = ({
    isBlockExpanded,
    setIsBlockExpanded,
    drawerContentRef,
    moduleTitle,
    params,
    rendUid,
    isDrawerBtn,
}) => {
    const { getPhrase, trackModuleClick } = useStore(({ layoutStore, trackingStore }: TStores) => ({
        getPhrase: layoutStore.getPhrase,
        trackModuleClick: trackingStore.trackModuleClick,
    }));
    const isExtraSmall = useXSMobileViewport();
    const { IsModuleClickTrackingEnabled, ModuleLocation } = params;
    const getButtonText = (): string => {
        if (isDrawerBtn) {
            return getPhrase(SitecoreDictionary.GlobalsButtonsClose);
        }

        if (isBlockExpanded && !isExtraSmall) {
            return getPhrase(SitecoreDictionary.GlobalsLabelsShowLess);
        }

        return getPhrase(SitecoreDictionary.GlobalsLabelsShowMore);
    };
    const buttonText = getButtonText();
    const onToggleButtonClick = (): void => {
        const isExpanded = isDrawerBtn ? false : !isBlockExpanded;

        setIsBlockExpanded(isExpanded);

        if (isExtraSmall && isExpanded && drawerContentRef.current) {
            // Open drawer with content on top
            drawerContentRef.current.scrollTop = 0;
        }

        if (isSitecoreCheckboxSelected(IsModuleClickTrackingEnabled)) {
            trackModuleClick({
                moduleId: rendUid,
                name: moduleTitle,
                location: ModuleLocation,
                selection: buttonText,
                destinationPath: '',
            });
        }
    };

    if (isDrawerBtn) {
        return (
            <Button isTransparent isFullWidth onClick={onToggleButtonClick} className={styles.btn}>
                {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
            </Button>
        );
    }

    return (
        <Button isText onClick={onToggleButtonClick} className={styles.btn}>
            <span>{buttonText}</span>
            {isExtraSmall ? (
                <SvgChevronRight />
            ) : (
                <SVGChevronDown className={classNames(isBlockExpanded && 'icon--reflect-y')} />
            )}
        </Button>
    );
};

export default ToggleButton;
