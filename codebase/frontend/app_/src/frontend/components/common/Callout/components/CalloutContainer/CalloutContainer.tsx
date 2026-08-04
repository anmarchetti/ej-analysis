import React, { createRef, useEffect, useState } from 'react';
import classNames from 'classnames';

export interface ICalloutContainerProps {
    containerClass: string;
    containerRef: React.RefObject<HTMLDivElement>;
    calculateWidth?: boolean;
    children?: any;
    isCloseWhenClickOnContent?: boolean;
    onClose?: () => void;
}

export const CalloutContainer = (props: ICalloutContainerProps) => {
    const ref = createRef<HTMLDivElement>();
    const [width, setWidth] = useState(0);

    const onDocumentClick = (event: MouseEvent) => {
        const calloutElement = props.containerRef?.current;

        if ((calloutElement && !calloutElement.contains(event.target as Node)) || props.isCloseWhenClickOnContent) {
            props.onClose?.();
        }
    };

    useEffect(() => {
        document.addEventListener('click', onDocumentClick);
        props.calculateWidth && setWidth(ref.current?.clientWidth ?? 0);

        return () => document.removeEventListener('click', onDocumentClick);
    }, []);

    return (
        <div
            ref={ref}
            className={classNames(
                props.containerClass,
                !width && props.calculateWidth && 'hidden',
                props.calculateWidth && 'centered-by-content',
            )}
            style={props.calculateWidth ? { left: `calc(20% - ${width / 2}px)` } : undefined}
        >
            {props.children}
        </div>
    );
};
