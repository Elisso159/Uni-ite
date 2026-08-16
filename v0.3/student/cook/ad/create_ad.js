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

    const coords = await getCoordinates(locationInput);

    if (coords) {
        const photoInput = document.querySelector('input[name="photo"]');
        let imageDataUrl = '';

        if (photoInput && photoInput.files && photoInput.files[0]) {
            const selectedFile = photoInput.files[0];

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

        const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || { university: "upatras", fullname: "Φοιτητής" };
        const userUniKey = currentUser.university ? currentUser.university.toLowerCase() : "upatras";

        const adCity = universityCities[userUniKey] || "Άγνωστο";
        
        const pickupInput = document.querySelector('input[name="pickup_date"]');
        const delivery_timeFrom = document.querySelector('input[name="delivery_time_from"]').value;
        const delivery_timeTo = document.querySelector('input[name="delivery_time_to"]').value;

        if(pickupInput && delivery_timeFrom && delivery_timeTo){
            const dateTimeFrom = '${pickupInput}T${delivery_timeFrom}';
            const dateTimeTo = '${pickupInput}T${delivery_timeTo}';

            combinedTimeFrom = new Date(dateTimeFrom).toISOString();
            compinedTimeTo = new Date(dateTimeTo).toISOString();

            //console.log(combinedTimeFrom);
        }




        const newAd = { 
            createdAt: Date.now(),
            title: document.querySelector('input[name="title"]').value,
            delivery_datetimeFrom: combinedTimeFrom,
            delivery_datetimeTo: compinedTimeTo,
            servings: parseInt(document.querySelector('input[name="servings"]').value) || 1,
            notes: document.querySelector('textarea[name="notes"]').value || "",
            allergens: document.querySelector('input[name="allergens"]').value || "",
            address: locationInput,
            image: imageDataUrl, 
            lat: coords.lat,
            lng: coords.lng,
            university: userUniKey
        };
        
        try {
            const response = await fetch('http://localhost:3000/api/ads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAd)
            });

            if (response.ok) {
                alert("Η αγγελία δημιουργήθηκε με επιτυχία!");
                window.location.href = "../cook.html";
            } else {
                const errData = await response.json();
                alert(`Αποτυχία αποθήκευσης: ${errData.message || 'Σφάλμα διακομιστή'}`);
            }
        } catch (error) {
            console.error("Σφάλμα σύνδεσης:", error);
            alert("Αδυναμία επικοινωνίας με τον διακομιστή. Βεβαιωθείτε ότι ο Node.js server τρέχει.");
        }
    }

    submitBtn.innerText = originalBtnText;
    submitBtn.disabled = false;
});