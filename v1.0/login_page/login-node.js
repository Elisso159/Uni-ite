document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    // Helper function to check if an email belongs to an admin
    function isAdminEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const cleanEmail = email.trim().toLowerCase();
        const parts = cleanEmail.split('@');
        if (parts.length !== 2) return false;
        const localPart = parts[0];
        return localPart.startsWith('adm_') && localPart.length > 4;}

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault(); 

        const email = document.getElementById('email').value.trim(); 
        const password = document.getElementById('password').value.trim();

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {

                // Server returned the user object
                sessionStorage.setItem('currentUser', JSON.stringify(data.user));
                const isAdministrator = isAdminEmail(email) || data.user.property === 'admin';

                if (isAdministrator) {
                    window.location.href = '/home/totoro/Έγγραφα/University/Sixth_Semester/Web/admin/admin.html'; 

                } else {
                    window.location.href = '/home/totoro/Έγγραφα/University/Sixth_Semester/Web/student/student.html';

                }
            } else {
                // Handle error sent from server
                alert(data.message || 'Λάθος email ή κωδικός πρόσβασης.');
            }

        } catch (error) {
            console.error("Σφάλμα σύνδεσης:", error);
            alert("Δεν ήταν δυνατή η σύνδεση με τον διακομιστή.");
        }
    });
});