document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) 
                     || JSON.parse(localStorage.getItem('currentUser')) 
                     || {};

    if (!currentUser.fullname) currentUser.fullname = "Φοιτητής";

    loadCompletedOrders(currentUser);
});

function loadCompletedOrders(currentUser) {
    const container = document.getElementById('myOrdersContainer');
    if (!container) return;

    const allRequests = JSON.parse(localStorage.getItem('allRequests')) || [];
    const allAds = JSON.parse(localStorage.getItem('allAds')) || [];

    const currentConsumerName = currentUser.fullname.trim().toLowerCase();

    let completedOrders = allRequests.filter(req => {
        const reqConsumer = (req.consumerName || "").trim().toLowerCase();
        const isMyRequest = reqConsumer === currentConsumerName;
        const isCompleted = String(req.status).trim().toLowerCase() === 'completed';

        return isMyRequest && isCompleted;
    });

    if (completedOrders.length === 0) {
        container.innerHTML = `
            <div style="padding: 30px; text-align: center;">
                <p style="color: #abb2bf; font-size: 0.95rem; font-style: italic; margin: 0;">
                    Δεν έχετε καμία ολοκληρωμένη παραλαβή γεύματος ακόμα.
                </p>
            </div>`;
        return;
    }

    completedOrders.sort((a, b) => {
        const ratingA = Number(a.rating || 0);
        const ratingB = Number(b.rating || 0);

        if (ratingA === 0 && ratingB > 0) return -1; 
        if (ratingA > 0 && ratingB === 0) return 1;  
        return 0;
    });

    container.innerHTML = '';

    completedOrders.forEach(req => {
        const parentAd = allAds.find(ad => String(ad.id) === String(req.adId)) || {};

        const rawImage = parentAd.image || parentAd.img || parentAd.imageUrl || parentAd.photo 
                      || req.adImage || req.image || '';

        const mealTitle = parentAd.title || req.adTitle || 'Παραλαβή Γεύματος';
        const cookName = parentAd.cookName || parentAd.cook || req.cookName || 'Φοιτητής';
        const address = parentAd.address || req.address || '-';
        const servings = req.requestedServings || req.servings || 1;
        
        const currentRating = Number(req.rating || 0);
        const reqUniqueId = req.id !== undefined ? req.id : req.adId;

        const item = document.createElement('div');
        item.className = 'setting-item';
        item.style.flexDirection = 'column';
        item.style.alignItems = 'stretch';

        item.innerHTML = `
            <div style="display: flex; align-items: center; width: 100%;">
                <div class="setting-icon" style="overflow: hidden; padding: 0; width: 55px; height: 55px; border-radius: 10px; flex-shrink: 0; margin-right: 15px;">
                    ${rawImage ? `
                        <img src="${rawImage}" alt="${mealTitle}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                    ` : `
                    `}
                </div>

                <div class="setting-text" style="flex: 1;">
                    <h3>${mealTitle}</h3>
                    <p><b>Μάγειρας:</b> ${cookName}</p>
                    <p><b>Μερίδες που παραλάβατε:</b> ${servings}</p>
                </div>
            </div>

            <div class="rating-container">
                <div class="rating-title">${currentRating > 0 ? 'Η αξιολόγησή σας:' : 'Αξιολογήστε το γεύμα:'}</div>
                <div class="stars-wrapper" data-req-id="${reqUniqueId}">
                    ${[1, 2, 3, 4, 5].map(star => `
                        <span class="star ${star <= currentRating ? 'active' : ''}" data-value="${star}">★</span>
                    `).join('')}
                </div>
            </div>
        `;

        container.appendChild(item);
    });

    setupRatingListeners(currentUser);
}

function setupRatingListeners(currentUser) {
    document.querySelectorAll('.stars-wrapper').forEach(wrapper => {
        const reqId = wrapper.getAttribute('data-req-id');
        const stars = wrapper.querySelectorAll('.star');

        stars.forEach(star => {
            star.addEventListener('click', () => {
                const selectedValue = parseInt(star.getAttribute('data-value'));
                saveRatingAndCalculatePoints(reqId, selectedValue);
                loadCompletedOrders(currentUser);
            });
        });
    });
}

function saveRatingAndCalculatePoints(reqId, ratingValue) {
    let allRequests = JSON.parse(localStorage.getItem('allRequests')) || [];
    let allAds = JSON.parse(localStorage.getItem('allAds')) || [];

    allRequests = allRequests.map(req => {
        const currentReqId = req.id !== undefined ? req.id : req.adId;

        if (String(currentReqId) === String(reqId)) {
            const parentAd = allAds.find(ad => String(ad.id) === String(req.adId)) || {};
            
            req.cookName = parentAd.cookName || parentAd.cook || req.cookName || "";

            const servings = Number(req.requestedServings || req.servings || 1);

            const base = 1;
            const bonus = ratingValue > 3 ? 1 : 0;
            
            req.rating = ratingValue;
            req.earnedPoints = (base + bonus) * servings;
        }
        return req;
    });

    localStorage.setItem('allRequests', JSON.stringify(allRequests));
}