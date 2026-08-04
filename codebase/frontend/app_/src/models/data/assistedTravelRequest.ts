import { IGuestPassenger } from './ILeadPassenger';

export interface IAssistedTravelRequest {
    bookingReference: string;
    caseId: string;
    passengers: Array<{
        assistanceTypes: string[];
        hasRequest: boolean;
        passengerName: string;
        questionsAndAnswers: Array<{
            answer: string;
            question: string;
            questionCode: string;
        }>;
        requestedAt?: string;
    }>;
}

export interface IGuestWithAssistedTravelRequest {
    passenger: IGuestPassenger;
    passengerName: string;
    requestedAt: string;
}
