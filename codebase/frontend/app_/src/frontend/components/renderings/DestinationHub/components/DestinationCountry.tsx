import React, { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

import { purifyUrl } from 'frontend/utils/url.utils';
import { IAlphabeticAnchor } from 'frontend/components/common/AlphabetIndex';
import Link from 'frontend/components/common/Link';
import { IDestinationListCountry } from 'frontend/components/renderings/DestinationHub/DestinationsList';

export interface IDestinationCountryProps {
    anchors: IAlphabeticAnchor[];
    country: IDestinationListCountry;
    isScrollDown: React.MutableRefObject<boolean | undefined>;
    onSetLetter: (letter: IAlphabeticAnchor | null) => void;
    icon?: string;
    nextCountry?: IDestinationListCountry;
}

export const getCountryAnchorId = (country: IDestinationListCountry) => `destination-${country.Code}`;

const DestinationCountry = (props: IDestinationCountryProps) => {
    const passedRender = useRef(false);
    const { ref, inView } = useInView({
        rootMargin: '-40px 0px 0px 0px',
    });

    useEffect(() => {
        setTimeout(() => {
            passedRender.current = true;
        });
    }, []);

    useEffect(() => {
        if (inView) {
            onShow();
        } else {
            onHide();
        }
    }, []);

    const onHide = () => {
        if (!passedRender.current || !props.isScrollDown.current) {
            return;
        }

        if (!props.nextCountry) {
            props.onSetLetter(null);

            return;
        }

        const countryLetter = props.country.Name?.[0].toUpperCase();
        const nextCountryLetter = props.nextCountry.Name?.[0].toUpperCase();

        if (nextCountryLetter === countryLetter) {
            return;
        }

        const nextAnchor = props.anchors.find(a => a.letter === nextCountryLetter);

        if (!nextAnchor) {
            return;
        }

        props.onSetLetter(nextAnchor);
    };

    const onShow = () => {
        if (!passedRender.current || props.isScrollDown?.current === undefined || props.isScrollDown.current) {
            return;
        }

        const countryLetter = props.country.Name?.[0].toUpperCase();
        const nextCountryLetter = props.nextCountry?.Name?.[0].toUpperCase();

        if (nextCountryLetter === countryLetter) {
            return;
        }

        const anchor = props.anchors.find(a => a.letter === countryLetter);

        if (!anchor) {
            return;
        }

        props.onSetLetter(anchor);
    };

    const isRegionsLessTwo = props.country.Regions.length <= 2;

    return (
        <div id={getCountryAnchorId(props.country)} className='destinations-list-item'>
            <div ref={ref}>
                <div className='destinations-list-item__title'>
                    {props.icon && <img src={props.icon} alt='' />}
                    <Link href={purifyUrl(props.country.Url)} legacyBehavior>
                        <a>{props.country.Name}</a>
                    </Link>
                </div>

                <ul
                    className={
                        isRegionsLessTwo
                            ? 'destinations-list-item__children-flex-grid'
                            : 'destinations-list-item__children'
                    }
                    data-tid='destinations-region-list'
                >
                    {props.country.Regions.map(r => (
                        <li className='destinations-list-item__child' key={r.Id}>
                            <Link href={purifyUrl(r.Url)} legacyBehavior>
                                <a>{r.Name}</a>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DestinationCountry;
