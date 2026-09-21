const UNI_COORDINATES = {
    "uoa": { lat: 37.9678, lng: 23.7830 },        
    "ntua": { lat: 37.9765, lng: 23.7853 },      
    "panteion": { lat: 37.9606, lng: 23.7183 },  
    "aueb": { lat: 37.9941, lng: 23.7321 },
    "aua": { lat: 37.9836, lng: 23.7049 },       
    "hua": { lat: 37.9612, lng: 23.7086 },       
    "unipi": { lat: 37.9415, lng: 23.6529 },    
    "uniwa": { lat: 38.0294, lng: 23.6739 },    
    "asfa": { lat: 37.9701, lng: 23.6847 },      
    "auth": { lat: 40.6325, lng: 22.9520 },      
    "uom": { lat: 40.6248, lng: 22.9601 },        
    "ihu": { lat: 40.6579, lng: 22.8021 },    
    "upatras": { lat: 38.2879, lng: 21.7874 },    
    "uoi": { lat: 39.6191, lng: 20.8412 },        
    "duth": { lat: 41.1444, lng: 25.3344 },    
    "uoc": { lat: 35.3121, lng: 25.0811 },        
    "tuc": { lat: 35.5312, lng: 24.0683 },        
    "uth": { lat: 39.3621, lng: 22.9431 },        
    "aegean": { lat: 39.1102, lng: 26.5562 },    
    "ionio": { lat: 39.6225, lng: 19.9218 },    
    "uop": { lat: 37.5212, lng: 22.3802 },    
    "uowm": { lat: 40.3019, lng: 21.7915 }    
};

const universityNameMap = {
    "εθνικό και καποδιστριακό πανεπιστήμιο αθηνών": "uoa",
    "εθνικό μετσόβιο πολυτεχνείο": "ntua",
    "πάντειο πανεπιστήμιο": "panteion",
    "οικονομικό πανεπιστήμιο αθηνών": "aueb",
    "γεωπονικό πανεπιστήμιο αθηνών": "aua",
    "χαροκόπειο πανεπιστήμιο": "hua",
    "πανεπιστήμιο πειραιώς": "unipi",
    "πανεπιστήμιο δυτικής αττικής": "uniwa",
    "ανωτάτη σχολή καλών τεχνών": "asfa",
    "αριστοτέλειο πανεπιστήμιο θεσσαλονίκης": "auth",
    "πανεπιστήμιο μακεδονίας": "uom",
    "διεθνές πανεπιστήμιο της ελλάδος": "ihu",
    "δημοκρίτειο πανεπιστήμιο θράκης": "duth",
    "πανεπιστήμιο δυτικής μακεδονίας": "uowm",
    "πανεπιστήμιο πατρών": "upatras",
    "πανεπιστήμιο ιωαννίνων": "uoi",
    "πανεπιστήμιο κρήτης": "uoc",
    "πολυτεχνείο κρήτης": "tuc",
    "πανεπιστήμιο θεσσαλίας": "uth",
    "πανεπιστήμιο αιγαίου": "aegean",
    "ιόνιο πανεπιστήμιο": "ionio",
    "πανεπιστήμιο πελοποννήσου": "uop"
};

