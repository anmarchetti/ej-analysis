import { FunctionComponent } from 'react';

import { cmsUrls } from 'code/endpoints';
import { ITransfer } from 'models/data/ITransfer';
import ImageWithFilter, { SVGFilterMatrix } from 'frontend/components/common/ImageWithFilter/ImageWithFilter';

interface ITransferDetailsProps {
    transfer: ITransfer;
    className?: string;
    dataTid?: string;
}

const TransferDetails: FunctionComponent<ITransferDetailsProps> = ({
    dataTid = 'transfer-details',
    className,
    transfer,
}) => {
    const transferIconUrl = transfer.iconUrl;

    return (
        <div className={className} data-tid={dataTid}>
            {transferIconUrl && (
                <ImageWithFilter
                    imageSrc={cmsUrls.media(transferIconUrl)}
                    filterMatrix={SVGFilterMatrix.Grayscale}
                    dataTid={`${dataTid}-icon`}
                />
            )}
            <span data-tid={`${dataTid}-title`}>{transfer.name}</span>
        </div>
    );
};

export default TransferDetails;
