import { RefObject, useEffect, useState } from 'react';

interface IUseResizeOutcome {
    height: number;
    width: number;
}

const useResize = (component?: RefObject<HTMLDivElement> | null): IUseResizeOutcome => {
    const [size, setSize] = useState<IUseResizeOutcome>({ width: 0, height: 0 });
    useEffect(() => {
        const getSize = () => {
            setSize({
                width: component?.current ? component.current.offsetWidth : window.innerWidth,
                height: component?.current ? component.current.offsetHeight : window.innerHeight,
            });
        };
        getSize();
        window.addEventListener('resize', getSize);

        return () => window.removeEventListener('resize', getSize);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return size;
};

export default useResize;
