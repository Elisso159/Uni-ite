document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) 
                     || JSON.parse(localStorage.getItem('currentUser')) 
                     || {};

    await loadCookRatings(currentUser);
});

async function loadCookRatings(currentUser) {
    const container = document.getElementById('myPlatesContainer'); 
    if (!container) return;

    const currentCookName = (currentUser.fullname || "").trim();

    if (!currentCookName) {
        container.innerHTML = `
            <div style="padding: 30px; text-align: center; color: #abb2bf;">
                <p style="font-style: italic; margin: 0;">Δεν βρέθηκαν στοιχεία μάγειρα.</p>
            </div>`;
        return;
    }

    try {
        const response = await fetch(`/api/cook/ratings?cookName=${encodeURIComponent(currentCookName)}`);

        if (!response.ok) {
            throw new Error('Αποτυχία ανάκτησης αξιολογήσεων από τον διακομιστή.');
        }

        const cookReviews = await response.json();

        if (cookReviews.length === 0) {
            container.innerHTML = `
                <div style="padding: 30px; text-align: center; color: #abb2bf;">
                    <p style="font-style: italic; margin: 0;">Δεν έχετε λάβει ακόμα αξιολογήσεις από καταναλωτές.</p>
                </div>`;
            return;
        }

        container.innerHTML = '';

        // Εμφάνιση αξιολογήσεων
        cookReviews.forEach(review => {
            const mealTitle = review.adTitle || 'Γεύμα';
            const consumerName = review.consumerName || 'Φοιτητής';
            const ratingStars = Number(review.rating || 0);
            const servings = review.servings || 1;

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

    } catch (error) {
        console.error('Σφάλμα κατά τη φόρτωση των αξιολογήσεων:', error);
        container.innerHTML = `<p style="color: red; text-align: center;">Προέκυψε σφάλμα κατά τη σύνδεση με τον διακομιστή.</p>`;
    }
}