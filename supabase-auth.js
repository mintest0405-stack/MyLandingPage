let signupForm;
let loginForm;
let toggleSignupButton;
let checkUsernameButton;
let usernameFeedback;
let phoneFeedback;
let emailFeedback;
let passwordFeedback;
let passwordConfirmFeedback;
let loginStatus;
let signupCard;

let signupUsername;
let signupPhone;
let signupEmail;
let signupPassword;
let signupPasswordConfirm;
let loginUsername;
let loginPassword;

function cacheAuthElements() {
  signupForm = document.getElementById("signup-form");
  loginForm = document.getElementById("login-form");
  toggleSignupButton = document.getElementById("toggle-signup");
  checkUsernameButton = document.getElementById("check-username");
  usernameFeedback = document.getElementById("username-feedback");
  phoneFeedback = document.getElementById("phone-feedback");
  emailFeedback = document.getElementById("email-feedback");
  passwordFeedback = document.getElementById("password-feedback");
  passwordConfirmFeedback = document.getElementById("password-confirm-feedback");
  loginStatus = document.getElementById("login-status");
  signupCard = document.getElementById("signup-card");

  signupUsername = document.getElementById("signup-username");
  signupPhone = document.getElementById("signup-phone");
  signupEmail = document.getElementById("signup-email");
  signupPassword = document.getElementById("signup-password");
  signupPasswordConfirm = document.getElementById("signup-password-confirm");
  loginUsername = document.getElementById("login-username");
  loginPassword = document.getElementById("login-password");
}

let supabaseClient;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  if (!window.supabase || !window.SUPABASE_CONFIG) {
    showToast("회원가입 기능을 준비하는 중입니다. 잠시 후 다시 시도해주세요.");
    return null;
  }

  window.supabaseClient = window.supabaseClient || window.supabase.createClient(
    window.SUPABASE_CONFIG.url,
    window.SUPABASE_CONFIG.anonKey
  );
  supabaseClient = window.supabaseClient;
  return supabaseClient;
}

function handleAuthError(error, fallbackMessage) {
  console.error(fallbackMessage, error);
  showToast(fallbackMessage);
}

function isMissingUserAccountsTable(error) {
  return error && (error.code === "PGRST205" || String(error.message || "").includes("public.user_accounts"));
}

function showMissingUserAccountsTableMessage() {
  const message = "Supabase에 user_accounts 테이블을 생성한 뒤 페이지를 새로고침해주세요.";
  if (loginStatus) {
    loginStatus.textContent = message;
  }
  showToast(message);
}

function showSignupDatabaseError(error) {
  console.error("Signup insert failed:", error);

  if (isMissingUserAccountsTable(error)) {
    showMissingUserAccountsTableMessage();
    return;
  }

  if (error.code === "23505" || error.code === "409") {
    setFieldState(signupUsername, false, "아이디가 중복됩니다.");
    showToast("이미 사용 중인 아이디입니다.");
    return;
  }

  if (error.code === "42501") {
    showToast("Supabase RLS insert 정책을 확인해주세요.");
    return;
  }

  const detail = error.message ? `회원가입 오류: ${error.message}` : "회원가입 중 오류가 발생했습니다.";
  if (loginStatus) {
    loginStatus.textContent = detail;
  }
  showToast(detail);
}

if (window.supabase && window.SUPABASE_CONFIG) {
  window.supabaseClient = window.supabaseClient || window.supabase.createClient(
    window.SUPABASE_CONFIG.url,
    window.SUPABASE_CONFIG.anonKey
  );
  supabaseClient = window.supabaseClient;
}

