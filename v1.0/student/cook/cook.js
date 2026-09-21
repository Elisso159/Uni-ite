document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) 
                       || JSON.parse(localStorage.getItem('currentUser')) 
                       || {};

    const nameElement = document.getElementById('cookName');
    const universityElement = document.getElementById('cookUniversity');
    const pointElement = document.getElementById('cookPoints');
    
    // Αρχική εμφάνιση στοιχείων από το storage
    if (nameElement) nameElement.textContent = currentUser.fullname || currentUser.st_name || 'Φοιτητής';
    if (universityElement && (currentUser.university || currentUser.st_university)) {
        universityElement.textContent = (currentUser.university || currentUser.st_university).toUpperCase();
    }
    if (pointElement) pointElement.textContent = currentUser.st_points ?? currentUser.points ?? 0;

    const userId = currentUser.st_id || currentUser.id;
    if (userId) {
        // 1. Φόρτωση αγγελιών και αιτημάτων αμέσως
        loadPersonalAds(userId);
        loadIncomingRequests(userId);

        // 2. Παράλληλη ενημέρωση των πόντων στο background
        refreshCookPoints(userId, currentUser);
    } else {
        console.error("No valid user ID found in session/local storage.");
    }
});

// Συνάρτηση ασφαλούς μορφοποίησης ημερομηνίας και ώρας χωρίς μετατροπές timezone
function formatDeliveryTime(ad) {
    if (!ad.food_time_start) {
        return ad.delivery_time || "Δεν ορίστηκε";
    }

    try {
        const rawStart = ad.food_time_start.replace(' ', 'T');
        const startParts = rawStart.split('T');
        const dateParts = startParts[0].split('-'); // [YYYY, MM, DD]

        if (dateParts.length < 3) {
            return ad.food_time_start;
        }

        const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        const startTime = startParts[1] ? startParts[1].substring(0, 5) : "";

        let endTime = "";
        if (ad.food_time_end) {
            const rawEnd = ad.food_time_end.replace(' ', 'T');
            const endParts = rawEnd.split('T');
            if (endParts[1]) {
                endTime = " - " + endParts[1].substring(0, 5);
            }
        }

        return `${formattedDate} | ${startTime}${endTime}`;
    } catch (e) {
        console.error("Error formatting date:", e);
        return ad.food_time_start.replace('T', ' ').substring(0, 16);
    }
}

