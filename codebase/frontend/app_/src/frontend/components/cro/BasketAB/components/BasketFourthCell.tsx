import React, { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import BasketDiagonalCellABStyles from 'frontend/components/cro/BasketAB/components/BasketDiagonalCellsAB.module.scss';
import SvgExternalLink from 'frontend/components/icons-new/ExternalLink';

interface IBasketFourthCellProps {
    className: string;
    onOpenPopup: () => void;
}

export const BasketFourthCell: FC<IBasketFourthCellProps> = ({ className, onOpenPopup }) => {
    const { getPhrase, isATOLProtectionEnabled } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isATOLProtectionEnabled: stores.layoutStore.isATOLProtectionEnabled,
    }));

    return (
        <div className={classNames(`${className}-cell`, BasketDiagonalCellABStyles.fourthCell)}>
            <div className='list list--icon'>
                {isATOLProtectionEnabled && (
                    <div
                        className={classNames('list-item--no-icon', BasketDiagonalCellABStyles.listItem)}
                        data-tid='atol-protected'
                    >
                        {getPhrase(SitecoreDictionary.HotelDetailsLabelsAtolProtected)}
                    </div>
                )}

                <Button
                    onClick={onOpenPopup}
                    isText
                    className={classNames('basket__show-popup', BasketDiagonalCellABStyles.showPopup)}
                    data-tid='show-more-details'
                >
                    <SvgExternalLink />
                    <span>{getPhrase(SitecoreDictionary.GlobalsLabelsShowMoreDetails)}</span>
                </Button>
            </div>
        </div>
    );
};

export default observer(BasketFourthCell);
