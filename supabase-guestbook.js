const guestbookForm = document.getElementById("guestbook-form");
const guestbookName = document.getElementById("guestbook-name");
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

  const { error } = await supabaseClient.from("guestbook").insert([
    {
      name,
      message
    }
  ]);

  if (error) {
    showToast("메시지를 저장하는 중 오류가 발생했습니다.");
    console.error(error);
    return;
  }

  guestbookName.value = "";
  guestbookMessage.value = "";
  showToast("방명록이 정상적으로 등록되었습니다.");
  fetchGuestbookEntries();
}

if (guestbookForm) {
  guestbookForm.addEventListener("submit", handleGuestbookSubmit);
  fetchGuestbookEntries();
}
