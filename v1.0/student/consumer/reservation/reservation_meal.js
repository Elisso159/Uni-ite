document.addEventListener('DOMContentLoaded', async () => {
    const selectedAdId = parseInt(sessionStorage.getItem('selectedAdId'));
    const container = document.getElementById('orderDetailsContainer');

    if (!selectedAdId) {
        alert("Δεν βρέθηκε επιλεγμένη αγγελία.");
        window.location.href = "../map/map.html"; 
        return;
    }

    // Παίρνουμε την αγγελία είτε από τα cached διαθέσιμα γεύματα, είτε κάνουμε fetch από τον server
    const cachedMeals = JSON.parse(localStorage.getItem('allAds')) || [];
    let selectedAd = cachedMeals.find(ad => ad.food_id === selectedAdId || ad.food_id === selectedAdId);

    // Αν δεν υπάρχει στο cache, μπορούμε να την ζητήσουμε από τον server (ή να την βρούμε)
    if (!selectedAd) {
        try {
            const response = `http://localhost:3000/api/nearby-ads`; // ή έναπρος-ένα endpoint αν φτιάξεις
            const res = await fetch(response);
            const allAds = await res.json();
            selectedAd = allAds.find(ad => ad.id === selectedAdId || ad.food_id === selectedAdId);
        } catch (err) {
            console.error("Σφάλμα φόρτωσης αγγελίας:", err);
        }
    }

    if (!selectedAd) {
        alert("Τα στοιχεία της αγγελίας δεν βρέθηκαν.");
        window.location.href = "../map/map.html";
        return;
    }

    const maxServings = selectedAd.food_portion || 1;

    container.innerHTML = `
        <div class="order-summary">
            <h3>${selectedAd.food_title}</h3>
            <p><b>Μάγειρας:</b> <span>${selectedAd.st_name || selectedAd.cookName || 'Φοιτητής'}</span></p>
            <p><b>Διεύθυνση Παραλαβής:</b> <span>${selectedAd.food_address}</span></p>
            <p><b>Ώρα Παραλαβής:</b> <span>${formatDeliveryTime(selectedAd)}</span></p>
            <p><b>Διαθέσιμες Μερίδες:</b> <span>${maxServings}</span></p>
            
            <div class="servings-selection" style="margin: 20px 0; display: flex; align-items: center; gap: 10px;">
                <label style="font-weight: bold; color: #ffffff;">Πόσες μερίδες επιθυμείτε;</label>
                <input type="number" id="requestedServings" class="search-box" 
                       value="1" min="1" max="${maxServings}" 
                       style="width: 70px; padding: 5px; border-radius: 5px; border: 1px solid #555; background: #1a1a1a; color: white; text-align: center;">
            </div>
            
            ${selectedAd.food_allergens || selectedAd.allergens ? `
                <div class="allergen-box" style="color: #ff6b6b; margin-bottom: 10px;">
                    <b>Αλλεργιογόνα:</b> ${selectedAd.food_allergens || selectedAd.allergens}
                </div>
            ` : ''}
            
            ${selectedAd.food_description ? `
                <div class="notes-box" style="color: #abb2bf; font-style: italic;">
                    "${selectedAd.food_description}"
                </div>
            ` : ''}
        </div>
    `;

    // Κουμπί επιβεβαίωσης κράτησης μέσω Node Server
    document.getElementById('confirmOrderBtn').addEventListener('click', async () => {
        const requestedInput = document.getElementById('requestedServings');
        const requestedAmount = parseInt(requestedInput.value);

        if (isNaN(requestedAmount) || requestedAmount < 1 || requestedAmount > maxServings) {
            alert(`Παρακαλώ επιλέξτε έναν έγκυρο αριθμό μερίδων (1 έως ${maxServings}).`);
            return;
        }

        const selectedAdId = parseInt(sessionStorage.getItem('selectedAdId'));
        const container = document.getElementById('orderDetailsContainer');
        const cachedMeals = JSON.parse(localStorage.getItem('allAds')) || [];
        let selectedAd = cachedMeals.find(ad => ad.food_id === selectedAdId || ad.food_id === selectedAdId);

        const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) 
                           || JSON.parse(localStorage.getItem('currentUser')) 
                           || {};

        const requestData = {
            cookId: selectedAd.cook_id,
            consumerId: currentUser.st_id || currentUser.st_id, // Ανάλογα πώς αποθηκεύεις το ID του χρήστη στη βάση
            foodId: selectedAd.food_id,
            requestedServings: requestedAmount
        };



        try {

            console.log(requestData);

            const response = await fetch('http://localhost:3000/api/requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error('Αποτυχία αποθήκευσης κράτησης στον server.');
            }

            const result = await response.json();
            alert(`Το αίτημά σας για ${requestedAmount} μερίδα/ες στάλθηκε επιτυχώς στον server!`);
            
            sessionStorage.removeItem('selectedAdId');
            window.history.back(); 

        } catch (error) {
            console.error("Σφάλμα:", error);
            alert("Υπήρξε πρόβλημα κατά την αποστολή της κράτησης. Δοκιμάστε ξανά.");
        }
    });
});

// Βοηθητική συνάρτηση για την ώρα
function formatDeliveryTime(ad) {
    if (ad.food_time_start && ad.food_time_end) {
        const fromDate = new Date(ad.food_time_start);
        const toDate = new Date(ad.food_time_end);
        const fromTime = fromDate.toTimeString().substring(0, 5);
        const toTime = toDate.toTimeString().substring(0, 5);
        return `${fromTime} - ${toTime}`;
    }
    return ad.delivery_time || "Δεν ορίστηκε";
}