const phonePattern = /^01\d{8,9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^.{4,}$/;

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

function sanitizePhoneInput() {
  const raw = signupPhone.value;
  const digits = raw.replace(/[^0-9]/g, "");
  if (signupPhone.value !== digits) {
    signupPhone.value = digits;
  }
  return validatePhone();
}

function validatePassword() {
  const value = signupPassword.value;
  const valid = passwordPattern.test(value);
  setFieldState(signupPassword, valid, valid ? "사용 가능한 비밀번호입니다." : "비밀번호는 4자 이상 입력하세요.");
  return valid;
}

function validatePasswordConfirm() {
  const valid = signupPasswordConfirm.value === signupPassword.value && signupPasswordConfirm.value.length > 0;
  setFieldState(signupPasswordConfirm, valid, valid ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다.");
  return valid;
}

async function checkUsernameUnique(username) {
  try {
    const client = getSupabaseClient();
    if (!client) return false;

    const { data, error } = await client
      .from("user_accounts")
      .select("id")
      .eq("username", username)
      .limit(1);

    if (error) {
      if (isMissingUserAccountsTable(error)) {
        console.error("Missing user_accounts table:", error);
        showMissingUserAccountsTableMessage();
        return false;
      }
      handleAuthError(error, "아이디 중복 확인 중 오류가 발생했습니다.");
      return false;
    }

    return Array.isArray(data) ? data.length === 0 : false;
  } catch (error) {
    handleAuthError(error, "아이디 중복 확인 중 오류가 발생했습니다.");
    return false;
  }
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
  setFieldState(signupUsername, unique, unique ? "사용 가능한 아이디입니다." : "아이디가 중복됩니다.");
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
  try {
    const usernameValid = validateUsername();
    const phoneValid = sanitizePhoneInput();
    const emailValid = validateEmail();
    const passwordValid = validatePassword();
    const passwordConfirmValid = validatePasswordConfirm();

    if (!usernameValid || !phoneValid || !emailValid || !passwordValid || !passwordConfirmValid) {
      if (!usernameValid) {
        showToast("아이디를 입력해주세요.");
      } else if (!phoneValid) {
        showToast("전화번호는 01012345678 형식으로 입력해주세요.");
      } else if (!emailValid) {
        showToast("이메일 주소를 확인해주세요.");
      } else if (!passwordValid) {
        showToast("비밀번호는 4자 이상 입력해주세요.");
      } else {
        showToast("비밀번호 확인이 일치하지 않습니다.");
      }
      return;
    }

    const username = signupUsername.value.trim();

    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client
      .from("user_accounts")
      .insert([
        {
          username,
          phone: signupPhone.value.trim(),
          email: signupEmail.value.trim(),
          password: signupPassword.value
        }
      ]);

    if (error) {
      showSignupDatabaseError(error);
      return;
    }

    loginUsername.value = username;
    loginPassword.value = signupPassword.value;
    loginStatus.textContent = "가입을 환영합니다!";
    showToast("가입을 환영합니다!");
    signupForm.reset();

    if (signupCard) {
      signupCard.classList.add("collapsed");
    }
    if (toggleSignupButton) {
      toggleSignupButton.textContent = "회원가입 하기";
    }
  } catch (error) {
    handleAuthError(error, "회원가입 중 오류가 발생했습니다.");
  }
}

async function handleLogin(event) {
  if (event) event.preventDefault();
  try {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;

    if (!username || !password) {
      loginStatus.textContent = "아이디와 비밀번호를 모두 입력해주세요.";
      return false;
    }

    const client = getSupabaseClient();
    if (!client) {
      loginStatus.textContent = "로그인 기능을 준비하는 중입니다. 잠시 후 다시 시도해주세요.";
      return false;
    }

    const { data, error } = await client
      .from("user_accounts")
      .select("id, username")
      .eq("username", username)
      .eq("password", password)
      .limit(1);

    if (error) {
      if (isMissingUserAccountsTable(error)) {
        console.error("Missing user_accounts table:", error);
        showMissingUserAccountsTableMessage();
        return false;
      }
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
  } catch (error) {
    handleAuthError(error, "로그인 중 오류가 발생했습니다.");
    return false;
  }
}

function togglePasswordVisibility(button) {
  const input = button.previousElementSibling;
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
  button.textContent = input.type === "password" ? "👁️" : "🙈";
}

function initAuthEvents() {
  cacheAuthElements();

  if (signupForm) {
    signupUsername.addEventListener("input", validateUsername);
    signupUsername.addEventListener("blur", () => {
      validateUsernameUnique().catch((error) => {
        handleAuthError(error, "아이디 중복 확인 중 오류가 발생했습니다.");
      });
    });
    signupPhone.addEventListener("input", sanitizePhoneInput);
    signupEmail.addEventListener("input", validateEmail);
    signupPassword.addEventListener("input", validatePassword);
    signupPasswordConfirm.addEventListener("input", validatePasswordConfirm);
    if (checkUsernameButton) {
      checkUsernameButton.addEventListener("click", () => {
        validateUsernameUnique().catch((error) => {
          handleAuthError(error, "아이디 중복 확인 중 오류가 발생했습니다.");
        });
      });
    }
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
