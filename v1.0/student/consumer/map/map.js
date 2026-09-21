const universityLocations = {
    "uoa": { lat: 37.9691, lng: 23.7807, name: "Εθνικό και Καποδιστριακό Πανεπιστήμιο Αθηνών", zoom: 14 },
    "ntua": { lat: 37.9765, lng: 23.7853, name: "Εθνικό Μετσόβιο Πολυτεχνείο", zoom: 14 },
    "panteion": { lat: 37.9595, lng: 23.7194, name: "Πάντειο Πανεπιστήμιο", zoom: 15 },
    "aueb": { lat: 37.9941, lng: 23.7321, name: "Οικονομικό Πανεπιστήμιο Αθηνών", zoom: 15 },
    "aua": { lat: 37.9834, lng: 23.7038, name: "Γεωπονικό Πανεπιστήμιο Αθηνών", zoom: 15 },
    "hua": { lat: 37.9612, lng: 23.7083, name: "Χαροκόπειο Πανεπιστήμιο", zoom: 15 },
    "unipi": { lat: 37.9416, lng: 23.6530, name: "Πανεπιστήμιο Πειραιώς", zoom: 15 },
    "uniwa": { lat: 38.0025, lng: 23.6749, name: "Πανεπιστήμιο Δυτικής Αττικής", zoom: 14 },
    "asfa": { lat: 37.9621, lng: 23.6906, name: "Ανωτάτη Σχολή Καλών Τεχνών", zoom: 15 },
    "auth": { lat: 40.6322, lng: 22.9515, name: "Αριστοτέλειο Πανεπιστήμιο Θεσσαλονίκης", zoom: 14 },
    "uom": { lat: 40.6251, lng: 22.9596, name: "Πανεπιστήμιο Μακεδονίας", zoom: 15 },
    "ihu": { lat: 40.6579, lng: 22.8016, name: "Διεθνές Πανεπιστήμιο της Ελλάδος", zoom: 14 },
    "duth": { lat: 41.1444, lng: 25.3344, name: "Δημοκρίτειο Πανεπιστήμιο Θράκης", zoom: 14 }, 
    "uowm": { lat: 40.3182, lng: 21.7946, name: "Πανεπιστήμιο Δυτικής Μακεδονίας", zoom: 14 },
    "upatras": { lat: 38.2879, lng: 21.7874, name: "Πανεπιστήμιο Πατρών", zoom: 14 },
    "uoi": { lat: 39.6191, lng: 20.8406, name: "Πανεπιστήμιο Ιωαννίνων", zoom: 14 },
    "uoc": { lat: 35.3175, lng: 25.0831, name: "Πανεπιστήμιο Κρήτης", zoom: 14 },
    "tuc": { lat: 35.5317, lng: 24.0682, name: "Πολυτεχνείο Κρήτης", zoom: 14 },
    "uth": { lat: 39.3621, lng: 22.9439, name: "Πανεπιστήμιο Θεσσαλίας", zoom: 14 },
    "aegean": { lat: 39.1092, lng: 26.5554, name: "Πανεπιστήμιο Αιγαίου", zoom: 13 },
    "ionio": { lat: 39.6200, lng: 19.9200, name: "Ιόνιο Πανεπιστήμιο", zoom: 14 },
    "uop": { lat: 37.5100, lng: 22.3700, name: "Πανεπιστήμιο Πελοποννήσου", zoom: 13 }
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

const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('currentUser')) || {};
if (!currentUser.fullname) currentUser.fullname = "Φοιτητής";

const rawUniName = (currentUser.st_university || currentUser.university || "").trim().toLowerCase();
const userUniKey = universityNameMap[rawUniName] || rawUniName || "upatras";
const selectedLocation = universityLocations[userUniKey] || universityLocations["upatras"];

console.log("Συνδεδεμένος Χρήστης στο Χάρτη:", currentUser);

const map = L.map('map').setView([selectedLocation.lat, selectedLocation.lng], selectedLocation.zoom);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

const uniMarker = L.marker([selectedLocation.lat, selectedLocation.lng]).addTo(map);
uniMarker.bindPopup(`<b>${selectedLocation.name}</b><br>Το Πανεπιστήμιό σου!`).openPopup();

function checkAndCleanExpiredAds() {
    let allAds = JSON.parse(localStorage.getItem('allAds')) || [];
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

    const updatedAds = allAds.filter(ad => {
        const createdTime = ad.createdAt || ad.id; 
        const age = now - createdTime;

        if (age > FORTY_EIGHT_HOURS) {
            console.log(`Η αγγελία "${ad.title}" διαγράφηκε λόγω παρόδου 48 ωρών.`);
            return false; 
        }

        if (age > TWENTY_FOUR_HOURS) {
            if (!ad.servings || ad.servings <= 0) return false;
            ad.isSecondDay = true; 
        }

        return true; 
    });

    localStorage.setItem('allAds', JSON.stringify(updatedAds));
    return updatedAds;
}

function loadConsumerMapAds() {
    const allAds = JSON.parse(localStorage.getItem('allAds')) || [];
    
    const localAds = allAds.filter(ad => {
        const hasServings = ad.food_portion > 0;
        const currentName = (currentUser.st_name || "Φοιτητής").trim().toLowerCase();
        const adCookName = (ad.st_name || "Φοιτητής").trim().toLowerCase();
        const isNotOwnAd = adCookName !== currentName;

        return hasServings && isNotOwnAd; 
    });

    localAds.forEach(ad => {
        const latCoord = Number(ad.food_lat);
        const lngCoord = Number(ad.food_lng);

        if (latCoord && lngCoord) {
            const adMarker = L.marker([latCoord, lngCoord]).addTo(map);
            
            const popupContent = `
                <div class="map-popup-container">
                    <h3 class="map-popup-title">${ad.food_title}</h3>
                    <p class="map-popup-text"><b>Από:</b> ${ad.st_name || 'Φοιτητής'}</p>
                    <p class="map-popup-text"><b>Παραλαβή:</b> ${ad.food_time_start.replace('T', ' ').substring(0, 19)}</p>
                    <p class="map-popup-text"><b>Διεύθυνση:</b> ${ad.food_address}</p>
                    <p class="map-popup-text"><b>Μερίδες:</b> ${ad.food_portion}</p>
                    ${ad.food_allergens ? `<p class="map-popup-allergens"><b>Αλλεργιογόνα:</b> ${ad.food_allergens}</p>` : ''}
                    ${ad.food_notes ? `<p class="map-popup-notes">"${ad.food_notes}"</p>` : ''}
                    <button class="claim-btn map-popup-btn" onclick="requestMeal(${ad.food_id})">
                        Ζήτα Μερίδα
                    </button>
                </div>`;

            adMarker.bindPopup(popupContent);
        }
    });
}

loadConsumerMapAds();

window.requestMeal = function(adId) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) 
                       || JSON.parse(localStorage.getItem('currentUser')) 
                       || {};

    const userPoints = Number(currentUser.st_points ?? currentUser.points ?? 0);

    if (userPoints < 1) {
        alert("Δεν έχετε αρκετούς πόντους για να κάνετε κράτηση (Απαιτείται τουλάχιστον 1 πόντος).");
        return;
    }

    sessionStorage.setItem('selectedAdId', adId);
    window.location.href = "../reservation/reservation_meal.html";
};