import { encodeBase64URL } from './base64URL.utils';

describe('base64URL.utils.test', () => {
    test('should encode object to base64 string', () => {
        const jsObject = {
            messageType: 'CRes',
            messageVersion: '2.1.0',
            threeDSServerTransID: 'ea442456-6439-480c-bee9-4d38094db484',
            acsTransID: 'b7a5693b-ffc7-4639-a7a9-b09e17678c8f',
            acsUiType: '01',
            challengeCompletionInd: 'Y',
            transStatus: 'Y',
        };
        const base64String = encodeBase64URL(jsObject);
        expect(base64String).toEqual(
            'eyJtZXNzYWdlVHlwZSI6IkNSZXMiLCJtZXNzYWdlVmVyc2lvbiI6IjIuMS4wIiwidGhyZWVEU1NlcnZlclRyYW5zSUQiOiJlYTQ0MjQ1Ni02NDM5LTQ4MGMtYmVlOS00ZDM4MDk0ZGI0ODQiLCJhY3NUcmFuc0lEIjoiYjdhNTY5M2ItZmZjNy00NjM5LWE3YTktYjA5ZTE3Njc4YzhmIiwiYWNzVWlUeXBlIjoiMDEiLCJjaGFsbGVuZ2VDb21wbGV0aW9uSW5kIjoiWSIsInRyYW5zU3RhdHVzIjoiWSJ9',
        );
    });

    test('should encode string to base64 string', () => {
        const str = 'test';
        const base64String = encodeBase64URL(str);
        expect(base64String).toEqual('dGVzdA');
    });
});
