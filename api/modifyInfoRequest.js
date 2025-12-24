import { getServerUrl, authenticatedFetch } from '../utils/function.js';

export const userModify = async changeData => {
    return authenticatedFetch(`${getServerUrl()}/users/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(changeData),
    });
};

export const userDelete = async () => {
    return authenticatedFetch(`${getServerUrl()}/users`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });
};
