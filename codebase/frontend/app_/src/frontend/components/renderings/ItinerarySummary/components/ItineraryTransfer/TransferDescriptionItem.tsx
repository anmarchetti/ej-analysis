import { FC } from 'react';

import RichTextDictionary from 'frontend/components/common/RichTextDictionary';

interface ITransferDescriptionItemProps {
    text: string;
    className?: string;
    icon?: Nullable<JSX.Element>;
    name?: string;
}

const TransferDescriptionItem: FC<ITransferDescriptionItemProps> = ({ name, text, icon, className }) => {
    if (!text) {
        return null;
    }

    return (
        <div className={className}>
            {icon}

            <span>
                <strong>{name}</strong> <RichTextDictionary content={text} />
            </span>
        </div>
    );
};

export default TransferDescriptionItem;
