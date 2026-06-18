const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const toggleSignupButton = document.getElementById("toggle-signup");
const generateUsernameButton = document.getElementById("generate-username");
const usernameFeedback = document.getElementById("username-feedback");
const phoneFeedback = document.getElementById("phone-feedback");
const emailFeedback = document.getElementById("email-feedback");
const passwordFeedback = document.getElementById("password-feedback");
const passwordConfirmFeedback = document.getElementById("password-confirm-feedback");
const loginStatus = document.getElementById("login-status");
const signupCard = document.getElementById("signup-card");

const signupUsername = document.getElementById("signup-username");
const signupPhone = document.getElementById("signup-phone");
const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");
const signupPasswordConfirm = document.getElementById("signup-password-confirm");
const loginUsername = document.getElementById("login-username");
const loginPassword = document.getElementById("login-password");

window.supabaseClient = window.supabaseClient || supabase.createClient(
  window.SUPABASE_CONFIG.url,
  window.SUPABASE_CONFIG.anonKey
);
const supabaseClient = window.supabaseClient;

const phonePattern = /^01\d{8,9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

function setFieldState(field, valid, message) {
  field.classList.toggle("valid", valid);
  field.classList.toggle("invalid", !valid);
  const feedback = document.getElementById(`${field.id}-feedback`);
  if (feedback) {
    feedback.textContent = message;
    feedback.classList.toggle("field-valid", valid);
    feedback.classList.toggle("field-invalid", !valid);
  }
}

function validateUsername() {
  const value = signupUsername.value.trim();
  if (!value) {
    setFieldState(signupUsername, false, "아이디를 입력해주세요.");
    return false;
  }
  return true;
}

function validatePhone() {
  const value = signupPhone.value.replace(/[^0-9]/g, "");
  signupPhone.value = value;
  const valid = phonePattern.test(value);
  setFieldState(signupPhone, valid, valid ? "정상적인 전화번호입니다." : "정상적인 전화번호(01012345678)를 입력하세요.");
  return valid;
}

function validateEmail() {
  const value = signupEmail.value.trim();
  const valid = emailPattern.test(value);
  setFieldState(signupEmail, valid, valid ? "정상적인 이메일입니다." : "유효한 이메일 주소를 입력하세요.");
  return valid;
}

function validatePassword() {
  const value = signupPassword.value;
  const valid = passwordPattern.test(value);
  setFieldState(signupPassword, valid, valid ? "안전한 비밀번호입니다." : "8자 이상, 대소문자, 숫자, 특수문자 모두 포함하세요.");
  return valid;
}

function validatePasswordConfirm() {
  const valid = signupPasswordConfirm.value === signupPassword.value && signupPasswordConfirm.value.length > 0;
  setFieldState(signupPasswordConfirm, valid, valid ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다.");
  return valid;
}

async function checkUsernameUnique(username) {
  const { data, error } = await supabaseClient
    .from("user_accounts")
    .select("id")
    .eq("username", username)
    .limit(1);

  if (error) {
    console.error("Username uniqueness check failed:", error);
    showToast("아이디 중복 확인 중 오류가 발생했습니다.");
    return false;
  }

  return Array.isArray(data) ? data.length === 0 : false;
}

function randomUsername() {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += i % 2 ? digits[Math.floor(Math.random() * digits.length)] : letters[Math.floor(Math.random() * letters.length)];
  }
  return result;
}

async function generateRandomUsernames() {
  const suggestions = new Set();
  while (suggestions.size < 50) {
    suggestions.add(randomUsername());
  }
  return Array.from(suggestions);
}

async function attemptGenerateUsername() {
  const candidates = await generateRandomUsernames();
  for (const candidate of candidates) {
    if (await checkUsernameUnique(candidate)) {
      signupUsername.value = candidate;
      setFieldState(signupUsername, true, "사용 가능한 아이디입니다.");
      return;
    }
  }
  setFieldState(signupUsername, false, "사용 가능한 아이디를 찾을 수 없습니다. 다시 시도해주세요.");
}

async function validateUsernameUnique() {
  const value = signupUsername.value.trim();
  if (!value) {
    setFieldState(signupUsername, false, "아이디를 입력해주세요.");
    return false;
  }
  const unique = await checkUsernameUnique(value);
  setFieldState(signupUsername, unique, unique ? "사용 가능한 아이디입니다." : "이미 사용중인 아이디입니다.");
  return unique;
}

function toggleSignupCard() {
  if (!signupCard || !toggleSignupButton) return;
  const isCollapsed = signupCard.classList.toggle("collapsed");
  toggleSignupButton.textContent = isCollapsed ? "회원가입 하기" : "회원가입 닫기";
  if (!isCollapsed) {
    signupCard.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

async function handleSignup(event) {
  event.preventDefault();
  if (!validateUsername() || !validatePhone() || !validateEmail() || !validatePassword() || !validatePasswordConfirm()) {
    showToast("입력값을 다시 확인해주세요.");
    return;
  }

  if (!(await validateUsernameUnique())) {
    showToast("아이디를 확인해주세요.");
    return;
  }

  const username = signupUsername.value.trim();

  const { data, error } = await supabaseClient.from("user_accounts").insert([
    {
      username,
      phone: signupPhone.value.trim(),
      email: signupEmail.value.trim(),
      password: signupPassword.value
    }
  ]);

  if (error) {
    showToast("회원가입 중 오류가 발생했습니다.");
    console.error("Signup insert failed:", error);
    return;
  }

  if (!data || data.length === 0) {
    showToast("회원가입이 정상적으로 처리되지 않았습니다.");
    return;
  }

  loginUsername.value = username;
  loginPassword.value = signupPassword.value;
  const loggedIn = await handleLogin();

  if (loggedIn) {
    alert("환영합니다! 자동 로그인되었습니다.");
    showToast("환영합니다! 자동 로그인되었습니다.");
    if (signupCard) {
      signupCard.classList.add("collapsed");
    }
    if (toggleSignupButton) {
      toggleSignupButton.textContent = "회원가입 하기";
    }
  }
}

async function handleLogin(event) {
  if (event) event.preventDefault();
  const username = loginUsername.value.trim();
  const password = loginPassword.value;

  if (!username || !password) {
    loginStatus.textContent = "아이디와 비밀번호를 모두 입력해주세요.";
    return false;
  }

  const { data, error } = await supabaseClient
    .from("user_accounts")
    .select("id, username")
    .eq("username", username)
    .eq("password", password)
    .limit(1);

  if (error) {
    loginStatus.textContent = "로그인 중 오류가 발생했습니다.";
    console.error(error);
    return false;
  }

  if (!data || data.length === 0) {
    loginStatus.textContent = "아이디 또는 비밀번호가 틀렸습니다.";
    return false;
  }

  loginStatus.textContent = `환영합니다, ${data[0].username}님!`;
  return true;
}

function togglePasswordVisibility(button) {
  const input = button.previousElementSibling;
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
  button.textContent = input.type === "password" ? "👁️" : "🙈";
}

function initAuthEvents() {
  if (signupForm) {
    signupUsername.addEventListener("input", validateUsername);
    signupUsername.addEventListener("blur", validateUsernameUnique);
    signupPhone.addEventListener("input", validatePhone);
    signupEmail.addEventListener("input", validateEmail);
    signupPassword.addEventListener("input", validatePassword);
    signupPasswordConfirm.addEventListener("input", validatePasswordConfirm);
    generateUsernameButton.addEventListener("click", attemptGenerateUsername);
    signupForm.addEventListener("submit", handleSignup);
  }

  if (toggleSignupButton) {
    toggleSignupButton.addEventListener("click", toggleSignupCard);
  }

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => togglePasswordVisibility(button));
  });
}

document.addEventListener("DOMContentLoaded", initAuthEvents);
