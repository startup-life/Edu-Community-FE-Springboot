import { getServerUrl, authenticatedFetch } from '../utils/function.js';

export const getPosts = (page = 0, size = 10, sortBy = 'createdAt', direction = 'DESC') => {
    return authenticatedFetch(
        `${getServerUrl()}/posts?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`,
        {
            method: 'GET',
        }
    );
};