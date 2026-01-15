import BoardItem from '../component/board/boardItem.js';
import Header from '../component/header/header.js';
import {authCheck, prependChild} from '../utils/function.js';
import {getPosts} from '../api/indexRequest.js';

const DEFAULT_PROFILE_IMAGE = '/public/image/profile/default.jpg';  // 절대 경로 사용
const SCROLL_THRESHOLD = 0.9;
const INITIAL_PAGE = 0;
const ITEMS_PER_PAGE = 10;

const clearViewFlags = () => {
    const removeKeys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('viewed_post_')) {
            removeKeys.push(key);
        }
    }
    removeKeys.forEach(key => sessionStorage.removeItem(key));
};

// getBoardItem 함수
const getBoardItem = async (page = 0, size = 10) => {
    const response = await getPosts(page, size);
    if (!response.ok) {
        throw new Error('Failed to load post list.');
    }

    const data = await response.json();
    return data.data?.posts || [];
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
                    post.author.profileImageUrl,                                    // Spring: author.profileImageUrl
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
                isEnd = true;
            } finally {
                isProcessing = false;
            }
        }
    });
};

const init = async () => {
    try {
        // 상세 페이지에서 저장한 조회수 플래그 초기화 (홈 진입 시 다시 증가 허용)
        clearViewFlags();

        const response = await authCheck();

        // authCheck에서 이미 리다이렉션 처리했으면 여기까지 오지 않음
        if (!response) {
            return;
        }

        const data = await response.json();

        // 프로필 이미지: 없으면 FE 기본 이미지, 있으면 Spring 백엔드 URL
        const profileImageUrl =
            data.data.profileImageUrl === null || data.data.profileImageUrl === undefined
                ? DEFAULT_PROFILE_IMAGE
                : data.data.profileImageUrl;

        prependChild(
            document.body,
            Header('Community', 0, profileImageUrl),
        );

        const boardList = await getBoardItem();
        setBoardItem(boardList);

        addInfinityScrollEvent();
    } catch (error) {
        // 인증 에러면 로그인 페이지로 리다이렉션
        window.location.href = '/html/login.html';
    }
};

init();
