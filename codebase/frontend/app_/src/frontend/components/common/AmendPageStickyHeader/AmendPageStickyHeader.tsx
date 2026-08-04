import { FunctionComponent } from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import CalloutPrice from 'frontend/components/common/CalloutPrice/CalloutPrice';
import StickyBox from 'frontend/components/common/StickyBox';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';

import styles from './AmendPageStickyHeader.module.scss';

export interface IAmendPageStickyHeaderProps {
    children: React.ReactNode;
    onContinueBtnClick: () => void;
    price: number;
    priceLabel: string;
    isConfirmButtonDisabled?: boolean;
    isPriceHidden?: boolean;
    priceTooltipContent?: ISitecoreField<string>;
}

const AmendPageStickyHeader: FunctionComponent<IAmendPageStickyHeaderProps> = ({
    children,
    isConfirmButtonDisabled,
    onContinueBtnClick,
    price,
    isPriceHidden,
    priceLabel,
    priceTooltipContent,
}) => {
    const { getPhrase } = useStore(({ layoutStore }: IHolidaysStores) => ({
        getPhrase: layoutStore.getPhrase,
    }));

    return (
        <StickyBox
            render={() => (
                <div className={styles.header}>
                    <ComponentWrapper>
                        <div className={styles.wrapper} data-tid='amend-page-header'>
                            <div className={styles.content}>{children}</div>
                            {!isPriceHidden && (
                                <div className={styles.price} data-tid='header-price'>
                                    <div className={classnames(styles.prices, 'diagonal-cell__inner')}>
                                        <div className={styles.additional} data-tid='basket-additional-price'>
                                            <span className={styles.additionalLabel} data-tid='header-price-label'>
                                                {priceLabel}
                                            </span>
                                            <CalloutPrice
                                                priceTooltipContent={priceTooltipContent}
                                                orientation={CalloutOrientation.Bottom}
                                                position={CalloutPosition.Right}
                                                price={price}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button
                                isMedium
                                className='summary-edit'
                                disabled={isConfirmButtonDisabled}
                                onClick={onContinueBtnClick}
                            >
                                {getPhrase(SitecoreDictionary.GlobalsButtonsConfirmChanges)}
                            </Button>
                        </div>
                    </ComponentWrapper>
                </div>
            )}
        />
    );
};

export default observer(AmendPageStickyHeader);
