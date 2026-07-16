// JavaScript Logic for Coalla Platform (Updated Stage 3)

// Global State
let partnersData = [];
let tutorsData = [];
let currentChatChannel = null;
let currentChatRecipientName = "";
let currentUser = null;

// Default Mock Data (No emojis, no long dashes, no Discord option)
const defaultPartners = [
    {
        id: "p1",
        name: "Lucas",
        subject: "Physique Générale",
        level: "Licence",
        mode: "Présentiel",
        location: "Lyon (Bibliothèque de la Part-Dieu)",
        contact: "lucas.m@exemple.fr",
        desc: "Je cherche un ou deux camarades de niveau licence scientifique pour travailler sur la thermodynamique et l'électromagnétisme deux fois par semaine en fin de journée.",
        date: Date.now() - 3600000 * 24,
        image: "",
        isUserCreated: false
    },
    {
        id: "p2",
        name: "Emma",
        subject: "Algorithmique et Python",
        level: "Lycée",
        mode: "Visioconférence",
        location: "",
        contact: "emma.python@exemple.fr",
        desc: "En terminale NSI, j'aimerais collaborer avec d'autres élèves pour préparer le projet de fin d'année et s'exercer sur les structures de données. Disponible le week-end.",
        date: Date.now() - 3600000 * 12,
        image: "",
        isUserCreated: false
    },
    {
        id: "p3",
        name: "Marc",
        subject: "Histoire contemporaine",
        level: "Licence",
        mode: "Visioconférence",
        location: "",
        contact: "marc.hist@exemple.fr",
        desc: "Étudiant en L2 histoire, je souhaite faire des sessions de révision en visioconférence pour s'interroger mutuellement sur les fiches de cours avant les examens partiels.",
        date: Date.now() - 3600000 * 48,
        image: "",
        isUserCreated: false
    },
    {
        id: "p4",
        name: "Sophie",
        subject: "Mathématiques Spécialité",
        level: "Classe Préparatoire",
        mode: "Présentiel",
        location: "Paris (Bibliothèque Sainte-Geneviève)",
        contact: "sophie.p@exemple.fr",
        desc: "Élève en prépa MPSI, je recherche un partenaire d'étude pour revoir les démonstrations d'analyse et d'algèbre linéaire. Séance idéale le samedi après-midi.",
        date: Date.now() - 3600000 * 2,
        image: "",
        isUserCreated: false
    }
];

const defaultTutors = [
    {
        id: "t1",
        name: "Professeur David",
        subject: "Mathématiques",
        level: "Lycée",
        price: 25,
        mode: "Présentiel et En ligne",
        contact: "david.maths.cours@exemple.fr",
        desc: "Diplômé d'un master de mathématiques appliquées, je propose des cours de soutien scolaire individualisés. Pédagogie active axée sur la résolution méthodique d'exercices et la reprise des bases.",
        date: Date.now() - 3600000 * 10,
        image: "",
        isUserCreated: false
    },
    {
        id: "t2",
        name: "Clara",
        subject: "Anglais et Préparation IELTS",
        level: "Tous niveaux",
        price: 20,
        mode: "En ligne uniquement",
        contact: "clara.english@exemple.fr",
        desc: "Bilingue ayant vécu 4 ans à Londres, j'accompagne les étudiants de tous niveaux pour améliorer leur expression orale ou préparer des certifications. Méthode interactive.",
        date: Date.now() - 3600000 * 36,
        image: "",
        isUserCreated: false
    },
    {
        id: "t3",
        name: "Thomas",
        subject: "Physique et Chimie",
        level: "Enseignement Supérieur",
        price: 30,
        mode: "Présentiel et En ligne",
        contact: "thomas.phys@exemple.fr",
        desc: "Doctorant en sciences physiques, je donne des cours particuliers aux étudiants en licence ou classes préparatoires. Explication intuitive des concepts physiques complexes.",
        date: Date.now() - 3600000 * 5,
        image: "",
        isUserCreated: false
    }
];

