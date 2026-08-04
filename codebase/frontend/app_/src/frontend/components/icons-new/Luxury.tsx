import { FC, SVGProps } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

const SvgLuxury: FC<SVGProps<SVGSVGElement>> = props => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <svg
            data-tid='svg-luxury'
            viewBox='1 1 22 22'
            width='1em'
            height='1em'
            focusable='false'
            className={classNames('icon-svg', props.className)}
            aria-label={getPhrase(SitecoreDictionary.LuxuryLabelsLuxuryIconAriaLabel)}
        >
            <path d='M21.88 8.49l-3.3-6a.93.93 0 00-.83-.5H6.25a1 1 0 00-.84.5l-3.29 6a1 1 0 00.08 1.06l9 12.07a1 1 0 00.8.38 1 1 0 00.76-.38l9-12.07a1 1 0 00.12-1.06zM17.13 4l2.21 4h-3.45l-1.2-4zm-9 6l2.37 7.26L5.05 10zm2.1 0h3.56L12 15.46zm5.66 0H19l-5.44 7.25zm-3.28-6l1.19 4h-3.61l1.19-4zM6.87 4h2.42L8.11 8H4.66z' />
        </svg>
    );
};
export default SvgLuxury;
