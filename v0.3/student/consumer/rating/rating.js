document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) 
                     || JSON.parse(localStorage.getItem('currentUser')) 
                     || {};

    if (!currentUser.fullname) currentUser.fullname = "Φοιτητής";

    await loadCompletedOrders(currentUser);
});

async function loadCompletedOrders(currentUser) {
    const container = document.getElementById('myOrdersContainer');
    if (!container) return;

    try {
        
        const response = await fetch(`/api/orders/completed?consumerName=${encodeURIComponent(currentUser.fullname)}`);
        
        if (!response.ok) {
            throw new Error('Αποτυχία ανάκτησης δεδομένων από τον διακομιστή.');
        }

        const completedOrders = await response.json();

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
            const rawImage = req.image || req.imageUrl || req.adImage || '';
            const mealTitle = req.adTitle || req.title || 'Παραλαβή Γεύματος';
            const cookName = req.cookName || 'Φοιτητής';
            const servings = req.requestedServings || req.servings || 1;
            
            const currentRating = Number(req.rating || 0);
            const reqUniqueId = req.id || req._id || req.adId;

            const item = document.createElement('div');
            item.className = 'setting-item';
            item.style.flexDirection = 'column';
            item.style.alignItems = 'stretch';

            item.innerHTML = `
                <div style="display: flex; align-items: center; width: 100%;">
                    <div class="setting-icon" style="overflow: hidden; padding: 0; width: 55px; height: 55px; border-radius: 10px; flex-shrink: 0; margin-right: 15px;">
                        ${rawImage ? `<img src="${rawImage}" alt="${mealTitle}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />` : ''}
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

    } catch (error) {
        console.error('Σφάλμα κατά τη φόρτωση των παραγγελιών:', error);
        container.innerHTML = `<p style="color: red; text-align: center;">Προέκυψε σφάλμα κατά τη σύνδεση με τον διακομιστή.</p>`;
    }
}

function setupRatingListeners(currentUser) {
    document.querySelectorAll('.stars-wrapper').forEach(wrapper => {
        const reqId = wrapper.getAttribute('data-req-id');
        const stars = wrapper.querySelectorAll('.star');

        stars.forEach(star => {
            star.addEventListener('click', async () => {
                const selectedValue = parseInt(star.getAttribute('data-value'));
                
                const success = await saveRatingAndCalculatePoints(reqId, selectedValue);
                
                if (success) {
                    await loadCompletedOrders(currentUser);
                }
            });
        });
    });
}

async function saveRatingAndCalculatePoints(reqId, ratingValue) {
    try {
        const response = await fetch(`/api/orders/${reqId}/rate`, {
            method: 'PUT', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rating: ratingValue
            })
        });

        if (!response.ok) {
            throw new Error('Αποτυχία αποθήκευσης αξιολόγησης');
        }

        return true;

    } catch (error) {
        console.error('Σφάλμα κατά την αποθήκευση της αξιολόγησης:', error);
        alert('Δεν ήταν δυνατή η αποθήκευση της αξιολόγησης. Παρακαλώ δοκιμάστε ξανά.');
        return false;
    }
}