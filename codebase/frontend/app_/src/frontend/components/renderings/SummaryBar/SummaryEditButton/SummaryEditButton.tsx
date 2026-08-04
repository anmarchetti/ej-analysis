import { FC, useState } from 'react';
import classNames from 'classnames';
import { when } from 'mobx';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { waitForFrames } from 'frontend/utils/scroll.utils';
import { scrollToElement } from 'frontend/utils/ui.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import Button from 'frontend/components/common/Button';

import styles from './SummaryEditButton.module.scss';

export interface ISummaryEditButtonProps {
    dataTid?: string;
    isHidden?: boolean;
    onClick?: () => void;
    scrollAnchorId?: string;
}

const DEFAULT_SCROLL_OFFSET = 15;

const SummaryEditButton: FC<ISummaryEditButtonProps> = ({ dataTid, onClick, scrollAnchorId, isHidden }) => {
    const { isExtrasPage, redirectTo, buildHotelDetailsQuery, bookingStore, getPhrase } = useStore(
        (stores: TStores) => ({
            isExtrasPage: stores.layoutStore.isExtrasPage,
            redirectTo: stores.routerStore.redirectTo,
            buildHotelDetailsQuery: stores.queryParamStore.buildHotelDetailsQuery,
            bookingStore: stores.bookingStore,
            getPhrase: stores.layoutStore.getPhrase,
        }),
    );

    const [isLoading, setIsLoading] = useState(false);

    if (isHidden) {
        return null;
    }

    const handleClick = async (): Promise<void> => {
        setIsLoading(true);

        try {
            onClick?.();

            if (!isExtrasPage) {
                const extrasUrl = `${SitePath.Extras}${buildHotelDetailsQuery()}`;
                await redirectTo(extrasUrl);

                await when(() => !bookingStore.isValidatingPackage && !bookingStore.isLoadingOffer);

                await waitForFrames();
            }

            if (scrollAnchorId) {
                const element = document.getElementById(scrollAnchorId);

                if (element) {
                    scrollToElement(element, DEFAULT_SCROLL_OFFSET);
                }
            }
        } catch {
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleClick}
            isText
            dataTid={dataTid}
            className={classNames(styles.button, styles.priority)}
            disabled={isLoading}
        >
            {getPhrase(SitecoreDictionary.GlobalsButtonsEdit)}
        </Button>
    );
};

export default observer(SummaryEditButton);
