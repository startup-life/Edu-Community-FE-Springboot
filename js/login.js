import Header from '../component/header/header.js';
import {
    authCheckReverse,
    prependChild,
    setAccessToken,
    debounce,
    validEmail,
} from '../utils/function.js';
import { userLogin } from '../api/loginRequest.js';

const HTTP_OK = 200;
const MAX_PASSWORD_LENGTH = 8;
const INPUT_DEBOUNCE_MS = 500;

const loginData = {
    id: '',
    password: '',
};

const updateHelperText = (helperTextElement, message = '') => {
    helperTextElement.textContent = message;
};

const validateEmailHelper = value => {
    const helperTextElement = document.querySelector('.helperText');
    const isValidEmail = validEmail(value);
    updateHelperText(
        helperTextElement,
        isValidEmail || !value
            ? ''
            : '*올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)',
    );
    if (value) {
        lottieAnimation(isValidEmail ? 1 : 2);
    }
};

const debouncedEmailHelper = debounce(validateEmailHelper, INPUT_DEBOUNCE_MS);

const loginClick = async () => {
    const { id: email, password } = loginData;
    const helperTextElement = document.querySelector('.helperText');

    try {
        const response = await userLogin(email, password);

        if (!response.ok) {
            updateHelperText(
                helperTextElement,
                '*입력하신 계정 정보가 정확하지 않았습니다.',
            );
            return;
        }

        const result = await response.json();

        if (response.status !== HTTP_OK || !result.data || !result.data.token) {
            updateHelperText(
                helperTextElement,
                '*입력하신 계정 정보가 정확하지 않았습니다.',
            );
            return;
        }

        updateHelperText(helperTextElement);

        // AccessToken을 localStorage에 저장 (RefreshToken은 HttpOnly 쿠키로 자동 저장됨)
        setAccessToken(result.data.token.accessToken);

        location.href = '/html/index.html';
    } catch (error) {
        updateHelperText(
            helperTextElement,
            '*로그인 중 오류가 발생했습니다. 다시 시도해주세요.',
        );
    }
};

const observeSignupData = () => {
    const { id: email, password } = loginData;
    const button = document.querySelector('#login');

    const isValidEmail = validEmail(email);

    button.disabled = !(
        email &&
        isValidEmail &&
        password &&
        password.length >= MAX_PASSWORD_LENGTH
    );
    button.style.backgroundColor = button.disabled ? '#ACA0EB' : '#7F6AEE';
};

const eventSet = () => {
    document.getElementById('login').addEventListener('click', loginClick);

    document.addEventListener('keypress', event => {
        if (event.key === 'Enter') {
            loginClick();
        }
    });

    ['id', 'pw'].forEach(field => {
        const inputElement = document.getElementById(field);
        inputElement.addEventListener('input', event =>
            onChangeHandler(event, field === 'id' ? 'id' : 'password'),
        );

        if (field === 'id') {
            inputElement.addEventListener('focusout', event =>
                validateEmailHelper(event.target.value),
            );
        }
    });

    document
        .getElementById('id')
        .addEventListener('input', event => {
            validateEmail(event.target);
            debouncedEmailHelper(event.target.value);
        });
};

const onChangeHandler = (event, uid) => {
    loginData[uid] = event.target.value;
    observeSignupData();
};

const validateEmail = input => {
    const regex = /^[A-Za-z0-9@.]+$/;
    if (!regex.test(input.value)) input.value = input.value.slice(0, -1);
};

let lottieInstance = null;
const lottieAnimation = type => {
    const container = document.getElementById('lottie-animation');
    const animationPaths = [
        '/public/check_anim.json',
        '/public/denied_anim.json',
    ];
    if (lottieInstance) lottieInstance.destroy();
    container.innerHTML = '';
    lottieInstance = window.lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: false,
        autoplay: true,
        path: animationPaths[type - 1],
    });
};

const init = async () => {
    await authCheckReverse();
    observeSignupData();
    prependChild(document.body, Header('커뮤니티', 0));
    eventSet();
};

init();
