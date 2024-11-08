function scaleRecipe(scale) {
    const ingredients = document.querySelectorAll('.ingredients-list li');
    ingredients.forEach(ingredient => {
        const originalText = ingredient.getAttribute('data-original') || ingredient.textContent;
        if (!ingredient.getAttribute('data-original')) {
            ingredient.setAttribute('data-original', originalText);
        }
        
        const match = originalText.match(/^([\d.,]+)(\s*[a-zA-ZäöåÄÖÅ]+\s*)(.*)/);
        if (match) {
            const [_, amount, unit, rest] = match;
            const scaledAmount = (parseFloat(amount.replace(',', '.')) * parseFloat(scale))
                .toFixed(1)
                .replace(/\.0$/, '')
                .replace('.', ',');
            ingredient.textContent = `${scaledAmount}${unit}${rest}`;
        }
    });
}
