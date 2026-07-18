// ============================================================
// JavaScript Logic for Coalla Platform
// Version 4 — Supabase backend (real shared data)
// ============================================================

// Global State
let partnersData = [];
let tutorsData = [];
let currentUser = null;
let currentConversationId = null;
let currentChatRecipientName = "";
let chatSubscription = null;

// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
    loadThemePreference();
    initNavigation();
    initCarousel();
    initFilters();
    initModals();
    initForms();
    initChat();
    initAuth();
    initSettings();
    initScrollReveal();

    // Restore Supabase session + load data
    await restoreSession();
    await loadData();
    renderPartners();
    renderTutors();
    updateHeaderUI();
});

// ============================================================
// THEME (localStorage — purely cosmetic, stays local)
// ============================================================
function loadThemePreference() {
    const themePref = localStorage.getItem("coalla_theme");
    if (themePref === "dark") {
        document.body.classList.add("dark-mode");
        const themeToggle = document.getElementById("theme-toggle");
        if (themeToggle) themeToggle.checked = true;
    }
}

// ============================================================
// DATA — Load from Supabase
// ============================================================
async function loadData() {
    showListLoading(true);
    try {
        const [partnersRes, tutorsRes] = await Promise.all([
            supabase.from("partners").select("*").order("created_at", { ascending: false }),
            supabase.from("tutors").select("*").order("created_at", { ascending: false })
        ]);

        if (partnersRes.error) throw partnersRes.error;
        if (tutorsRes.error) throw tutorsRes.error;

        partnersData = (partnersRes.data || []).map(normalizePartner);
        tutorsData = (tutorsRes.data || []).map(normalizeTutor);
    } catch (err) {
        console.error("Erreur de chargement des données:", err);
        showNotification("Impossible de charger les annonces. Vérifie la configuration Supabase.");
        partnersData = [];
        tutorsData = [];
    } finally {
        showListLoading(false);
    }
}

function normalizePartner(row) {
    return {
        id: row.id,
        owner_id: row.owner_id,
        name: row.name,
        subject: row.subject,
        level: row.level,
        mode: row.mode,
        location: row.location || "",
        contact: row.contact,
        desc: row.description,
        image: row.image_url || "",
        date: new Date(row.created_at).getTime(),
        is_example: row.is_example === true,
        isUserCreated: row.owner_id != null
    };
}

function normalizeTutor(row) {
    return {
        id: row.id,
        owner_id: row.owner_id,
        name: row.name,
        subject: row.subject,
        level: row.level,
        price: parseFloat(row.price) || 0,
        mode: row.mode,
        contact: row.contact,
        desc: row.description,
        image: row.image_url || "",
        date: new Date(row.created_at).getTime(),
        is_example: row.is_example === true,
        isUserCreated: row.owner_id != null
    };
}

function showListLoading(isLoading) {
    ["partners-list", "tutors-list"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (isLoading) {
            el.innerHTML = '<div class="empty-state"><h3>Chargement des annonces...</h3></div>';
        }
    });
}

// ============================================================
// NAVIGATION & TABS
// ============================================================
function initNavigation() {
    const navButtons = document.querySelectorAll(".nav-btn");
    const logoBtn = document.getElementById("logo-btn");

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            switchTab(btn.getAttribute("data-target"));
        });
    });

    if (logoBtn) {
        logoBtn.addEventListener("click", () => switchTab("home-section"));
    }
}