// Initialize Data on Load
function initData() {
    const localPartners = localStorage.getItem("coalla_partners");
    const localTutors = localStorage.getItem("coalla_tutors");

    if (localPartners) {
        partnersData = JSON.parse(localPartners);
    } else {
        partnersData = [...defaultPartners];
        localStorage.setItem("coalla_partners", JSON.stringify(partnersData));
    }

    if (localTutors) {
        tutorsData = JSON.parse(localTutors);
    } else {
        tutorsData = [...defaultTutors];
        localStorage.setItem("coalla_tutors", JSON.stringify(tutorsData));
    }

    // Load user account
    const localUser = localStorage.getItem("coalla_user");
    if (localUser) {
        currentUser = JSON.parse(localUser);
    }

    // Load theme preference
    const themePref = localStorage.getItem("coalla_theme");
    if (themePref === "dark") {
        document.body.classList.add("dark-mode");
        const themeToggle = document.getElementById("theme-toggle");
        if (themeToggle) themeToggle.checked = true;
    }
}

// Helper: Read file input as base64 data URL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve("");
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

// DOM Setup
document.addEventListener("DOMContentLoaded", () => {
    initData();
    initNavigation();
    initCarousel();
    initFilters();
    initModals();
    initForms();
    initChat();
    initAuth();
    initSettings();
    initScrollReveal();

    // Initial renders
    renderPartners();
    renderTutors();
    updateHeaderUI();
});

// 1. Navigation & Tabs
function initNavigation() {
    const navButtons = document.querySelectorAll(".nav-btn");
    const logoBtn = document.getElementById("logo-btn");

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("data-target");
            switchTab(targetId);
        });
    });

    logoBtn.addEventListener("click", () => {
        switchTab("home-section");
    });
}

