import { getServerUrl, authenticatedFetch } from '../utils/function.js';

// 댓글 작성
export const createComment = (postId, content) => {
    return authenticatedFetch(
        `${getServerUrl()}/posts/${postId}/comments`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),  // Spring: { content: "..." }
        }
    );
};

// 댓글 삭제
export const deleteComment = (postId, commentId) => {
    return authenticatedFetch(
        `${getServerUrl()}/posts/${postId}/comments/${commentId}`,
        {
            method: 'DELETE',
        }
    );
};

// 댓글 수정
export const updateComment = (postId, commentId, commentContent) => {
    return authenticatedFetch(
        `${getServerUrl()}/posts/${postId}/comments/${commentId}`,
        {
            method: 'PUT',  // Spring: PUT 메서드 사용
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(commentContent),
        }
    );
};
