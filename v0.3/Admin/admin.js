async function fetchMonthlyStats() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/stats/monthly-portions');
    const data = await response.json();

    if (data.success) {
      console.log('Συνολικές μερίδες:', data.totalPortionsLastMonth);
      document.getElementById('portions-count').textContent = data.totalPortionsLastMonth;
    } else {
      console.error('Σφάλμα από τον server:', data.error);
    }
  } catch (error) {
    console.error('Αποτυχία σύνδεσης με το backend:', error);
  }
}

// Συνάρτηση για να φέρουμε το Leaderboard
async function fetchLeaderboard() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/leaderboard');
    const data = await response.json();

    if (data.success) {
      const { topDonor, topMeals } = data.leaderboard;

      // Εμφάνιση Top Donor
      if (topDonor) {
        document.getElementById('top-donor-name').textContent = `${topDonor.st_name} ${topDonor.st_surname}`;
        document.getElementById('top-donor-portions').textContent = topDonor.total_donated_portions;
      }

      // Εμφάνιση Top Γευμάτων (Λίστα)
      const mealsListContainer = document.getElementById('top-meals-list');
      mealsListContainer.innerHTML = ''; // Καθαρισμός

      topMeals.forEach(meal => {
        const li = document.createElement('li');
        li.textContent = `${meal.food_title} - ${meal.total_requests} αιτήματα`;
        mealsListContainer.appendChild(li);
      });
    }
  } catch (error) {
    console.error('Σφάλμα κατά την ανάκτηση του leaderboard:', error);
  }
}
fetchMonthlyStats();
fetchLeaderboard();