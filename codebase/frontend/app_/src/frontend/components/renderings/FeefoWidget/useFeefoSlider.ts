import { useEffect, useState } from 'react';

import { ScrollDirectionLabels, useScrollDirection } from './useScrollDirection';

export const useFeefoSlider = (hostRef, showAnimation) => {
    const { scrollDirection } = useScrollDirection(true);

    const [shadowDom, setShadowDom] = useState<ShadowRoot | undefined | null>();

    const [scrollTop, setScrollTop] = useState(0);

    // Get Shadow Root and inject Styles
    useEffect(() => {
        const shadowDom = hostRef.current?.shadowRoot;
        const shadowStyle = document?.createElement('style');

        shadowStyle.textContent =
            '.slideout-reviews-button-container{transition: all .25s ease-in-out  !important;}.slideout-reviews-button-container.right-alignment.feefo__animate {right: 0 !important;} .slideout-reviews-button-container.right-alignment {right: -92px !important} .slideout-reviews-button-container button { box-shadow: none  !important; transition: all .25s ease-in-out  !important;}  .slideout-reviews-button-container.feefo__animate button {box-shadow: 0 0 20px 0 rgba(0, 0, 0, .3)  !important;}';
        shadowDom?.appendChild(shadowStyle);

        setShadowDom(shadowDom);
    }, [hostRef, hostRef.current?.shadowRoot]);

    // Add Scroll Features
    useEffect(() => {
        const button = shadowDom?.querySelector('.slideout-reviews-button-container');

        const onScroll = e => {
            setScrollTop(e.target.documentElement.scrollTop);
        };

        if (showAnimation) {
            scrollTop < 100 || scrollDirection === ScrollDirectionLabels.Up
                ? button?.classList.add('feefo__animate')
                : button?.classList.remove('feefo__animate');
        }

        window.addEventListener('scroll', onScroll);

        return () => window.removeEventListener('scroll', onScroll);
    }, [scrollTop, scrollDirection, shadowDom, showAnimation]);
};
