document.addEventListener('DOMContentLoaded', () => { 
    const registerForm = document.getElementById('registerForm');

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const fullname = document.getElementById('fullname').value;
        const university = document.getElementById('university').value;
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value.trim();
        const confPassword = document.getElementById('confirm-password').value;

        if (password !== confPassword) {
            alert('Οι κωδικοί πρόσβασης δεν ταιριάζουν! Προσπάθησε ξανά.');
            return;
        }
       
        const localUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];


        const userExists = localUsers.some(user => user.email === email);
        if (userExists) {
            alert('Αυτό το ακαδημαϊκό email χρησιμοποιείται ήδη!');
            return;
        }

        const newUser = {
            fullname: fullname,
            university: university,
            email: email,
            password: password,
            property: 'student' 
        };

        localUsers.push(newUser);
        localStorage.setItem('registeredUsers', JSON.stringify(localUsers));

        alert('Η εγγραφή ολοκληρώθηκε επιτυχώς!'); 
        window.location.href = 'index.html';
    });
}); 