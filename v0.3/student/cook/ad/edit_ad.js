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

    // Γέμισμα των inputs με τις υπάρχουσες τιμές
    document.querySelector('input[name="title"]').value = adToEdit.title || "";
    document.getElementById('adLocation').value = adToEdit.address || "";
    
    // Ανάκτηση ημερομηνίας και ώρας
    if (adToEdit.delivery_datetimeFrom) {
        const dateObj = new Date(adToEdit.delivery_datetimeFrom);
        const pickupInput = document.querySelector('input[name="pickup_date"]');
        if (pickupInput) {
            pickupInput.value = dateObj.toISOString().split('T')[0];
        }
        
        const timeFromInput = document.querySelector('input[name="delivery_time_from"]');
        if (timeFromInput) {
            timeFromInput.value = dateObj.toTimeString().substring(0, 5);
        }
    }

    if (adToEdit.delivery_datetimeTo) {
        const dateObjTo = new Date(adToEdit.delivery_datetimeTo);
        const timeToInput = document.querySelector('input[name="delivery_time_to"]');
        if (timeToInput) {
            timeToInput.value = dateObjTo.toTimeString().substring(0, 5);
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

    if (coords) {
        const photoInput = document.querySelector('input[name="photo"]');
        let imageDataUrl = '';

        if (photoInput && photoInput.files && photoInput.files[0]) {
            const selectedFile = photoInput.files[0];
            if (selectedFile.size <= 2 * 1024 * 1024) {
                imageDataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (event) => resolve(event.target.result);
                    reader.onerror = () => resolve('');
                    reader.readAsDataURL(selectedFile);
                });
            }
        }

        const pickupInput = document.querySelector('input[name="pickup_date"]')?.value || new Date().toISOString().split('T')[0];
        const delivery_timeFrom = document.querySelector('input[name="delivery_time_from"]')?.value || "12:00";
        const delivery_timeTo = document.querySelector('input[name="delivery_time_to"]')?.value || "14:00";

        let combinedTimeFrom = "";
        let combinedTimeTo = "";

        if (pickupInput && delivery_timeFrom && delivery_timeTo) {
            const dateTimeFromStr = `${pickupInput}T${delivery_timeFrom}`;
            const dateTimeToStr = `${pickupInput}T${delivery_timeTo}`;

            combinedTimeFrom = new Date(dateTimeFromStr).toISOString();
            combinedTimeTo = new Date(dateTimeToStr).toISOString();
        }

        const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || { university: "upatras" };
        const userUniKey = currentUser.university ? currentUser.university.toLowerCase() : "upatras";

        let allAds = JSON.parse(localStorage.getItem('allAds')) || [];
        const adIndex = allAds.findIndex(ad => ad.id === editAdId);

        const updatedAd = {
            ...(adIndex !== -1 ? allAds[adIndex] : {}),
            id: editAdId,
            title: document.querySelector('input[name="title"]').value,
            delivery_datetimeFrom: combinedTimeFrom,
            delivery_datetimeTo: combinedTimeTo,
            servings: parseInt(document.querySelector('input[name="servings"]').value) || 1,
            notes: document.querySelector('textarea[name="notes"]').value || "",
            allergens: document.querySelector('input[name="allergens"]').value || "",
            address: locationInput,
            image: imageDataUrl || (adIndex !== -1 ? allAds[adIndex].image : ""),
            lat: coords.lat,
            lng: coords.lng,
            university: userUniKey
        };

        if (adIndex !== -1) {
            allAds[adIndex] = updatedAd;
            localStorage.setItem('allAds', JSON.stringify(allAds));
        }

        try {
            const response = await fetch(`http://localhost:3000/api/ads/${editAdId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedAd)
            });

            if (response.ok) {
                sessionStorage.removeItem('editAdId');
                alert("Η αγγελία ενημερώθηκε με επιτυχία!");
                window.location.href = "../cook.html";
            } else {
                const errData = await response.json();
                alert(`Αποτυχία ενημέρωσης στο server: ${errData.message || 'Σφάλμα διακομιστή'}`);
            }
        } catch (error) {
            console.error("Σφάλμα σύνδεσης:", error);
            sessionStorage.removeItem('editAdId');
            alert("Η αγγελία ενημερώθηκε τοπικά (Local Storage).");
            window.location.href = "../cook.html";
        }
    }

    submitBtn.innerText = originalBtnText;
    submitBtn.disabled = false;
});