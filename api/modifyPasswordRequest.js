import { getServerUrl, authenticatedFetch } from '../utils/function.js';

export const changePassword = async (oldPassword, newPassword) => {
    return authenticatedFetch(`${getServerUrl()}/auth/password`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            oldPassword,
            newPassword,
        }),
    });
};
