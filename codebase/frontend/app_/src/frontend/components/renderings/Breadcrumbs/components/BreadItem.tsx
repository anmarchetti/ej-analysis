import { FC } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import Link from 'frontend/components/common/Link';
import FphTick from 'frontend/components/icons-new/FphTick';
import SVGTick from 'frontend/components/icons-new/Tick';

interface IBreadItemProps {
    href: string;
    isActive: boolean;
    isPrev: boolean;
    number: number;
    onClick: () => void;
    title: string;
    isFlightPlusHotelFunnel?: boolean;
    onPopupAction?: () => void;
}

const BreadItem: FC<IBreadItemProps> = props => {
    const { basePath } = useStore((stores: TStores) => ({
        basePath: stores.layoutStore.basePath,
    }));

    const { isActive, isPrev, title, number, href, isFlightPlusHotelFunnel, onPopupAction } = props;
    const className = classNames('bread-item', isActive && 'active', isPrev && 'bread-item--ready');

    const content = (
        <>
            {isPrev && <div>{isFlightPlusHotelFunnel ? <FphTick /> : <SVGTick />}</div>}

            {(isActive || !isPrev) && <div>{number}</div>}

            <span className='bread-item__title'>{title}</span>
        </>
    );

    if (isPrev && onPopupAction) {
        return (
            <button className={className} data-tid={`step-${number}`} onClick={onPopupAction}>
                {content}
            </button>
        );
    }

    if (isPrev && typeof NO_ANALYTICS !== 'undefined' && NO_ANALYTICS) {
        // EJH-17746: dataLayer should not be empty after returning to previous page
        const finalHref = href.startsWith('http') || href.startsWith(basePath) ? href : basePath + href;

        return (
            <a className={className} href={finalHref} data-tid={`step-${number}`} onClick={props.onClick}>
                {content}
            </a>
        );
    }

    return isPrev ? (
        <Link href={href} legacyBehavior>
            <a className={className} data-tid={`step-${number}`} onClick={props.onClick}>
                {content}
            </a>
        </Link>
    ) : (
        <div className={className} data-tid={`step-${number}`}>
            {content}
        </div>
    );
};

export default BreadItem;
