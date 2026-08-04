import { AxiosResponse } from 'axios';
import { makeAutoObservable, runInAction } from 'mobx';

import { webApiUrls } from 'code/endpoints';
import { ValidationConfig } from 'code/validation.config';
import AxiosRequest from 'frontend/utils/request';
import { validate } from 'frontend/utils/validation.utils';
import { IGuestPassenger } from 'models/data/ILeadPassenger';
import { ApiErrors } from 'models/enum/ApiErrors';
import { PassengerType } from 'models/enum/PassengerType';

export class GuestToEdit {
    editedDetails: IGuestPassenger;
    isSelected: boolean = false;
    initialDetails: IGuestPassenger;
    passengerType: PassengerType;
    canChangeName: boolean = true;
    error: Nullable<
        Partial<{
            errorCode: ApiErrors;
            errorStatus: number;
        }>
    >;

    isCheckPending: boolean = false;

    //name or surname for fields before save click.
    @validate(ValidationConfig.firstName) tempName: string;
    @validate(ValidationConfig.lastName) tempSurname: string;

    constructor(passengerData: IGuestPassenger, public bookingReference: string, canChangeName?: boolean) {
        makeAutoObservable(this);
        this.init(passengerData, canChangeName);
    }

    init(passengerData: IGuestPassenger, canChangeName?: boolean): void {
        this.initialDetails = passengerData;
        this.editedDetails = { ...passengerData };
        this.canChangeName = canChangeName ?? true;
        this.tempName = passengerData.firstName;
        this.tempSurname = passengerData.lastName;
    }

    editName = (newName: string): void => {
        this.tempName = newName;
    };

    editSurname = (newSurname: string): void => {
        this.tempSurname = newSurname;
    };

    openCard = (): void => {
        this.isSelected = true;
    };

    closeCard = (): void => {
        this.isSelected = false;
        this.tempName = this.editedDetails.firstName;
        this.tempSurname = this.editedDetails.lastName;
    };

    saveCard = (e: React.SyntheticEvent): void => {
        e.preventDefault();

        runInAction(() => {
            this.isCheckPending = true;
            this.error = null;
        });
        this.checkForAmendPossibility()
            .then(() => {
                runInAction(() => {
                    this.isSelected = false;
                    this.editedDetails.firstName = this.tempName;
                    this.editedDetails.lastName = this.tempSurname;
                });
            })
            .catch(error => {
                runInAction(() => {
                    this.error = {
                        errorStatus: error?.response?.status,
                        errorCode: error?.response?.code,
                    };
                });
            })
            .finally(() => {
                runInAction(() => {
                    this.isCheckPending = false;
                });
            });
    };

    checkForAmendPossibility = async (): Promise<AxiosResponse<any>> =>
        AxiosRequest.post(webApiUrls.amendPassengerDetails(), {
            bookingReference: this.bookingReference,
            guest: {
                ...this.editedDetails,
                firstName: this.tempName,
                lastName: this.tempSurname,
                paxNameChanged: true,
            },
        });

    get isEdited(): boolean {
        return (
            this.tempName !== this.initialDetails.firstName ||
            this.tempSurname !== this.initialDetails.lastName ||
            Object.keys(this.initialDetails).some(key => this.editedDetails[key] !== this.initialDetails[key])
        );
    }
}
