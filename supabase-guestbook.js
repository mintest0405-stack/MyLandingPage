const guestbookForm = document.getElementById("guestbook-form");
const guestbookName = document.getElementById("guestbook-name");
const guestbookPassword = document.getElementById("guestbook-password");
const guestbookMessage = document.getElementById("guestbook-message");
const guestbookList = document.getElementById("guestbook-list");

const supabaseClient = supabase.createClient(
  window.SUPABASE_CONFIG.url,
  window.SUPABASE_CONFIG.anonKey
);

async function fetchGuestbookEntries() {
  if (!guestbookList) return;
  const { data, error } = await supabaseClient
    .from("guestbook")
    .select("id, name, message, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    showToast("방명록을 불러오는 중 오류가 발생했습니다.");
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    guestbookList.innerHTML = "<p>아직 등록된 메시지가 없습니다. 첫 번째로 남겨보세요.</p>";
    return;
  }

  guestbookList.innerHTML = data
    .map(
      (entry) => `
        <article class="guestbook-item">
          <strong>${entry.name || "익명"}</strong>
          <p>${entry.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          <button class="delete-button guestbook-delete" type="button" data-entry-id="${entry.id}" data-entry-name="${entry.name}">삭제</button>
          <time datetime="${entry.created_at}">${new Date(entry.created_at).toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          })}</time>
        </article>
      `
    )
    .join("");
}

async function handleGuestbookSubmit(event) {
  event.preventDefault();

  const name = guestbookName.value.trim();
  const message = guestbookMessage.value.trim();

  if (!name || !message) {
    showToast("이름과 메시지를 모두 입력해주세요.");
    return;
  }

  const password = guestbookPassword.value.trim();

  if (!password) {
    showToast("비밀번호를 입력해주세요.");
    return;
  }

  const { error } = await supabaseClient.from("guestbook").insert([
    {
      name,
      password,
      message
    }
  ]);

  if (error) {
    showToast("메시지를 저장하는 중 오류가 발생했습니다.");
    console.error(error);
    return;
  }

  guestbookName.value = "";
  guestbookPassword.value = "";
  guestbookMessage.value = "";
  showToast("방명록이 정상적으로 등록되었습니다.");
  fetchGuestbookEntries();
}

async function handleGuestbookDelete(event) {
  const deleteButton = event.target.closest(".guestbook-delete");
  if (!deleteButton) return;

  const entryId = deleteButton.dataset.entryId;
  const entryName = deleteButton.dataset.entryName;
  const inputName = prompt("삭제하려면 이름을 입력하세요.");
  if (!inputName) {
    showToast("삭제할 이름을 입력해주세요.");
    return;
  }

  if (inputName.trim() !== entryName) {
    showToast("이름이 일치하지 않습니다.");
    return;
  }

  const inputPassword = prompt("비밀번호를 입력하세요.");
  if (!inputPassword) {
    showToast("비밀번호를 입력해주세요.");
    return;
  }

  const { data, error } = await supabaseClient
    .from("guestbook")
    .delete({ returning: "representation" })
    .match({ id: Number(entryId), name: entryName, password: inputPassword.trim() });

  if (error) {
    showToast("삭제 중 오류가 발생했습니다.");
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    showToast("이름 또는 비밀번호가 일치하지 않습니다.");
    return;
  }

  showToast("메시지가 삭제되었습니다.");
  fetchGuestbookEntries();
}

if (guestbookForm) {
  guestbookForm.addEventListener("submit", handleGuestbookSubmit);
  guestbookList.addEventListener("click", handleGuestbookDelete);
  fetchGuestbookEntries();
}
