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
        

        const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || { university: "upatras", fullname: "Φοιτητής" };
        const userUniKey = currentUser.university ? currentUser.university.toLowerCase() : "upatras";
        const stId = currentUser.st_id;

        //const adCity = universityCities[userUniKey] || "Άγνωστο";
        
        const pickupInput = document.querySelector('input[name="pickup_date"]').value;
        const delivery_timeFrom = document.querySelector('input[name="delivery_time_from"]').value;
        const delivery_timeTo = document.querySelector('input[name="delivery_time_to"]').value;

        let combinedTimeFrom = null;
        let compinedTimeTo = null;

        if(pickupInput && delivery_timeFrom && delivery_timeTo){
            const dateTimeFrom = `${pickupInput}T${delivery_timeFrom}`;
            const dateTimeTo = `${pickupInput}T${delivery_timeTo}`;

            combinedTimeFrom = new Date(dateTimeFrom).toISOString().slice(0, 19).replace('T', ' ');
            compinedTimeTo = new Date(dateTimeTo).toISOString().slice(0, 19).replace('T', ' ');
            //console.log(combinedTimeFrom);
        }




        const formData = new FormData();
    formData.append('studentId', stId);
    formData.append('createdAt', new Date().toISOString().slice(0, 19).replace('T', ' '));
    formData.append('title', document.querySelector('input[name="title"]').value);
    formData.append('delivery_datetimeFrom', combinedTimeFrom);
    formData.append('delivery_datetimeTo', compinedTimeTo);
    formData.append('servings', parseInt(document.querySelector('input[name="servings"]').value) || 1);
    formData.append('notes', document.querySelector('textarea[name="notes"]').value || "");
    formData.append('allergens', document.querySelector('input[name="allergens"]').value || "");
    formData.append('address', locationInput);
    formData.append('lat', coords.lat);
    formData.append('lng', coords.lng);
    formData.append('university', userUniKey);

    // 3. Append the actual file object if selected
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

    try {
        // NOTE: Do NOT set 'Content-Type': 'application/json' headers when sending FormData. 
        // The browser sets it automatically to multipart/form-data along with the correct boundary.
        const response = await fetch('http://localhost:3000/api/ads', {
            method: 'POST',
            body: formData 
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
        alert("Αδυναμία επικοινωνίας με τον διακομιστή.");
    }
    }

    submitBtn.innerText = originalBtnText;
    submitBtn.disabled = false;
});