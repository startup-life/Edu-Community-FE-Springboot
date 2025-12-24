import { getServerUrl, authenticatedFetch } from '../utils/function.js';

export const getPost = postId => {
    return authenticatedFetch(`${getServerUrl()}/posts/${postId}`, {
        method: 'GET',
    });
};

export const deletePost = async postId => {
    return authenticatedFetch(`${getServerUrl()}/posts/${postId}`, {
        method: 'DELETE',
    });
};

export const writeComment = async (pageId, comment) => {
    return authenticatedFetch(`${getServerUrl()}/posts/${pageId}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: comment }),  // Spring: content (camelCase)
    });
};

export const getComments = async postId => {
    return authenticatedFetch(`${getServerUrl()}/posts/${postId}/comments`, {
        method: 'GET',
    });
};

export const increasePostViews = async postId => {
    // 조회수 증가 전용 엔드포인트 (POST /posts/{id}/views)
    return authenticatedFetch(`${getServerUrl()}/posts/${postId}/views`, {
        method: 'POST',
    });
};
