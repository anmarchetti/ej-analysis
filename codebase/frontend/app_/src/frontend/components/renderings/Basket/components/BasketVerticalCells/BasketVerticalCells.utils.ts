// should be refactored with basket component
// =============
export const setContainerHeight = (): void => {
    // temporary A/B testing solution:
    //
    // both versions exist in DOM,
    // so we select the one currently visible
    // (not el.offsetParent: null) to the user
    //
    // should be removed after A/B test is finished
    const wr = Array.from(document.querySelectorAll('#basket-container')).find(
        (el: HTMLDivElement) => el.offsetParent !== null,
    ) as HTMLDivElement | undefined;

    if (wr) {
        wr.style.setProperty('--basket-summary-box-height', `${wr.offsetHeight}px`);
    }
};

export const resetScrollbarPosition = (): void => {
    // reset scrollbar position after collapsing the summary details
    const el = document.getElementById('scrollable-wrapper');
    el?.scroll(0, 0);
};
// =============
