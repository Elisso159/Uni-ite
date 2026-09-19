document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    // Helper function to check if an email belongs to an admin
    function isAdminEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const cleanEmail = email.trim().toLowerCase();
        const parts = cleanEmail.split('@');
        if (parts.length !== 2) return false;
        const localPart = parts[0];
        return localPart.startsWith('adm_') && localPart.length > 4;
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault(); 

        const email = document.getElementById('email').value.trim(); 
        const password = document.getElementById('password').value.trim();

        try {
            // Send request to your Node.js backend
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Success: Server returned the user object
                sessionStorage.setItem('currentUser', JSON.stringify(data.user));
                
                // Determine if user is admin via email pattern or database property
                const isAdministrator = isAdminEmail(email) || data.user.property === 'admin';

                // Redirect based on user role
                if (isAdministrator) {
                    //window.location.href = '/home/vboxuser/Personal_Work/WEB_PROJECT/admin/admin.html'; // Or your full path to admin page
                    window.location.href = '/home/vboxuser/Personal_Work/WEB_PROJECT/admin/admin.html'; // Or your full path to admin page

                } else {
                    //window.location.href = '/home/vboxuser/Personal_Work/WEB_PROJECT/student/student.html';
                    window.location.href = '/student/student.html';

                }

            } else {
                // Failure: Handle error sent from server
                alert(data.message || 'Λάθος email ή κωδικός πρόσβασης.');
            }

        } catch (error) {
            console.error("Σφάλμα σύνδεσης:", error);
            alert("Δεν ήταν δυνατή η σύνδεση με τον διακομιστή.");
        }
    });
});