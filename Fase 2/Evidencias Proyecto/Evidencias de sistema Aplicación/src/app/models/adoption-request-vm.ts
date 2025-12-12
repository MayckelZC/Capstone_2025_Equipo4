import { AdoptionRequest } from './AdoptionRequest';

export interface AdoptionRequestWithNewStatus extends AdoptionRequest {
    isNew?: boolean;
    ownerPhone?: string;
    ownerEmail?: string;
    ownerName?: string;
}
