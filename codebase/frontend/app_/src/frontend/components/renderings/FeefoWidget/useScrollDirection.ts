import * as React from 'react';

const THRESHOLD = 0;

export enum ScrollDirectionLabels {
    Up = 'up',
    Down = 'down',
}

const useScrollDirection = (trackScrolling: boolean = false) => {
    const [scrollDirection, setScrollDirection] = React.useState({ prevDirection: '', scrollDirection: '' });

    const blocking = React.useRef(false);
    const prevScrollY = React.useRef(0);

    React.useEffect(() => {
        if (!trackScrolling) {
            return;
        }

        prevScrollY.current = window.pageYOffset;

        const updateScrollDirection = () => {
            const scrollY = window.pageYOffset;

            if (Math.abs(scrollY - prevScrollY.current) >= THRESHOLD) {
                const newScrollDirection =
                    scrollY > prevScrollY.current ? ScrollDirectionLabels.Down : ScrollDirectionLabels.Up;

                setScrollDirection(prevState => ({
                    prevDirection:
                        prevState.scrollDirection !== prevState.prevDirection
                            ? newScrollDirection
                            : prevState.prevDirection,
                    scrollDirection: newScrollDirection,
                }));

                prevScrollY.current = scrollY > 0 ? scrollY : 0;
            }

            blocking.current = false;
        };

        const onScroll = () => {
            if (!blocking.current) {
                blocking.current = true;
                window.requestAnimationFrame(updateScrollDirection);
            }
        };

        window.addEventListener('scroll', onScroll);

        return () => window.removeEventListener('scroll', onScroll);
    }, [trackScrolling]);

    return scrollDirection;
};

export { useScrollDirection };