async function fetchAdsFromServer(lat = null, lng = null) {
    try {
        let url = 'http://localhost:3000/api/nearby-ads';
        if (lat !== null && lng !== null) {
            url += `?lat=${lat}&lng=${lng}`;
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Server status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Σφάλμα κατά την ανάκτηση των αγγελιών:", error);
        return [];
    }
}

function formatDeliveryTime(ad) {
    if (!ad.food_time_start) {
        return ad.delivery_time || "Δεν ορίστηκε";
    }

    try {
        const rawStart = ad.food_time_start.replace(' ', 'T');
        const startParts = rawStart.split('T');
        const dateParts = startParts[0].split('-');
        
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

function isValidMealTime(dateString) {
    if (!dateString) return false;

    const now = new Date();
    const adDate = new Date(dateString);

    // 1. Έλεγχος αν είναι μελλοντική ημέρα (YYYY-MM-DD)
    const todayStr = now.toISOString().split('T')[0];
    const adDateStr = adDate.toISOString().split('T')[0];

    if (adDateStr > todayStr) {
        return false; // Απορρίπτεται αν είναι μελλοντική ημέρα
    }

    // 2. Έλεγχος αν απέχει πάνω από 48 ώρες στο παρελθόν
    const diffInMilliseconds = now - adDate;
    const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

    // Πρέπει να μην έχει περάσει πάνω από 48 ώρες (και να μην είναι στο μέλλον εντός της ίδιας μέρας)
    return diffInHours >= 0 && diffInHours <= 48;
}

document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) 
                       || JSON.parse(localStorage.getItem('currentUser')) 
                       || {};

    if (document.getElementById('consumerName')) {
        document.getElementById('consumerName').textContent = currentUser.st_name || currentUser.fullname || 'Φοιτητής';
    }
    if (document.getElementById('consumerUniversity') && (currentUser.st_university || currentUser.university)) {
        document.getElementById('consumerUniversity').textContent = (currentUser.st_university || currentUser.university).toUpperCase();
    }
    if (document.getElementById('userPoints')) {
        document.getElementById('userPoints').textContent = currentUser.st_points ?? currentUser.points ?? 0;
    }

    const rawUniName = (currentUser.st_university || currentUser.university || "").trim().toLowerCase();
    const userUniKey = universityNameMap[rawUniName] || rawUniName || "upatras";
    const uniCoords = UNI_COORDINATES[userUniKey] || UNI_COORDINATES["upatras"];

    await loadAvailableMeals(currentUser, "", uniCoords.lat, uniCoords.lng);
    loadAcceptedRequests(currentUser);

    const sortBtn = document.getElementById('sortByDistanceBtn');
    if (sortBtn) {
        sortBtn.addEventListener('click', async () => {
            await sortMealsByUniLocation(currentUser);
        });
    }

    const searchBtn = document.querySelector('.submit-search-btn');
    const searchInput = document.querySelector('.search-box');
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', async () => {
            const query = searchInput.value.trim().toLowerCase();
            await loadAvailableMeals(currentUser, query, uniCoords.lat, uniCoords.lng);
        });
    }
});

async function loadAvailableMeals(currentUser, searchQuery = "", lat = null, lng = null) {
    const feedContainer = document.getElementById('foodFeedContainer');
    if (!feedContainer) return;

    const allAds = await fetchAdsFromServer(lat, lng);

    localStorage.setItem('allAds', JSON.stringify(allAds));
    
    let localMeals = allAds.filter(ad => {
        const hasServings = Number(ad.food_portion) > 0;
        const currentName = (currentUser.st_name || currentUser.fullname || "Φοιτητής").trim().toLowerCase();
        const adCookName = (ad.st_name || "Φοιτητής").trim().toLowerCase();
    
    // Χρήση του νέου ελέγχου 48ώρου & όχι μελλοντικών ημερών:
        return hasServings && (adCookName !== currentName) && isValidMealTime(ad.food_time_start);});

    if (searchQuery) {
        localMeals = localMeals.filter(ad => ad.food_title && ad.food_title.toLowerCase().includes(searchQuery));
    }

    localMeals.sort((a, b) => {
        const timeA = new Date(a.food_time_start.replace(' ', 'T')).getTime();
        const timeB = new Date(b.food_time_start.replace(' ', 'T')).getTime();
        return timeA - timeB;
    });

    renderMeals(localMeals, feedContainer);
}

async function sortMealsByUniLocation(currentUser) {
    const feedContainer = document.getElementById('foodFeedContainer');
    
    const rawUniName = (currentUser.st_university || currentUser.university || "").trim().toLowerCase();
    const userUniKey = universityNameMap[rawUniName] || rawUniName || "upatras";
    const uniCoords = UNI_COORDINATES[userUniKey] || UNI_COORDINATES["upatras"];

    if (!uniCoords) {
        alert("Δεν έχουν οριστεί συντεταγμένες για το πανεπιστήμιό σας.");
        return;
    }

    const allAds = await fetchAdsFromServer(uniCoords.lat, uniCoords.lng);
    
    let meals = allAds.filter(ad => {
        const hasServings = Number(ad.food_portion) > 0;
        const currentName = (currentUser.st_name || "Φοιτητής").trim().toLowerCase();
        const adCookName = (ad.st_name || "Φοιτητής").trim().toLowerCase();
        
        return hasServings && (adCookName !== currentName) && isToday(ad.food_time_start);
    });

    meals.sort((a, b) => {
        const timeA = new Date(a.food_time_start.replace(' ', 'T')).getTime();
        const timeB = new Date(b.food_time_start.replace(' ', 'T')).getTime();
        return timeA - timeB;
    });

    localStorage.setItem('allAds', JSON.stringify(meals));

    renderMeals(meals, feedContainer, true);
}

