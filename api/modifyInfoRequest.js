import { getServerUrl, authenticatedFetch } from '../utils/function.js';

export const userModify = async changeData => {
    // Spring: 회원 정보 수정 엔드포인트는 PATCH /users/me
    return authenticatedFetch(`${getServerUrl()}/users/me`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(changeData),
    });
};

export const userDelete = async () => {
    // Spring: 회원 탈퇴 엔드포인트는 DELETE /users/me
    return authenticatedFetch(`${getServerUrl()}/users/me`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });
};
