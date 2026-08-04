import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import CalloutPrice from 'frontend/components/common/CalloutPrice/CalloutPrice';
import { withRerender } from 'frontend/components/hoc';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';

import styles from './AmendRoomAndBoardFooter.module.scss';

export interface IAmendRoomAndBoardFooterProps {
    additionalCostLabel: string;
    goBackLabel: string;
    goBackNoChangesLabel: string;
    refundAmountLabel: string;
    priceTooltipContent?: ISitecoreField<string>;
    wasRerendered?: boolean;
}

const AmendRoomAndBoardFooter = ({
    wasRerendered,
    goBackNoChangesLabel,
    goBackLabel,
    additionalCostLabel,
    refundAmountLabel,
    priceTooltipContent,
}: IAmendRoomAndBoardFooterProps) => {
    const {
        getPhrase,
        isScreenMedium,
        redirectTo,
        clearStore,
        isLoading,
        isOriginalVariantChosen,
        confirmChosenVariant,
        chosenRoomVariant,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isScreenMedium: stores.appStore.isScreenMedium,
        redirectTo: stores.routerStore.redirectTo,
        clearStore: stores.amendRoomAndBoardStore.clearStore,
        isLoading: stores.amendRoomAndBoardStore.isLoadingValidatedOptions,
        isOriginalVariantChosen: stores.amendRoomAndBoardStore.isOriginalVariantChosen,
        confirmChosenVariant: stores.amendRoomAndBoardStore.confirmChosenVariant,
        chosenRoomVariant: stores.amendRoomAndBoardStore.chosenRoomVariant,
    }));

    const goBackWithoutChanges = () => {
        clearStore();
        redirectTo(SitePath.ViewBooking);
    };

    const backBtnLabel = isScreenMedium ? goBackNoChangesLabel : goBackLabel;
    const isDisabled = isOriginalVariantChosen || isLoading;
    const price = chosenRoomVariant?.fullAmendmentCharges || 0;
    const isPriceShown = wasRerendered && !isScreenMedium && !isDisabled;
    const isGoBackShown = (wasRerendered && isScreenMedium) || isDisabled;
    const priceLabel = price < 0 ? refundAmountLabel : additionalCostLabel;

    return (
        <ComponentWrapper>
            <div className={styles.wrapper}>
                {isPriceShown && (
                    <div className={styles.priceDesc} data-tid='rbc-footer-price'>
                        <p className={styles.priceLabel}>{priceLabel}</p>
                        <CalloutPrice
                            priceTooltipContent={priceTooltipContent}
                            orientation={CalloutOrientation.Top}
                            position={CalloutPosition.IconLeft}
                            price={price}
                        />
                    </div>
                )}
                {isGoBackShown && (
                    <Button
                        className={styles.backButton}
                        isTransparent
                        onClick={goBackWithoutChanges}
                        data-tid='rbc-go-back-btn'
                    >
                        {backBtnLabel}
                    </Button>
                )}

                <Button
                    disabled={isDisabled}
                    onClick={confirmChosenVariant}
                    className={styles.confirm}
                    data-tid='rbc-footer-continue'
                >
                    {getPhrase(SitecoreDictionary.GlobalsButtonsConfirmChanges)}
                </Button>
            </div>
        </ComponentWrapper>
    );
};

export default withRerender(observer(AmendRoomAndBoardFooter));