function renderMeals(meals, feedContainer, showDistance = false) {
    if (meals.length === 0) {
        feedContainer.innerHTML = '<p class="loading-text" style="color: #abb2bf; font-style: italic;">Δεν υπάρχουν διαθέσιμα γεύματα για σήμερα.</p>';
        return;
    }

    feedContainer.innerHTML = ''; 

    meals.forEach(ad => {
        const mealCard = document.createElement('div');
        mealCard.className = 'card shared-meal-card'; 
        mealCard.setAttribute('onclick', `goToReservation(${ad.food_id})`);
        mealCard.style.cursor = 'pointer';
        
        let displayDist = '';
        if (showDistance && ad.computedDistance !== undefined) {
            displayDist = `<span style="font-size: 0.95rem; color: #ff1e1e; margin-left: 10px;">(${Number(ad.computedDistance).toFixed(1)} km)</span>`;
        }

        const imgSrc = ad.food_image || '';
        const deliveryDateTimeStr = formatDeliveryTime(ad);

        mealCard.innerHTML = `
            <div class="meal-content-wrapper" style="display: flex; gap: 15px; align-items: center;">
                <img src="${imgSrc}" 
                     alt="${ad.food_title}" 
                     onerror="this.onerror=null; this.src='${ad.food_image}';" 
                     style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; flex-shrink: 0;" />

                <div class="meal-info">
                    <h3 class="meal-title">${ad.food_title} ${displayDist}</h3>
                    <p class="meal-portions"><b>Από:</b> ${ad.st_name || 'Φοιτητής'}</p>
                    <p class="meal-portions"><b>Διεύθυνση:</b> ${ad.food_address || 'Δεν ορίστηκε'}</p>
                    <p class="meal-portions"><b>Ημερομηνία & Ώρα Παραλαβής:</b> ${deliveryDateTimeStr}</p>
                    <p class="meal-portions"><b>Μερίδες:</b> ${ad.food_portion}</p>
                    ${ad.food_allergens ? `<p class="meal-portions" style="color: #ff6b6b;"><b>Αλλεργιογόνα:</b> ${ad.food_allergens}</p>` : ''}
                </div>
            </div>
        `;
        feedContainer.appendChild(mealCard);
    });
}

