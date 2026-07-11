document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault(); 

        const emailInput = document.getElementById('email').value.trim(); 
        const passwordInput = document.getElementById('password').value.trim();

        try {
            const response = await fetch('users_consumers_testing.json');
            const jsonUsers = await response.json(); 

            const localUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
            const allUsers = [...jsonUsers, ...localUsers];

            const user = allUsers.find(user => user.email === emailInput && user.password === passwordInput);

            if (user) {
                sessionStorage.setItem('currentUser', JSON.stringify(user))
                if(user.property == 'student'){
                    window.location.href = 'student.html';
                }
                else{
                    window.location.href = 'admin.html';
                }
            } else {
                alert('Λάθος email ή κωδικός πρόσβασης.');
            }

        } catch (error) {
            console.error("Κάτι πήγε λάθος με το fetch:", error);
            alert("Σφάλμα κατά τη φόρτωση των δεδομένων.");
        }
    });
});

