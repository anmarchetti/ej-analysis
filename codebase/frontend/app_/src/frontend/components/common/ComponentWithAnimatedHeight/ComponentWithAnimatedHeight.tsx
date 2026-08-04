import { FC, useEffect, useRef, useState } from 'react';

interface IComponentWithAnimatedHeightProps {
    children?: React.ReactNode;
}

const ComponentWithAnimatedHeight: FC<IComponentWithAnimatedHeightProps> = ({ children }) => {
    const listElement = useRef<HTMLDivElement>(null);
    const [listHeight, setListHeight] = useState<number | string>('auto');

    useEffect(() => {
        setListHeight(listElement.current?.clientHeight ?? 'auto');
    }, [children]);

    return (
        <div
            style={{
                height: listHeight,
                overflow: 'hidden',
                transition: 'height 0.3s linear 0s',
            }}
            data-tid='animated-height-wrapper'
        >
            <div ref={listElement}>{children}</div>
        </div>
    );
};

export default ComponentWithAnimatedHeight;
