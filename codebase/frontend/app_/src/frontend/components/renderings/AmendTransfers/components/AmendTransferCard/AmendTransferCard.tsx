import React, { FunctionComponent } from 'react';
import classNames from 'classnames';

import { CurrencyCode, SignDisplay } from 'code/currency';
import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { getAmendmentRoundedPrice, getPricePostfix } from 'frontend/utils/amendBooking.utils';
import { ITransfer } from 'models/data/ITransfer';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import BlockSelected from 'frontend/components/common/BlockSelected';
import Button from 'frontend/components/common/Button';
import Callout from 'frontend/components/common/Callout/Callout';
import AmendErrataMessages from 'frontend/components/renderings/AmendFlights/components/AmendErrataMessages/AmendErrataMessages';
import TransferDuration from 'frontend/components/renderings/Transfer/components/TransferDuration/TransferDuration';

import styles from './AmendTransferCard.module.scss';

export interface IAmendTransferCardProps {
    currency: CurrencyCode | undefined;
    transfer: ITransfer;
    amendCharge?: number;
    className?: string;
    contentClassName?: string;
    errataMessages?: string[];
    isAmendAppearance?: boolean;
    isPayment?: boolean;
    isPriceBlockHidden?: boolean;
    isSelected?: boolean;
    onSelect?: () => void;
    priceTitle?: string;
    priceTooltipText?: JSX.Element;
    revertPrice?: number; // when  another transfer option selected we should show opposite price for booking transfer option
}

const AmendTransferCard: FunctionComponent<IAmendTransferCardProps> = ({
    isSelected,
    priceTitle,
    amendCharge: currentPrice,
    isPayment,
    priceTooltipText,
    transfer,
    revertPrice,
    className,
    contentClassName,
    isPriceBlockHidden,
    errataMessages = [],
    currency,
    onSelect,
    isAmendAppearance,
}) => {
    const { getPhrase, formatMoney } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const { name, content, iconUrl, transferInfo } = transfer;

    const isShowErrata = errataMessages.length > 0;

    const displayTransferDuration = !!transferInfo?.duration && Number(transferInfo.duration) > 0;

    const amendCharge = getAmendmentRoundedPrice(revertPrice ?? currentPrice ?? 0, !!revertPrice);

    const amendPriceLabel = formatMoney(amendCharge, {
        currency,
        maximumFractionDigits: 0,
        signDisplay: SignDisplay.ExceptZero,
    });

    const isShowPriceBlock = !isPriceBlockHidden && !isAmendAppearance;

    return (
        <div
            data-tid='amend-transfer-card'
            className={classNames(
                'amend-transfer-card',
                isSelected && 'amend-transfer-card--selected',
                {
                    [styles.amendView]: isAmendAppearance,
                    [styles.withDuration]: displayTransferDuration,
                },
                className,
            )}
        >
            <div className={classNames(styles.content, contentClassName)}>
                <div className='amend-transfer-card__info'>
                    <div className='card-container'>
                        <div
                            className={classNames('amend-transfer-card__heading', styles.header, {
                                'pb-md-1': displayTransferDuration,
                            })}
                        >
                            {iconUrl && (
                                <div
                                    className='card__icon'
                                    style={{ backgroundImage: `url("${cmsUrls.media(iconUrl)}")` }}
                                />
                            )}
                            <p className='card__title'>{name}</p>
                        </div>
                        <div
                            className={classNames('card__content flex-column', {
                                'mb-md-n5': displayTransferDuration,
                            })}
                        >
                            {content && (
                                <div
                                    className={classNames('amend-transfer-card__content', styles.card)}
                                    dangerouslySetInnerHTML={{ __html: content }}
                                />
                            )}

                            {displayTransferDuration && !!transferInfo.duration && (
                                <div className={classNames('amend-transfer-card__duration mt-md-3 pb-md-3')}>
                                    <TransferDuration
                                        className={styles.transferDuration}
                                        duration={transferInfo.duration}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {isPayment ? (
                    <div className='amend-transfer-card__action' data-tid='amend-transfer-payment-block'>
                        {isShowPriceBlock && (
                            <>
                                {!!priceTitle && <div>{priceTitle}</div>}
                                <p className='price-block' data-tid='amend-transfer-price'>
                                    {amendPriceLabel}
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <div
                        className={classNames('amend-transfer-card__action pb-md-3', {
                            'mt-md-n5': !displayTransferDuration && !isSelected,
                        })}
                    >
                        {isSelected ? (
                            <BlockSelected
                                className={styles.blockSelected}
                                siteCoreKey={SitecoreDictionary.TransferButtonsSelected}
                            />
                        ) : (
                            <div
                                className={classNames('amend-transfer-card__price-container', {
                                    'mt-md-n5': displayTransferDuration,
                                })}
                            >
                                {isShowPriceBlock && (
                                    <div className='d-flex justify-content-end'>
                                        {!!priceTitle && <div data-tid='amend-transfer-price-title'>{priceTitle}</div>}
                                        <p className='price-block' data-tid='amend-transfer-price'>
                                            {amendPriceLabel}
                                            <span className='price-block__label-postfix'>
                                                {getPricePostfix(
                                                    getPhrase(SitecoreDictionary.PriceSummaryLabelsTotal),
                                                    amendCharge,
                                                )}
                                            </span>
                                        </p>
                                        {priceTooltipText && (
                                            <Callout
                                                content={<div>{priceTooltipText}</div>}
                                                orientation={CalloutOrientation.Top}
                                                position={CalloutPosition.Right}
                                                isShownOnHover
                                                className='ms-2 mt-1 text-center'
                                            />
                                        )}
                                    </div>
                                )}

                                <Button className='select-transfer' onClick={() => onSelect?.()}>
                                    {!isAmendAppearance && getPhrase(SitecoreDictionary.TransferLabelsSelect)}
                                    {isAmendAppearance && (
                                        <div data-tid='price-on-button'>
                                            <span className={styles.amendPrice}>{amendPriceLabel}</span>
                                            <span className={styles.amendPriceLabel}>
                                                {getPricePostfix(
                                                    getPhrase(SitecoreDictionary.PriceSummaryLabelsTotal),
                                                    amendCharge,
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {isShowErrata && <AmendErrataMessages errataInfo={errataMessages} expandId={name} />}
        </div>
    );
};

export default AmendTransferCard;
