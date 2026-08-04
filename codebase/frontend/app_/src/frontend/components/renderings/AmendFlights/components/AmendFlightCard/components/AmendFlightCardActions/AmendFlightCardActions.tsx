import { FunctionComponent } from 'react';
import classNames from 'classnames';

import { SignDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { getPricePostfix } from 'frontend/utils/amendBooking.utils';
import { isDefined } from 'frontend/utils/object.utils';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import Callout from 'frontend/components/common/Callout/Callout';
import { IAmendFlightCardProps } from 'frontend/components/renderings/AmendFlights/components/AmendFlightCard/AmendFlightCard';

import styles from './AmendFlightCardActions.module.scss';

export interface IAmendFlightCardActionsProps extends Partial<IAmendFlightCardProps> {
    onClickSelect: (priceDifference?: number) => void;
    feeLabel?: string;
    priceDifference?: number;
    priceTooltipText?: JSX.Element;
}

const AmendFlightCardActions: FunctionComponent<IAmendFlightCardActionsProps> = ({
    priceTooltipText,
    priceDifference,
    currency,
    onClickSelect,
    feeLabel,
}) => {
    const { getPhrase, formatMoney } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const priceDifferenceTotal = isDefined(priceDifference)
        ? formatMoney(priceDifference, {
              currency: currency,
              signDisplay: SignDisplay.ExceptZero,
              maximumFractionDigits: 0,
          })
        : '';

    return (
        <div className={classNames('row', styles.flightCardActions)}>
            {isDefined(priceDifference) && (
                <div className={classNames(styles.priceContainer, 'col-auto ms-auto mb-2')}>
                    <div className={styles.priceContent}>
                        <div>
                            <span className={styles.priceTotal} data-tid='price-total'>
                                {priceDifferenceTotal}
                            </span>
                            <span className={styles.pricePostfix} data-tid='price-postfix'>
                                {getPricePostfix(
                                    getPhrase(SitecoreDictionary.PriceSummaryLabelsTotal),
                                    priceDifference,
                                )}
                            </span>
                        </div>
                        {!!feeLabel && (
                            <span className={styles.fee} data-tid='fee-label'>
                                {feeLabel}
                            </span>
                        )}
                    </div>

                    {!!priceTooltipText && (
                        <Callout
                            content={<div className={styles.tooltipText}>{priceTooltipText}</div>}
                            orientation={CalloutOrientation.Top}
                            position={CalloutPosition.Right}
                            isShownOnHover
                            className='ms-2 text-center flight-card__price-tooltip'
                        />
                    )}
                </div>
            )}

            <div className={classNames('col-12', styles.selectButtonContainer)}>
                <Button
                    isFullWidth
                    dataTid='select-button'
                    onClick={() => onClickSelect(priceDifference)}
                    className={styles.selectButton}
                >
                    <span>{getPhrase(SitecoreDictionary.AlternativeFlightsButtonsSelect)}</span>
                </Button>
            </div>
        </div>
    );
};

export default AmendFlightCardActions;
