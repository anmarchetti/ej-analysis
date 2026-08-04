import { FC, SVGProps } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import useUniqueId from 'frontend/hooks/useUniqueId';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

const SvgLuxuryGradient: FC<SVGProps<SVGSVGElement>> = props => {
    const { getPhrase } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const gradientId = useUniqueId('luxury-gradient');

    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='20'
            height='21'
            viewBox='0 0 20 21'
            fill='none'
            focusable='false'
            data-tid='svg-luxury-gradient'
            className={classNames('icon-svg', props.className)}
            aria-label={getPhrase(SitecoreDictionary.LuxuryLabelsLuxuryIconAriaLabel)}
            aria-hidden='true'
        >
            <path
                d='M19.9004 6.58386L16.5962 0.586933C16.4349 0.278075 16.1141 0.0851775 15.7652 0.0871735H4.2507C3.90232 0.0963117 3.58377 0.285595 3.40964 0.586933L0.115498 6.58386C-0.0636188 6.9231 -0.0324967 7.33474 0.195599 7.64331L9.20693 19.7071C9.40015 19.9513 9.69626 20.0917 10.0079 20.087C10.3055 20.0795 10.5844 19.9404 10.7689 19.7071L19.7802 7.64331C20.0214 7.34275 20.0681 6.93063 19.9004 6.58386ZM15.1444 2.09616L17.3572 6.09411H13.9028L12.7013 2.09616H15.1444ZM6.13306 8.09308L8.50605 15.3494L3.04919 8.09308H6.13306ZM8.23571 8.09308H11.8002L10.0079 13.5503L8.23571 8.09308ZM13.9028 8.09308H17.0167L11.5699 15.3394L13.9028 8.09308ZM10.6187 2.09616L11.8102 6.09411H8.19565L9.38715 2.09616H10.6187ZM4.87148 2.09616H7.29452L6.11304 6.09411H2.65869L4.87148 2.09616Z'
                fill={`url(#${gradientId})`}
            />
            <defs>
                <linearGradient
                    id={gradientId}
                    x1='20'
                    y1='20.0872'
                    x2='0'
                    y2='0.0871582'
                    gradientUnits='userSpaceOnUse'
                >
                    <stop stopColor='#F2C173' />
                    <stop offset='1' stopColor='#FF6600' />
                </linearGradient>
            </defs>
        </svg>
    );
};
export default SvgLuxuryGradient;
