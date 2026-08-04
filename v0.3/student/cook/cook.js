document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) 
                     || JSON.parse(localStorage.getItem('currentUser')) 
                     || {};

    console.log("Current User Loaded:", currentUser);

    const nameElement = document.getElementById('cookName');
    const universityElement = document.getElementById('cookUniversity');
    
    if (nameElement) nameElement.textContent = currentUser.fullname || "Μάγειρας";
    if (universityElement && currentUser.university) universityElement.textContent = currentUser.university.toUpperCase();

    updateCookPointsUI(currentUser);

    checkAndCleanExpiredAds();
    loadPersonalAds(currentUser);
    loadIncomingRequests(currentUser);
});

function updateCookPointsUI(currentUser) {
    const pointElement = document.getElementById('cookPoints');
    if (!pointElement) return;

    if (currentUser.initialPoints === undefined) {
        currentUser.initialPoints = Number(currentUser.points || 0);
    }

    const basePoints = Number(currentUser.initialPoints);
    const currentCookName = (currentUser.fullname || "").trim().toLowerCase();
    const currentCookUni = (currentUser.university || "").trim().toLowerCase();
    
    const allRequests = JSON.parse(localStorage.getItem('allRequests')) || [];
    const allAds = JSON.parse(localStorage.getItem('allAds')) || [];

    let earnedFromOrders = 0;

    allRequests.forEach(req => {
        const parentAd = allAds.find(ad => String(ad.id) === String(req.adId)) || {};
        
        const reqCookName = (parentAd.cookName || parentAd.cook || req.cookName || "").trim().toLowerCase();
        const reqCookUni = (parentAd.university || "").trim().toLowerCase();

        const isMyCook = (currentCookName && reqCookName === currentCookName) || 
                         (currentCookUni && reqCookUni === currentCookUni);
        
        const isCompleted = String(req.status).trim().toLowerCase() === 'completed';

        if (isMyCook && isCompleted) {
            const servings = Number(req.requestedServings || req.servings || 1);
            
            if (req.earnedPoints !== undefined) {
                earnedFromOrders += Number(req.earnedPoints);
            } else {
                const base = 1;
                const bonus = (req.rating && Number(req.rating) > 3) ? 1 : 0;
                earnedFromOrders += (base + bonus) * servings;
            }
        }
    });

    const totalPoints = basePoints + earnedFromOrders;
    pointElement.textContent = totalPoints;
    currentUser.points = totalPoints;

    if (localStorage.getItem('currentUser')) 
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    if (sessionStorage.getItem('currentUser')) 
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    
}
function checkAndCleanExpiredAds() {
    let allAds = JSON.parse(localStorage.getItem('allAds')) || [];
    const now = Date.now();
    const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
    
    const updatedAds = allAds.filter(ad => {
        const createdTime = ad.createdAt || ad.id; 
        return (now - createdTime) <= FORTY_EIGHT_HOURS;
    });

    localStorage.setItem('allAds', JSON.stringify(updatedAds));
    return updatedAds;
}