function switchTab(targetSectionId) {
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach(btn => {
        const btnTarget = btn.getAttribute("data-target");
        if (btnTarget === targetSectionId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    const sections = document.querySelectorAll(".content-section");
    sections.forEach(section => {
        if (section.id === targetSectionId) {
            section.classList.add("active");
            window.scrollTo({ top: 0, behavior: "smooth" });
            // Trigger reveal animations in the newly shown section
            setTimeout(() => triggerRevealInSection(targetSectionId), 80);
        } else {
            section.classList.remove("active");
        }
    });
}

window.navigateToTab = function(targetSectionId) {
    switchTab(targetSectionId);
};

// 2. Carousel
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
            if (idx === carouselIndex) {
                indicator.classList.add("active");
            } else {
                indicator.classList.remove("active");
            }
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

    nextBtn.addEventListener("click", () => {
        nextSlide();
        resetAutoplay();
    });

    prevBtn.addEventListener("click", () => {
        prevSlide();
        resetAutoplay();
    });

    indicators.forEach((indicator) => {
        indicator.addEventListener("click", (e) => {
            carouselIndex = parseInt(e.target.getAttribute("data-slide"), 10);
            updateCarousel();
            resetAutoplay();
        });
    });

    function startAutoplay() {
        carouselInterval = setInterval(nextSlide, autoplayDelay);
    }

    function resetAutoplay() {
        clearInterval(carouselInterval);
        startAutoplay();
    }

    startAutoplay();
}

// 3. Modals Management (Including Detail Modal)
function initModals() {
    const partnerModal = document.getElementById("partner-modal");
    const tutorModal = document.getElementById("tutor-modal");
    const detailModal = document.getElementById("detail-modal");
    
    const openPartnerBtn = document.getElementById("open-partner-form-btn");
    const openTutorBtn = document.getElementById("open-tutor-form-btn");
    
    const closePartnerBtn = document.getElementById("close-partner-modal");
    const closeTutorBtn = document.getElementById("close-tutor-modal");
    const closeDetailBtn = document.getElementById("close-detail-modal");
    
    const cancelPartnerBtn = document.getElementById("cancel-partner-form");
    const cancelTutorBtn = document.getElementById("cancel-tutor-form");
    const cancelDetailBtn = document.getElementById("close-detail-btn");
    
    const partnerModeSelect = document.getElementById("p-mode");
    const partnerLocationGroup = document.getElementById("p-location-group");

    // Open/Close Handlers
    openPartnerBtn.addEventListener("click", () => {
        partnerModal.classList.add("active");
        document.body.style.overflow = "hidden";
        togglePartnerLocationField();
        // Pre-fill name with current user if logged in
        if (currentUser) {
            document.getElementById("p-name").value = currentUser.prenom + " " + currentUser.nom;
        }
    });

    openTutorBtn.addEventListener("click", () => {
        tutorModal.classList.add("active");
        document.body.style.overflow = "hidden";
        // Pre-fill name with current user if logged in
        if (currentUser) {
            document.getElementById("t-name").value = currentUser.prenom + " " + currentUser.nom;
        }
    });

    closePartnerBtn.addEventListener("click", closePartnerModal);
    cancelPartnerBtn.addEventListener("click", closePartnerModal);
    
    closeTutorBtn.addEventListener("click", closeTutorModal);
    cancelTutorBtn.addEventListener("click", closeTutorModal);

    closeDetailBtn.addEventListener("click", closeDetailModal);
    cancelDetailBtn.addEventListener("click", closeDetailModal);

    partnerModal.addEventListener("click", (e) => {
        if (e.target === partnerModal) closePartnerModal();
    });
    tutorModal.addEventListener("click", (e) => {
        if (e.target === tutorModal) closeTutorModal();
    });
    detailModal.addEventListener("click", (e) => {
        if (e.target === detailModal) closeDetailModal();
    });

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
    }

    function closeTutorModal() {
        tutorModal.classList.remove("active");
        document.body.style.overflow = "auto";
        document.getElementById("tutor-form").reset();
    }

    function closeDetailModal() {
        detailModal.classList.remove("active");
        document.body.style.overflow = "auto";
    }

    window.closePartnerModal = closePartnerModal;
    window.closeTutorModal = closeTutorModal;
    window.closeDetailModal = closeDetailModal;
}

// 4. Form Submissions (With Base64 file inputs)
function initForms() {
    const partnerForm = document.getElementById("partner-form");
    const tutorForm = document.getElementById("tutor-form");

    partnerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById("p-image-input");
        const file = fileInput.files[0];
        let base64Image = "";
        
        try {
            base64Image = await readFileAsDataURL(file);
        } catch (error) {
            console.error("Erreur lors de la lecture de l'image", error);
        }

        const newPartner = {
            id: "p_" + Date.now(),
            name: document.getElementById("p-name").value.trim(),
            subject: document.getElementById("p-subject").value.trim(),
            level: document.getElementById("p-level").value,
            mode: document.getElementById("p-mode").value,
            location: document.getElementById("p-mode").value === "Présentiel" ? document.getElementById("p-location").value.trim() : "",
            contact: document.getElementById("p-contact").value.trim(),
            desc: document.getElementById("p-desc").value.trim(),
            date: Date.now(),
            image: base64Image,
            isUserCreated: true
        };

        partnersData.unshift(newPartner);
        localStorage.setItem("coalla_partners", JSON.stringify(partnersData));
        
        renderPartners();
        window.closePartnerModal();
        showNotification("Votre annonce de recherche a été publiée");
    });

    tutorForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fileInput = document.getElementById("t-image-input");
        const file = fileInput.files[0];
        let base64Image = "";

        try {
            base64Image = await readFileAsDataURL(file);
        } catch (error) {
            console.error("Erreur lors de la lecture de l'image", error);
        }

        const newTutor = {
            id: "t_" + Date.now(),
            name: document.getElementById("t-name").value.trim(),
            subject: document.getElementById("t-subject").value.trim(),
            level: document.getElementById("t-level").value,
            price: parseFloat(document.getElementById("t-price").value),
            mode: document.getElementById("t-mode").value,
            contact: document.getElementById("t-contact").value.trim(),
            desc: document.getElementById("t-desc").value.trim(),
            date: Date.now(),
            image: base64Image,
            isUserCreated: true
        };

        tutorsData.unshift(newTutor);
        localStorage.setItem("coalla_tutors", JSON.stringify(tutorsData));

        renderTutors();
        window.closeTutorModal();
        showNotification("Votre profil de professeur a été publié");
    });
}

// Toast notification system (No emojis, no long dashes)
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
    }, 3000);
}

