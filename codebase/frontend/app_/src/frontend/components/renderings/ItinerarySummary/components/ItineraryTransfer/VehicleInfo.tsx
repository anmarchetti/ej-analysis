import { FC } from 'react';

import { Tokens } from 'code/tokens';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IBookingTransfer } from 'models/data/ITransfer';
import { TransferType } from 'models/enum/transfer/TransferType';
import SvgBusLined from 'frontend/components/icons-new/BusLined';
import SvgTaxiLined from 'frontend/components/icons-new/TaxiLined';
import { IItineraryTransferFields } from 'frontend/components/renderings/ItinerarySummary/interfaces';

import TransferDescriptionItem from './TransferDescriptionItem';

import styles from './ItineraryTransfer.module.scss';

interface IVehicleInfoProps {
    fields: IItineraryTransferFields;
    transfer: IBookingTransfer;
}

const VehicleInfo: FC<IVehicleInfoProps> = ({ transfer, fields }) => {
    if (!transfer?.vehicle || Object.values(transfer.vehicle).every(value => !value)) {
        return null;
    }

    const isSharedTransfer = transfer.transferType === TransferType.Shared;

    const icon = isSharedTransfer ? (
        <SvgBusLined className={styles.smallerIcon} />
    ) : (
        <SvgTaxiLined className={styles.smallerIcon} />
    );

    const { vehicleDriverName, vehicleDriverPhone, vehicleRegistration, vehicleType, provider } = transfer.vehicle;

    const registrationSuffix = isSharedTransfer ? ` ${fields.SubjectToChangeText.value}` : '';
    const registrationText = `${vehicleRegistration}${registrationSuffix}`;

    return (
        <div className={styles.item}>
            {icon}
            <div className={styles.subItems}>
                {vehicleType && <TransferDescriptionItem name={fields.VehicleLabel.value} text={vehicleType} />}
                {provider && (
                    <TransferDescriptionItem
                        name={fields.VehicleLabel.value}
                        text={Tokenizer.replaceToken(
                            isSharedTransfer
                                ? fields.SharedStandardBusText.value
                                : fields.PrivateTransferProviderText.value,
                            Tokens.Provider,
                            provider,
                        )}
                    />
                )}
                {vehicleRegistration && (
                    <TransferDescriptionItem name={fields.VehicleRegistrationLabel.value} text={registrationText} />
                )}
                {vehicleDriverName && (
                    <TransferDescriptionItem name={fields.DriverNameLabel.value} text={vehicleDriverName} />
                )}
                {vehicleDriverPhone && (
                    <TransferDescriptionItem name={fields.DriverNumberLabel.value} text={vehicleDriverPhone} />
                )}
            </div>
        </div>
    );
};

export default VehicleInfo;