async function refreshCookPoints(userId, currentUser) {
    const pointElement = document.getElementById('cookPoints');
    try {
        const response = await fetch(`http://localhost:3000/api/student/${userId}`);
        if (response.ok) {
            const freshData = await response.json();
            
            // Ενημέρωση UI
            if (pointElement && freshData.st_points !== undefined) {
                pointElement.textContent = freshData.st_points;
            }

            // Ενημέρωση Storage
            currentUser.st_points = freshData.st_points;
            currentUser.points = freshData.st_points;
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            if (localStorage.getItem('currentUser')) {
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
        }
    } catch (error) {
        console.warn("Αποτυχία ενημέρωσης πόντων στο background:", error);
    }
}

async function loadPersonalAds(userId) {
    const container = document.getElementById('cookAdsContainer');
    if (!container) return;

    container.innerHTML = '<p class="no-ads-message">Φόρτωση αγγελιών...</p>';

    try {
        const response = await fetch(`http://localhost:3000/api/my-ads?st_id=${userId}`);
        const activeAds = await response.json();

        container.innerHTML = '';

        if (!Array.isArray(activeAds) || activeAds.length === 0) {
            container.innerHTML = '<p class="no-ads-message">Δεν έχετε αγγελίες αυτή τη στιγμή.</p>';
            return;
        }

        activeAds.forEach(ad => {
            const card = document.createElement('div');
            card.className = 'card shared-meal-card';

            // Χρήση της νέας μορφοποίησης ημερομηνίας/ώρας
            const food_hours = formatDeliveryTime(ad);

            card.innerHTML = `
                <div class="top-right-actions">
                    <button class="icon-btn edit-btn-dots" title="Επεξεργασία" onclick="editAd(${ad.food_id})">⋮</button>
                    <button class="icon-btn delete-btn-x" title="Διαγραφή" onclick="deleteAd(${ad.food_id})">✕</button>
                </div>

                <div class="meal-content-wrapper" style="display: flex; gap: 15px; align-items: center;">
                    <img src="${ad.food_image || ''}" 
                         alt="${ad.food_title}" 
                         onerror="this.onerror=null; this.src='${ad.food_image}';"
                         style="width: 90px; height: 90px; object-fit: cover; border-radius: 8px; flex-shrink: 0;" />

                    <div class="meal-info">
                        <h3 class="meal-title">${ad.food_title || 'Αγγελία'}</h3>
                        <p class="meal-portions"><b>Διεύθυνση:</b> ${ad.food_address || '-'}</p>
                        <p class="meal-portions"><b>Ημερομηνία & Ώρα Παραλαβής:</b> ${food_hours || '-'}</p>
                        <p class="meal-portions"><b>Διαθέσιμες Μερίδες:</b> ${ad.food_portion ?? 0}</p>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Σφάλμα φόρτωσης αγγελιών:", error);
        container.innerHTML = '<p class="no-ads-message">Σφάλμα σύνδεσης με τον server.</p>';
    }
}

async function loadIncomingRequests(userId) {
    const requestsContainer = document.getElementById('cookRequestsContainer');
    if (!requestsContainer) return;

    requestsContainer.innerHTML = '<p class="no-ads-message">Φόρτωση αιτημάτων...</p>';

    try {
        const response = await fetch(`http://localhost:3000/api/cook-requests?st_id=${userId}`);
        const myRequests = await response.json();

        requestsContainer.innerHTML = '';

        if (!Array.isArray(myRequests) || myRequests.length === 0) {
            requestsContainer.innerHTML = '<p class="no-ads-message">Δεν υπάρχουν ενεργά αιτήματα αυτή τη στιγμή.</p>';
            return;
        }

        myRequests.forEach(req => {
            const reqStatus = req.req_status || 'pending';
            const card = document.createElement('div');
            card.className = 'request-card'; 

            let badgeHTML = '';
            if (reqStatus === 'ongoing') {
                badgeHTML = `<span class="status-badge status-progress">Σε εξέλιξη</span>`;
            } else {
                badgeHTML = `<span class="status-badge status-active">Εκκρεμεί</span>`;
            }

            let actionsHTML = '';
            if (reqStatus === 'pending') {
                actionsHTML = `
                    <button class="sort-btn approve-btn" onclick="updateRequestStatus(${req.req_id}, 'ongoing')">Αποδοχή</button>
                    <button class="sort-btn reject-btn" onclick="updateRequestStatus(${req.req_id}, 'rejected')">Απόρριψη</button>
                `;
            } else if (reqStatus === 'ongoing') {
                actionsHTML = `
                    <button class="sort-btn confirm-pickup-btn" onclick="updateRequestStatus(${req.req_id}, 'completed')">Παραδόθηκε</button>
                `;
            }

            card.innerHTML = `
                <div class="meal-info">
                    <h3 class="meal-title">${req.food_title || 'Γεύμα'}</h3>
                    <p class="meal-portions"><b>Από Φοιτητή:</b> ${req.consumerName || 'Φοιτητής'}</p>
                    <p class="meal-portions"><b>Μερίδες που ζητήθηκαν:</b> ${req.req_servings || 1}</p>
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
    } catch (error) {
        console.error("Σφάλμα φόρτωσης αιτημάτων:", error);
        requestsContainer.innerHTML = '<p class="no-ads-message">Σφάλμα σύνδεσης με τον server.</p>';
    }
}

window.deleteAd = async function(adId) {
    if (!confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την αγγελία;")) return;

    try {
        const response = await fetch(`http://localhost:3000/api/ads/${adId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('currentUser')) || {};
            const userId = currentUser.st_id || currentUser.id;
            loadPersonalAds(userId);
            loadIncomingRequests(userId);
        } else {
            alert("Αποτυχία διαγραφής αγγελίας.");
        }
    } catch (error) {
        console.error("Σφάλμα διαγραφής:", error);
    }
};

window.editAd = function(adId) {
    sessionStorage.setItem('editAdId', Number(adId));
    window.location.href = `ad/edit_ad.html?edit=${adId}`;
};

window.updateRequestStatus = async function(requestId, newStatus) {
    if (newStatus === 'rejected' && !confirm("Θέλετε να απορρίψετε αυτό το αίτημα;")) return;

    try {
        const response = await fetch(`http://localhost:3000/api/requests/${requestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        const result = await response.json();

        if (response.ok) {
            alert("Το αίτημα ενημερώθηκε επιτυχώς!");
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('currentUser')) || {};
            const userId = currentUser.st_id || currentUser.id;
            loadPersonalAds(userId);
            loadIncomingRequests(userId);
        } else {
            alert("Σφάλμα: " + (result.message || "Αποτυχία ενημέρωσης"));
        }
    } catch (error) {
        console.error("Σφάλμα σύνδεσης:", error);
    }
};