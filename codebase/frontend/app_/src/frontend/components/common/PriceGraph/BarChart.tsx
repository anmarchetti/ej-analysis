import React from 'react';
import { Bar } from 'react-chartjs-2';
import { ActiveElement, BarElement, CategoryScale, Chart as ChartJS, ChartEvent, LinearScale } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IPriceGraphBarConfig } from 'models/data/IPriceGraphBarConfig';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';

import useChartConfig from './hooks/useChartConfig';
import useChartIconLoad from './hooks/useChartIconLoad';
import { drawBottomBorder } from './Plugins/BorderBottom';
import holidayDurationPlugin from './Plugins/HolidayDuration';
import PriceGraphSettings from './constants';
import { getBackgroundColor, getLabelColor } from './priceGraphUtils';

ChartJS.register(BarElement, CategoryScale, LinearScale);

interface IBarChartProps {
    barChartRef: React.RefObject<ChartJS<'bar', IPriceGraphBarConfig[]>>;
    changeActiveDate: (idx: number) => void;
    data: IPriceGraphBarConfig[];
    getPriceTick: (price: number) => string;
    holidayDuration: number;
}

const BarChart = ({ barChartRef, data, holidayDuration, changeActiveDate, getPriceTick }: IBarChartProps) => {
    const { isMobileView, isScreenExtraLarge, getPhrase } = useStore(stores => ({
        isMobileView: stores.priceGraphStore.isMobileView,
        isScreenExtraLarge: stores.appStore.isScreenExtraLarge,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const departureIcon = useChartIconLoad(SiteSettings.PriceGraphDepartureIcon);
    const arrivalIcon = useChartIconLoad(SiteSettings.PriceGraphArrivalIcon);
    const noFlightIcon = useChartIconLoad(SiteSettings.PriceGraphNoFlightIcon);

    const { dataSet, min, stepSize } = useChartConfig(data);

    const onBarClick = (_e: ChartEvent, elements: ActiveElement[]) => {
        if (elements.length) {
            const index = elements[0].index;
            changeActiveDate(index);

            // Use timeout to reset active element and hover styles.
            setTimeout(() => barChartRef.current?.setActiveElements([]));
        }
    };

    return (
        <Bar
            ref={barChartRef}
            options={{
                events: ['click', 'mousemove', 'mouseout'],
                onClick: onBarClick,
                layout: {
                    padding: {
                        top: 30,
                        bottom: 30,
                        right: isMobileView ? 0 : 40,
                        left: isMobileView ? -90 : 20,
                    },
                },
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: { display: false },
                    tooltip: { enabled: false },
                    datalabels: {
                        anchor: 'start',
                        align: 'top',
                        clamp: true,
                        textAlign: 'center',
                        color: getLabelColor,
                        font: {
                            size: isScreenExtraLarge ? 14 : 11,
                            family: PriceGraphSettings.fontFamily,
                        },
                        labels: {
                            weekDay: {
                                formatter: v => `${formatDateL10n(v.date, DATE_FORMATS.DayOfWeekAbbr)}\n`,
                                font: { weight: 'normal' },
                            },
                            date: {
                                formatter: v => formatDateL10n(v.date, 'MMM D'),
                                font: { weight: 'bold' },
                            },
                        },
                    },
                    holidayDuration: {
                        holidayDuration: holidayDuration,
                        icons: {
                            departure: departureIcon,
                            arrival: arrivalIcon,
                            noFlight: noFlightIcon,
                        },
                        labels: {
                            currentPrice: getPhrase(SitecoreDictionary.PriceGraphLabelsCurrentPrice),
                        },
                        getPriceTick: getPriceTick,
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { display: true },
                    },
                    y: {
                        beginAtZero: false,
                        min: min,
                        stacked: true,
                        border: { display: false },
                        grid: { color: PriceGraphSettings.colors.grid },
                        offset: false,
                        ticks: {
                            display: !isMobileView,
                            autoSkip: false,
                            stepSize: stepSize,
                            callback: getPriceTick,
                            color: PriceGraphSettings.colors.tickLabel,
                            font: {
                                family: PriceGraphSettings.fontFamily,
                                size: 12,
                            },
                            padding: 5,
                        },
                    },
                },
            }}
            data={{
                labels: new Array(data.length).fill(''),
                datasets: [
                    {
                        categoryPercentage: 1,
                        barPercentage: 0.9,
                        minBarLength: 0,
                        label: 'Dates',
                        backgroundColor: getBackgroundColor,
                        borderColor: PriceGraphSettings.colors.orange,
                        borderWidth: 2,
                        borderRadius: 4,
                        hoverBackgroundColor: PriceGraphSettings.colors.darkOrange,
                        hoverBorderColor: PriceGraphSettings.colors.darkOrange,
                        data: dataSet,
                        parsing: { xAxisKey: 'y' },
                        barThickness: 'flex',
                    },
                ],
            }}
            plugins={[holidayDurationPlugin, ChartDataLabels, drawBottomBorder]}
        />
    );
};

export default observer(BarChart);