// 5. Filters Logic
function initFilters() {
    const partnerSearch = document.getElementById("partner-search-subject");
    const partnerLevel = document.getElementById("partner-filter-level");
    const partnerMode = document.getElementById("partner-filter-mode");
    const partnerReset = document.getElementById("reset-partner-filters");

    partnerSearch.addEventListener("input", renderPartners);
    partnerLevel.addEventListener("change", renderPartners);
    partnerMode.addEventListener("change", renderPartners);
    partnerReset.addEventListener("click", () => {
        partnerSearch.value = "";
        partnerLevel.value = "";
        partnerMode.value = "";
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
        tutorSearch.value = "";
        tutorLevel.value = "";
        tutorPrice.value = "";
        renderTutors();
    });
}

// Helper: Stylized banner HTML for announcement cards (replaces image block)
function buildCardBanner(item, type) {
    const isTutor = type === "tutor";
    const bannerClass = isTutor ? "card-banner card-banner-tutor" : "card-banner";
    const letter = isTutor
        ? (item.name ? item.name.charAt(0).toUpperCase() : "P")
        : (item.subject ? item.subject.charAt(0).toUpperCase() : "C");
    const subjectTag = isTutor ? item.subject : item.subject;
    const modeTag = item.mode || "";
    return `
        <div class="${bannerClass}">
            <span class="card-banner-letter">${letter}</span>
            <div class="card-banner-pill">
                <span class="card-banner-subject-tag">${subjectTag}</span>
                <span class="card-banner-mode-tag">${modeTag}</span>
            </div>
        </div>
    `;
}

// Helper: Staggered card reveal animation
function animateCardsIn(container) {
    const cards = container.querySelectorAll(".announcement-card");
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add("card-visible");
        }, index * 80);
    });
}

