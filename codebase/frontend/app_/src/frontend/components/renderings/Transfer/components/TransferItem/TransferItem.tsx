import React, { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { isPricePPShown } from 'frontend/utils/offer.utils';
import { ITransfer } from 'models/data/ITransfer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TransferType } from 'models/enum/transfer/TransferType';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import BlockSelected from 'frontend/components/common/BlockSelected';
import Button from 'frontend/components/common/Button';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import LuxuryWrapper from 'frontend/components/common/LuxuryWrapper/LuxuryWrapper';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import SvgConfirmFilled from 'frontend/components/icons-new/ConfirmFilled';
import PriceInfo from 'frontend/components/renderings/Transfer/components/PriceInfo/PriceInfo';
import SportEquipmentFees from 'frontend/components/renderings/Transfer/components/SportEquipmentFees/SportEquipmentFees';
import TransferDuration from 'frontend/components/renderings/Transfer/components/TransferDuration/TransferDuration';
import TransferHeader from 'frontend/components/renderings/Transfer/components/TransferHeader/TransferHeader';
import { ITransferFields } from 'frontend/components/renderings/Transfer/Transfer';

import styles from './TransferItem.module.scss';

export interface ITransferItemProps {
    isDefault: boolean;
    transfer: ITransfer;
    fields?: ITransferFields;
    isSelected?: boolean;
    onSelect?: () => void;
    promo?: JSX.Element | null;
}

const TransferItem: FunctionComponent<ITransferItemProps> = ({
    isSelected,
    transfer,
    promo,
    fields,
    onSelect,
    isDefault,
}) => {
    const {
        offer,
        isLoadingOffers,
        isLoadingTransfers,
        isTransferDurationEnabled,
        isPriceVisible,
        infantsQuantity,
        getPhrase,
        isLuxuryPackage,
    } = useStore((stores: TStores) => ({
        isLoadingOffers: stores.bookingStore.isLoadingOffer,
        isLoadingTransfers: stores.bookingStore.isLoadingExtras,
        offer: stores.bookingStore.selectedOffer,
        infantsQuantity: stores.searchStore.searchWho.infantsQuantity,
        isTransferDurationEnabled: stores.layoutStore.isTransferDurationEnabled,
        isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
        getPhrase: stores.layoutStore.getPhrase,
        isLuxuryPackage: stores.bookingStore.isLuxuryPackage,
    }));

    if (!fields) {
        return null;
    }

    const { pricePP, name, type, content, iconUrl, transferInfo, smallSeSurcharge, largeSeSurcharge } = transfer;
    const isNoTransfer = type === TransferType.NoTransfer;

    const {
        SharedCTADescription,
        PrivateCTADescription,
        NoTransferCTADescription,
        IncludedForFreeText,
        UpgradeForText,
        UpgradeForFree,
    } = fields;

    const getCTAText = (type: TransferType): ISitecoreField<string> | undefined => {
        switch (type) {
            case TransferType.Shared:
                return SharedCTADescription;
            case TransferType.Private:
                return PrivateCTADescription;
            case TransferType.NoTransfer:
                return NoTransferCTADescription;
            default:
                return;
        }
    };

    const isTransferDuration = (): boolean =>
        !!transferInfo?.duration && !isNoTransfer && Number(transferInfo.duration) > 0 && isTransferDurationEnabled;

    const isLuxury = (): boolean => isLuxuryPackage && type === TransferType.Private && !!isSelected;

    const shouldShowTransferDuration = isTransferDuration();
    const isButtonDisabled = isLoadingOffers || isLoadingTransfers;
    const isLuxuryTransfer = isLuxury();
    const shouldRenderError = isSelected && type !== TransferType.NoTransfer && !!infantsQuantity;
    const dictionaryKey =
        type === TransferType.Private
            ? SitecoreDictionary.TransferLabelsInfantsPrivateInstructionsHTML
            : SitecoreDictionary.TransferLabelsInfantsSharedInstructionsHTML;

    const errorEl = shouldRenderError ? (
        <ErrorMessage
            message={getPhrase(SitecoreDictionary.TransferLabelsInfantInstructionsTitle)}
            description={<RichTextDictionary dictionaryKey={dictionaryKey} />}
            icon={<IconInfoCircle />}
            IsNotification
            errorMessageClass={styles.errorMessage}
        />
    ) : null;
    const contentEl = (
        <div
            className={classNames(
                styles.cardContainer,
                isSelected && styles.selected,
                isLuxuryTransfer && styles.luxuryTransfer,
            )}
            data-tid={`transfer-${type}`}
        >
            <div>
                <div
                    data-tid={`option-card-${type}`}
                    className={classNames(styles.optionCard, isNoTransfer && styles.noTransfer)}
                >
                    <div>
                        <TransferHeader
                            name={name}
                            iconUrl={iconUrl}
                            transferInfo={transferInfo}
                            isNoTransfer={isNoTransfer}
                            isShouldShowTransferDuration={shouldShowTransferDuration}
                        />
                        {shouldShowTransferDuration && (
                            <TransferDuration
                                className={styles.transferDuration}
                                iconClassName={styles.transferDurationIcon}
                                duration={transferInfo!.duration as number}
                                hideOnDesktop
                            />
                        )}
                        {content && <div className={styles.content} dangerouslySetInnerHTML={{ __html: content }} />}
                    </div>
                    {(!isNoTransfer || pricePP < 0) && (
                        <div data-tid='line' className={classNames('d-block d-sm-none', styles.line)} />
                    )}
                    <div className={styles.actionPanel}>
                        {isSelected ? (
                            <BlockSelected
                                className={styles.selectedBlock}
                                siteCoreKey={!isDefault ? SitecoreDictionary.TransferButtonsSelected : undefined}
                                sitecoreField={isDefault ? IncludedForFreeText : undefined}
                                customSvg={<SvgConfirmFilled className={styles.customSvg} />}
                            />
                        ) : (
                            <div className={styles.CTAcontainer}>
                                {isPriceVisible && (
                                    <PriceInfo
                                        UpgradeForText={UpgradeForText}
                                        UpgradeForFree={UpgradeForFree}
                                        type={type}
                                        isNoTransfer={isNoTransfer}
                                        pricePP={pricePP}
                                        isLabelPPShown={isPricePPShown(offer)}
                                        currency={offer?.currency?.code}
                                    />
                                )}

                                <div
                                    className={classNames(
                                        styles.buttonContainer,
                                        isNoTransfer && pricePP >= 0 && styles.noTransferButton,
                                    )}
                                    data-tid='button-container'
                                >
                                    <Button
                                        className={styles.button}
                                        isOutlined={isNoTransfer}
                                        onClick={() => onSelect?.()}
                                        dataTid='select-transfer-button'
                                        disabled={isButtonDisabled}
                                        isLoading={isButtonDisabled}
                                    >
                                        <Text field={getCTAText(type)} />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {promo || null}

            {isSelected && (
                <SportEquipmentFees
                    fields={fields}
                    smallSeSurcharge={smallSeSurcharge}
                    largeSeSurcharge={largeSeSurcharge}
                    type={type}
                />
            )}
        </div>
    );

    return (
        <>
            {isLuxuryTransfer ? (
                <LuxuryWrapper
                    label={getPhrase(SitecoreDictionary.LuggageLabelsIncluded)}
                    wrapperClassName={styles.luxuryWrapper}
                    contentClassName={styles.luxuryContent}
                >
                    {contentEl}
                </LuxuryWrapper>
            ) : (
                contentEl
            )}
            {errorEl}
        </>
    );
};

export default observer(TransferItem);
