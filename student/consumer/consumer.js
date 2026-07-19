const UNI_COORDINATES = {
    "uoa": { lat: 37.9678, lng: 23.7830 },       
    "ntua": { lat: 37.9765, lng: 23.7853 },     
    "panteion": { lat: 37.9606, lng: 23.7183 },  
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

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || {};
    
    if (!currentUser.fullname) currentUser.fullname = "Φοιτητής";
    if (!currentUser.university) currentUser.university = "upatras";

    if(document.getElementById('consumerName')) document.getElementById('consumerName').textContent = currentUser.fullname;
    if(document.getElementById('consumerUniversity')) document.getElementById('consumerUniversity').textContent = currentUser.university.toUpperCase();
    if(document.getElementById('userPoints')) document.getElementById('userPoints').textContent = currentUser.points || 0;

    loadAvailableMeals(currentUser);

    const sortBtn = document.getElementById('sortByDistanceBtn');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            sortMealsByUniLocation(currentUser);
        });
    }
});

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 99999; 
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

function sortMealsByUniLocation(currentUser) {
    const feedContainer = document.getElementById('foodFeedContainer');
    const userUniKey = currentUser.university ? currentUser.university.toLowerCase() : "";
    const uniCoords = UNI_COORDINATES[userUniKey];

    if (!uniCoords) {
        alert("Δεν έχουν οριστεί συντεταγμένες για το πανεπιστήμιό σας.");
        return;
    }

    const allAds = JSON.parse(localStorage.getItem('allAds')) || [];
    
    let meals = allAds.filter(ad => {
        const hasServings = ad.servings > 0;
        
        const currentName = (currentUser.fullname || "Φοιτητής").trim().toLowerCase();
        const adCookName = (ad.cookName || "Φοιτητής").trim().toLowerCase();
        
        const isNotOwnAd = adCookName !== currentName;

        return hasServings && isNotOwnAd;
    });

    if (meals.length === 0) {
        feedContainer.innerHTML = '<p class="loading-text" style="color: #abb2bf; font-style: italic;">Δεν υπάρχουν διαθέσιμα γεύματα.</p>';
        return;
    }

    meals.forEach(ad => {
        ad.computedDistance = calculateDistance(uniCoords.lat, uniCoords.lng, ad.lat, ad.lng);
    });

    meals.sort((a, b) => a.computedDistance - b.computedDistance);

    feedContainer.innerHTML = ''; 

    meals.forEach(ad => {
        const mealCard = document.createElement('div');
        mealCard.className = 'card shared-meal-card'; 
        mealCard.setAttribute('onclick', `goToReservation(${ad.id})`);
        mealCard.style.cursor = 'pointer';
        
        const displayDist = ad.computedDistance !== 99999 
            ? `<span style="font-size: 0.95rem; color: #ff1e1e; margin-left: 10px;"></span>`
            : '';

        mealCard.innerHTML = `
            <div class="meal-info">
                <h3 class="meal-title">${ad.title} ${displayDist}</h3>
                <p class="meal-portions"><b>Από:</b> ${ad.cookName || 'Φοιτητής'}</p>
                <p class="meal-portions"><b>Διεύθυνση:</b> ${ad.address}</p>
                <p class="meal-portions"><b>Ώρα Παραλαβής:</b> ${ad.delivery_time}</p>
                <p class="meal-portions"><b>Μερίδες:</b> ${ad.servings}</p>
                ${ad.allergens ? `<p class="meal-portions" style="color: #ff6b6b;"><b>Αλλεργιογόνα:</b> ${ad.allergens}</p>` : ''}
            </div>
        `;
        feedContainer.appendChild(mealCard);
    });
}

function loadAvailableMeals(currentUser) {
    const feedContainer = document.getElementById('foodFeedContainer');
    const allAds = JSON.parse(localStorage.getItem('allAds')) || [];
    
    const localMeals = allAds.filter(ad => {
        const hasServings = ad.servings > 0;
        
        const currentName = (currentUser.fullname || "Φοιτητής").trim().toLowerCase();
        const adCookName = (ad.cookName || "Φοιτητής").trim().toLowerCase();
        
        const isNotOwnAd = adCookName !== currentName;

        return hasServings && isNotOwnAd;
    });

    if (localMeals.length === 0) {
        feedContainer.innerHTML = '<p class="loading-text" style="color: #abb2bf; font-style: italic;">Δεν υπάρχουν διαθέσιμα γεύματα.</p>';
        return;
    }

    feedContainer.innerHTML = '';
    localMeals.forEach(ad => {
        const mealCard = document.createElement('div');
        mealCard.className = 'card shared-meal-card'; 
        mealCard.setAttribute('onclick', `goToReservation(${ad.id})`);
        mealCard.style.cursor = 'pointer';

        mealCard.innerHTML = `
            <div class="meal-info">
                <h3 class="meal-title">${ad.title}</h3>
                <p class="meal-portions"><b>Από:</b> ${ad.cookName || 'Φοιτητής'}</p>
                <p class="meal-portions"><b>Διεύθυνση:</b> ${ad.address}</p>
                <p class="meal-portions"><b>Ώρα Παραλαβής:</b> ${ad.delivery_time}</p>
                <p class="meal-portions"><b>Μερίδες:</b> ${ad.servings}</p>
                ${ad.allergens ? `<p class="meal-portions" style="color: #ff6b6b;"><b>Αλλεργιογόνα:</b> ${ad.allergens}</p>` : ''}
            </div>
        `;
        feedContainer.appendChild(mealCard);
    });
}

window.goToReservation = function(adId) {
    sessionStorage.setItem('selectedAdId', adId);
    window.location.href = "reservation/reservation_meal.html";
};