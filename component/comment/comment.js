import { getServerUrl, padTo2Digits } from '../../utils/function.js';
import Dialog from '../dialog/dialog.js';
import { deleteComment, updateComment } from '../../api/commentRequest.js';

const DEFAULT_PROFILE_IMAGE = '/public/image/profile/default.jpg';  // 절대 경로 사용
const HTTP_OK = 200;

const CommentItem = (data, writerId, postId) => {
    // Spring: commentId는 data.commentId에서 가져옴
    const commentId = data.commentId;
    const CommentDelete = () => {
        Dialog(
            '댓글을 삭제하시겠습니까?',
            '삭제한 내용은 복구 할 수 없습니다.',
            async () => {
                const response = await deleteComment(postId, commentId);
                if (!response.ok) {
                    Dialog('삭제 실패', '댓글 삭제에 실패하였습니다.');
                    return;
                }

                if (response.status === HTTP_OK)
                    location.href = '/html/board.html?id=' + postId;
            },
        );
    };

    const CommentModify = () => {
        // 댓글 내용을 보여주는 p 태그 찾기
        const p = commentInfoWrap.querySelector('p');
        // 현재 댓글 내용 저장
        const originalContent = p.innerHTML.replace(/<br>/g, '\n');
        // 원래 p 태그의 부모 참조 저장 (나중에 복원하기 위해)
        const parentElement = p.parentElement;

        // 수정 컨테이너 생성
        const editContainer = document.createElement('div');
        editContainer.className = 'comment-edit-container';

        // textarea 생성 및 설정
        const textarea = document.createElement('textarea');
        textarea.className = 'comment-edit-textarea';
        textarea.value = originalContent;
        textarea.maxLength = 1500;
        textarea.placeholder = '댓글을 입력해주세요...';

        // 푸터 (글자 수 + 버튼)
        const footer = document.createElement('div');
        footer.className = 'comment-edit-footer';

        // 글자 수 카운터
        const charCount = document.createElement('span');
        charCount.className = 'comment-char-count';
        charCount.textContent = `${originalContent.length} / 1,500`;

        // 버튼 그룹
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'comment-edit-buttons';

        // 사용자가 입력할 때마다 글자 수 체크
        textarea.addEventListener('input', () => {
            if (textarea.value.length > 1500) {
                // 1500자를 초과하는 경우, 초과분을 자름
                textarea.value = textarea.value.substring(0, 1500);
            }
            // 글자 수 업데이트
            charCount.textContent = `${textarea.value.length.toLocaleString()} / 1,500`;
            // 1400자 이상이면 경고 스타일
            if (textarea.value.length >= 1400) {
                charCount.classList.add('warning');
            } else {
                charCount.classList.remove('warning');
            }
            // 빈 내용이면 저장 버튼 비활성화
            saveButton.disabled = textarea.value.length === 0;
        });

        // 취소 버튼 생성 및 설정
        const cancelButton = document.createElement('button');
        cancelButton.className = 'comment-edit-btn cancel';
        cancelButton.textContent = '취소';
        cancelButton.onclick = () => {
            // 새로운 p 태그 생성하여 원래 내용으로 복원
            const newP = document.createElement('p');
            newP.innerHTML = originalContent.replace(/\n/g, '<br>');
            // 수정 컨테이너를 새로운 p 태그로 교체
            parentElement.replaceChild(newP, editContainer);
        };

        // 수정 완료(저장) 버튼 생성 및 설정
        const saveButton = document.createElement('button');
        saveButton.className = 'comment-edit-btn save';
        saveButton.textContent = '저장';
        saveButton.onclick = async () => {
            if (textarea.value.length === 0) {
                Dialog('수정 실패', '댓글은 1자 이상 입력해주세요.');
                return;
            }
            // 서버로 수정된 댓글 내용 전송하는 로직
            const updatedContent = textarea.value;
            const sendData = {
                content: updatedContent,
            };

            const response = await updateComment(postId, commentId, sendData);
            if (!response.ok)
                return Dialog('수정 실패', '댓글 수정에 실패하였습니다.');

            location.href = '/html/board.html?id=' + postId;
        };

        // 요소 조립
        buttonGroup.appendChild(cancelButton);
        buttonGroup.appendChild(saveButton);
        footer.appendChild(charCount);
        footer.appendChild(buttonGroup);
        editContainer.appendChild(textarea);
        editContainer.appendChild(footer);

        // p 태그를 수정 컨테이너로 대체
        parentElement.replaceChild(editContainer, p);

        // textarea에 포커스
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    };

    const commentItem = document.createElement('div');
    commentItem.className = 'commentItem';

    const picture = document.createElement('picture');

    const img = document.createElement('img');
    img.className = 'commentImg';
    // Spring: author.profileImageUrl (null이면 FE 기본 이미지, 있으면 Spring 백엔드)
    img.src = data.author.profileImageUrl === null || data.author.profileImageUrl === undefined
        ? DEFAULT_PROFILE_IMAGE
        : `http://localhost:8080${data.author.profileImageUrl}`;
    picture.appendChild(img);

    const commentInfoWrap = document.createElement('div');
    commentInfoWrap.className = 'commentInfoWrap';

    const infoDiv = document.createElement('div');

    const h3 = document.createElement('h3');
    // Spring: author.nickname
    h3.textContent = data.author.nickname;
    infoDiv.appendChild(h3);

    const h4 = document.createElement('h4');
    // Spring: createdAt (ISO format)
    const date = new Date(data.createdAt);
    const formattedDate = `${date.getFullYear()}-${padTo2Digits(date.getMonth() + 1)}-${padTo2Digits(date.getDate())} ${padTo2Digits(date.getHours())}:${padTo2Digits(date.getMinutes())}:${padTo2Digits(date.getSeconds())}`;
    h4.textContent = formattedDate;
    infoDiv.appendChild(h4);

    // Spring: author.userId와 writerId 비교 (둘 다 문자열)
    if (data.author.userId.toString() === writerId) {
        const buttonWrap = document.createElement('span');

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '삭제';
        deleteButton.onclick = CommentDelete;
        const modifyButton = document.createElement('button');
        modifyButton.textContent = '수정';
        modifyButton.onclick = CommentModify;

        buttonWrap.appendChild(modifyButton);
        buttonWrap.appendChild(deleteButton);

        infoDiv.appendChild(buttonWrap);
    }

    const p = document.createElement('p');
    // Spring: content (camelCase)
    p.innerHTML = data.content.replace(/(?:\r\n|\r|\n)/g, '<br>');

    commentInfoWrap.appendChild(infoDiv);
    commentInfoWrap.appendChild(p);

    commentItem.appendChild(picture);
    commentItem.appendChild(commentInfoWrap);

    return commentItem;
};

export default CommentItem;