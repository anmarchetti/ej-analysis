import { FC } from 'react';

import Button from 'frontend/components/common/Button';

interface ISubmitButtonProps {
    onClick: () => void;
    text: string;
}

export const SubmitButton: FC<ISubmitButtonProps> = ({ onClick, text }: ISubmitButtonProps) => (
    <Button isFullWidth onClick={onClick} dataTid='continue-button' isLarge className='holiday-summary__btn no-print'>
        {text}
    </Button>
);
