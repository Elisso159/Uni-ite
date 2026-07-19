document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    const nameElement = document.getElementById('cookName');
    const universityElement = document.getElementById('cookUniversity');
    const pointElement = document.getElementById('cookPoints');
    
    if (nameElement) nameElement.textContent = currentUser.fullname;
    if (universityElement) universityElement.textContent = currentUser.university.toUpperCase();
    if (pointElement) pointElement.textContent = currentUser.points;

    loadPersonnalAds(currentUser);
});

function loadPersonnalAds(currentUser){
    const container = document.getElementById('cookAdsContainer');
    
    if(!container) return;

    container.innerHTML = '';

    const userUniKey = currentUser.university ? currentUser.university.toLowerCase() : "";
    const allAds = JSON.parse(localStorage.getItem('allAds')) || [];
    const myUniversityAds = allAds.filter(ad => ad.university === userUniKey);

    if (myUniversityAds.length === 0) {
        container.innerHTML = '<p class="no-ads-message">Δεν έχετε δημοσιεύσει ακόμα κάποια αγγελία.</p>';
        return;
    }

    myUniversityAds.forEach(ad => {
        const card = document.createElement('div');
        card.className = 'card shared-meal-card';

        card.innerHTML = `
            <div class="meal-info">
                <h3 class="meal-title">${ad.title}</h3>
                <p class="meal-portions"> <b>Διεύθυνση:</b> ${ad.address}</p>
                <p class="meal-portions"> <b>Ώρα Παραλαβής:</b> ${ad.delivery_time}</p>
                ${ad.allergens ? `<p class="meal-portions" style="color: rgb(247, 239, 239);"><b>Αλλεργιογόνα:</b> ${ad.allergens}</p>` : ''}
            </div>
            <div class="meal-actions">
                <button class="sort-btn edit-btn" onclick="editAd(${ad.id})">Edit</button>
                <button class="sort-btn delete-btn" onclick="deleteAd(${ad.id})">Delete</button>
            </div>
        `;

        container.appendChild(card);
    });
}

window.deleteAd = function(adId) {
    if (confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την αγγελία;")) {
        let allAds = JSON.parse(localStorage.getItem('allAds')) || [];
        allAds = allAds.filter(ad => ad.id !== adId);
        localStorage.setItem('allAds', JSON.stringify(allAds));
        
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || {};
        
        loadPersonnalAds(currentUser);
    }
};

window.editAd = function(adId) { 
    if (confirm("Είστε σίγουροι ότι θέλετε να επεξεργαστείτε αυτή την αγγελία;")) {
        sessionStorage.setItem('editAdId', adId); 
        window.location.href = "ad/edit_ad.html";
    }
};