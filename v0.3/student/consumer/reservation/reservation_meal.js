document.addEventListener('DOMContentLoaded', () => {
    const selectedAdId = parseInt(sessionStorage.getItem('selectedAdId'));
    const container = document.getElementById('orderDetailsContainer');

    if (!selectedAdId) {
        alert("Δεν βρέθηκε επιλεγμένη αγγελία.");
        window.location.href = "../map/map.html"; 
        return;
    }

    const allAds = JSON.parse(localStorage.getItem('allAds')) || [];
    const selectedAd = allAds.find(ad => ad.id === selectedAdId);

    if (!selectedAd) {
        alert("Τα στοιχεία της αγγελίας δεν βρέθηκαν.");
        window.location.href = "../map/map.html";
        return;
    }

    const maxServings = selectedAd.servings || 1;

    container.innerHTML = `
        <div class="order-summary">
            <h3>${selectedAd.title}</h3>
            <p><b>Μάγειρας:</b> <span>${selectedAd.cookName || 'Φοιτητής'}</span></p>
            <p><b>Διεύθυνση Παραλαβής:</b> <span>${selectedAd.address}</span></p>
            <p><b>Ώρα Παραλαβής:</b> <span>${selectedAd.delivery_time}</span></p>
            <p><b>Διαθέσιμες Μερίδες:</b> <span>${maxServings}</span></p>
            
            <div class="servings-selection" style="margin: 20px 0; display: flex; align-items: center; gap: 10px;">
                <label style="font-weight: bold; color: #ffffff;">Πόσες μερίδες επιθυμείτε;</label>
                <input type="number" id="requestedServings" class="search-box" 
                       value="1" min="1" max="${maxServings}" 
                       style="width: 70px; padding: 5px; border-radius: 5px; border: 1px solid #555; background: #1a1a1a; color: white; text-align: center;">
            </div>
            
            ${selectedAd.allergens ? `
                <div class="allergen-box">
                    <b>Αλλεργιογόνα:</b> ${selectedAd.allergens}
                </div>
            ` : ''}
            
            ${selectedAd.notes ? `
                <div class="notes-box">
                    "${selectedAd.notes}"
                </div>
            ` : ''}
        </div>
    `;

    document.getElementById('confirmOrderBtn').addEventListener('click', () => {
        const requestedInput = document.getElementById('requestedServings');
        const requestedAmount = parseInt(requestedInput.value);

        if (isNaN(requestedAmount) || requestedAmount < 1 || requestedAmount > maxServings) {
            alert(`Παρακαλώ επιλέξτε έναν έγκυρο αριθμό μερίδων (1 έως ${maxServings}).`);
            return;
        }

        const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || { fullname: "Φοιτητής" };

        const newRequest = {
            id: Date.now(),
            adId: selectedAdId,
            consumerName: currentUser.fullname || "Φοιτητής",
            requestedServings: requestedAmount,
            status: "pending", // Εκκρεμεί έγκριση από τον μάγειρα
            timestamp: Date.now()
        };

        let allRequests = JSON.parse(localStorage.getItem('allRequests')) || [];
        allRequests.push(newRequest);
        localStorage.setItem('allRequests', JSON.stringify(allRequests));

        alert(`Το αίτημά σας για ${requestedAmount} μερίδα/ες στάλθηκε στον μάγειρα! Αναμένεται η έγκρισή του.`);
        sessionStorage.removeItem('selectedAdId');
        window.history.back(); 
    });
});