function switchTab(targetSectionId) {
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach(btn => {
        if (btn.getAttribute("data-target") === targetSectionId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    document.querySelectorAll(".content-section").forEach(section => {
        if (section.id === targetSectionId) {
            section.classList.add("active");
            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(() => triggerRevealInSection(targetSectionId), 80);
            if (targetSectionId === "partners-section" || targetSectionId === "tutors-section") {
                loadData().then(() => {
                    if (targetSectionId === "partners-section") renderPartners();
                    else renderTutors();
                });
            }
        } else {
            section.classList.remove("active");
        }
    });
}

window.navigateToTab = function(targetSectionId) {
    switchTab(targetSectionId);
};

// ============================================================
// CAROUSEL
// ============================================================
let carouselIndex = 0;
let carouselInterval;
const autoplayDelay = 5000;

function initCarousel() {
    const track = document.getElementById("carousel-track");
    const slides = document.querySelectorAll(".carousel-slide");
    const prevBtn = document.getElementById("carousel-prev");
    const nextBtn = document.getElementById("carousel-next");
    const indicators = document.querySelectorAll(".carousel-indicators .indicator");

    if (!track || slides.length === 0) return;

    function updateCarousel() {
        track.style.transform = `translateX(-${carouselIndex * 100}%)`;
        indicators.forEach((indicator, idx) => {
            indicator.classList.toggle("active", idx === carouselIndex);
        });
    }

    function nextSlide() {
        carouselIndex = (carouselIndex + 1) % slides.length;
        updateCarousel();
    }

    function prevSlide() {
        carouselIndex = (carouselIndex - 1 + slides.length) % slides.length;
        updateCarousel();
    }

    nextBtn.addEventListener("click", () => { nextSlide(); resetAutoplay(); });
    prevBtn.addEventListener("click", () => { prevSlide(); resetAutoplay(); });

    indicators.forEach((indicator) => {
        indicator.addEventListener("click", (e) => {
            carouselIndex = parseInt(e.target.getAttribute("data-slide"), 10);
            updateCarousel();
            resetAutoplay();
        });
    });

    function startAutoplay() { carouselInterval = setInterval(nextSlide, autoplayDelay); }
    function resetAutoplay() { clearInterval(carouselInterval); startAutoplay(); }

    startAutoplay();
}

// ============================================================
// MODALS
// ============================================================
function initModals() {
    const partnerModal = document.getElementById("partner-modal");
    const tutorModal = document.getElementById("tutor-modal");
    const detailModal = document.getElementById("detail-modal");

    const openPartnerBtn = document.getElementById("open-partner-form-btn");
    const openTutorBtn = document.getElementById("open-tutor-form-btn");

    const partnerModeSelect = document.getElementById("p-mode");
    const partnerLocationGroup = document.getElementById("p-location-group");

    openPartnerBtn.addEventListener("click", () => {
        if (!currentUser) {
            showNotification("Connectez-vous pour publier une annonce.");
            openLoginModal();
            return;
        }
        partnerModal.classList.add("active");
        document.body.style.overflow = "hidden";
        togglePartnerLocationField();
        document.getElementById("p-name").value = currentUser.pseudo;
        document.getElementById("p-contact").value = currentUser.email || "";
    });

    openTutorBtn.addEventListener("click", () => {
        if (!currentUser) {
            showNotification("Connectez-vous pour publier une annonce.");
            openLoginModal();
            return;
        }
        tutorModal.classList.add("active");
        document.body.style.overflow = "hidden";
        document.getElementById("t-name").value = currentUser.pseudo;
        document.getElementById("t-contact").value = currentUser.email || "";
    });

    document.getElementById("close-partner-modal").addEventListener("click", closePartnerModal);
    document.getElementById("cancel-partner-form").addEventListener("click", closePartnerModal);
    document.getElementById("close-tutor-modal").addEventListener("click", closeTutorModal);
    document.getElementById("cancel-tutor-form").addEventListener("click", closeTutorModal);
    document.getElementById("close-detail-modal").addEventListener("click", closeDetailModal);
    document.getElementById("close-detail-btn").addEventListener("click", closeDetailModal);

    partnerModal.addEventListener("click", (e) => { if (e.target === partnerModal) closePartnerModal(); });
    tutorModal.addEventListener("click", (e) => { if (e.target === tutorModal) closeTutorModal(); });
    detailModal.addEventListener("click", (e) => { if (e.target === detailModal) closeDetailModal(); });

    partnerModeSelect.addEventListener("change", togglePartnerLocationField);

    function togglePartnerLocationField() {
        if (partnerModeSelect.value === "Présentiel") {
            partnerLocationGroup.style.display = "flex";
            document.getElementById("p-location").setAttribute("required", "required");
        } else {
            partnerLocationGroup.style.display = "none";
            document.getElementById("p-location").removeAttribute("required");
        }
    }

    function closePartnerModal() {
        partnerModal.classList.remove("active");
        document.body.style.overflow = "auto";
        document.getElementById("partner-form").reset();
        hidePreview("p-image-preview");
    }

    function closeTutorModal() {
        tutorModal.classList.remove("active");
        document.body.style.overflow = "auto";
        document.getElementById("tutor-form").reset();
        hidePreview("t-image-preview");
    }

    function closeDetailModal() {
        detailModal.classList.remove("active");
        document.body.style.overflow = "auto";
    }

    window.closePartnerModal = closePartnerModal;
    window.closeTutorModal = closeTutorModal;
    window.closeDetailModal = closeDetailModal;

    initImagePreview("p-image-input", "p-image-preview");
    initImagePreview("t-image-input", "t-image-preview");
}

function initImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener("change", () => {
        const file = input.files[0];
        const preview = document.getElementById(previewId);
        if (!file || !preview) {
            hidePreview(previewId);
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.querySelector("img").src = e.target.result;
            preview.style.display = "block";
        };
        reader.readAsDataURL(file);
    });

    const removeBtn = document.getElementById(previewId.replace("image-preview", "preview-remove"));
    if (removeBtn) {
        removeBtn.addEventListener("click", () => {
            input.value = "";
            hidePreview(previewId);
        });
    }
}

function hidePreview(previewId) {
    const preview = document.getElementById(previewId);
    if (preview) {
        preview.style.display = "none";
        const img = preview.querySelector("img");
        if (img) img.src = "";
    }
}

// ============================================================
// FORM SUBMISSIONS — Insert into Supabase
// ============================================================
function initForms() {
    document.getElementById("partner-form").addEventListener("submit", handlePartnerSubmit);
    document.getElementById("tutor-form").addEventListener("submit", handleTutorSubmit);
}

async function handlePartnerSubmit(e) {
    e.preventDefault();
    if (!currentUser) { showNotification("Connectez-vous pour publier."); return; }

    const submitBtn = e.target.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Publication...";

    try {
        const fileInput = document.getElementById("p-image-input");
        const imageUrl = await uploadImage(fileInput.files[0]);

        const insert = {
            owner_id: currentUser.id,
            name: document.getElementById("p-name").value.trim(),
            subject: document.getElementById("p-subject").value.trim(),
            level: document.getElementById("p-level").value,
            mode: document.getElementById("p-mode").value,
            location: document.getElementById("p-mode").value === "Présentiel" ? document.getElementById("p-location").value.trim() : "",
            contact: document.getElementById("p-contact").value.trim(),
            description: document.getElementById("p-desc").value.trim(),
            image_url: imageUrl
        };

        const { data, error } = await supabase.from("partners").insert(insert).select().single();
        if (error) throw error;

        partnersData.unshift(normalizePartner(data));
        renderPartners();
        window.closePartnerModal();
        showNotification("Votre annonce a été publiée.");
    } catch (err) {
        console.error(err);
        showNotification("Erreur lors de la publication: " + (err.message || err));
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Publier mon annonce";
    }
}

async function handleTutorSubmit(e) {
    e.preventDefault();
    if (!currentUser) { showNotification("Connectez-vous pour publier."); return; }

    const submitBtn = e.target.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Publication...";

    try {
        const fileInput = document.getElementById("t-image-input");
        const imageUrl = await uploadImage(fileInput.files[0]);

        const insert = {
            owner_id: currentUser.id,
            name: document.getElementById("t-name").value.trim(),
            subject: document.getElementById("t-subject").value.trim(),
            level: document.getElementById("t-level").value,
            price: parseFloat(document.getElementById("t-price").value),
            mode: document.getElementById("t-mode").value,
            contact: document.getElementById("t-contact").value.trim(),
            description: document.getElementById("t-desc").value.trim(),
            image_url: imageUrl
        };

        const { data, error } = await supabase.from("tutors").insert(insert).select().single();
        if (error) throw error;

        tutorsData.unshift(normalizeTutor(data));
        renderTutors();
        window.closeTutorModal();
        showNotification("Votre profil de professeur a été publié.");
    } catch (err) {
        console.error(err);
        showNotification("Erreur lors de la publication: " + (err.message || err));
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Publier mon offre";
    }
}

async function uploadImage(file) {
    if (!file) return "";
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${currentUser.id}/${fileName}`;
    const { error } = await supabase.storage.from("annonces").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("annonces").getPublicUrl(path);
    return data.publicUrl;
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showNotification(message) {
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.textContent = message;

    Object.assign(toast.style, {
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        backgroundColor: "#0f766e",
        color: "white",
        padding: "1rem 1.5rem",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: "1000",
        fontFamily: "'Inter', sans-serif",
        fontSize: "0.9rem",
        fontWeight: "500",
        opacity: "0",
        transform: "translateY(10px)",
        transition: "all 0.3s ease"
    });

    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    }, 10);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ============================================================
// FILTERS
// ============================================================
function initFilters() {
    const partnerSearch = document.getElementById("partner-search-subject");
    const partnerLevel = document.getElementById("partner-filter-level");
    const partnerMode = document.getElementById("partner-filter-mode");
    const partnerReset = document.getElementById("reset-partner-filters");

    partnerSearch.addEventListener("input", renderPartners);
    partnerLevel.addEventListener("change", renderPartners);
    partnerMode.addEventListener("change", renderPartners);
    partnerReset.addEventListener("click", () => {
        partnerSearch.value = ""; partnerLevel.value = ""; partnerMode.value = "";
        renderPartners();
    });

    const tutorSearch = document.getElementById("tutor-search-subject");
    const tutorLevel = document.getElementById("tutor-filter-level");
    const tutorPrice = document.getElementById("tutor-filter-price");
    const tutorReset = document.getElementById("reset-tutor-filters");

    tutorSearch.addEventListener("input", renderTutors);
    tutorLevel.addEventListener("change", renderTutors);
    tutorPrice.addEventListener("input", renderTutors);
    tutorReset.addEventListener("click", () => {
        tutorSearch.value = ""; tutorLevel.value = ""; tutorPrice.value = "";
        renderTutors();
    });
}

// ============================================================
// CARD BANNER HELPER
// ============================================================
function buildCardBanner(item, type) {
    const isTutor = type === "tutor";
    const bannerClass = isTutor ? "card-banner card-banner-tutor" : "card-banner";
    const letter = isTutor
        ? (item.name ? item.name.charAt(0).toUpperCase() : "P")
        : (item.subject ? item.subject.charAt(0).toUpperCase() : "C");
    return `
        <div class="${bannerClass}">
            <span class="card-banner-letter">${escapeHtml(letter)}</span>
            <div class="card-banner-pill">
                <span class="card-banner-subject-tag">${escapeHtml(item.subject)}</span>
                <span class="card-banner-mode-tag">${escapeHtml(item.mode || "")}</span>
            </div>
        </div>
    `;
}

function animateCardsIn(container) {
    const cards = container.querySelectorAll(".announcement-card");
    cards.forEach((card, index) => {
        setTimeout(() => card.classList.add("card-visible"), index * 80);
    });
}

// ============================================================
// RENDER — Partners & Tutors
// ============================================================
function renderPartners() {
    const listContainer = document.getElementById("partners-list");
    if (!listContainer) return;

    const querySubject = document.getElementById("partner-search-subject").value.toLowerCase().trim();
    const filterLevel = document.getElementById("partner-filter-level").value;
    const filterMode = document.getElementById("partner-filter-mode").value;

    const filtered = partnersData.filter(item => {
        const matchesSubject = item.subject.toLowerCase().includes(querySubject);
        const matchesLevel = !filterLevel || item.level === filterLevel;
        const matchesMode = !filterMode || item.mode === filterMode;
        return matchesSubject && matchesLevel && matchesMode;
    });

    listContainer.innerHTML = "";

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <h3>Aucun camarade trouvé</h3>
                <p>Modifiez vos critères ou soyez le premier à poster une annonce.</p>
            </div>`;
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement("div");
        card.className = "announcement-card";

        let locationHTML = "";
        if (item.mode === "Présentiel" && item.location) {
            locationHTML = `<span class="badge badge-mode">${escapeHtml(item.location)}</span>`;
        }

        let deleteBtnHTML = "";
        if (canDelete(item)) {
            deleteBtnHTML = `<button class="delete-btn" onclick="event.stopPropagation(); deleteAnnouncement('partner', '${item.id}')">Supprimer</button>`;
        }

        card.innerHTML = `
            ${buildCardBanner(item, "partner")}
            <div class="card-content-body">
                <div class="card-top">
                    <div class="card-badges">
                        <span class="badge badge-level">${escapeHtml(item.level)}</span>
                        ${locationHTML}
                    </div>
                    <div class="card-title-row">
                        <h3 class="card-title">Camarade pour : ${escapeHtml(item.subject)}</h3>
                    </div>
                    <div class="card-author">Publié par ${escapeHtml(item.name)}</div>
                    <p class="card-desc">${escapeHtml(item.desc)}</p>
                </div>
                <div class="card-bottom">
                    <button class="btn btn-secondary card-contact-btn">Consulter</button>
                    <div class="card-actions-wrapper">${deleteBtnHTML}</div>
                </div>
            </div>`;

        card.addEventListener("click", () => openDetailModal("partner", item.id));
        listContainer.appendChild(card);
    });

    animateCardsIn(listContainer);
}

