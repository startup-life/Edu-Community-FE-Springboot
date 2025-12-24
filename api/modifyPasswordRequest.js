import { getServerUrl, authenticatedFetch } from '../utils/function.js';

export const changePassword = async newPassword => {
    // Spring: 요청 바디 필드는 { password }
    return authenticatedFetch(`${getServerUrl()}/auth/password`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            password: newPassword,
        }),
    });
};
