import { getServerUrl, authenticatedFetch } from '../utils/function.js';

export const createPost = boardData => {
    return authenticatedFetch(`${getServerUrl()}/posts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(boardData),
    });
};

export const updatePost = (postId, boardData) => {
    return authenticatedFetch(`${getServerUrl()}/posts/${postId}`, {
        method: 'PUT',  // Spring: PUT 메서드 사용
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(boardData),
    });
};

export const fileUpload = formData => {
    return authenticatedFetch(`${getServerUrl()}/posts/image`, {
        method: 'POST',
        body: formData,
    });
};

export const getBoardItem = postId => {
    return authenticatedFetch(`${getServerUrl()}/posts/${postId}`, {
        method: 'GET',
    });
};
