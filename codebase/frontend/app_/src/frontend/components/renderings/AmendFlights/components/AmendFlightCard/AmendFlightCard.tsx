import React from 'react';
import classNames from 'classnames';

import { CurrencyCode } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { getAmendmentRoundedPrice } from 'frontend/utils/amendBooking.utils';
import { IRoute } from 'models/data/IRoute';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import BlockSelected from 'frontend/components/common/BlockSelected';
import Card from 'frontend/components/common/Card';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import { FlightsDetails } from 'frontend/components/common/FlightsDetails/FlightsDetails';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import AmendErrataMessages from 'frontend/components/renderings/AmendFlights/components/AmendErrataMessages/AmendErrataMessages';
import AmendFlightCardActions from 'frontend/components/renderings/AmendFlights/components/AmendFlightCard/components/AmendFlightCardActions/AmendFlightCardActions';

import styles from './AmendFlightCard.module.scss';

export interface IAmendFlightCardProps {
    currency: CurrencyCode | undefined;
    onClickSelect: (priceDifference?: number) => void;
    routes: IRoute[];
    cardClassName?: string;
    csMask?: boolean;
    dataTid?: string;
    errataFlightInfo?: string[];
    feeLabel?: string;
    isSelected?: boolean;
    notAvailable?: boolean;
    priceDifference?: number;
    priceTooltipText?: JSX.Element;
}

export const AmendFlightCard = React.forwardRef(
    (
        { errataFlightInfo = [], priceTooltipText, csMask, feeLabel, ...props }: IAmendFlightCardProps,
        ref: React.Ref<HTMLDivElement>,
    ) => {
        const { isErrataEnabled, getPhrase } = useStore(stores => ({
            getPhrase: stores.layoutStore.getPhrase,
            isErrataEnabled: stores.layoutStore.isErrataEnabled,
        }));

        const showErrata = isErrataEnabled && errataFlightInfo?.length > 0;
        const expandMessagedUniqKey = `${props.routes[0]?.id}-${props.routes[1]?.id}`;
        const priceDifference = getAmendmentRoundedPrice(props.priceDifference ?? 0);

        return (
            <Card className={props.cardClassName} pseudoBorder selected={props.isSelected}>
                <div className='flight-card' data-tid={props.dataTid} ref={ref} data-cs-mask={csMask}>
                    <FlightsDetails routes={props.routes} />

                    <div className={classNames('flight-card__action', styles.flightCardAction)}>
                        {props.notAvailable ? (
                            <ErrorMessage
                                icon={
                                    <i className='error-message__icon'>
                                        <SvgWarningFilled />
                                    </i>
                                }
                                message={getPhrase(SitecoreDictionary.AmendFlightsErrorsUnavailableFlight)}
                                errorMessageClass='amend-item-unavailable-error'
                            />
                        ) : (
                            <>
                                {props.isSelected && (
                                    <BlockSelected siteCoreKey={SitecoreDictionary.AlternativeFlightsButtonsSelected} />
                                )}

                                {!props.isSelected && (
                                    <AmendFlightCardActions
                                        priceTooltipText={priceTooltipText}
                                        priceDifference={priceDifference}
                                        currency={props.currency}
                                        onClickSelect={props.onClickSelect}
                                        feeLabel={feeLabel}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>

                {showErrata && <AmendErrataMessages errataInfo={errataFlightInfo} expandId={expandMessagedUniqKey} />}
            </Card>
        );
    },
);

export default AmendFlightCard;
