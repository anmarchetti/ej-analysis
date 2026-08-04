import React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import Button from 'frontend/components/common/Button';
import ShowMoreButton from 'frontend/components/common/ShowMoreButton';
import SvgExternalLink from 'frontend/components/icons-new/ExternalLink';

import styles from './BoardSectionButton.module.scss';

export interface IBoardSectionButtonProps {
    alternativeBoardsCount: number;
    handleShowMore: () => void;
    isCollapsed: boolean;
    isMostExpensiveBoardSelected: boolean;
    offer: Nullable<IOfferWithoutAltBoards>;
    title?: string;
}

const BoardSectionButton = ({
    isCollapsed,
    offer,
    title,
    handleShowMore,
    alternativeBoardsCount,
    isMostExpensiveBoardSelected,
}: IBoardSectionButtonProps) => {
    const { isExtrasPage, isScreenMedium } = useStore((stores: TStores) => ({
        isExtrasPage: stores.layoutStore.isExtrasPage,
        isScreenMedium: stores.appStore.isScreenMedium,
    }));

    const isBtnVisible = () => {
        // button is not displayed when there no alternative boards are available
        if (!alternativeBoardsCount) {
            return false;
        }

        // button is displayed when only one alternative board is available
        // and when most expensive board selected or on extras page
        if (alternativeBoardsCount === 1) {
            return isMostExpensiveBoardSelected || isExtrasPage;
        }

        // button is always displayed when at least 2 alternative boards are available
        return true;
    };

    // Show more button is hidden in EE mode or when title is undefined or button visibility condition is false
    if (!offer || !title || !isBtnVisible()) {
        return null;
    }

    return isScreenMedium ? (
        <ShowMoreButton
            dataTid='show-more-boards-button-desktop'
            onClick={handleShowMore}
            isChevronUp={!isCollapsed}
            title={title}
        />
    ) : (
        <Button
            data-tid='show-more-boards-button-mobile'
            className={styles.showButton}
            isOutlined
            isFullWidth
            onClick={handleShowMore}
        >
            {title}
            <SvgExternalLink className={styles.externalLinkIcon} />
        </Button>
    );
};

export default observer(BoardSectionButton);
