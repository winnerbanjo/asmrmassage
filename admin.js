const loginPanel = document.querySelector("[data-admin-login]");
const loginForm = document.querySelector("[data-admin-login-form]");
const dashboard = document.querySelector("[data-admin-dashboard]");
const adminMessage = document.querySelector("[data-admin-message]");
const adminList = document.querySelector("[data-admin-list]");
const adminEmpty = document.querySelector("[data-admin-empty]");
const adminCount = document.querySelector("[data-admin-count]");
const refreshButton = document.querySelector("[data-refresh-bookings]");
const clearButton = document.querySelector("[data-clear-bookings]");
const logoutButton = document.querySelector("[data-admin-logout]");
const pinStorageKey = "suzzy-admin-pin";

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getPin = () => sessionStorage.getItem(pinStorageKey);

const setMessage = (message) => {
  adminMessage.textContent = message;
};

const apiRequest = async (method = "GET", body) => {
  const response = await fetch("/api/bookings", {
    method,
    headers: {
      "content-type": "application/json",
      "x-admin-pin": getPin(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Admin request failed");
  }

  return data;
};

const getStatusClass = (status) => `admin-status ${String(status).toLowerCase()}`;

const getWhatsAppLink = (booking) => {
  const message = [
    `Hello ${booking.name}, this is Suzzy’s ASMR.`,
    `Your booking request ${booking.reference} is ${booking.status.toLowerCase()}.`,
  ].join("\n");

  return `https://wa.me/${String(booking.phone).replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
};

const renderBookings = (bookings) => {
  adminCount.textContent = `${bookings.length} ${bookings.length === 1 ? "request" : "requests"}`;
  adminEmpty.hidden = bookings.length > 0;

  adminList.innerHTML = bookings
    .map(
      (booking) => `
        <article class="admin-card">
          <div>
            <span>${escapeHtml(booking.reference)}</span>
            <h3>${escapeHtml(booking.name)}</h3>
            <p>${escapeHtml(booking.service)}</p>
            <strong class="${getStatusClass(booking.status)}">${escapeHtml(booking.status)}</strong>
          </div>
          <div class="admin-meta">
            <strong>${escapeHtml(booking.day)} • ${escapeHtml(booking.time)}</strong>
            <span>${escapeHtml(booking.phone)}</span>
            <span>${escapeHtml(booking.email)}</span>
            <span>Submitted ${escapeHtml(booking.submittedAt)}</span>
          </div>
          <div class="admin-actions">
            <a href="${booking.receiptUrl}" target="_blank" rel="noreferrer">View Receipt</a>
            <a href="${getWhatsAppLink(booking)}" target="_blank" rel="noreferrer">WhatsApp Client</a>
            <button type="button" data-status="${booking.id}" data-next-status="Confirmed">Confirm</button>
            <button type="button" data-status="${booking.id}" data-next-status="Cancelled">Cancel</button>
          </div>
        </article>
      `
    )
    .join("");
};

const loadBookings = async () => {
  setMessage("Loading bookings...");
  const { bookings } = await apiRequest();
  loginPanel.classList.add("is-hidden");
  dashboard.classList.remove("is-hidden");
  setMessage("");
  renderBookings(bookings);
};

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  sessionStorage.setItem(pinStorageKey, formData.get("pin"));

  try {
    await loadBookings();
  } catch (error) {
    sessionStorage.removeItem(pinStorageKey);
    setMessage(error.message);
  }
});

adminList?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-status]");

  if (!button) {
    return;
  }

  button.disabled = true;

  try {
    await apiRequest("PATCH", {
      id: button.dataset.status,
      status: button.dataset.nextStatus,
    });
    await loadBookings();
  } catch (error) {
    setMessage(error.message);
    button.disabled = false;
  }
});

refreshButton?.addEventListener("click", () => {
  loadBookings().catch((error) => setMessage(error.message));
});

clearButton?.addEventListener("click", async () => {
  if (!window.confirm("Clear all booking requests and receipt files?")) {
    return;
  }

  try {
    await apiRequest("DELETE");
    await loadBookings();
  } catch (error) {
    setMessage(error.message);
  }
});

logoutButton?.addEventListener("click", () => {
  sessionStorage.removeItem(pinStorageKey);
  dashboard.classList.add("is-hidden");
  loginPanel.classList.remove("is-hidden");
});

if (getPin()) {
  loadBookings().catch(() => {
    sessionStorage.removeItem(pinStorageKey);
    loginPanel.classList.remove("is-hidden");
    dashboard.classList.add("is-hidden");
  });
}
