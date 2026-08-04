const universityCities = {
    "uoa": "Αθήνα", "ntua": "Αθήνα", "panteion": "Αθήνα", "aueb": "Αθήνα", 
    "aua": "Αθήνα", "hua": "Αθήνα", "unipi": "Πειραιάς", "uniwa": "Αθήνα", "asfa": "Αθήνα",
    "auth": "Θεσσαλονίκη", "uom": "Θεσσαλονίκη", "ihu": "Θεσσαλονίκη",
    "upatras": "Πάτρα", "uoi": "Ιωάννινα", "duth": "Κομοτηνή", "uoc": "Ηράκλειο", 
    "tuc": "Χανιά", "uth": "Βόλος", "aegean": "Μυτιλήνη", "ionio": "Κέρκυρα", 
    "uop": "Τρίπολη", "uowm": "Κοζάνη"
};

async function getCoordinates(address) {
    const searchQuery = `${address}, Greece`; 
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(searchQuery)}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'UniBiteApp/1.0 (student.project@unibite.gr)'
            }
        });
        const data = await response.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        } else {
            alert("Δεν μπορέσαμε να εντοπίσουμε αυτή τη διεύθυνση στον χάρτη. Παρακαλώ ελέγξτε την ορθογραφία.");
            return null;
        }
    } catch (error) {
        console.error("Σφάλμα κατά την επικοινωνία με το Geocoding API:", error);
        alert("Πρόκυψε σφάλμα κατά τον εντοπισμό της διεύθυνσης. Προσπαθήστε ξανά.");
        return null;
    }
}

document.getElementById('createAdForm').addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const locationInput = document.getElementById('adLocation').value;
    
    const submitBtn = document.querySelector('.form-submit-btn');
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "Αναζήτηση τοποθεσίας...";
    submitBtn.disabled = true;

    const coords = await getCoordinates(locationInput);

    submitBtn.innerText = originalBtnText;
    submitBtn.disabled = false;

    if (coords) {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || { university: "upatras", fullname: "Φοιτητής" };
        const userUniKey = currentUser.university ? currentUser.university.toLowerCase() : "upatras";

        const timeFrom = document.querySelector('input[name="delivery_time_from"]').value;
        const timeTo = document.querySelector('input[name="delivery_time_to"]').value;
        const formattedDeliverySlot = `${timeFrom} - ${timeTo}`;

        const adCity = universityCities[userUniKey] || "Άγνωστο";

        const newAd = {
            id: Date.now(), 
            createdAt: Date.now(),
            title: document.querySelector('input[name="title"]').value,
            delivery_time: formattedDeliverySlot,
            servings: parseInt(document.querySelector('input[name="servings"]').value) || 1,
            notes: document.querySelector('textarea[name="notes"]').value || "",
            allergens: document.querySelector('input[name="allergens"]').value || "",
            address: locationInput,
            lat: coords.lat,
            lng: coords.lng,
            university: userUniKey,
            city: adCity, 
            cookName: currentUser.fullname || "Φοιτητής"
        };
        
        let savedAds = JSON.parse(localStorage.getItem('allAds')) || [];
        savedAds.push(newAd);
        localStorage.setItem('allAds', JSON.stringify(savedAds));

        alert("Η αγγελία δημιουργήθηκε με επιτυχία!");
        window.location.href = "../cook.html"; 
    }

});

