import CommentItem from '../component/comment/comment.js';
import Dialog from '../component/dialog/dialog.js';
import Header from '../component/header/header.js';
import {
    authCheck,
    prependChild,
    padTo2Digits,
} from '../utils/function.js';
import {
    getPost,
    deletePost,
    writeComment,
    getComments,
    increasePostViews,
    likePost,
    unlikePost,
} from '../api/boardRequest.js';

const DEFAULT_PROFILE_IMAGE = '/public/image/profile/default.jpg';  // 절대 경로 사용
const MAX_COMMENT_LENGTH = 1000;
const HTTP_NOT_AUTHORIZED = 401;
const HTTP_OK = 200;

const getQueryString = name => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
};

const getBoardDetail = async postId => {
    const response = await getPost(postId);
    if (!response.ok)
        return new Error('게시글 정보를 가져오는데 실패하였습니다.');

    const data = await response.json();
    return data.data;
};

const setBoardDetail = data => {
    // 헤드 정보
    const titleElement = document.querySelector('.title');
    const createdAtElement = document.querySelector('.createdAt');
    const imgElement = document.querySelector('.img');
    const nicknameElement = document.querySelector('.nickname');

    // Spring: title (camelCase)
    titleElement.textContent = data.title;
    // Spring: createdAt (ISO format)
    const date = new Date(data.createdAt);
    const formattedDate = `${date.getFullYear()}-${padTo2Digits(date.getMonth() + 1)}-${padTo2Digits(date.getDate())} ${padTo2Digits(date.getHours())}:${padTo2Digits(date.getMinutes())}:${padTo2Digits(date.getSeconds())}`;
    createdAtElement.textContent = formattedDate;

    // Spring: author.profileImageUrl (nested object)
    // 기본 이미지는 FE 서버, 업로드된 프로필은 Spring 백엔드
    imgElement.src =
        data.author.profileImageUrl === undefined || data.author.profileImageUrl === null
            ? DEFAULT_PROFILE_IMAGE
            : `http://localhost:8080${data.author.profileImageUrl}`;

    // Spring: author.nickname (nested object)
    nicknameElement.textContent = data.author.nickname;

    // 바디 정보
    const contentImgElement = document.querySelector('.contentImg');
    // Spring: file 객체 (AttachFileInfo - fileId, path)
    if (data.file && data.file.path) {
        const img = document.createElement('img');
        img.src = `http://localhost:8080${data.file.path}`;
        contentImgElement.appendChild(img);
    }
    const contentElement = document.querySelector('.content');
    // Spring: content (camelCase)
    contentElement.textContent = data.content;

    const viewCountElement = document.querySelector('.viewCount h3');
    // Spring: hits는 int 타입이므로 숫자로 처리
    viewCountElement.textContent = data.hits.toLocaleString();

    const commentCountElement = document.querySelector('.commentCount h3');
    // Spring: commentCount (camelCase)
    commentCountElement.textContent = data.commentCount.toLocaleString();

    // 좋아요 정보 설정
    const likeIconElement = document.querySelector('.likeIcon');
    const likeNumberElement = document.querySelector('.likeNumber');
    const likeBtnElement = document.querySelector('.likeBtn');

    likeNumberElement.textContent = data.likeCount.toLocaleString();

    const isLiked = data.isLiked ?? data.liked ?? false;

    // 좋아요 상태에 따라 아이콘 설정
    if (isLiked) {
        likeIconElement.textContent = '♥';
        likeIconElement.classList.add('liked');
    } else {
        likeIconElement.textContent = '♡';
        likeIconElement.classList.remove('liked');
    }

    // 좋아요 버튼 클릭 이벤트
    likeBtnElement.addEventListener('click', async () => {
        const postId = getQueryString('id');
        const isCurrentlyLiked = likeIconElement.classList.contains('liked');

        try {
            let response;
            if (isCurrentlyLiked) {
                response = await unlikePost(postId);
            } else {
                response = await likePost(postId);
            }

            if (response.ok) {
                const result = await response.json();
                likeNumberElement.textContent = result.data.likeCount.toLocaleString();
                if (isCurrentlyLiked) {
                    likeIconElement.textContent = '♡';
                    likeIconElement.classList.remove('liked');
                } else {
                    likeIconElement.textContent = '♥';
                    likeIconElement.classList.add('liked');
                }
            }
        } catch {}
    });
};

