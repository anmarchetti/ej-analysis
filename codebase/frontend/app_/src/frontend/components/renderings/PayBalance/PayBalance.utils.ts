export const scrollToPayBlock = (): void => {
    const targetElement = document.querySelector('[data-tid="total-price-description"]');
    targetElement?.scrollIntoView({ behavior: 'smooth' });
};
