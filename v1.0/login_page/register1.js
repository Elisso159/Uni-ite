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
       
        const userData = { fullname, university, email, password };

    console.log(userData);

    try {
        // 4. Send data to your Node.js API
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (response.ok) {
            alert("Επιτυχής εγγραφή!");
            window.location.href = 'index.html';
            // Redirect or clear form
        } else {
            alert("Σφάλμα: " + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert("Παρουσιάστηκε πρόβλημα με τη σύνδεση στον διακομιστή.");
    }

        //alert('Η εγγραφή ολοκληρώθηκε επιτυχώς!'); 
    });
}); 