// 6. Renders Cards
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
                <p>Modifiez vos critères de recherche ou soyez le premier à poster une annonce.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement("div");
        card.className = "announcement-card";

        let locationHTML = "";
        if (item.mode === "Présentiel" && item.location) {
            locationHTML = `<span class="badge badge-mode">${item.location}</span>`;
        }

        let deleteBtnHTML = "";
        if (item.isUserCreated) {
            deleteBtnHTML = `<button class="delete-btn" onclick="event.stopPropagation(); deleteAnnouncement('partner', '${item.id}')">Supprimer</button>`;
        }

        card.innerHTML = `
            ${buildCardBanner(item, "partner")}
            <div class="card-content-body">
                <div class="card-top">
                    <div class="card-badges">
                        <span class="badge badge-level">${item.level}</span>
                        ${locationHTML}
                    </div>
                    <div class="card-title-row">
                        <h3 class="card-title">Camarade pour : ${item.subject}</h3>
                    </div>
                    <div class="card-author">Publié par ${item.name}</div>
                    <p class="card-desc">${item.desc}</p>
                </div>
                <div class="card-bottom">
                    <button class="btn btn-secondary card-contact-btn">Consulter</button>
                    <div class="card-actions-wrapper">
                        ${deleteBtnHTML}
                    </div>
                </div>
            </div>
        `;

        card.addEventListener("click", () => {
            openDetailModal("partner", item.id);
        });

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
            </div>
        `;
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement("div");
        card.className = "announcement-card";

        let deleteBtnHTML = "";
        if (item.isUserCreated) {
            deleteBtnHTML = `<button class="delete-btn" onclick="event.stopPropagation(); deleteAnnouncement('tutor', '${item.id}')">Supprimer</button>`;
        }

        card.innerHTML = `
            ${buildCardBanner(item, "tutor")}
            <div class="card-content-body">
                <div class="card-top">
                    <div class="card-badges">
                        <span class="badge badge-level">Cible : ${item.level}</span>
                    </div>
                    <div class="card-title-row">
                        <h3 class="card-title">${item.name}</h3>
                        <div class="card-price">${item.price} euros/h</div>
                    </div>
                    <div class="card-author">Professeur particulier</div>
                    <p class="card-desc">${item.desc}</p>
                </div>
                <div class="card-bottom">
                    <button class="btn btn-secondary card-contact-btn">Consulter</button>
                    <div class="card-actions-wrapper">
                        ${deleteBtnHTML}
                    </div>
                </div>
            </div>
        `;
        
        card.addEventListener("click", () => {
            openDetailModal("tutor", item.id);
        });

        listContainer.appendChild(card);
    });

    animateCardsIn(listContainer);
}

// 7. Open Detail Modal Logic (Initial letter backup style)
function openDetailModal(type, id) {
    const modal = document.getElementById("detail-modal");
    const item = type === "partner" 
        ? partnersData.find(x => x.id === id) 
        : tutorsData.find(x => x.id === id);

    if (!item) return;

    // Populate Fields
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

    // Image/Fallback management
    const imgWrapper = document.getElementById("detail-image-wrapper");
    if (item.image) {
        imgWrapper.innerHTML = `<img id="detail-image" src="${item.image}" alt="Illustration de l'annonce">`;
    } else {
        const initial = type === "partner" 
            ? (item.subject ? item.subject.charAt(0).toUpperCase() : "?")
            : (item.name ? item.name.charAt(0).toUpperCase() : "?");
        imgWrapper.innerHTML = `
            <div class="detail-initial-fallback">
                <span class="detail-fallback-letter">${initial}</span>
            </div>
        `;
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

    const badgesBox = document.getElementById("detail-badges");
    badgesBox.innerHTML = `
        <span class="badge badge-subject">${item.subject}</span>
        <span class="badge badge-level">${type === "partner" ? item.level : "Cible : " + item.level}</span>
        <span class="badge badge-mode">${item.mode}</span>
    `;

    const chatBtn = document.getElementById("start-chat-btn");
    const newChatBtn = chatBtn.cloneNode(true);
    chatBtn.parentNode.replaceChild(newChatBtn, chatBtn);
    
    newChatBtn.addEventListener("click", () => {
        window.closeDetailModal();
        openChatPanel(item.id, item.name);
    });

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

// 8. Direct Live Chat Logic
function initChat() {
    const chatPanel = document.getElementById("chat-panel");
    const closeChatBtn = document.getElementById("close-chat-btn");
    const chatInputForm = document.getElementById("chat-input-form");

    closeChatBtn.addEventListener("click", () => {
        chatPanel.classList.remove("active");
        currentChatChannel = null;
    });

    chatInputForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const inputEl = document.getElementById("chat-message-input");
        const text = inputEl.value.trim();
        if (!text || !currentChatChannel) return;

        appendAndSaveChatMessage("user", text);
        inputEl.value = "";
        
        triggerSimulatedReply(text);
    });
}

function openChatPanel(announcementId, authorName) {
    currentChatChannel = "chat_" + announcementId;
    currentChatRecipientName = authorName;

    const chatPanel = document.getElementById("chat-panel");
    document.getElementById("chat-recipient-name").textContent = authorName;
    
    // Set chat avatar fallback letter
    const avatarWrapper = document.getElementById("chat-recipient-avatar-wrapper");
    const initial = authorName ? authorName.charAt(0).toUpperCase() : "?";
    avatarWrapper.innerHTML = `
        <div class="chat-avatar-fallback" id="chat-recipient-avatar">
            <span>${initial}</span>
        </div>
    `;

    const messagesBox = document.getElementById("chat-messages");
    messagesBox.innerHTML = "";

    let history = [];
    const saved = localStorage.getItem(currentChatChannel);
    if (saved) {
        history = JSON.parse(saved);
    } else {
        history = [
            {
                sender: "recipient",
                text: "Bonjour ! Merci pour l'intérêt que vous portez à mon annonce. Comment puis-je vous aider ?",
                time: Date.now()
            }
        ];
        localStorage.setItem(currentChatChannel, JSON.stringify(history));
    }

    renderChatMessages(history);
    chatPanel.classList.add("active");
}

function renderChatMessages(history) {
    const messagesBox = document.getElementById("chat-messages");
    messagesBox.innerHTML = "";

    history.forEach(msg => {
        const bubble = document.createElement("div");
        bubble.className = `message-bubble ${msg.sender === "user" ? "message-sender" : "message-recipient"}`;
        bubble.textContent = msg.text;
        messagesBox.appendChild(bubble);
    });

    messagesBox.scrollTop = messagesBox.scrollHeight;
}

function appendAndSaveChatMessage(sender, text) {
    if (!currentChatChannel) return;
    
    let history = [];
    const saved = localStorage.getItem(currentChatChannel);
    if (saved) {
        history = JSON.parse(saved);
    }
    
    history.push({
        sender: sender,
        text: text,
        time: Date.now()
    });
    
    localStorage.setItem(currentChatChannel, JSON.stringify(history));
    renderChatMessages(history);
}

function triggerSimulatedReply(userMessage) {
    const textLower = userMessage.toLowerCase();
    let reply = "C'est une excellente idée ! Organisons une première séance pour voir si notre méthode de travail correspond. Préférez-vous que l'on s'appelle ?";

    if (textLower.includes("dispo") || textLower.includes("disponible") || textLower.includes("quand") || textLower.includes("heure")) {
        reply = "Je suis disponible principalement en fin de semaine ou en soirée. Qu'est-ce qui vous conviendrait le mieux ?";
    } else if (textLower.includes("tarif") || textLower.includes("prix") || textLower.includes("payer") || textLower.includes("combien")) {
        reply = "Mon tarif est fixe comme indiqué sur mon profil, mais je propose une première prise de contact gratuite de dix minutes pour faire le point.";
    } else if (textLower.includes("matiere") || textLower.includes("niveau") || textLower.includes("cours") || textLower.includes("revis")) {
        reply = "Tout à fait, nous pouvons cibler spécifiquement ces chapitres. Avez-vous déjà des exercices ou des fiches de cours à partager ?";
    } else if (textLower.includes("salut") || textLower.includes("bonjour") || textLower.includes("ca va")) {
        reply = "Bonjour ! J'espère que vous allez bien. Pouvez-vous m'en dire un peu plus sur votre projet d'étude ?";
    }

    setTimeout(() => {
        if (!currentChatChannel) return; 
        appendAndSaveChatMessage("recipient", reply);
    }, 1500);
}

// 9. Delete Logic
window.deleteAnnouncement = function(type, id) {
    if (type === "partner") {
        partnersData = partnersData.filter(item => item.id !== id);
        localStorage.setItem("coalla_partners", JSON.stringify(partnersData));
        renderPartners();
        showNotification("L'annonce a été retirée");
    } else if (type === "tutor") {
        tutorsData = tutorsData.filter(item => item.id !== id);
        localStorage.setItem("coalla_tutors", JSON.stringify(tutorsData));
        renderTutors();
        showNotification("L'offre de cours a été retirée");
    }
    localStorage.removeItem("chat_" + id);
};

/* ========================================
   AUTHENTICATION (Login / Signup / Logout)
   ======================================== */

function initAuth() {
    const loginModal = document.getElementById("login-modal");
    const signupModal = document.getElementById("signup-modal");
    const userMenuBtn = document.getElementById("user-menu-btn");
    const userDropdown = document.getElementById("user-dropdown");
    const settingsBtn = document.getElementById("settings-btn");

    // Open/close dropdown when clicking the user icon
    userMenuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle("active");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (!userDropdown.contains(e.target) && !userMenuBtn.contains(e.target)) {
            userDropdown.classList.remove("active");
        }
    });

    // Open login modal
    document.getElementById("dropdown-login-btn").addEventListener("click", () => {
        userDropdown.classList.remove("active");
        openLoginModal();
    });

    // Open signup modal
    document.getElementById("dropdown-signup-btn").addEventListener("click", () => {
        userDropdown.classList.remove("active");
        openSignupModal();
    });

    // Profile -> go to settings
    document.getElementById("dropdown-profile-btn").addEventListener("click", () => {
        userDropdown.classList.remove("active");
        switchTab("settings-section");
        loadProfileIntoForm();
    });

    // Settings dropdown item
    document.getElementById("dropdown-settings-btn").addEventListener("click", () => {
        userDropdown.classList.remove("active");
        switchTab("settings-section");
        loadProfileIntoForm();
    });

    // Settings gear icon
    if (settingsBtn) {
        settingsBtn.addEventListener("click", () => {
            switchTab("settings-section");
            loadProfileIntoForm();
        });
    }

    // Logout
    document.getElementById("dropdown-logout-btn").addEventListener("click", () => {
        userDropdown.classList.remove("active");
        logout();
    });

    // --- Login modal close handlers ---
    document.getElementById("close-login-modal").addEventListener("click", closeLoginModal);
    document.getElementById("cancel-login-btn").addEventListener("click", closeLoginModal);
    loginModal.addEventListener("click", (e) => {
        if (e.target === loginModal) closeLoginModal();
    });

    // --- Signup modal close handlers ---
    document.getElementById("close-signup-modal").addEventListener("click", closeSignupModal);
    document.getElementById("cancel-signup-btn").addEventListener("click", closeSignupModal);
    signupModal.addEventListener("click", (e) => {
        if (e.target === signupModal) closeSignupModal();
    });

    // --- Switch between login & signup ---
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

    // --- Form submissions ---
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

function handleLogin(e) {
    e.preventDefault();
    const pseudo = document.getElementById("login-pseudo").value.trim();
    const password = document.getElementById("login-password").value;
    const errorEl = document.getElementById("login-error");

    const stored = localStorage.getItem("coalla_account_" + pseudo.toLowerCase());
    if (!stored) {
        errorEl.textContent = "Aucun compte trouvé avec ce pseudo.";
        errorEl.style.display = "block";
        return;
    }

    const account = JSON.parse(stored);
    if (account.password !== password) {
        errorEl.textContent = "Mot de passe incorrect.";
        errorEl.style.display = "block";
        return;
    }

    // Success: store session user (without password)
    currentUser = {
        prenom: account.prenom,
        nom: account.nom,
        pseudo: account.pseudo,
        age: account.age,
        classe: account.classe,
        matiere: account.matiere,
        niveau: account.niveau,
        ville: account.ville
    };
    localStorage.setItem("coalla_user", JSON.stringify(currentUser));

    closeLoginModal();
    updateHeaderUI();
    showNotification("Connexion réussie. Bienvenue " + account.prenom + " !");
}

function handleSignup(e) {
    e.preventDefault();
    const errorEl = document.getElementById("signup-error");

    const password = document.getElementById("signup-password").value;
    const passwordConfirm = document.getElementById("signup-password-confirm").value;

    if (password !== passwordConfirm) {
        errorEl.textContent = "Les mots de passe ne correspondent pas.";
        errorEl.style.display = "block";
        return;
    }

    const pseudo = document.getElementById("signup-pseudo").value.trim();

    // Check uniqueness
    if (localStorage.getItem("coalla_account_" + pseudo.toLowerCase())) {
        errorEl.textContent = "Ce pseudo est déjà utilisé. Choisissez-en un autre.";
        errorEl.style.display = "block";
        return;
    }

    const account = {
        prenom: document.getElementById("signup-prenom").value.trim(),
        nom: document.getElementById("signup-nom").value.trim(),
        pseudo: pseudo,
        password: password,
        age: parseInt(document.getElementById("signup-age").value),
        classe: document.getElementById("signup-classe").value,
        matiere: document.getElementById("signup-matiere").value,
        niveau: document.getElementById("signup-niveau").value,
        ville: document.getElementById("signup-ville").value.trim()
    };

    // Store full account (with password)
    localStorage.setItem("coalla_account_" + pseudo.toLowerCase(), JSON.stringify(account));

    // Auto-login the new user
    currentUser = {
        prenom: account.prenom,
        nom: account.nom,
        pseudo: account.pseudo,
        age: account.age,
        classe: account.classe,
        matiere: account.matiere,
        niveau: account.niveau,
        ville: account.ville
    };
    localStorage.setItem("coalla_user", JSON.stringify(currentUser));

    closeSignupModal();
    updateHeaderUI();
    showNotification("Compte créé avec succès. Bienvenue " + account.prenom + " !");
}

function logout() {
    currentUser = null;
    localStorage.removeItem("coalla_user");
    updateHeaderUI();
    switchTab("home-section");
    showNotification("Vous êtes déconnecté.");
}

function updateHeaderUI() {
    const headerPseudo = document.getElementById("header-pseudo");
    const settingsBtn = document.getElementById("settings-btn");
    const dropdownPseudo = document.querySelector(".dropdown-pseudo");
    const dropdownRole = document.querySelector(".dropdown-role");

    // Toggle visibility of logged-in items
    const loggedItems = document.querySelectorAll(".dropdown-item-logged");
    const loggedOutItems = [
        document.getElementById("dropdown-login-btn"),
        document.getElementById("dropdown-signup-btn")
    ];

    if (currentUser) {
        headerPseudo.textContent = currentUser.prenom;
        if (settingsBtn) settingsBtn.style.display = "flex";
        if (dropdownPseudo) dropdownPseudo.textContent = currentUser.prenom + " " + currentUser.nom;
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

/* ========================================
   SETTINGS SECTION
   ======================================== */

function initSettings() {
    // Profile form submit
    document.getElementById("settings-profile-form").addEventListener("submit", (e) => {
        e.preventDefault();
        saveProfile();
    });

    // Theme toggle
    const themeToggle = document.getElementById("theme-toggle");
    themeToggle.addEventListener("change", () => {
        toggleTheme(themeToggle.checked);
    });

    // Delete account button
    document.getElementById("delete-account-btn").addEventListener("click", () => {
        deleteAccount();
    });
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

function saveProfile() {
    if (!currentUser) return;

    currentUser.prenom = document.getElementById("settings-prenom").value.trim();
    currentUser.nom = document.getElementById("settings-nom").value.trim();
    currentUser.age = parseInt(document.getElementById("settings-age").value);
    currentUser.classe = document.getElementById("settings-classe").value;
    currentUser.matiere = document.getElementById("settings-matiere").value;
    currentUser.niveau = document.getElementById("settings-niveau").value;
    currentUser.ville = document.getElementById("settings-ville").value.trim();

    // Update session user
    localStorage.setItem("coalla_user", JSON.stringify(currentUser));

    // Update full account record (preserve password)
    const accountKey = "coalla_account_" + currentUser.pseudo.toLowerCase();
    const stored = localStorage.getItem(accountKey);
    if (stored) {
        const account = JSON.parse(stored);
        Object.assign(account, currentUser);
        localStorage.setItem(accountKey, JSON.stringify(account));
    }

    updateHeaderUI();
    showNotification("Profil mis à jour avec succès.");
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

    const pseudo = currentUser.pseudo;
    const myPartners = partnersData.filter(item => item.name === pseudo);
    const myTutors = tutorsData.filter(item => item.name === pseudo);

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

function deleteAccount() {
    if (!currentUser) return;

    const confirmed = confirm("Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible et supprimera toutes vos annonces.");
    if (!confirmed) return;

    const pseudo = currentUser.pseudo;

    // Remove all user's announcements
    partnersData = partnersData.filter(item => item.name !== pseudo);
    tutorsData = tutorsData.filter(item => item.name !== pseudo);
    localStorage.setItem("coalla_partners", JSON.stringify(partnersData));
    localStorage.setItem("coalla_tutors", JSON.stringify(tutorsData));

    // Remove the account record
    localStorage.removeItem("coalla_account_" + pseudo.toLowerCase());

    // Remove session
    localStorage.removeItem("coalla_user");
    currentUser = null;

    updateHeaderUI();
    renderPartners();
    renderTutors();
    switchTab("home-section");
    showNotification("Votre compte a été supprimé.");
}

// Helper to escape HTML in user-generated content
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Expose renderUserAnnouncements globally for inline onclick handlers
window.renderUserAnnouncements = renderUserAnnouncements;

// Scroll-reveal system using IntersectionObserver
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
    }, {
        threshold: 0.08,
        rootMargin: "0px 0px -20px 0px"
    });

    revealElements.forEach(el => observer.observe(el));

    // Also trigger elements already visible on initial load after a short delay
    setTimeout(() => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const inView = rect.top < window.innerHeight && rect.bottom > 0;
            if (inView) {
                el.classList.add("visible");
                observer.unobserve(el);
            }
        });
    }, 120);
}

// Re-run reveal check after tab switch (exported for use in switchTab)
function triggerRevealInSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const revealEls = section.querySelectorAll(".reveal:not(.visible)");
    revealEls.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add("visible");
        }, index * 80);
    });
}