function loadPersonalAds(currentUser) {
    const container = document.getElementById('cookAdsContainer');
    if (!container) return;

    container.innerHTML = '';

    const currentCookName = (currentUser.fullname || "").trim().toLowerCase();
    const userUniKey = (currentUser.university || "").trim().toLowerCase();
    
    const allAds = JSON.parse(localStorage.getItem('allAds')) || [];
    
    const activeAds = allAds.filter(ad => {
        const adCook = (ad.cookName || ad.cook || "").trim().toLowerCase();
        const adUni = (ad.university || "").trim().toLowerCase();
        
        const belongsToUser = !currentCookName 
            ? true 
            : ((adCook && adCook === currentCookName) || (userUniKey && adUni === userUniKey));
        
        const status = ad.status || 'active';
        return belongsToUser && status !== 'completed';
    });

    if (activeAds.length === 0) {
        container.innerHTML = '<p class="no-ads-message">Δεν έχετε αγγελίες αυτή τη στιγμή.</p>';
        return;
    }

    const defaultImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80';

    activeAds.forEach(ad => {
        const card = document.createElement('div');
        card.className = 'card shared-meal-card';

        const imgSrc = (ad.image && ad.image.trim() !== '') ? ad.image : defaultImg;

        card.innerHTML = `
            <div class="top-right-actions">
                <button class="icon-btn edit-btn-dots" title="Επεξεργασία" onclick="editAd(${ad.id})">⋮</button>
                <button class="icon-btn delete-btn-x" title="Διαγραφή" onclick="deleteAd(${ad.id})">✕</button>
            </div>

            <div class="meal-content-wrapper" style="display: flex; gap: 15px; align-items: center;">
                <img src="${imgSrc}" 
                     alt="${ad.title}" 
                     onerror="this.onerror=null; this.src='${defaultImg}';" 
                     style="width: 90px; height: 90px; object-fit: cover; border-radius: 8px; flex-shrink: 0;" />

                <div class="meal-info">
                    <h3 class="meal-title">${ad.title || 'Αγγελία'}</h3>
                    <p class="meal-portions"><b>Διεύθυνση:</b> ${ad.address || '-'}</p>
                    <p class="meal-portions"><b>Ώρα Παραλαβής:</b> ${ad.delivery_time || '-'}</p>
                    <p class="meal-portions"><b>Διαθέσιμες Μερίδες:</b> ${ad.servings ?? 0}</p>
                    ${ad.allergens ? `<p class="meal-portions" style="color: #ff6b6b;"><b>Αλλεργιογόνα:</b> ${ad.allergens}</p>` : ''}
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

function loadIncomingRequests(currentUser) {
    const requestsContainer = document.getElementById('cookRequestsContainer');
    if (!requestsContainer) return;

    requestsContainer.innerHTML = '';

    const currentCookName = (currentUser.fullname || "").trim().toLowerCase();
    const userUniKey = (currentUser.university || "").trim().toLowerCase();

    const allAds = JSON.parse(localStorage.getItem('allAds')) || [];
    const allRequests = JSON.parse(localStorage.getItem('allRequests')) || [];

    const myAds = allAds.filter(ad => {
        const adCook = (ad.cookName || ad.cook || "").trim().toLowerCase();
        const adUni = (ad.university || "").trim().toLowerCase();
        return !currentCookName ? true : ((adCook && adCook === currentCookName) || (userUniKey && adUni === userUniKey));
    });

    const myAdIds = myAds.map(ad => Number(ad.id));
    
    const myRequests = allRequests.filter(req => myAdIds.includes(Number(req.adId)) && req.status !== 'completed' && req.status !== 'rejected');

    if (myRequests.length === 0) {
        requestsContainer.innerHTML = '<p class="no-ads-message">Δεν υπάρχουν ενεργά αιτήματα αυτή τη στιγμή.</p>';
        return;
    }

    myRequests.forEach(req => {
        const parentAd = myAds.find(ad => ad.id == req.adId);
        const adTitle = parentAd ? parentAd.title : "Αγγελία";
        const reqStatus = req.status || 'pending';

        const card = document.createElement('div');
        card.className = 'request-card'; 

        let badgeHTML = reqStatus === 'accepted'
            ? `<span class="status-badge status-progress">Σε εξέλιξη</span>`
            : `<span class="status-badge status-active">Εκκρεμεί</span>`;

        let actionsHTML = '';
        if (reqStatus === 'pending') {
            actionsHTML = `
                <button class="sort-btn approve-btn" onclick="acceptRequest(${req.id})">Αποδοχή</button>
                <button class="sort-btn reject-btn" onclick="rejectRequest(${req.id})">Απόρριψη</button>
            `;
        } else if (reqStatus === 'accepted') {
            actionsHTML = `
                <button class="sort-btn confirm-pickup-btn" onclick="confirmPickup(${req.id})">Παραδόθηκε</button>
            `;
        }

        card.innerHTML = `
            <div class="meal-info">
                <h3 class="meal-title">${adTitle}</h3>
                <p class="meal-portions"><b>Από Φοιτητή:</b> ${req.consumerName || 'Φοιτητής'}</p>
                <p class="meal-portions"><b>Μερίδες που ζητήθηκαν:</b> ${req.requestedServings || 1}</p>
                <div class="status-container">
                    ${badgeHTML}
                </div>
            </div>
            <div class="request-actions">
                ${actionsHTML}
            </div>
        `;

        requestsContainer.appendChild(card);
    });
}

window.deleteAd = function(adId) {
    if (!confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την αγγελία;")) return;

    let allAds = JSON.parse(localStorage.getItem('allAds')) || [];
    let allRequests = JSON.parse(localStorage.getItem('allRequests')) || [];

    allAds = allAds.filter(ad => Number(ad.id) !== Number(adId));
    allRequests = allRequests.filter(req => Number(req.adId) !== Number(adId));

    localStorage.setItem('allAds', JSON.stringify(allAds));
    localStorage.setItem('allRequests', JSON.stringify(allRequests));

    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('currentUser')) || {};
    loadPersonalAds(currentUser);
    loadIncomingRequests(currentUser);
};

window.editAd = function(adId) {
    sessionStorage.setItem('editAdId', Number(adId));
    window.location.href = `ad/edit_ad.html?edit=${adId}`;
};

window.acceptRequest = function(requestId) {
    let allRequests = JSON.parse(localStorage.getItem('allRequests')) || [];
    let allAds = JSON.parse(localStorage.getItem('allAds')) || [];

    const reqIndex = allRequests.findIndex(r => Number(r.id) === Number(requestId));
    if (reqIndex === -1) return;

    const request = allRequests[reqIndex];
    const adIndex = allAds.findIndex(a => Number(a.id) === Number(request.adId));
    const neededServings = request.requestedServings || 1;

    if (adIndex !== -1 && allAds[adIndex].servings >= neededServings) {
        allAds[adIndex].servings -= neededServings;
        allRequests[reqIndex].status = 'accepted';

        localStorage.setItem('allAds', JSON.stringify(allAds));
        localStorage.setItem('allRequests', JSON.stringify(allRequests));

        alert(`Εγκρίθηκε το αίτημα του/της ${request.consumerName}!`);
        
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('currentUser')) || {};
        loadPersonalAds(currentUser);
        loadIncomingRequests(currentUser);
    } else {
        alert("Δεν υπάρχουν αρκετές διαθέσιμες μερίδες!");
    }
};

window.rejectRequest = function(requestId) {
    if (!confirm("Θέλετε να απορρίψετε αυτό το αίτημα;")) return;

    let allRequests = JSON.parse(localStorage.getItem('allRequests')) || [];
    const reqIndex = allRequests.findIndex(r => Number(r.id) === Number(requestId));
    
    if (reqIndex !== -1) {
        allRequests[reqIndex].status = 'rejected';
        localStorage.setItem('allRequests', JSON.stringify(allRequests));

        const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('currentUser')) || {};
        loadIncomingRequests(currentUser);
    }
};

window.confirmPickup = function(requestId) {
    let allRequests = JSON.parse(localStorage.getItem('allRequests')) || [];
    let allAds = JSON.parse(localStorage.getItem('allAds')) || [];

    const reqIndex = allRequests.findIndex(r => Number(r.id) === Number(requestId));
    if (reqIndex === -1) return;

    const request = allRequests[reqIndex];
    const parentAd = allAds.find(a => Number(a.id) === Number(request.adId)) || {};

    // 🎯 Ορισμός κατάστασης & αποθήκευση cookName
    allRequests[reqIndex].status = 'completed';
    allRequests[reqIndex].cookName = parentAd.cookName || parentAd.cook || request.cookName || "";

    // 🎯 Αρχικός υπολογισμός πόντων (1 βασικός πόντος ανά μερίδα)
    const servings = Number(request.requestedServings || request.servings || 1);
    allRequests[reqIndex].earnedPoints = servings; 

    const adIndex = allAds.findIndex(a => Number(a.id) === Number(request.adId));
    if (adIndex !== -1 && allAds[adIndex].servings === 0) {
        allAds[adIndex].status = 'completed';
    }

    localStorage.setItem('allRequests', JSON.stringify(allRequests));
    localStorage.setItem('allAds', JSON.stringify(allAds));

    alert("Η παραλαβή ολοκληρώθηκε επιτυχώς!");

    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('currentUser')) || {};
    
    updateCookPointsUI(currentUser);

    loadPersonalAds(currentUser);
    loadIncomingRequests(currentUser);
};