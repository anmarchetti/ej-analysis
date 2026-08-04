import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import IconPlane from 'frontend/components/icons/Plane';

import FlipCardLine from './FlipCardLine';

export type TFlipSymbol = string | JSX.Element;

interface INotFoundFlipTextProps {
    text: string;
}

const MAX_SYMBOLS_IN_LINE = {
    desktop: 18,
    tablet: 10,
    mobile: 7,
};

export const NotFoundFlipText = ({ text }: INotFoundFlipTextProps) => {
    const { isScreenExtraSmall, isScreenLarge } = useStore((stores: TStores) => ({
        isScreenExtraSmall: stores.appStore.isScreenExtraSmall,
        isScreenLarge: stores.appStore.isScreenLarge,
    }));

    const [words] = useState<TFlipSymbol[][]>(() => {
        if (!text) return [];

        const words: TFlipSymbol[][] = text.split(' ').map(w => w.split(''));

        // Add 2 symbols to last word (one symbol will be ellipsis, other - icon);
        words[words.length - 1].push('...');
        words[words.length - 1].push(<IconPlane />);

        return words;
    });
    const longestWordLength: number = Math.max(...words.map(w => w.length));

    const [lines, setLines] = useState<TFlipSymbol[][]>([]);

    const getLineLength = (): number => {
        const maxOnScreen = isScreenLarge
            ? MAX_SYMBOLS_IN_LINE.desktop
            : isScreenExtraSmall
            ? MAX_SYMBOLS_IN_LINE.mobile
            : MAX_SYMBOLS_IN_LINE.tablet;

        return Math.max(longestWordLength, maxOnScreen);
    };

    const initializeLines = (): void => {
        if (!words?.length) return;

        const lineLength = getLineLength();
        const lines: TFlipSymbol[][] = [];
        let currentLine: TFlipSymbol[] = [];

        const addLine = (line: TFlipSymbol[]): void => {
            // Fill the line with empty symbols to make line length equals to other lines length
            while (line.length < lineLength) {
                line.push('');
            }
            lines.push(line);
        };

        words.forEach(word => {
            const separator = currentLine.length ? ' ' : '';

            if (currentLine.length + separator.length + word.length > lineLength) {
                addLine(currentLine);
                currentLine = [];
            } else if (separator.length) {
                currentLine.push(separator);
            }

            currentLine.push(...word);
        });

        addLine(currentLine);

        setLines(lines);
    };

    useEffect(() => {
        initializeLines();
    }, [words, isScreenExtraSmall, isScreenLarge]);

    return (
        <>
            <h1 className='visually-hidden'>{text}</h1>
            <div className='not-found__flip-text flip-animation' aria-hidden='true'>
                {lines.map((line, i) => (
                    <FlipCardLine symbols={line} key={i} />
                ))}
            </div>
        </>
    );
};

export default observer(NotFoundFlipText);
