const PriceGraphSettings = {
    fontFamily: '"easyjet_rounded_book",Arial,Helvetica,sans-serif',
    colors: {
        white: '#fff',
        grey: '#999',
        orange: '#f60',
        darkOrange: '#e63600',
        durationLabel: '#333',
        tickLabel: '#b2b2b2',
        grid: '#d7e2e5',
    },
    barWidth: {
        desktop: 60,
        mobile: 48,
    },
    barMargin: 7,
    barsPerSlide: {
        largeDesktop: 15,
        desktop: 13,
        tablet: 11,
    },
    durationDotRadius: 3,
    durationEndDotRadius: 4,
    iconSize: 20,
    priceAxis: {
        stepSize: 250,
        ticksCount: 10,
    },
};

export default PriceGraphSettings;
