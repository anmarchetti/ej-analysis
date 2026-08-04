import React, { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Link from 'frontend/components/common/Link';

export interface IOfferButtonProps {
    link: string;
    onClick: () => void;
    asLink?: string;
    className?: string;
    label?: string;
}

const OfferButton: FC<IOfferButtonProps> = ({ link, onClick, label, asLink, className }) => {
    const { getPhrase, isPriceVisible, setNeedOpenWhenField } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        setNeedOpenWhenField: stores.searchStore.setNeedOpenWhenField,
        ...(isHolidayStore(stores) && {
            isPriceVisible: true,
        }),
        ...(isTradeStore(stores) && {
            isPriceVisible: !stores.layoutStore.isPricesHidden,
        }),
    }));

    const isMobile = useMobileViewport();

    const onSelectHoliday = (): void => {
        // does not work currently, waiting requirements INS-804
        if (!isMobile && !isPriceVisible) {
            setNeedOpenWhenField(true);
        }

        onClick();
    };

    return (
        <Link
            onClick={onSelectHoliday}
            data-tid='view-holiday-link'
            className={classNames('btn btn--wide', className)}
            href={link}
            as={asLink}
        >
            {label ?? getPhrase(SitecoreDictionary.SearchResultsButtonsViewHoliday)}
        </Link>
    );
};

export default observer(OfferButton);
