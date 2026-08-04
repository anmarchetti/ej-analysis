import { FC, Fragment } from 'react';

import { NEGATIVE_INDEX, TWO } from 'code/commonNumbers';

export interface IHighlightedTextProps {
    filterValue: string;
    text: string;
}

export const HighlightedText: FC<IHighlightedTextProps> = ({ filterValue, text }) => {
    const lowerName: string = text.toLocaleLowerCase();
    const prettifiedFilter = filterValue.toLocaleLowerCase().trim();

    const highlightMatch = (str: string, match: string): JSX.Element => {
        const index = str.toLowerCase().indexOf(match);

        if (index === NEGATIVE_INDEX) {
            return <>{str}</>;
        }

        const end = index + match.length;

        return (
            <>
                {str.substring(0, index)}
                <b>{str.substring(index, end)}</b>
                {str.substring(end)}
            </>
        );
    };

    if (lowerName.includes(prettifiedFilter)) {
        return highlightMatch(text, prettifiedFilter);
    }

    const filterParts = prettifiedFilter.split(' ').sort((a, b) => b.length - a.length);
    const isFilterComplex = filterParts.length < TWO;

    if (isFilterComplex) {
        return <>{text}</>;
    }

    return (
        <>
            {text.split(' ').map((word, index) => {
                const match = filterParts.find(part => word.toLowerCase().includes(part));

                return <Fragment key={word + index}>{match ? highlightMatch(word, match) : word} </Fragment>;
            })}
        </>
    );
};