const setBoardModify = async (data, myInfo) => {
    // Spring: author.userId와 myInfo.id 비교
    if (String(myInfo.id) === String(data.author.userId)) {
        const modifyElement = document.querySelector('.hidden');
        modifyElement.classList.remove('hidden');

        const modifyBtnElement = document.querySelector('#deleteBtn');
        const postId = getQueryString('id');
        modifyBtnElement.addEventListener('click', () => {
            Dialog(
                '게시글을 삭제하시겠습니까?',
                '삭제한 내용은 복구 할 수 없습니다.',
                async () => {
                    const response = await deletePost(postId);
                    if (response.ok) {
                        window.location.href = '/';
                    } else {
                        Dialog('삭제 실패', '게시글 삭제에 실패하였습니다.');
                    }
                },
            );
        });

        const modifyBtnElement2 = document.querySelector('#modifyBtn');
        modifyBtnElement2.addEventListener('click', () => {
            // Spring: postId (camelCase)
            window.location.href = `/html/board-modify.html?post_id=${data.postId}`;
        });
    }
};

const getBoardComment = async id => {
    const response = await getComments(id);
    if (!response.ok) return [];
    const data = await response.json();
    if (response.status !== HTTP_OK) return [];
    // Spring: { data: { comments: [...] } }
    return data.data.comments;
};

const setBoardComment = (comments, myInfo, postId) => {
    const commentListElement = document.querySelector('.commentList');
    if (commentListElement && comments) {
        comments.forEach(comment => {
            const item = CommentItem(
            comment,
                String(myInfo.id),
                postId,  // 게시글 id는 쿼리 파라미터에서 가져온 값을 사용
            );
            commentListElement.appendChild(item);
        });
    }
};

const addComment = async () => {
    const comment = document.querySelector('textarea').value;
    const pageId = getQueryString('id');

    const response = await writeComment(pageId, comment);

    if (response.ok) {
        window.location.reload();
    } else {
        Dialog('댓글 등록 실패', '댓글 등록에 실패하였습니다.');
    }
};

const inputComment = async () => {
    const textareaElement = document.querySelector(
        '.commentInputWrap textarea',
    );
    const commentBtnElement = document.querySelector('.commentInputBtn');

    if (textareaElement.value.length > MAX_COMMENT_LENGTH) {
        textareaElement.value = textareaElement.value.substring(
            0,
            MAX_COMMENT_LENGTH,
        );
    }
    if (textareaElement.value === '') {
        commentBtnElement.disabled = true;
        commentBtnElement.style.backgroundColor = '#ACA0EB';
    } else {
        commentBtnElement.disabled = false;
        commentBtnElement.style.backgroundColor = '#7F6AEE';
    }
};

const init = async () => {
    try {
        const data = await authCheck();
        const myInfoResult = await data.json();
        if (data.status !== HTTP_OK) {
            throw new Error('사용자 정보를 불러오는데 실패하였습니다.');
        }

        const myInfo = myInfoResult.data;
        const commentBtnElement = document.querySelector('.commentInputBtn');
        const textareaElement = document.querySelector(
            '.commentInputWrap textarea',
        );
        textareaElement.addEventListener('input', inputComment);
        commentBtnElement.addEventListener('click', addComment);
        commentBtnElement.disabled = true;
        if (data.status === HTTP_NOT_AUTHORIZED) {
            window.location.href = '/html/login.html';
        }
        // 프로필 이미지: 기본 이미지는 FE 서버, 업로드된 이미지는 Spring 백엔드
        const profileImage =
            myInfo.profileImageUrl === undefined || myInfo.profileImageUrl === null
                ? DEFAULT_PROFILE_IMAGE
                : myInfo.profileImageUrl;

        prependChild(document.body, Header('커뮤니티', 2, profileImage));

        const pageId = getQueryString('id');

        // 같은 탭에서는 조회수 증가를 한 번만 호출
        const viewKey = `viewed_post_${pageId}`;
        if (!sessionStorage.getItem(viewKey)) {
            try {
                await increasePostViews(pageId);
            } catch {} finally {
                sessionStorage.setItem(viewKey, 'true');
            }
        }

        const pageData = await getBoardDetail(pageId);

        // Spring: author.userId와 myInfo.id 비교
        if (String(myInfo.id) === String(pageData.author.userId)) {
            setBoardModify(pageData, myInfo);
        }
        setBoardDetail(pageData);

        getBoardComment(pageId).then(data => setBoardComment(data, myInfo, pageId));
    } catch {}
};

init();
