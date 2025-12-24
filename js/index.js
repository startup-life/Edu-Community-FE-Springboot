import BoardItem from '../component/board/boardItem.js';
import Header from '../component/header/header.js';
import { authCheck, getServerUrl, prependChild } from '../utils/function.js';
import { getPosts } from '../api/indexRequest.js';

const DEFAULT_PROFILE_IMAGE = '/public/image/profile/default.jpg';  // 절대 경로 사용
const HTTP_NOT_AUTHORIZED = 401;
const SCROLL_THRESHOLD = 0.9;
const INITIAL_PAGE = 0;
const ITEMS_PER_PAGE = 10;

// getBoardItem 함수
const getBoardItem = async (page = 0, size = 10) => {
    const response = await getPosts(page, size);
    if (!response.ok) {
        console.error('Failed to load post list. Status:', response.status);
        throw new Error('Failed to load post list.');
    }

    const data = await response.json();
    console.log('Posts API response:', data);
    // Spring 백엔드 응답 구조: { data: { posts: [...], page: {...} } }
    const posts = data.data?.posts || [];
    console.log('Extracted posts:', posts);
    return posts;
};

const setBoardItem = boardData => {
    const boardList = document.querySelector('.boardList');
    if (boardList && boardData) {
        const itemsHtml = boardData
            .map(post =>
                BoardItem(
                    post.postId,                                                    // Spring: postId
                    post.createdAt,                                                 // Spring: createdAt (ISO format)
                    post.title,                                                     // Spring: title
                    post.hits,                                                      // Spring: hits
                    post.author.profileImagePath,                                   // Spring: author.profileImagePath
                    post.author.nickname,                                           // Spring: author.nickname
                    post.commentCount,                                              // Spring: commentCount
                    post.likeCount,                                                 // Spring: likeCount
                ),
            )
            .join('');
        boardList.innerHTML += ` ${itemsHtml}`;
    }
};

// 스크롤 이벤트 추가
const addInfinityScrollEvent = () => {
    let currentPage = INITIAL_PAGE + 1, // 첫 페이지는 이미 로드됨
        isEnd = false,
        isProcessing = false;

    window.addEventListener('scroll', async () => {
        const hasScrolledToThreshold =
            window.scrollY + window.innerHeight >=
            document.documentElement.scrollHeight * SCROLL_THRESHOLD;
        if (hasScrolledToThreshold && !isProcessing && !isEnd) {
            isProcessing = true;

            try {
                const newItems = await getBoardItem(currentPage, ITEMS_PER_PAGE);
                if (!newItems || newItems.length === 0) {
                    isEnd = true;
                } else {
                    currentPage++;
                    setBoardItem(newItems);
                }
            } catch (error) {
                console.error('Error fetching new items:', error);
                isEnd = true;
            } finally {
                isProcessing = false;
            }
        }
    });
};

const init = async () => {
    try {
        const response = await authCheck();

        // authCheck에서 이미 리다이렉션 처리했으면 여기까지 오지 않음
        if (!response) {
            return;
        }

        const data = await response.json();
        console.log('Auth check response:', data);

        // 프로필 이미지: 없으면 FE 기본 이미지, 있으면 Spring 백엔드 URL
        const profileImagePath =
            data.data.profileImagePath === null || data.data.profileImagePath === undefined
                ? DEFAULT_PROFILE_IMAGE  // FE 서버의 기본 이미지
                : `http://localhost:8080${data.data.profileImagePath}`;  // Spring 백엔드 정적 파일

        console.log('Profile image path:', profileImagePath);

        prependChild(
            document.body,
            Header('Community', 0, profileImagePath),
        );

        const boardList = await getBoardItem();
        setBoardItem(boardList);

        addInfinityScrollEvent();
    } catch (error) {
        console.error('Initialization failed:', error);
        // 인증 에러면 로그인 페이지로 리다이렉션
        window.location.href = '/html/login.html';
    }
};

init();