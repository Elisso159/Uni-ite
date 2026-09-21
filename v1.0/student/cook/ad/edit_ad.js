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

document.addEventListener('DOMContentLoaded', async () => {
    const editAdId = parseInt(sessionStorage.getItem('editAdId'));
    
    if (!editAdId) {
        alert("Δεν επιλέχθηκε αγγελία προς επεξεργασία.");
        window.location.href = "../cook.html";
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/ads/${editAdId}`);
        
        if (!response.ok) {
            throw new Error("Η αγγελία δεν βρέθηκε στον διακομιστή.");
        }
        
        const adToEdit = await response.json();

        // 1. Τίτλος
        const titleInput = document.querySelector('input[name="title"]');
        if (titleInput) {
            titleInput.value = adToEdit.food_title || adToEdit.title || "";
        }

        // 2. Διεύθυνση
        const locationInput = document.getElementById('adLocation');
        if (locationInput) {
            locationInput.value = adToEdit.food_address || adToEdit.deli_location || adToEdit.address || "";
        }
        
        // 3. Ημερομηνία και Ώρα Έναρξης / Λήξης
        const timeStart = adToEdit.food_time_start || adToEdit.delivery_datetimeFrom || "";
        if (timeStart) {
            const rawStart = timeStart.replace(' ', 'T');
            const startParts = rawStart.split('T'); // [ "YYYY-MM-DD", "HH:MM:SS..." ]
            
            const pickupInput = document.querySelector('input[name="pickup_date"]');
            if (pickupInput && startParts[0]) {
                pickupInput.value = startParts[0];
            }
            
            const timeFromInput = document.querySelector('input[name="delivery_time_from"]');
            if (timeFromInput && startParts[1]) {
                timeFromInput.value = startParts[1].substring(0, 5);
            }
        }

        const timeEnd = adToEdit.food_time_end || adToEdit.delivery_datetimeTo || "";
        if (timeEnd) {
            const rawEnd = timeEnd.replace(' ', 'T');
            const endParts = rawEnd.split('T');
            const timeToInput = document.querySelector('input[name="delivery_time_to"]');
            
            if (timeToInput) {
                const timeString = endParts[1] ? endParts[1] : endParts[0];
                timeToInput.value = timeString.substring(0, 5);
            }
        }

        // 4. Μερίδες
        const servingsInput = document.querySelector('input[name="servings"]');
        if (servingsInput) {
            servingsInput.value = adToEdit.food_portion ?? adToEdit.servings ?? 1;
        }
        
        // 5. Περιγραφή / Σημειώσεις
        const notesInput = document.querySelector('textarea[name="notes"]');
        if (notesInput) {
            notesInput.value = adToEdit.food_description || adToEdit.notes || "";
        }

        // 6. Αλλεργιογόνα
        const allergensInput = document.querySelector('input[name="allergens"]');
        if (allergensInput) {
            allergensInput.value = adToEdit.food_allergens || adToEdit.allergens || "";
        }

        // 7. Προεπισκόπηση Εικόνας (αν υπάρχει στο HTML στοιχείο img)
        const imagePreview = document.getElementById('adImagePreview');
        if (imagePreview && (adToEdit.food_image || adToEdit.image)) {
            imagePreview.src = adToEdit.food_image || adToEdit.image;
        }

    } catch (error) {
        console.error("Σφάλμα φόρτωσης αγγελίας:", error);
        alert("Η αγγελία δεν βρέθηκε.");
        window.location.href = "../cook.html";
    }
});

document.getElementById('editAdForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const editAdId = parseInt(sessionStorage.getItem('editAdId'));
    const locationInput = document.getElementById('adLocation').value;

    const submitBtn = document.querySelector('.form-submit-btn');
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "Ενημέρωση τοποθεσίας & δεδομένων...";
    submitBtn.disabled = true;

    try {
        const coords = await getCoordinates(locationInput);

        if (!coords) {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
            return;
        }

        const pickupInput = document.querySelector('input[name="pickup_date"]').value;
        const delivery_timeFrom = document.querySelector('input[name="delivery_time_from"]').value;
        const delivery_timeTo = document.querySelector('input[name="delivery_time_to"]').value;

        let combinedTimeFrom = null;
        let combinedTimeTo = null;

        if (pickupInput && delivery_timeFrom && delivery_timeTo) {
            combinedTimeFrom = `${pickupInput} ${delivery_timeFrom}:00`;
            combinedTimeTo = `${pickupInput} ${delivery_timeTo}:00`;
        }

        const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('currentUser')) || { university: "upatras" };
        const userUniKey = (currentUser.st_university || currentUser.university || "upatras").toLowerCase();

        const formData = new FormData();
        formData.append('title', document.querySelector('input[name="title"]').value);
        formData.append('delivery_datetimeFrom', combinedTimeFrom);
        formData.append('delivery_datetimeTo', combinedTimeTo);
        formData.append('servings', parseInt(document.querySelector('input[name="servings"]').value) || 1);
        formData.append('notes', document.querySelector('textarea[name="notes"]')?.value || "");
        formData.append('allergens', document.querySelector('input[name="allergens"]')?.value || "");
        formData.append('address', locationInput);
        formData.append('lat', coords.lat);
        formData.append('lng', coords.lng);
        formData.append('university', userUniKey);

        const photoInput = document.querySelector('input[name="photo"]');
        if (photoInput && photoInput.files && photoInput.files[0]) {
            const selectedFile = photoInput.files[0];
            if (selectedFile.size > 2 * 1024 * 1024) {
                alert("Η εικόνα είναι πολύ μεγάλη! Παρακαλώ επιλέξτε μια εικόνα κάτω από 2MB.");
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
                return;
            }
            formData.append('photo', selectedFile);
        }

        const response = await fetch(`http://localhost:3000/api/ads/${editAdId}`, {
            method: 'PUT',
            body: formData
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
        alert("Αδυναμία επικοινωνίας με τον διακομιστή.");
    } finally {
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
    }
});