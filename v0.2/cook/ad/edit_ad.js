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

document.addEventListener('DOMContentLoaded', () => {
    const editAdId = parseInt(sessionStorage.getItem('editAdId'));
    
    if (!editAdId) {
        alert("Δεν επιλέχθηκε αγγελία προς επεξεργασία.");
        window.location.href = "../cook.html";
        return;
    }

    const allAds = JSON.parse(localStorage.getItem('allAds')) || [];
    const adToEdit = allAds.find(ad => ad.id === editAdId);

    if (!adToEdit) {
        alert("Η αγγελία δεν βρέθηκε.");
        window.location.href = "../cook.html";
        return;
    }

    document.querySelector('input[name="title"]').value = adToEdit.title || "";
    document.getElementById('adLocation').value = adToEdit.address || "";
    
    if (adToEdit.delivery_time && adToEdit.delivery_time.includes('-')) {
        const timeParts = adToEdit.delivery_time.split('-').map(t => t.trim());
        if (document.querySelector('input[name="delivery_time_from"]')) {
            document.querySelector('input[name="delivery_time_from"]').value = timeParts[0] || "";
        }
        if (document.querySelector('input[name="delivery_time_to"]')) {
            document.querySelector('input[name="delivery_time_to"]').value = timeParts[1] || "";
        }
    } else {
        if (document.querySelector('input[name="delivery_time_from"]')) {
            document.querySelector('input[name="delivery_time_from"]').value = adToEdit.delivery_time || "";
        }
    }

    const servingsInput = document.querySelector('input[name="servings"]');
    if (servingsInput) {
        servingsInput.value = adToEdit.servings || 1;
    }
    
    document.querySelector('textarea[name="notes"]').value = adToEdit.notes || "";
    document.querySelector('input[name="allergens"]').value = adToEdit.allergens || "";
});

document.getElementById('editAdForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const editAdId = parseInt(sessionStorage.getItem('editAdId'));
    const locationInput = document.getElementById('adLocation').value;

    const submitBtn = document.querySelector('.form-submit-btn');
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "Ενημέρωση τοποθεσίας...";
    submitBtn.disabled = true;

    const coords = await getCoordinates(locationInput);

    submitBtn.innerText = originalBtnText;
    submitBtn.disabled = false;

    if (coords) {
        let allAds = JSON.parse(localStorage.getItem('allAds')) || [];
        const adIndex = allAds.findIndex(ad => ad.id === editAdId);

        if (adIndex !== -1) {
            const timeFrom = document.querySelector('input[name="delivery_time_from"]').value;
            const timeTo = document.querySelector('input[name="delivery_time_to"]').value;
            const formattedDeliverySlot = `${timeFrom} - ${timeTo}`;

            const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || {};
            const userUniKey = currentUser.university ? currentUser.university.toLowerCase() : "upatras";
            const updatedCity = universityCities[userUniKey] || allAds[adIndex].city || "Άγνωστο";

            allAds[adIndex] = {
                ...allAds[adIndex], 
                title: document.querySelector('input[name="title"]').value,
                delivery_time: formattedDeliverySlot,
                servings: parseInt(document.querySelector('input[name="servings"]').value) || 1,
                notes: document.querySelector('textarea[name="notes"]').value || "",
                allergens: document.querySelector('input[name="allergens"]').value || "",
                address: locationInput,
                lat: coords.lat,
                lng: coords.lng,
                city: updatedCity
            };

            localStorage.setItem('allAds', JSON.stringify(allAds));
            sessionStorage.removeItem('editAdId');

            alert("Η αγγελία ενημερώθηκε με επιτυχία!");
            window.location.href = "../cook.html";
        } else {
            alert("Σφάλμα: Η αγγελία δεν βρέθηκε για να ενημερωθεί.");
        }
    }
});