function renderTutors() {
    const listContainer = document.getElementById("tutors-list");
    if (!listContainer) return;

    const querySubject = document.getElementById("tutor-search-subject").value.toLowerCase().trim();
    const filterLevel = document.getElementById("tutor-filter-level").value;
    const filterPrice = document.getElementById("tutor-filter-price").value;

    const filtered = tutorsData.filter(item => {
        const matchesSubject = item.subject.toLowerCase().includes(querySubject);
        const matchesLevel = !filterLevel || item.level === filterLevel;
        const matchesPrice = !filterPrice || item.price <= parseFloat(filterPrice);
        return matchesSubject && matchesLevel && matchesPrice;
    });

    listContainer.innerHTML = "";

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <h3>Aucun professeur trouvé</h3>
                <p>Aucun profil ne correspond à vos filtres actuels.</p>
            </div>`;
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement("div");
        card.className = "announcement-card";

        let deleteBtnHTML = "";
        if (canDelete(item)) {
            deleteBtnHTML = `<button class="delete-btn" onclick="event.stopPropagation(); deleteAnnouncement('tutor', '${item.id}')">Supprimer</button>`;
        }

        card.innerHTML = `
            ${buildCardBanner(item, "tutor")}
            <div class="card-content-body">
                <div class="card-top">
                    <div class="card-badges">
                        <span class="badge badge-level">Cible : ${escapeHtml(item.level)}</span>
                    </div>
                    <div class="card-title-row">
                        <h3 class="card-title">${escapeHtml(item.name)}</h3>
                        <div class="card-price">${item.price} euros/h</div>
                    </div>
                    <div class="card-author">Professeur particulier</div>
                    <p class="card-desc">${escapeHtml(item.desc)}</p>
                </div>
                <div class="card-bottom">
                    <button class="btn btn-secondary card-contact-btn">Consulter</button>
                    <div class="card-actions-wrapper">${deleteBtnHTML}</div>
                </div>
            </div>`;

        card.addEventListener("click", () => openDetailModal("tutor", item.id));
        listContainer.appendChild(card);
    });

    animateCardsIn(listContainer);
}

function canDelete(item) {
    if (item.is_example) return false;
    return currentUser && item.owner_id === currentUser.id;
}

// ============================================================
// DETAIL MODAL
// ============================================================
function openDetailModal(type, id) {
    const modal = document.getElementById("detail-modal");
    const item = type === "partner"
        ? partnersData.find(x => x.id === id)
        : tutorsData.find(x => x.id === id);

    if (!item) return;

    document.getElementById("detail-modal-title").textContent = type === "partner" ? "Détails de la recherche" : "Profil du Professeur";
    document.getElementById("detail-subject").textContent = type === "partner" ? "Camarade pour : " + item.subject : item.name;
    document.getElementById("detail-author").textContent = type === "partner" ? "Publié par " + item.name : "Professeur particulier";

    const priceBox = document.getElementById("detail-price-box");
    if (type === "tutor") {
        priceBox.style.display = "block";
        document.getElementById("detail-price").textContent = item.price;
    } else {
        priceBox.style.display = "none";
    }

    const imgWrapper = document.getElementById("detail-image-wrapper");
    if (item.image) {
        imgWrapper.innerHTML = `<img id="detail-image" src="${escapeAttr(item.image)}" alt="Illustration de l'annonce">`;
    } else {
        const initial = type === "partner"
            ? (item.subject ? item.subject.charAt(0).toUpperCase() : "?")
            : (item.name ? item.name.charAt(0).toUpperCase() : "?");
        imgWrapper.innerHTML = `
            <div class="detail-initial-fallback">
                <span class="detail-fallback-letter">${escapeHtml(initial)}</span>
            </div>`;
    }

    document.getElementById("detail-desc").textContent = item.desc;
    document.getElementById("detail-mode").textContent = item.mode;
    document.getElementById("detail-contact").textContent = item.contact;

    const locationWrapper = document.getElementById("detail-location-wrapper");
    if (type === "partner" && item.mode === "Présentiel" && item.location) {
        locationWrapper.style.display = "flex";
        document.getElementById("detail-location").textContent = item.location;
    } else {
        locationWrapper.style.display = "none";
    }

    document.getElementById("detail-badges").innerHTML = `
        <span class="badge badge-subject">${escapeHtml(item.subject)}</span>
        <span class="badge badge-level">${escapeHtml(type === "partner" ? item.level : "Cible : " + item.level)}</span>
        <span class="badge badge-mode">${escapeHtml(item.mode)}</span>`;

    const chatBtn = document.getElementById("start-chat-btn");
    const newChatBtn = chatBtn.cloneNode(true);
    chatBtn.parentNode.replaceChild(newChatBtn, chatBtn);

    newChatBtn.addEventListener("click", () => {
        window.closeDetailModal();
        openChatPanel(item.id, type, item.name);
    });

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

// ============================================================
// CHAT — Real conversations between users
// ============================================================
function initChat() {
    const chatPanel = document.getElementById("chat-panel");
    document.getElementById("close-chat-btn").addEventListener("click", () => {
        chatPanel.classList.remove("active");
        currentConversationId = null;
        if (chatSubscription) {
            chatSubscription.unsubscribe();
            chatSubscription = null;
        }
    });

    document.getElementById("chat-input-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const inputEl = document.getElementById("chat-message-input");
        const text = inputEl.value.trim();
        if (!text || !currentConversationId) return;
        inputEl.value = "";

        try {
            const { error } = await supabase.from("messages").insert({
                conversation_id: currentConversationId,
                sender_id: currentUser.id,
                text: text
            });
            if (error) throw error;
        } catch (err) {
            console.error(err);
            showNotification("Message non envoyé.");
        }
    });
}

async function openChatPanel(adId, adType, authorName) {
    if (!currentUser) {
        showNotification("Connectez-vous pour discuter.");
        openLoginModal();
        return;
    }

    currentChatRecipientName = authorName;
    document.getElementById("chat-recipient-name").textContent = authorName;

    const avatarWrapper = document.getElementById("chat-recipient-avatar-wrapper");
    const initial = authorName ? authorName.charAt(0).toUpperCase() : "?";
    avatarWrapper.innerHTML = `
        <div class="chat-avatar-fallback">
            <span>${escapeHtml(initial)}</span>
        </div>`;

    document.getElementById("chat-messages").innerHTML = "";

    try {
        const table = adType === "tutor" ? "tutors" : "partners";
        const { data: ad } = await supabase.from(table).select("owner_id").eq("id", adId).single();
        const adOwnerId = ad ? ad.owner_id : null;

        if (adOwnerId && adOwnerId === currentUser.id) {
            showNotification("C'est votre propre annonce.");
            return;
        }

        let convId = null;
        const { data: existing } = await supabase
            .from("conversations")
            .select("id")
            .eq("ad_id", adId)
            .eq("participant_a", currentUser.id)
            .maybeSingle();

        if (existing && existing.id) {
            convId = existing.id;
        } else {
            const { data: existingB } = await supabase
                .from("conversations")
                .select("id")
                .eq("ad_id", adId)
                .eq("participant_b", currentUser.id)
                .maybeSingle();
            if (existingB && existingB.id) {
                convId = existingB.id;
            }
        }

        if (!convId) {
            const insert = {
                ad_id: adId,
                ad_type: adType,
                participant_a: currentUser.id,
                participant_b: adOwnerId || null
            };
            const { data: created, error } = await supabase
                .from("conversations").insert(insert).select().single();
            if (error) throw error;
            convId = created.id;
        }

        currentConversationId = convId;
        await loadConversationMessages(convId);

        if (chatSubscription) chatSubscription.unsubscribe();
        chatSubscription = supabase
            .channel("messages:" + convId)
            .on("postgres_changes",
                { event: "INSERT", schema: "public", table: "messages", filter: "conversation_id=eq." + convId },
                () => loadConversationMessages(convId))
            .subscribe();

    } catch (err) {
        console.error(err);
        showNotification("Impossible d'ouvrir la conversation.");
    }

    document.getElementById("chat-panel").classList.add("active");
}

async function loadConversationMessages(convId) {
    try {
        const { data, error } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", convId)
            .order("created_at", { ascending: true });

        if (error) throw error;

        const messagesBox = document.getElementById("chat-messages");
        messagesBox.innerHTML = "";

        const history = (data || []).map(m => ({
            sender: m.sender_id === currentUser.id ? "user" : "recipient",
            text: m.text
        }));

        history.forEach(msg => {
            const bubble = document.createElement("div");
            bubble.className = `message-bubble ${msg.sender === "user" ? "message-sender" : "message-recipient"}`;
            bubble.textContent = msg.text;
            messagesBox.appendChild(bubble);
        });

        messagesBox.scrollTop = messagesBox.scrollHeight;
    } catch (err) {
        console.error(err);
    }
}

// ============================================================
// DELETE
// ============================================================
window.deleteAnnouncement = async function(type, id) {
    const table = type === "tutor" ? "tutors" : "partners";
    const item = (type === "tutor" ? tutorsData : partnersData).find(x => x.id === id);

    if (!canDelete(item)) {
        showNotification("Vous ne pouvez pas supprimer cette annonce.");
        return;
    }

    if (!confirm("Supprimer définitivement cette annonce ?")) return;

    try {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;

        if (type === "tutor") {
            tutorsData = tutorsData.filter(x => x.id !== id);
            renderTutors();
        } else {
            partnersData = partnersData.filter(x => x.id !== id);
            renderPartners();
        }
        if (document.getElementById("settings-section").classList.contains("active")) {
            renderUserAnnouncements();
        }
        showNotification("L'annonce a été retirée.");
    } catch (err) {
        console.error(err);
        showNotification("Erreur lors de la suppression.");
    }
};

// ============================================================
// AUTHENTICATION — Supabase Auth
// ============================================================
function initAuth() {
    const loginModal = document.getElementById("login-modal");
    const signupModal = document.getElementById("signup-modal");
    const userMenuBtn = document.getElementById("user-menu-btn");
    const userDropdown = document.getElementById("user-dropdown");
    const settingsBtn = document.getElementById("settings-btn");

    userMenuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
        if (!userDropdown.contains(e.target) && !userMenuBtn.contains(e.target)) {
            userDropdown.classList.remove("active");
        }
    });

    document.getElementById("dropdown-login-btn").addEventListener("click", () => {
        userDropdown.classList.remove("active");
        openLoginModal();
    });
    document.getElementById("dropdown-signup-btn").addEventListener("click", () => {
        userDropdown.classList.remove("active");
        openSignupModal();
    });
    document.getElementById("dropdown-profile-btn").addEventListener("click", () => {
        userDropdown.classList.remove("active");
        switchTab("settings-section");
        loadProfileIntoForm();
    });
    document.getElementById("dropdown-settings-btn").addEventListener("click", () => {
        userDropdown.classList.remove("active");
        switchTab("settings-section");
        loadProfileIntoForm();
    });
    if (settingsBtn) {
        settingsBtn.addEventListener("click", () => {
            switchTab("settings-section");
            loadProfileIntoForm();
        });
    }
    document.getElementById("dropdown-logout-btn").addEventListener("click", () => {
        userDropdown.classList.remove("active");
        logout();
    });

    document.getElementById("close-login-modal").addEventListener("click", closeLoginModal);
    document.getElementById("cancel-login-btn").addEventListener("click", closeLoginModal);
    loginModal.addEventListener("click", (e) => { if (e.target === loginModal) closeLoginModal(); });

    document.getElementById("close-signup-modal").addEventListener("click", closeSignupModal);
    document.getElementById("cancel-signup-btn").addEventListener("click", closeSignupModal);
    signupModal.addEventListener("click", (e) => { if (e.target === signupModal) closeSignupModal(); });

    document.getElementById("goto-signup").addEventListener("click", (e) => {
        e.preventDefault();
        closeLoginModal();
        openSignupModal();
    });
    document.getElementById("goto-login").addEventListener("click", (e) => {
        e.preventDefault();
        closeSignupModal();
        openLoginModal();
    });

    document.getElementById("login-form").addEventListener("submit", handleLogin);
    document.getElementById("signup-form").addEventListener("submit", handleSignup);
}

function openLoginModal() {
    document.getElementById("login-error").style.display = "none";
    document.getElementById("login-form").reset();
    document.getElementById("login-modal").classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeLoginModal() {
    document.getElementById("login-modal").classList.remove("active");
    document.body.style.overflow = "auto";
}

function openSignupModal() {
    document.getElementById("signup-error").style.display = "none";
    document.getElementById("signup-form").reset();
    document.getElementById("signup-modal").classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeSignupModal() {
    document.getElementById("signup-modal").classList.remove("active");
    document.body.style.overflow = "auto";
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const errorEl = document.getElementById("login-error");

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        currentUser = await buildUserFromAuth(data.user);
        closeLoginModal();
        updateHeaderUI();
        await loadData();
        renderPartners();
        renderTutors();
        showNotification("Connexion réussie. Bienvenue " + (currentUser.pseudo || "") + " !");
    } catch (err) {
        errorEl.textContent = "Erreur: " + (err.message || "Connexion impossible.");
        errorEl.style.display = "block";
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const errorEl = document.getElementById("signup-error");

    const password = document.getElementById("signup-password").value;
    const passwordConfirm = document.getElementById("signup-password-confirm").value;
    if (password !== passwordConfirm) {
        errorEl.textContent = "Les mots de passe ne correspondent pas.";
        errorEl.style.display = "block";
        return;
    }

    const email = document.getElementById("signup-email").value.trim();
    const pseudo = document.getElementById("signup-pseudo").value.trim();

    const metadata = {
        pseudo: pseudo,
        prenom: document.getElementById("signup-prenom").value.trim(),
        nom: document.getElementById("signup-nom").value.trim(),
        age: parseInt(document.getElementById("signup-age").value),
        classe: document.getElementById("signup-classe").value,
        matiere: document.getElementById("signup-matiere").value,
        niveau: document.getElementById("signup-niveau").value,
        ville: document.getElementById("signup-ville").value.trim()
    };

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: { data: metadata }
        });
        if (error) throw error;

        closeSignupModal();
        if (data.user && !data.session) {
            showNotification("Compte créé ! Vérifiez votre email pour confirmer votre inscription.");
        } else if (data.session) {
            currentUser = await buildUserFromAuth(data.user);
            updateHeaderUI();
            showNotification("Compte créé avec succès. Bienvenue " + pseudo + " !");
        }
    } catch (err) {
        errorEl.textContent = "Erreur: " + (err.message || "Inscription impossible.");
        errorEl.style.display = "block";
    }
}

async function restoreSession() {
    try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
                currentUser = await buildUserFromAuth(userData.user);
            }
        }
    } catch (err) {
        console.error("Session restore error:", err);
    }
}

async function buildUserFromAuth(authUser) {
    if (!authUser) return null;
    const m = authUser.user_metadata || {};
    return {
        id: authUser.id,
        email: authUser.email,
        pseudo: m.pseudo || (authUser.email ? authUser.email.split("@")[0] : "utilisateur"),
        prenom: m.prenom || "",
        nom: m.nom || "",
        age: m.age || null,
        classe: m.classe || "",
        matiere: m.matiere || "",
        niveau: m.niveau || "",
        ville: m.ville || ""
    };
}

async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
    updateHeaderUI();
    switchTab("home-section");
    showNotification("Vous êtes déconnecté.");
}

function updateHeaderUI() {
    const headerPseudo = document.getElementById("header-pseudo");
    const settingsBtn = document.getElementById("settings-btn");
    const dropdownPseudo = document.querySelector(".dropdown-pseudo");
    const dropdownRole = document.querySelector(".dropdown-role");

    const loggedItems = document.querySelectorAll(".dropdown-item-logged");
    const loggedOutItems = [
        document.getElementById("dropdown-login-btn"),
        document.getElementById("dropdown-signup-btn")
    ];

    if (currentUser) {
        headerPseudo.textContent = currentUser.pseudo;
        if (settingsBtn) settingsBtn.style.display = "flex";
        if (dropdownPseudo) dropdownPseudo.textContent = currentUser.pseudo;
        if (dropdownRole) dropdownRole.textContent = currentUser.classe + " - " + currentUser.matiere;
        loggedItems.forEach(el => el.style.display = "flex");
        loggedOutItems.forEach(el => el.style.display = "none");
    } else {
        headerPseudo.textContent = "";
        if (settingsBtn) settingsBtn.style.display = "none";
        if (dropdownPseudo) dropdownPseudo.textContent = "Invité";
        if (dropdownRole) dropdownRole.textContent = "Non connecté";
        loggedItems.forEach(el => el.style.display = "none");
        loggedOutItems.forEach(el => el.style.display = "flex");
    }
}

// ============================================================
// SETTINGS
// ============================================================
function initSettings() {
    document.getElementById("settings-profile-form").addEventListener("submit", (e) => {
        e.preventDefault();
        saveProfile();
    });
    document.getElementById("theme-toggle").addEventListener("change", (e) => {
        toggleTheme(e.target.checked);
    });
    document.getElementById("delete-account-btn").addEventListener("click", deleteAccount);
}

function loadProfileIntoForm() {
    if (!currentUser) return;
    document.getElementById("settings-prenom").value = currentUser.prenom || "";
    document.getElementById("settings-nom").value = currentUser.nom || "";
    document.getElementById("settings-pseudo-display").value = currentUser.pseudo || "";
    document.getElementById("settings-age").value = currentUser.age || "";
    document.getElementById("settings-classe").value = currentUser.classe || "6ème";
    document.getElementById("settings-matiere").value = currentUser.matiere || "Mathématiques";
    document.getElementById("settings-niveau").value = currentUser.niveau || "Débutant";
    document.getElementById("settings-ville").value = currentUser.ville || "";
    renderUserAnnouncements();
}

async function saveProfile() {
    if (!currentUser) return;

    const newMetadata = {
        pseudo: currentUser.pseudo,
        prenom: document.getElementById("settings-prenom").value.trim(),
        nom: document.getElementById("settings-nom").value.trim(),
        age: parseInt(document.getElementById("settings-age").value),
        classe: document.getElementById("settings-classe").value,
        matiere: document.getElementById("settings-matiere").value,
        niveau: document.getElementById("settings-niveau").value,
        ville: document.getElementById("settings-ville").value.trim()
    };

    try {
        const { error } = await supabase.auth.updateUser({ data: newMetadata });
        if (error) throw error;
        Object.assign(currentUser, newMetadata);
        updateHeaderUI();
        showNotification("Profil mis à jour avec succès.");
    } catch (err) {
        console.error(err);
        showNotification("Erreur lors de la mise à jour du profil.");
    }
}

function toggleTheme(isDark) {
    if (isDark) {
        document.body.classList.add("dark-mode");
        localStorage.setItem("coalla_theme", "dark");
    } else {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("coalla_theme", "light");
    }
}

function renderUserAnnouncements() {
    const container = document.getElementById("settings-announcements-list");
    if (!container) return;

    if (!currentUser) {
        container.innerHTML = '<p class="settings-empty-text">Connectez-vous pour voir vos annonces.</p>';
        return;
    }

    const myPartners = partnersData.filter(item => item.owner_id === currentUser.id);
    const myTutors = tutorsData.filter(item => item.owner_id === currentUser.id);

    const total = myPartners.length + myTutors.length;
    if (total === 0) {
        container.innerHTML = '<p class="settings-empty-text">Aucune annonce publiée.</p>';
        return;
    }

    let html = "";
    myPartners.forEach(item => {
        html += '<div class="settings-announcement-item">' +
            '<div class="settings-announcement-info">' +
                '<div class="settings-announcement-title">' + escapeHtml(item.subject) + '</div>' +
                '<div class="settings-announcement-type">Camarade - ' + escapeHtml(item.level) + '</div>' +
            '</div>' +
            '<button class="delete-btn" onclick="deleteAnnouncement(\'partner\', \'' + item.id + '\'); renderUserAnnouncements();">Supprimer</button>' +
        '</div>';
    });
    myTutors.forEach(item => {
        html += '<div class="settings-announcement-item">' +
            '<div class="settings-announcement-info">' +
                '<div class="settings-announcement-title">' + escapeHtml(item.subject) + '</div>' +
                '<div class="settings-announcement-type">Professeur - ' + item.price + ' EUR/h</div>' +
            '</div>' +
            '<button class="delete-btn" onclick="deleteAnnouncement(\'tutor\', \'' + item.id + '\'); renderUserAnnouncements();">Supprimer</button>' +
        '</div>';
    });

    container.innerHTML = html;
}

async function deleteAccount() {
    if (!currentUser) return;
    if (!confirm("Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible et supprimera toutes vos annonces.")) return;

    try {
        await supabase.from("partners").delete().eq("owner_id", currentUser.id);
        await supabase.from("tutors").delete().eq("owner_id", currentUser.id);

        await supabase.auth.signOut();
        currentUser = null;
        updateHeaderUI();
        await loadData();
        renderPartners();
        renderTutors();
        switchTab("home-section");
        showNotification("Vos annonces ont été supprimées.");
    } catch (err) {
        console.error(err);
        showNotification("Erreur lors de la suppression.");
    }
}

window.renderUserAnnouncements = renderUserAnnouncements;

// ============================================================
// HELPERS
// ============================================================
function escapeHtml(text) {
    if (text == null) return "";
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}

function escapeAttr(text) {
    return escapeHtml(text).replace(/"/g, "&quot;");
}

// ============================================================
// SCROLL REVEAL
// ============================================================
function initScrollReveal() {
    const revealElements = document.querySelectorAll(".reveal");
    if (!revealElements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: "0px 0px -20px 0px" });

    revealElements.forEach(el => observer.observe(el));

    setTimeout(() => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                el.classList.add("visible");
                observer.unobserve(el);
            }
        });
    }, 120);
}

function triggerRevealInSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.querySelectorAll(".reveal:not(.visible)").forEach((el, index) => {
        setTimeout(() => el.classList.add("visible"), index * 80);
    });
}
