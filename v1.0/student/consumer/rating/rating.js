document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) 
                     || JSON.parse(localStorage.getItem('currentUser')) 
                     || {};

    if (!currentUser.st_name) currentUser.fullname = "Φοιτητής";

    await loadCompletedOrders(currentUser);
});

async function loadCompletedOrders(currentUser) {
    const container = document.getElementById('myOrdersContainer');
    if (!container) return;

    try {
        const response = await fetch(`http://localhost:3000/api/orders/completed?consumerId=${currentUser.st_id}`);
        
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

        //Πρώτα εμφανίζονται τα μη αξιολογημένα γεύματα
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
            const mealTitle = req.title || 'Παραλαβή Γεύματος';
            const cookName = req.cookName || 'Φοιτητής';
            const servings = req.req_servings || req.servings || 1;
            
            const currentRating = Number(req.rating || 0);
            const reqUniqueId = req.req_id || req.id || req._id || req.adId;
            const isAlreadyRated = currentRating > 0;

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

                <div class="rating-container" style="margin-top: 10px;">
                    <div class="rating-title" style="font-size: 0.9rem; margin-bottom: 5px;">
                        ${isAlreadyRated ? 'Η αξιολόγησή σας:' : 'Αξιολογήστε το γεύμα:'}
                    </div>
                    <div class="stars-wrapper ${isAlreadyRated ? 'disabled' : ''}" data-req-id="${reqUniqueId}">
                        ${[1, 2, 3, 4, 5].map(star => `
                            <span class="star ${star <= currentRating ? 'active' : ''} ${isAlreadyRated ? 'readonly' : ''}" 
                                  data-value="${star}" 
                                  style="cursor: ${isAlreadyRated ? 'default' : 'pointer'}; font-size: 1.2rem; color: ${star <= currentRating ? '#ffc107' : '#ccc'};">★</span>
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
    // Επιλογή μόνο των αστεριών που ΔΕΝ έχουν ήδη κλειδώσει
    document.querySelectorAll('.stars-wrapper:not(.disabled)').forEach(wrapper => {
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
    if (!reqId || reqId === 'undefined') {
        console.error('Σφάλμα: Το reqId δεν είναι έγκυρο:', reqId);
        alert('Πρόβλημα ταυτοποίησης παραγγελίας.');
        return false;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/orders/${reqId}/rate`, {
            method: 'PUT', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rating: ratingValue
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Αποτυχία αποθήκευσης αξιολόγησης');
        }

        return true;

    } catch (error) {
        console.error('Σφάλμα κατά την αποθήκευση της αξιολόγησης:', error);
        alert(error.message || 'Δεν ήταν δυνατή η αποθήκευση της αξιολόγησης. Παρακαλώ δοκιμάστε ξανά.');
        return false;
    }
}