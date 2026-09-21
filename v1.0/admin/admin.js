async function fetchMonthlyStats() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/stats/monthly-portions');
    const data = await response.json();

    if (data.success) {
      const formattedPortions = Number(data.totalPortionsLastMonth).toLocaleString('el-GR');
      document.getElementById('portions-count').textContent = formattedPortions;
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
        document.getElementById('top-donor-portions').textContent = `${topDonor.total_donated_portions} γεύμα-τα`;
      }

      // Εμφάνιση Top Γευμάτων 
      const mealsListContainer = document.getElementById('top-meals-list');
      mealsListContainer.innerHTML = ''; 
      if (topMeals && topMeals.length > 0) {
        // Παίρνουμε μόνο τα πρώτα 3 γεύματα
        const top3Meals = topMeals.slice(0, 3);

        top3Meals.forEach(meal => {
          const li = document.createElement('li');
          li.textContent = meal.food_title;
          mealsListContainer.appendChild(li);
        });
      }
    }
  } catch (error) {
    console.error('Σφάλμα κατά την ανάκτηση του leaderboard:', error);
  }
}

fetchMonthlyStats();
fetchLeaderboard();