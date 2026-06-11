const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelectorAll("[data-nav] a");
const bookingForm = document.querySelector("[data-booking-form]");
const serviceCards = document.querySelectorAll("[data-service-card]");
const servicePicks = document.querySelectorAll("[data-service-pick]");
const dayPicks = document.querySelectorAll("[data-day-pick]");
const moodButtons = document.querySelectorAll("[data-mood]");
const moodOutput = document.querySelector("[data-mood-output]");
const selectedSession = document.querySelector("[data-selected-session]");
const nextWindow = document.querySelector("[data-next-window]");
const revealItems = document.querySelectorAll(".reveal");
const bookingNote = document.querySelector("[data-booking-note]");
const adminList = document.querySelector("[data-admin-list]");
const adminEmpty = document.querySelector("[data-admin-empty]");
const adminCount = document.querySelector("[data-admin-count]");
const clearBookingsButton = document.querySelector("[data-clear-bookings]");
const bookingsStorageKey = "suzzy-asmr-bookings";
const ownerWhatsAppNumber = "2347044325816";

const serviceSummaries = {
  "Relaxation Massage - 1 Hour - ₦90,000": "Relaxation Massage • 1 Hour • ₦90,000",
  "Back, Neck & Shoulder Massage - 30 Minutes - ₦35,000": "Back, Neck & Shoulder • 30 Minutes • ₦35,000",
  "Head & Scalp Massage - 30 Minutes - ₦35,000": "Head & Scalp Massage • 30 Minutes • ₦35,000",
};

const moodCopy = {
  "Whisper calm": "Whisper calm selected for a slower, lighter session pace.",
  "Soft pressure": "Soft pressure selected for focused tension relief around the neck and shoulders.",
  "Scalp focus": "Scalp focus selected for gentle head massage and a quieter finish.",
};

const bookingWindows = {
  Monday: "Monday, 10AM - 8PM",
  Tuesday: "Tuesday, 10AM - 8PM",
  Wednesday: "Wednesday, 10AM - 8PM",
  Thursday: "Thursday, 10AM - 8PM",
  Friday: "Friday, 10AM - 8PM",
  Saturday: "Saturday, 10AM - 8PM",
  Sunday: "Sunday, 1PM - 5PM",
};

const getBookings = () => JSON.parse(localStorage.getItem(bookingsStorageKey) || "[]");

const saveBookings = (bookings) => {
  localStorage.setItem(bookingsStorageKey, JSON.stringify(bookings));
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });

const renderAdminBookings = () => {
  if (!adminList || !adminEmpty || !adminCount) {
    return;
  }

  const bookings = getBookings();
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
            <strong class="admin-status">${escapeHtml(booking.status)}</strong>
          </div>
          <div class="admin-meta">
            <strong>${escapeHtml(booking.day)} • ${escapeHtml(booking.time)}</strong>
            <span>${escapeHtml(booking.phone)}</span>
            <span>${escapeHtml(booking.email)}</span>
            <span>Submitted ${escapeHtml(booking.submittedAt)}</span>
          </div>
          <div class="admin-actions">
            <a href="${booking.receiptData}" download="${escapeHtml(booking.receiptName)}">Receipt</a>
            <button type="button" data-status="${booking.id}" data-next-status="Confirmed">Confirm</button>
            <button type="button" data-status="${booking.id}" data-next-status="Cancelled">Cancel</button>
          </div>
        </article>
      `
    )
    .join("");
};

const notifyOwnerOnWhatsApp = (booking, notificationWindow) => {
  const message = [
    "New Suzzy’s ASMR booking request",
    "",
    `Reference: ${booking.reference}`,
    `Name: ${booking.name}`,
    `Phone: ${booking.phone}`,
    `Email: ${booking.email}`,
    `Service: ${booking.service}`,
    `Preferred day: ${booking.day}`,
    `Preferred time: ${booking.time}`,
    `Receipt uploaded: ${booking.receiptName}`,
    "",
    "Please check the admin section for the receipt.",
  ].join("\n");

  const whatsappUrl = `https://wa.me/${ownerWhatsAppNumber}?text=${encodeURIComponent(message)}`;

  if (notificationWindow) {
    notificationWindow.location.href = whatsappUrl;
    return;
  }

  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
};

navToggle?.addEventListener("click", () => {
  const isOpen = header.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Open menu");
  });
});

const syncSelectedService = (value) => {
  const serviceSelect = bookingForm?.elements.service;

  if (serviceSelect) {
    serviceSelect.value = value;
  }

  selectedSession.textContent = serviceSummaries[value] || value;

  serviceCards.forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.serviceValue === value);
  });

  servicePicks.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.servicePick === value);
  });
};

serviceCards.forEach((card) => {
  const pickCard = () => {
    syncSelectedService(card.dataset.serviceValue);
    document.querySelector("#booking")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  card.addEventListener("click", pickCard);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pickCard();
    }
  });
});

servicePicks.forEach((button) => {
  button.addEventListener("click", () => {
    syncSelectedService(button.dataset.servicePick);
  });
});

bookingForm?.elements.service?.addEventListener("change", (event) => {
  syncSelectedService(event.target.value);
});

dayPicks.forEach((button) => {
  button.addEventListener("click", () => {
    const daySelect = bookingForm?.elements.day;

    if (daySelect) {
      daySelect.value = button.dataset.dayPick;
    }

    nextWindow.textContent = bookingWindows[button.dataset.dayPick];

    document.querySelector("#booking")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

moodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    moodButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    moodOutput.textContent = moodCopy[button.dataset.mood];
  });
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-35% 0px -55% 0px" }
  );

  document.querySelectorAll("main section[id], footer[id]").forEach((section) => {
    sectionObserver.observe(section);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

bookingForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(bookingForm);
  const receipt = formData.get("receipt");

  if (!receipt || receipt.size === 0) {
    bookingNote.textContent = "Please upload your payment receipt.";
    return;
  }

  if (receipt.size > 2 * 1024 * 1024) {
    bookingNote.textContent = "Please upload a receipt smaller than 2MB.";
    return;
  }

  bookingNote.textContent = "Saving your booking request...";
  const notificationWindow = window.open("", "_blank");

  fileToDataUrl(receipt)
    .then((receiptData) => {
      const booking = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
        reference: `SASMR-${Date.now().toString().slice(-6)}`,
        service: formData.get("service"),
        day: formData.get("day"),
        time: formData.get("time"),
        name: formData.get("name"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        receiptName: receipt.name,
        receiptData,
        status: "Pending",
        submittedAt: new Date().toLocaleString([], {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const bookings = [booking, ...getBookings()];
      saveBookings(bookings);
      renderAdminBookings();
      bookingForm.reset();
      syncSelectedService("Relaxation Massage - 1 Hour - ₦90,000");
      bookingNote.textContent = `Booking request submitted. Reference: ${booking.reference}. WhatsApp notification is opening now.`;
      notifyOwnerOnWhatsApp(booking, notificationWindow);
      document.querySelector("#admin")?.scrollIntoView({ behavior: "smooth", block: "start" });
    })
    .catch(() => {
      notificationWindow?.close();
      bookingNote.textContent = "Could not save this receipt. Please try another file.";
    });
});

adminList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-status]");

  if (!button) {
    return;
  }

  const bookings = getBookings().map((booking) =>
    booking.id === button.dataset.status ? { ...booking, status: button.dataset.nextStatus } : booking
  );

  saveBookings(bookings);
  renderAdminBookings();
});

clearBookingsButton?.addEventListener("click", () => {
  saveBookings([]);
  renderAdminBookings();
});

renderAdminBookings();
