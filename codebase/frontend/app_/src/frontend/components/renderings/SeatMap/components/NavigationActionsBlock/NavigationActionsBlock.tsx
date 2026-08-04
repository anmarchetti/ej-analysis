import { FC } from 'react';
import classNames from 'classnames';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ISelectedSeat } from 'models/data/ISeatMapStore';
import { ISeatMapWidgetValue } from 'models/data/ISeatMapWidgetValue';
import { NavigationActionMode } from 'models/enum/NavigationActionMode';
import { SeatMapFlightDirection } from 'models/enum/SeatMapFlightDirection';
import Button from 'frontend/components/common/Button';
import { ISeatMapFields } from 'frontend/components/renderings/SeatMap/components/ISeatMapFields';

import styles from './NavigationActionsBlock.module.scss';

export interface INavigationActionsBlockProps {
    fields: ISeatMapFields;
    onSelectSeats: (widgetData: ISelectedSeat[]) => Promise<void>;
    totalPassengers: number;
    widgetOutputData: ISeatMapWidgetValue;
}

const NavigationActionsBlock: FC<INavigationActionsBlockProps> = ({
    fields,
    totalPassengers,
    widgetOutputData,
    onSelectSeats,
}) => {
    const { isPricesHidden, isScreenLarge } = useStore((stores: TStores) => ({
        isPricesHidden: isTradeStore(stores) && stores.layoutStore.isExtrasPage && stores.layoutStore.isPricesHidden,
        isScreenLarge: stores.appStore.isScreenLarge,
    }));

    if (!fields) {
        return null;
    }

    const directionsOutbound = fields.OutboundFlightDirectionName?.value;
    const directionsReturn = fields.InboundFlightDirectionName?.value;
    const selectionActionText = fields.SelectionActionText?.value;
    const fullSelectionActionText = fields.FullSelectionActionText?.value;

    const {
        selectedSeatLength,
        isSelectionEmpty: isOutlined,
        isSelectionIncorrect: isDisabled,
        isSelectionImpossible,
        actionMode,
        formattedTotalPrice,
        direction,
    } = widgetOutputData;
    const isDirectionOutbound = direction === SeatMapFlightDirection.Outbound;

    const handleSwitchTab = async (): Promise<void> => {
        const isPartial = (length: Nullable<number>): boolean => !!length && length < totalPassengers;
        const widgetData: Nullable<ISelectedSeat[]> = await window.SeatsMapWidget.complete();

        window.SeatsMapWidget.switchTab();

        if (!widgetData || isDirectionOutbound) {
            return;
        }

        const [outData, inData] = widgetData;

        onSelectSeats([
            {
                ...outData,
                seats: !isPartial(outData?.seats?.length) ? outData.seats : [],
            },
            {
                ...inData,
                seats: !isPartial(inData?.seats?.length) ? inData.seats : [],
            },
        ]);
    };

    const getActionBtnText = (mode: NavigationActionMode): string => {
        const flightDirectionLabel = isDirectionOutbound
            ? fields.OutboundFlightDirectionName?.value
            : fields.InboundFlightDirectionName?.value;
        const sitecoreValues = {
            [NavigationActionMode.ContinueToReturn]: fields.ContinueToReturnBtnText?.value,
            [NavigationActionMode.ConfirmSeats]: fields.ConfirmSeatsBtnText?.value,
            [NavigationActionMode.EmptySelection]: Tokenizer.replaceTokens(fields.EmptySelectionBtnText?.value, {
                [Tokens.FlightDirection]: flightDirectionLabel,
            }),
        };

        return sitecoreValues[mode];
    };

    const getActionText = (selectedSeatLength: number): string => {
        const flightDirection = isDirectionOutbound
            ? directionsOutbound?.toLowerCase()
            : directionsReturn?.toLowerCase();

        if (selectedSeatLength === totalPassengers) {
            return Tokenizer.replaceTokens(fullSelectionActionText, {
                [Tokens.FlightDirection]: flightDirection || '',
            });
        }

        return Tokenizer.replaceTokens(selectionActionText, {
            [Tokens.SelectedSeatsCount]: selectedSeatLength.toString() || '',
            [Tokens.SeatsCount]: totalPassengers.toString() ?? '',
            [Tokens.FlightDirection]: flightDirection || '',
        });
    };

    return (
        <div className={styles.navigationActions} data-tid='navigation-actions-block'>
            {isScreenLarge && (
                <span>
                    {getActionText(selectedSeatLength)}
                    {!isPricesHidden && <b data-tid='seat-map-navigation-price'> {formattedTotalPrice}</b>}
                </span>
            )}
            <Button
                onClick={handleSwitchTab}
                className={classNames(styles.button, !isScreenLarge && styles.buttonMobile)}
                isOutlined={isOutlined}
                hasDisabledStyles={isDisabled}
                disabled={isSelectionImpossible}
                dataTid='navigation-actions-block-button'
            >
                <span>{getActionBtnText(actionMode)}</span>
            </Button>
        </div>
    );
};

export default NavigationActionsBlock;
