import Dialog from '../component/dialog/dialog.js';

export const getServerUrl = () => {
    const host = window.location.hostname;
    return host.includes('localhost')
        ? 'http://localhost:8080/v1'
        : `http://${host}:8080/v1`;
};

export const setCookie = (cookie_name, value, days) => {
    const exdate = new Date();
    exdate.setDate(exdate.getDate() + days);
    // 설정 일수만큼 현재시간에 만료값으로 지정

    const cookie_value =
        escape(value) +
        (days == null ? '' : `; expires=${exdate.toUTCString()}`);
    document.cookie = `${cookie_name}=${cookie_value}`;
};

export const getCookie = cookie_name => {
    let x;
    let y;
    const val = document.cookie.split(';');

    for (let i = 0; i < val.length; i++) {
        x = val[i].substr(0, val[i].indexOf('='));
        y = val[i].substr(val[i].indexOf('=') + 1);
        x = x.replace(/^\s+|\s+$/g, ''); // 앞과 뒤의 공백 제거하기
        if (x == cookie_name) {
            return unescape(y); // unescape로 디코딩 후 값 리턴
        }
    }
};

export const deleteCookie = cookie_name => {
    setCookie(cookie_name, '', -1);
};

// JWT 토큰 관리 함수들
export const getAccessToken = () => {
    return localStorage.getItem('accessToken');
};

export const setAccessToken = (token) => {
    localStorage.setItem('accessToken', token);
};

export const removeAccessToken = () => {
    localStorage.removeItem('accessToken');
};

// 사용자 정보 캐시 관리
const USER_CACHE_KEY = 'userInfo';

export const getCachedUserInfo = () => {
    const cached = sessionStorage.getItem(USER_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
};

export const setCachedUserInfo = (userInfo) => {
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(userInfo));
};

export const clearCachedUserInfo = () => {
    sessionStorage.removeItem(USER_CACHE_KEY);
};

// AccessToken 갱신
export const refreshAccessToken = async () => {
    try {
        const response = await fetch(`${getServerUrl()}/auth/token/refresh`, {
            method: 'POST',
            credentials: 'include', // RefreshToken 쿠키 포함
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Token refresh failed: ${response.status}`);
        }

        const result = await response.json();
        // 백엔드 응답 구조: { code: "...", data: { accessToken: "..." } }
        if (result.data && result.data.accessToken) {
            setAccessToken(result.data.accessToken);
            return result.data.accessToken;
        }

        throw new Error('Invalid token response');
    } catch (error) {
        removeAccessToken();
        throw error;
    }
};

// 인증된 fetch 요청 (자동 토큰 갱신 포함)
export const authenticatedFetch = async (url, options = {}) => {
    let accessToken = getAccessToken();

    if (!accessToken) {
        accessToken = await refreshAccessToken();
    }

    // Authorization 헤더 추가
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
    };

    let response = await fetch(url, { ...options, headers, credentials: 'include' });

    // 401 Unauthorized면 토큰 갱신 후 재시도
    if (response.status === 401) {
        try {
            const newToken = await refreshAccessToken();
            headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, { ...options, headers, credentials: 'include' });
        } catch (refreshError) {
            throw new Error('Authentication failed');
        }
    }

    return response;
};

// 인증 상태 확인 (캐싱 적용)
export const authCheck = async () => {
    const HTTP_OK = 200;
    let accessToken = getAccessToken();

    if (!accessToken) {
        try {
            accessToken = await refreshAccessToken();
        } catch (error) {
            clearCachedUserInfo();
            location.href = '/html/login.html';
            return;
        }
    }

    // 캐시된 사용자 정보가 있으면 바로 반환
    const cachedUser = getCachedUserInfo();
    if (cachedUser) {
        // Response 객체처럼 반환
        return {
            ok: true,
            status: HTTP_OK,
            json: async () => ({ data: cachedUser }),
        };
    }

    try {
        const response = await authenticatedFetch(`${getServerUrl()}/users/me`, {
            method: 'GET',
        });

        if (!response || response.status !== HTTP_OK) {
            removeAccessToken();
            clearCachedUserInfo();
            location.href = '/html/login.html';
            return;
        }

        // 응답 복제 후 캐싱
        const clonedResponse = response.clone();
        const result = await clonedResponse.json();
        if (result.data) {
            setCachedUserInfo(result.data);
        }

        return response;
    } catch (error) {
        removeAccessToken();
        clearCachedUserInfo();
        location.href = '/html/login.html';
    }
};

// 로그인 여부 역방향 체크 (이미 로그인된 상태면 메인으로)
export const authCheckReverse = async () => {
    let accessToken = getAccessToken();

    if (!accessToken) {
        try {
            accessToken = await refreshAccessToken();
        } catch (error) {
            // Refresh 실패면 그대로 로그인 페이지 유지
            return;
        }
    }

    try {
        const response = await authenticatedFetch(`${getServerUrl()}/users/me`, {
            method: 'GET',
        });

        if (response.ok) {
            location.href = '/';
        }
    } catch (error) {
        // 토큰이 무효하면 그대로 로그인 페이지 유지
        removeAccessToken();
    }
};
// 이메일 유효성 검사
export const validEmail = email => {
    const REGEX =
        /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
    return REGEX.test(email);
};

export const validPassword = password => {
    const REGEX =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    return REGEX.test(password);
};

export const validNickname = nickname => {
    const REGEX = /^[가-힣a-zA-Z0-9]{2,10}$/;
    return REGEX.test(nickname);
};

export const prependChild = (parent, child) => {
    parent.insertBefore(child, parent.firstChild);
};

/**
 *
 * @param {File} file  이미지 파일
 * @param {boolean} isHigh? : true면 origin, false면  1/4 사이즈
 * @returns
 */
export const fileToBase64 = (file, isHigh) => {
    return new Promise((resolve, reject) => {
        const size = isHigh ? 1 : 4;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = e => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const width = img.width / size;
                const height = img.height / size;
                const elem = document.createElement('canvas');
                elem.width = width;
                elem.height = height;
                const ctx = elem.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(ctx.canvas.toDataURL());
            };
            img.onerror = e => {
                reject(e);
            };
        };
        reader.onerror = e => {
            reject(e);
        };
    });
};

/**
 *
 * @param {string} param
 * @returns
 */
export const getQueryString = param => {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
};

export const padTo2Digits = number => {
    return number.toString().padStart(2, '0');
};

export const debounce = (callback, delay = 500) => {
    let timerId;
    return (...args) => {
        if (timerId) {
            clearTimeout(timerId);
        }
        timerId = setTimeout(() => callback(...args), delay);
    };
};
