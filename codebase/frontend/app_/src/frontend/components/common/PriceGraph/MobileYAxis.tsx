import React from 'react';
import { Bar } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale } from 'chart.js';

import { IPriceGraphBarConfig } from 'models/data/IPriceGraphBarConfig';

import useChartConfig from './hooks/useChartConfig';
import PriceGraphSettings from './constants';

ChartJS.register(BarElement, CategoryScale, LinearScale);

interface IMobileYAxisProps {
    data: IPriceGraphBarConfig[];
    getPriceTick: (tick: number) => string;
}

const MobileYAxis: React.FC<IMobileYAxisProps> = ({ data, getPriceTick }) => {
    const { min, stepSize } = useChartConfig(data);

    return (
        <div className='y-axis-mobile'>
            <Bar
                options={{
                    layout: {
                        padding: {
                            top: 30,
                            bottom: 60,
                            right: 0,
                            left: 0,
                        },
                    },
                    maintainAspectRatio: false,
                    responsive: true,
                    scales: {
                        x: { display: false },
                        y: {
                            beginAtZero: false,
                            min: min,
                            stacked: true,
                            border: { display: false },
                            grid: { display: false },
                            offset: false,
                            ticks: {
                                autoSkip: false,
                                stepSize: stepSize,
                                callback: getPriceTick,
                                color: PriceGraphSettings.colors.tickLabel,
                                font: {
                                    family: PriceGraphSettings.fontFamily,
                                    size: 12,
                                },
                            },
                        },
                    },
                }}
                data={{
                    labels: [],
                    datasets: [
                        {
                            minBarLength: 0,
                            label: 'Dates',
                            data: data,
                        },
                    ],
                }}
            />
        </div>
    );
};

export default MobileYAxis;
