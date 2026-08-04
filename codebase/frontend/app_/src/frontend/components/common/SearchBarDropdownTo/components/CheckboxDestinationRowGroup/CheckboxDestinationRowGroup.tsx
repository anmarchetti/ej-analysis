import { FC, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { useMount } from 'frontend/hooks/useMount';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IDestinationCountry } from 'models/data/IDestinationCountries';
import Button from 'frontend/components/common/Button';
import DestinationCheckboxGroup from 'frontend/components/common/SearchBarDropdownTo/components/DestinationCheckboxGroup/DestinationCheckboxGroup';
import IconChevronDown from 'frontend/components/icons/ChevronDown';
import IconMapMarker from 'frontend/components/icons/MapMarker';

import styles from './CheckboxDestinationRowGroup.module.scss';

export interface ICheckboxDestinationRowGroupProps {
    availableCodes: string[] | null;
    hasTopMargin: boolean;
    parent: IDestinationCountry;
}

const CheckboxDestinationRowGroup: FC<ICheckboxDestinationRowGroupProps> = ({
    hasTopMargin,
    availableCodes,
    parent,
}) => {
    const { hasPrefilledSearchPod, isDisabledItem, isCheckedItem, trackToRegionToggle } = useStore(
        (stores: TStores) => ({
            hasPrefilledSearchPod: stores.searchStore.hasPrefilledSearchPod,
            isDisabledItem: stores.searchStore.searchTo.isDisabledItem,
            isCheckedItem: stores.searchStore.searchTo.isCheckedItem,
            trackToRegionToggle: stores.trackingStore.searchPod.trackToRegionToggle,
        }),
    );

    const [isOpened, setIsOpened] = useState<boolean>(false);

    const isMobile = useMobileViewport();

    useMount(() => {
        openCheckboxIfNeeded();
    });

    const prevHasPrefilledSearchPodRef = useRef<boolean>(hasPrefilledSearchPod);
    useEffect(() => {
        if (!prevHasPrefilledSearchPodRef.current && hasPrefilledSearchPod) {
            openCheckboxIfNeeded();
        }

        prevHasPrefilledSearchPodRef.current = hasPrefilledSearchPod;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasPrefilledSearchPod]);

    const toggleGroup = (parent: IDestinationCountry): void => {
        setIsOpened(prev => !prev);
        trackToRegionToggle(parent);
    };

    // open checkbox if it's selected or a child is selected. should be run on init and after prefilling search pod
    const openCheckboxIfNeeded = (): void => {
        if (isDisabledItem(parent)) {
            return setIsOpened(false);
        }

        if (isCheckedItem(parent) || parent.children?.some(child => isCheckedItem(child, parent))) {
            return setIsOpened(true);
        }
    };

    return (
        <div
            className={classNames(styles.checkboxRow, { [styles.hasMargin]: hasTopMargin })}
            data-tid='checkbox-destination-row-group'
        >
            <Button
                isText
                className={classNames(styles.btn, { [styles.btnDisabled]: isDisabledItem(parent) })}
                dataTid={parent.code}
                onClick={(): void => toggleGroup(parent)}
            >
                <IconMapMarker className={styles.markerIcon} />
                {parent.name}
                {isMobile && (
                    <span
                        className={classNames(styles.checkboxRowDropdown, { [styles.open]: isOpened })}
                        data-tid='checkbox-destination-row-group-icon'
                    >
                        <IconChevronDown />
                    </span>
                )}
            </Button>
            {isOpened && <DestinationCheckboxGroup availableCodes={availableCodes} parent={parent} />}
        </div>
    );
};

export default observer(CheckboxDestinationRowGroup);
