document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) 
                     || JSON.parse(localStorage.getItem('currentUser')) 
                     || {};

    loadCookRatings(currentUser);
});

function loadCookRatings(currentUser) {
    const container = document.getElementById('myPlatesContainer'); 
    if (!container) return;

    const currentCookName = (currentUser.fullname || "").trim().toLowerCase();
    const currentCookUni = (currentUser.university || "").trim().toLowerCase();

    const allRequests = JSON.parse(localStorage.getItem('allRequests')) || [];
    const allAds = JSON.parse(localStorage.getItem('allAds')) || [];

    // Φιλτράρισμα για ολοκληρωμένες && αξιολογημένες παραγγελίες του cook
    const cookReviews = allRequests.filter(req => {
        const parentAd = allAds.find(ad => String(ad.id) === String(req.adId)) || {};
        
        const reqCookName = (parentAd.cookName || parentAd.cook || req.cookName || "").trim().toLowerCase();
        const reqCookUni = (parentAd.university || "").trim().toLowerCase();

        // Έλεγχος αν η παραγγελία ανήκει σε αυτόν τον μάγειρα
        const isMyCook = (currentCookName && reqCookName === currentCookName) || 
                         (currentCookUni && reqCookUni === currentCookUni);

        const isCompleted = String(req.status).trim().toLowerCase() === 'completed';
        const hasRating = Number(req.rating || 0) > 0;

        return isMyCook && isCompleted && hasRating;
    });

    // Έλεγχος ύπαρξης αξιολογήσεων
    if (cookReviews.length === 0) {
        container.innerHTML = `
            <div style="padding: 30px; text-align: center; color: #abb2bf;">
                <p style="font-style: italic; margin: 0;">Δεν έχετε λάβει ακόμα αξιολογήσεις από καταναλωτές.</p>
            </div>`;
        return;
    }

    container.innerHTML = '';

    // Εμφάνιση  αξιολoγήσεων
    cookReviews.forEach(review => {
        const parentAd = allAds.find(ad => String(ad.id) === String(review.adId)) || {};

        const mealTitle = parentAd.title || review.adTitle || 'Γεύμα';
        const consumerName = review.consumerName || 'Φοιτητής';
        const ratingStars = Number(review.rating || 0);
        const servings = review.requestedServings || review.servings || 1;
        const earnedPoints = review.earnedPoints || (ratingStars > 3 ? servings * 2 : servings);

        const card = document.createElement('div');
        card.className = 'setting-item';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'stretch';

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                <div class="setting-text">
                    <h3>${mealTitle}</h3>
                    <p><b>Από:</b> ${consumerName}</p>
                    <p><b>Μερίδες που παρέλαβε:</b> ${servings}</p>
                </div>

                <div style="text-align: right;">
                    <div style="color: #ffc107; font-size: 1.2rem;">
                        ${'★'.repeat(ratingStars)}${'☆'.repeat(5 - ratingStars)}
                    </div>
                    <span style="color: #abb2bf; font-size: 0.85rem;">${ratingStars}/5</span>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}