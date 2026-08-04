import React, { FC, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { scrollToElement } from 'frontend/utils/ui.utils';
import { DestinationType } from 'models/enum/DestinationType';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import {
    AlphabetNav,
    AlphabetStickySelector,
    buildAlphabeticAnchors,
    IAlphabeticAnchor,
} from 'frontend/components/common/AlphabetIndex';

import DestinationCountry, { getCountryAnchorId } from './components/DestinationCountry';

export interface IDestinationListItem {
    Code: string;
    Id: string;
    Name: string;
    Type: DestinationType;
    Url: string;
}

export interface IDestinationListCountry extends IDestinationListItem {
    Regions: IDestinationListItem[];
}

export interface IDestinationsListFields {
    items: IDestinationListCountry[];
}

interface IDestinationsListPropsParams {
    Icon: string;
}

export type TDestinationsListProps = ISitecoreComponent<IDestinationsListFields, IDestinationsListPropsParams>;

const DestinationsList: FC<TDestinationsListProps> = ({ fields, params }) => {
    const { isScreenLessMedium } = useStore(stores => ({
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
    }));
    const { ref, inView } = useInView({
        rootMargin: '-20px 0px 0px 0px',
    });

    const countries = (fields?.items || []).filter(c => !!c.Name);
    const icon = params?.Icon ? cmsUrls.media(params.Icon) : undefined;
    const anchors = buildAlphabeticAnchors(countries, 'Name', getCountryAnchorId);

    const ignoreScroll = useRef(false); // variable to indicate that we currently do no need to track scroll
    const isScrollDown = useRef<boolean | undefined>(false); // variable to check whether user scrolling down or up

    const [currentLetter, setCurrentLetter] = useState<IAlphabeticAnchor<IDestinationListCountry> | null>(anchors[0]);

    const [isLetterSelectorShown, setLetterSelector] = useState(false);

    const onHideAnchors = () => {
        setLetterSelector(true);
    };

    const onShowAnchors = () => {
        setLetterSelector(false);
    };

    const onScrollToLetter = (anchor: IAlphabeticAnchor) => {
        // ignore scroll check, so changing letter on scroll logic won't be triggered
        ignoreScroll.current = true;
        isScrollDown.current = undefined;

        setCurrentLetter(anchor);

        const element = document.getElementById(anchor.id);

        element && scrollToElement(element, 15 - (isScreenLessMedium ? -30 : 0));

        setTimeout(() => {
            ignoreScroll.current = false;
        }, 100);
    };

    useEffect(() => {
        let lastScrollTop = 0;

        const scrollListener = () => {
            const st = window.pageYOffset || document.documentElement.scrollTop;

            if (!ignoreScroll.current) {
                isScrollDown.current = st > lastScrollTop;
            }

            lastScrollTop = st <= 0 ? 0 : st; // For Mobile or negative scrolling
        };

        // listen to scroll event to save whether user scrolling up or down
        window.addEventListener('scroll', scrollListener, false);

        return () => {
            window.removeEventListener('scroll', scrollListener);
        };
    }, []);

    useEffect(() => {
        if (inView) {
            onShowAnchors();
        } else {
            onHideAnchors();
        }
    }, [inView]);

    return (
        <div className='destinations-list'>
            <div ref={ref}>
                <AlphabetNav
                    className='destinations-list__alphabet-nav'
                    anchors={anchors}
                    activeAnchor={currentLetter}
                    onAnchorClick={(event, anchor) => {
                        event.preventDefault();
                        setCurrentLetter(anchor);
                        onScrollToLetter(anchor);
                    }}
                />
            </div>
            {isLetterSelectorShown && currentLetter && (
                <div className='alphabet-sticky-letter d-md-none'>{currentLetter.letter}</div>
            )}
            <ul className='destinations-list__items'>
                {countries.map((country, i) => (
                    <li key={country.Id}>
                        <DestinationCountry
                            icon={icon}
                            country={country}
                            nextCountry={countries[i + 1]}
                            anchors={anchors}
                            onSetLetter={l => setCurrentLetter(l)}
                            isScrollDown={isScrollDown}
                        />
                    </li>
                ))}
            </ul>
            {isLetterSelectorShown && (
                <AlphabetStickySelector
                    className='d-md-none'
                    anchors={anchors}
                    activeAnchor={currentLetter}
                    onAnchorClick={(event, anchor) => {
                        event.preventDefault();
                        setCurrentLetter(anchor);
                        onScrollToLetter(anchor);
                    }}
                />
            )}
        </div>
    );
};

export default DestinationsList;
