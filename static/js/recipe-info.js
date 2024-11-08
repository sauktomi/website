function toggleAdditionalInfo() {
    const additionalInfo = document.getElementById('additional-info');
    const button = document.querySelector('.info-toggle');
    const isHidden = additionalInfo.classList.contains('hidden');
    
    additionalInfo.classList.toggle('hidden');
    button.setAttribute('aria-expanded', isHidden);
    
    const toggleIcon = button.querySelector('.toggle-icon');
    toggleIcon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0)';
}
