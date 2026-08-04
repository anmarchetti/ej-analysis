import { FC } from 'react';
import * as React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import SiteSettings from 'models/enum/SiteSettings';
import SearchBarInputCallout from 'frontend/components/common/SearchBarInputCallout/SearchBarInputCallout';
import SvgLocationPinFilled from 'frontend/components/icons-new/LocationPinFilled';
import styles from 'frontend/components/renderings/SearchPod/components/SearchBar/components/SearchBarToContent/components/InspirationCallout/InspirationCallout.module.scss';

export const INSPIRATION_CALLOUT_ID = 'inspiration-callout';

export interface IInspirationCalloutProps {
    calloutText: string;
    calloutTitle: string;
    isTextIncludeLink: boolean;
    onCancel: () => void;
}

const InspirationCallout: FC<IInspirationCalloutProps> = ({
    onCancel,
    calloutText,
    calloutTitle,
    isTextIncludeLink,
}) => {
    const { getSetting, addAnywhere, hasErrorInField } = useStore((stores: TStores) => ({
        getSetting: stores.layoutStore.getSetting,
        addAnywhere: () => stores.searchStore.onAnywhereCheck(true),
        hasErrorInField: stores.searchStore.hasErrorInField,
    }));

    if (!getSetting<number>(SiteSettings.IsAnywhereShownInAutocomplete) || hasErrorInField(SearchBarDropdown.To)) {
        return null;
    }

    const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        const target = event.target as HTMLElement;
        const isClickedOnLink = target.tagName === 'A';

        // if click on anywhere-callout -> add anywhere
        if (!isTextIncludeLink) {
            addAnywhere();
            onCancel();
        }

        if (isClickedOnLink) {
            return;
        }

        onCancel();
    };

    return (
        <SearchBarInputCallout
            id={INSPIRATION_CALLOUT_ID}
            className={classNames('anywhere-callout', styles.callout)}
            title={calloutTitle}
            text={calloutText}
            icon={<SvgLocationPinFilled />}
            onClick={handleClick}
        />
    );
};

export default observer(InspirationCallout);
