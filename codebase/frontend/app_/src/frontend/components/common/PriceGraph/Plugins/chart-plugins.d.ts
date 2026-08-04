import { ChartType, Plugin } from 'chart.js';

declare module 'chart.js' {
    interface IHolidayDurationPluginOptions {
        holidayDuration: number;
        icons: {
            arrival: HTMLImageElement | null;
            departure: HTMLImageElement | null;
            noFlight: HTMLImageElement | null;
        };
        labels: {
            currentPrice: string;
        };
        getPriceTick: (price: number) => string;
    }

    interface PluginOptionsByType<TType extends ChartType> {
        holidayDuration?: IHolidayDurationPluginOptions;
    }
}

declare const HolidayDurationPlugin: Plugin<ChartType, IHolidayDurationPluginOptions>;

export default HolidayDurationPlugin;
