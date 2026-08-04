import { FunctionComponent, useMemo } from 'react';
import { Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { CurrencyCode } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IAmendTransport } from 'models/data/IAmendBookingFlights';
import { IAmendFlightsFields } from 'models/data/IAmendFlights';
import {
    DataStatus,
    isErrorStatus,
    isLoadedStatus,
    isLoadingMoreStatus,
    isLoadingStatus,
} from 'models/enum/DataStatus';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import { FlightShimmer } from 'frontend/components/renderings/AlternativeFlights/components/FlightShimmer';
import AmendFlightCard from 'frontend/components/renderings/AmendFlights/components/AmendFlightCard/AmendFlightCard';
import AmendFlightsFilters from 'frontend/components/renderings/AmendFlights/components/AmendFlightsFilters/AmendFlightsFilters';

import { getAmendAlternativeTransports } from './AmendAlternativeFlights.utils';

import styles from './AmendAlternativeFlights.module.scss';

export interface IAmendAlternativeFlightsProps {
    currency: CurrencyCode | undefined;
    flights: IAmendTransport[];
    isFlightSelected: (flight: IAmendTransport) => boolean;
    onChangeFlight: (flight: IAmendTransport) => void;
    onLoadMoreClick: () => void;
    status: DataStatus;
    title: string | undefined;
    totalFlights: number;
    fields?: IAmendFlightsFields;
    priceTooltipText?: JSX.Element;
    rendering?: any;
}

export const AmendAlternativeFlights: FunctionComponent<IAmendAlternativeFlightsProps> = ({
    flights,
    status,
    totalFlights,
    title,
    currency,
    isFlightSelected,
    onLoadMoreClick,
    onChangeFlight,
    fields,
    priceTooltipText,
    rendering,
}) => {
    const { getPhrase, isPreFilteredMessageShown, getFormattedNumber, isFromBooking } = useStore(
        (stores: IHolidaysStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            isPreFilteredMessageShown: stores.amendFlightsStore.isPreFilteredMessageShown,
            getFormattedNumber: stores.marketStore.getFormattedNumber,
            isFromBooking: stores.amendFlightsStore.isFromBooking,
        }),
    );

    const alternativeFlights = getAmendAlternativeTransports(
        flights as IAmendTransport[],
        fields,
    ) as (IAmendTransport & { errataMessages: string[] })[];

    const loading = isLoadingMoreStatus(status) || isLoadedStatus(status);
    const isShowFlights = loading || (isErrorStatus(status) && flights.length > 0);
    const isShowPrefilteredMessage = isPreFilteredMessageShown && fields?.IsShowPreFilteredMessage?.value;

    const noFlightsTitle =
        Tokenizer.replaceToken(fields?.NoFlightsAvailableTitle?.value, Tokens.Number, String(flights.length)) || '';

    const countOfFlightsLabel = useMemo(() => {
        const phrase =
            totalFlights > 1
                ? SitecoreDictionary.AlternativeFlightsLabelsTotalFlightsPlural
                : SitecoreDictionary.AlternativeFlightsLabelsTotalFlightsSingular;

        const count = getFormattedNumber(totalFlights);

        return Tokenizer.replaceToken(getPhrase(phrase), Tokens.Number, count);
    }, [totalFlights]);

    return (
        <div className={classNames(styles.container, 'amend-flights__alt-flights')} data-tid='alternative-flights'>
            {!!title && <h3 className='amend-flights__title'>{title}</h3>}

            <AmendFlightsFilters isShowPrefilteredMessage={isShowPrefilteredMessage} />

            {!!totalFlights && (
                <div className='alternative-flights__total' data-tid='alternative-flights-total'>
                    {countOfFlightsLabel}
                </div>
            )}

            {isFromBooking && <Placeholder name={PlaceholderNames.ChangeFeeInfo} rendering={rendering} />}

            {isLoadingStatus(status) && (
                <div className='loading-shimmers mt-0' data-tid='shimmer'>
                    <FlightShimmer />
                    <FlightShimmer />
                </div>
            )}

            {isShowFlights && (
                <div className='amend-flights__alt-flights-results'>
                    {alternativeFlights.map(flight => {
                        const key = `${flight.routes[0].id}-${flight.routes[1].id}`;

                        return (
                            <AmendFlightCard
                                key={key}
                                routes={flight.routes}
                                priceDifference={flight.amendmentCharges}
                                isSelected={isFlightSelected(flight)}
                                errataFlightInfo={flight.errataMessages}
                                onClickSelect={() => onChangeFlight(flight)}
                                notAvailable={flight.notAvailable}
                                priceTooltipText={priceTooltipText}
                                currency={currency}
                            />
                        );
                    })}

                    {flights.length < totalFlights && (
                        <div className='show-more py-0'>
                            <Button
                                onClick={() => !isLoadingMoreStatus(status) && onLoadMoreClick()}
                                isText
                                isLoading={isLoadingMoreStatus(status)}
                                dataTid='show-more'
                            >
                                {getPhrase(SitecoreDictionary.AmendFlightsButtonsShowMoreFlights)}
                                <SvgChevronDown />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {isShowFlights && flights.length === 0 && (
                <div className={styles['no-flights']} data-tid='amend-flights-no-flights'>
                    <Text
                        tag='h3'
                        className={styles['no-flights__title']}
                        field={{ value: noFlightsTitle }}
                        data-tid='amend-flights-no-flights-title'
                    />
                    {fields?.NoFlightsAvailableText?.value && (
                        <div className='d-flex align-items-center'>
                            <span
                                className={classNames('me-2', styles['no-flights__icon'])}
                                data-tid='amend-flights-no-flights-icon'
                            >
                                <IconInfoCircle />
                            </span>
                            <Text
                                tag='p'
                                className={styles['no-flights__text']}
                                field={fields?.NoFlightsAvailableText}
                                data-tid='amend-flights-no-flights-text'
                            />
                        </div>
                    )}
                </div>
            )}

            {isErrorStatus(status) && (
                <ErrorMessage
                    message={getPhrase(SitecoreDictionary.AmendFlightsErrorsGenericMessage)}
                    icon={<SvgWarningFilled />}
                    errorMessageClass='row'
                />
            )}
        </div>
    );
};

export default observer(AmendAlternativeFlights);
