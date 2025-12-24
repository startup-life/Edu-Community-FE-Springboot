import { getServerUrl, authenticatedFetch } from '../utils/function.js';

export const userSignup = async data => {
    const result = await fetch(`${getServerUrl()}/auth/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    return result;
};

export const checkEmail = async email => {
    const result = await fetch(
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

export const checkNickname = async nickname => {
    const result = await fetch(
        `${getServerUrl()}/auth/nickname/availability?nickname=${nickname}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        },
    );
    return result;
};

export const fileUpload = async file => {
    // 회원가입 시점에는 인증 불필요 (SecurityConfig permitAll 설정됨)
    return fetch(`${getServerUrl()}/users/me/profile-image`, {
        method: 'POST',
        body: file,
    });
};