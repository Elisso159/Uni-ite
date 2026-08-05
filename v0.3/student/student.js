function handleSuccessfulLogin(userData) {
    sessionStorage.setItem('currentUser', JSON.stringify(userData));
    window.location.href = "student.html";
}

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    document.getElementById('cookBtn').addEventListener('click', () => {
        currentUser.role = 'cook'; 
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser)); 
        window.location.href = "cook/cook.html";
    });

    document.getElementById('consumerBtn').addEventListener('click', () => {
        currentUser.role = 'consumer';
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser)); // Ενημέρωση
        window.location.href = "consumer/consumer.html";
    });
});