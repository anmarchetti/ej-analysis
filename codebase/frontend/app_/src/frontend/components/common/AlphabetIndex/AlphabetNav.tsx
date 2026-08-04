import React from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { IAlphabeticAnchor } from './IAlphabeticAnchor';

export interface IAlphabetNavProps {
    activeAnchor: Nullable<IAlphabeticAnchor>;
    anchors: IAlphabeticAnchor[];
    onAnchorClick: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>, anchor: IAlphabeticAnchor) => void;
    className?: string;
}

const AlphabetNav = ({ anchors, activeAnchor, className, onAnchorClick }: IAlphabetNavProps) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <nav
            className={classNames('alphabet-nav', className)}
            aria-label={getPhrase(SitecoreDictionary.GlobalsLabelsAlphabeticalIndex)}
        >
            <ul className='alphabet-nav__list'>
                {anchors.map(a => (
                    <li key={a.letter}>
                        <a
                            href={`#${a.id}`}
                            className={classNames(
                                'alphabet-nav__letter',
                                activeAnchor?.id === a.id && 'alphabet-nav__letter--active',
                            )}
                            aria-current={activeAnchor?.id === a.id}
                            onClick={e => onAnchorClick(e, a)}
                        >
                            {a.letter}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default AlphabetNav;
