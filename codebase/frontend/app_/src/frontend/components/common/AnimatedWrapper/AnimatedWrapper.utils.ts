import { useEffect, useState } from 'react';

interface IUseAnimatedWrapperProps {
    isShown: boolean;
    disableAnimation?: boolean;
    onEnd?: () => void;
}

interface IUseAnimatedWrapperData {
    onAnimationEnd: () => void;
    render: boolean;
}

export const useAnimatedWrapper = ({
    isShown,
    disableAnimation = false,
    onEnd,
}: IUseAnimatedWrapperProps): IUseAnimatedWrapperData => {
    const [render, setRender] = useState(isShown);

    useEffect(() => {
        // Show the element when isShown becomes true
        if (isShown) {
            setRender(true);

            return;
        }

        // When animation is disabled and element should be hidden,
        // immediately remove from DOM instead of waiting for animation end
        if (disableAnimation) {
            setRender(false);
            onEnd?.();
        }
    }, [isShown, disableAnimation, onEnd]);

    return {
        render,
        onAnimationEnd: () => {
            if (!isShown && !disableAnimation) {
                setRender(false);
                onEnd?.();
            }
        },
    };
};

export default useAnimatedWrapper;