async function loadAcceptedRequests(currentUser) {
    const reqContainer = document.getElementById('foodRequests');
    if (!reqContainer) {
        console.error("Δεν βρέθηκε το HTML element με id='foodRequests'");
        return;
    }

    reqContainer.innerHTML = '<p class="loading-text" style="color: #abb2bf; font-style: italic;">Φόρτωση κρατήσεων...</p>';

    // Έλεγχος και ανάκτηση του ID του χρήστη
    if (!currentUser || typeof currentUser !== 'object') {
        const stored = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
        currentUser = stored ? JSON.parse(stored) : {};
    }

    const userId = currentUser.st_id || currentUser.id || currentUser.stId || currentUser.cons_st_id || currentUser.user_id;

    console.log("Γίνεται αίτημα για User ID:", userId, "currentUser:", currentUser);

    if (!userId) {
        reqContainer.innerHTML = '<p class="no-ads-message">Δεν βρέθηκε ταυτότητα χρήστη. Παρακαλώ συνδεθείτε ξανά.</p>';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/consumer-requests?st_id=${userId}`);
        
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const requests = await response.json();
        console.log("Απόκριση API (consumer-requests):", requests);

        reqContainer.innerHTML = '';

        if (!Array.isArray(requests) || requests.length === 0) {
            reqContainer.innerHTML = '<p class="loading-text" style="color: #abb2bf; font-style: italic;">Δεν έχετε ενεργές ή ολοκληρωμένες κρατήσεις</p>';
            return;
        }

        // Φιλτράρισμα με υποστήριξη πολλών πιθανών τιμών κατάστασης
        const activeOrCompleted = requests.filter(req => {
            const status = String(req.req_status || req.status || '').toLowerCase().trim();
            return status === 'ongoing' || status === 'accepted' || status === 'approved' || status === 'completed';
        });

        console.log("Φιλτραρισμένα αιτήματα προς εμφάνιση:", activeOrCompleted);

        if (activeOrCompleted.length === 0) {
            reqContainer.innerHTML = '<p class="loading-text" style="color: #abb2bf; font-style: italic;">Δεν έχετε ενεργές ή ολοκληρωμένες κρατήσεις</p>';
            return;
        }

        activeOrCompleted.forEach(req => {
            const card = document.createElement('div');
            card.className = 'card shared-meal-card';
            
            const status = String(req.req_status || req.status || '').toLowerCase().trim();
            const deliveryDateTimeStr = typeof formatDeliveryTime === 'function' ? formatDeliveryTime(req) : (req.delivery_time || 'Δεν ορίστηκε');
            const addressStr = req.food_address || req.address || 'Δεν ορίστηκε';
            const cookName = req.cookName || req.cook_name || 'Φοιτητής';
            
            // Ενεργή / Αποδεκτή κράτηση
            if (status === 'ongoing' || status === 'accepted' || status === 'approved') {
                card.style.borderLeft = '4px solid #e63946';
                card.innerHTML = `
                    <div class="meal-info">
                        <h3 class="meal-title">${req.food_title || 'Γεύμα'}</h3>
                        <p class="meal-portions"><b>Μάγειρας:</b> ${cookName}</p>
                        <p class="meal-portions"><b>Διεύθυνση:</b> ${addressStr}</p>
                        <p class="meal-portions"><b>Ημερομηνία & Ώρα Παραλαβής:</b> ${deliveryDateTimeStr}</p>
                        <p class="meal-portions"><b>Μερίδες:</b> ${req.req_servings || req.servings || 1}</p>
                        <p class="meal-portions" style="color: #e63946; font-weight: bold;"><b>Κατάσταση:</b> Εγκεκριμένο για παραλαβή</p>
                    </div>
                `;
            } 
            // Ολοκληρωμένη κράτηση
            else if (status === 'completed') {
                card.style.borderLeft = '4px solid #8b0000';
                card.innerHTML = `
                    <div class="meal-info">
                        <h3 class="meal-title">${req.food_title || 'Γεύμα'}</h3>
                        <p class="meal-portions"><b>Μάγειρας:</b> ${cookName}</p>
                        <p class="meal-portions"><b>Διεύθυνση:</b> ${addressStr}</p>
                        <p class="meal-portions"><b>Ημερομηνία & Ώρα Παραλαβής:</b> ${deliveryDateTimeStr}</p>
                        <p class="meal-portions"><b>Μερίδες:</b> ${req.req_servings || req.servings || 1}</p>
                        <p class="meal-portions" style="color: #8b0000; font-weight: bold;"><b>Κατάσταση:</b> Ολοκληρώθηκε</p>
                    </div>
                `;
            }

            reqContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Σφάλμα φόρτωσης κρατήσεων:", error);
        reqContainer.innerHTML = '<p class="no-ads-message">Σφάλμα σύνδεσης με τον server.</p>';
    }
}

window.goToReservation = function(adId) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) 
                       || JSON.parse(localStorage.getItem('currentUser')) 
                       || {};
                       
    const points = Number(currentUser.st_points ?? currentUser.points ?? 0);

    if (points < 1) {
        alert("Δεν έχετε αρκετούς πόντους για να κάνετε κράτηση (Απαιτείται τουλάχιστον 1 πόντος).");
        return;
    }

    sessionStorage.setItem('selectedAdId', adId);
    window.location.href = "reservation/reservation_meal.html";
};