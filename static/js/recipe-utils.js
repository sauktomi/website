// Initialize UI elements and event listeners
document.addEventListener('DOMContentLoaded', () => {
    const dividerContainer = document.querySelector('.divider-container');
    
    // Set up divider toggle listeners
    dividerContainer.addEventListener('click', toggleAdditionalInfo);
    dividerContainer.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            toggleAdditionalInfo();
        }
    });

    // Set up recipe scaling listeners
    const customYieldInput = document.querySelector('#custom-yield');
    if (customYieldInput) {
        customYieldInput.addEventListener('focus', handleInputFocus);
    }

    // Initialize scale buttons
    const scaleButtons = document.querySelectorAll('.scale-btn:not(.input-btn)');
    scaleButtons.forEach(btn => {
        btn.addEventListener('click', () => scaleRecipe(btn.dataset.scale));
    });
});

// Toggle additional information visibility
function toggleAdditionalInfo() {
    const additionalInfo = document.getElementById('additional-info');
    const container = document.querySelector('.divider-container');
    const divider = document.querySelector('.meta-divider');
    const isHidden = additionalInfo.classList.contains('hidden');
    
    additionalInfo.classList.toggle('hidden');
    container.setAttribute('aria-expanded', isHidden);
    divider.classList.toggle('expanded', isHidden);
}

// Handle custom yield input focus
function handleInputFocus() {
    const inputBtn = document.querySelector('.input-btn');
    const scaleButtons = document.querySelectorAll('.scale-btn:not(.input-btn)');
    
    inputBtn.classList.add('active');
    scaleButtons.forEach(btn => btn.classList.remove('active'));
}

// Scale recipe quantities
function scaleRecipe(scale, fromInput = false) {
    // Convert scale to number and remove 'x' if present
    scale = parseFloat(scale.toString().replace('x', ''));
    
    const elements = {
        ingredients: document.querySelectorAll('.ingredients-list li'),
        scaleButtons: document.querySelectorAll('.scale-btn:not(.input-btn)'),
        customYieldInput: document.querySelector('#custom-yield'),
        inputBtn: document.querySelector('.input-btn'),
        currentYield: document.querySelector('#current-yield')
    };

    // Get original values
    const originalValues = {
        servings: parseFloat(elements.customYieldInput.dataset.originalServings),
        yield: parseFloat(elements.customYieldInput.dataset.originalYield),
        unit: elements.customYieldInput.dataset.yieldUnit
    };

    // Update UI active states
    updateUIState(elements, scale, fromInput);

    // Update yield display
    updateYieldDisplay(elements.currentYield, originalValues, scale);

    // Update custom yield input
    elements.customYieldInput.value = scale;

    // Update ingredient quantities
    updateIngredients(elements.ingredients, scale);
}

// Helper function to update UI state
function updateUIState(elements, scale, fromInput) {
    if (fromInput) {
        elements.scaleButtons.forEach(btn => btn.classList.remove('active'));
        elements.inputBtn.classList.add('active');
    } else {
        elements.inputBtn.classList.remove('active');
        elements.scaleButtons.forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.scale) === scale);
        });
    }
}

// Helper function to update yield display
function updateYieldDisplay(displayElement, originalValues, scale) {
    const scaledServings = formatNumber(originalValues.servings * scale);
    const scaledYield = formatNumber(originalValues.yield * scale);
    displayElement.textContent = `${scaledServings} ${scaledYield}${originalValues.unit}`;
}

// Helper function to update ingredients
function updateIngredients(ingredients, scale) {
    ingredients.forEach(ingredient => {
        const originalText = ingredient.getAttribute('data-original') || ingredient.textContent;
        if (!ingredient.getAttribute('data-original')) {
            ingredient.setAttribute('data-original', originalText);
        }

        const match = originalText.match(/^([\d.,]+)(\s*[a-zA-ZäöåÄÖÅ]+\s*)(.*)/);
        if (match) {
            const [_, amount, unit, rest] = match;
            const scaledAmount = formatNumber(parseFloat(amount.replace(',', '.')) * scale);
            ingredient.textContent = `${scaledAmount}${unit}${rest}`;
        }
    });
}

// Helper function to format numbers
function formatNumber(num) {
    return num.toFixed(1).replace(/\.0$/, '').replace('.', ',');
}