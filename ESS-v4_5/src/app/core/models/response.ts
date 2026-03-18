export interface GenericResponse<T> {
    message: string | null;
    Data: T | null;
    statusCode: ResponseStatus;
}

export enum ResponseStatus {
    Fail,
    Success,
    Unauthorize
}

export enum EActions {
    ADD = 'add',
    EDIT = 'edit',
    VIEW = 'view'
}

export enum ERoles {
    Admin = 'admin',
    Beneficiary = 'Beneficiary',
    Donor = 'Donor',
    // UnityFoodsMarketing = 'UnityFoodsMarketing',
    // UnityFoodsSO = 'UnityFoodsSO',
    // UnityFoodsSCM = 'UnityFoodsSCM',
    // Organization = 'Organization'
}

export enum ERoleIds {
    Admin = 1,
    Beneficiary = 2,
    Donor = 3,
    Organization = 4,
    UnityFoodsSO = 5,
    UnityFoodsSCM = 6,
    UnityFoodsMarketing = 7
}

export enum EMessageType {
    SUCCESS = 'success',
    ERROR = 'error',
    WARNING = 'warning'
}