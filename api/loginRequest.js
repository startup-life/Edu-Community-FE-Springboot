import { getServerUrl } from '../utils/function.js';

export const userLogin = async (email, password) => {
    const result = await fetch(`${getServerUrl()}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // RefreshToken 쿠키 수신을 위해 필요
        body: JSON.stringify({
            email: email,
            password: password,
        }),
    });
    return result;
};

export const checkEmail = async email => {
    const result = fetch(
        `${getServerUrl()}/auth/email/availability?email=${email}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        },
    );
    return result;
};
