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
    submitBtn.innerText = "Αναζήτηση τοποθεσίας & αποθήκευση...";
    submitBtn.disabled = true;

    // 1. Λήψη Συντεταγμένων
    const coords = await getCoordinates(locationInput);

    if (coords) {
        // 2. Επεξεργασία Εικόνας (μετατροπή σε Base64 μέσω FileReader)
        const photoInput = document.querySelector('input[name="photo"]');
        let imageDataUrl = '';

        if (photoInput && photoInput.files && photoInput.files[0]) {
            const selectedFile = photoInput.files[0];

            // Έλεγχος αν η εικόνα είναι >2MB για προστασία του localStorage
            if (selectedFile.size > 2 * 1024 * 1024) {
                alert("Η εικόνα είναι πολύ μεγάλη! Παρακαλώ επιλέξτε μια εικόνα κάτω από 2MB.");
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
                return;
            }

            imageDataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target.result);
                reader.onerror = () => resolve('');
                reader.readAsDataURL(selectedFile);
            });
        }

        // 3. Λήψη στοιχείων χρήστη & φόρμας
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || { university: "upatras", fullname: "Φοιτητής" };
        const userUniKey = currentUser.university ? currentUser.university.toLowerCase() : "upatras";

        const timeFrom = document.querySelector('input[name="delivery_time_from"]').value;
        const timeTo = document.querySelector('input[name="delivery_time_to"]').value;
        const formattedDeliverySlot = `${timeFrom} - ${timeTo}`;

        const adCity = universityCities[userUniKey] || "Άγνωστο";

        // 4. Δημιουργία Αντικειμένου Αγγελίας
        const newAd = {
            id: Date.now(), 
            createdAt: Date.now(),
            title: document.querySelector('input[name="title"]').value,
            delivery_time: formattedDeliverySlot,
            servings: parseInt(document.querySelector('input[name="servings"]').value) || 1,
            notes: document.querySelector('textarea[name="notes"]').value || "",
            allergens: document.querySelector('input[name="allergens"]').value || "",
            address: locationInput,
            image: imageDataUrl, // 🖼️ Εδώ αποθηκεύεται το Base64 string
            lat: coords.lat,
            lng: coords.lng,
            university: userUniKey,
            city: adCity, 
            cookName: currentUser.fullname || "Φοιτητής"
        };
        
        // 5. Αποθήκευση στο localStorage
        try {
            let savedAds = JSON.parse(localStorage.getItem('allAds')) || [];
            savedAds.push(newAd);
            localStorage.setItem('allAds', JSON.stringify(savedAds));

            alert("Η αγγελία δημιουργήθηκε με επιτυχία!");
            window.location.href = "../cook.html"; 
        } catch (error) {
            alert("Το localStorage είναι γεμάτο! Δοκιμάστε να ανεβάσετε μια μικρότερη φωτογραφία.");
        }
    }

    submitBtn.innerText = originalBtnText;
    submitBtn.disabled = false;
});