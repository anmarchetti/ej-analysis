import React from 'react';
import { observer } from 'mobx-react';

import { SignDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { isPricePPShown } from 'frontend/utils/offer.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import BlockSelected from 'frontend/components/common/BlockSelected';
import Button from 'frontend/components/common/Button';
import Card from 'frontend/components/common/Card';
import FlightErrata from 'frontend/components/common/ErrataInfo/FlightErrata';
import { FlightsDetails } from 'frontend/components/common/FlightsDetails/FlightsDetails';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import SvgEditFilled from 'frontend/components/icons-new/EditFilled';

export interface IFlightCardProps {
    isChangeable: boolean;
    isSelected: boolean;

    offer: IAlternativeOffer;
    onClickSelect: (offer: IAlternativeOffer, priceDiff: number) => void;

    priceDifference: number;

    dataTid?: string;
    isLoadingOffer?: boolean;
    onClickChange?: () => void;
}

export const FlightCard = React.forwardRef((props: IFlightCardProps, ref: React.Ref<HTMLDivElement>) => {
    const { isErrataEnabled, isPriceVisible, getPhrase, formatMoney } = useStore((stores: TStores) => ({
        isErrataEnabled: stores.layoutStore.isErrataEnabled,
        isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const { routes, errataFlightInfo } = props.offer?.transport || {};

    return (
        <Card pseudoBorder selected={props.isSelected}>
            <div className='flight-card' data-tid={props.dataTid} ref={ref}>
                <FlightsDetails routes={routes || []} />

                <div className='flight-card__action'>
                    {props.isSelected && !props.isChangeable && (
                        <BlockSelected siteCoreKey={SitecoreDictionary.AlternativeFlightsButtonsSelected} />
                    )}

                    {!props.isSelected && !props.isChangeable && (
                        <div className='row flight-card__action-select'>
                            {isPriceVisible && (
                                <div className='col-auto ms-auto mb-2'>
                                    <PriceLabel
                                        price={
                                            <span className='flight-card__price'>
                                                {formatMoney(props.priceDifference, {
                                                    currency: props.offer?.currency?.code,
                                                    signDisplay: SignDisplay.ExceptZero,
                                                    maximumFractionDigits: 0,
                                                })}
                                            </span>
                                        }
                                        priceDictionary={
                                            isPricePPShown(props.offer)
                                                ? SitecoreDictionary.GlobalsPriceLabelsPerPerson
                                                : undefined
                                        }
                                    />
                                </div>
                            )}

                            <div className='col-12'>
                                <Button
                                    isFullWidth
                                    onClick={(): void => props.onClickSelect(props.offer, props.priceDifference)}
                                    dataTid='select-button'
                                    disabled={props.isLoadingOffer}
                                    isLoading={props.isLoadingOffer}
                                >
                                    {getPhrase(SitecoreDictionary.AlternativeFlightsButtonsSelect)}
                                </Button>
                            </div>
                        </div>
                    )}

                    {props.isChangeable && (
                        <Button
                            isOutlined
                            isFullWidth
                            onClick={(): void => props.onClickChange?.()}
                            dataTid='change-button'
                        >
                            <span>{getPhrase(SitecoreDictionary.AlternativeFlightsButtonsChange)}</span>
                            <span className='btn__icon'>
                                <SvgEditFilled />
                            </span>
                        </Button>
                    )}
                </div>
            </div>

            {isErrataEnabled && !!errataFlightInfo?.length && (
                <div className='flight-card__flight-errata-info-container'>
                    <FlightErrata dotListStyle errataFlightInfo={errataFlightInfo} />
                </div>
            )}
        </Card>
    );
});

export default observer(FlightCard);
