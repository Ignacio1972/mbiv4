// Debug script para inyectar en la consola
(function() {
    const container = document.querySelector('.container');
    const campaignModule = document.querySelector('.campaign-library-module');
    const grid = document.querySelector('.messages-grid');
    const cards = document.querySelectorAll('.message-card');
    
    console.log('=== DEBUG VIEWPORT ===');
    console.log('Window width:', window.innerWidth);
    console.log('Media query (≤768px):', window.matchMedia('(max-width: 768px)').matches);
    
    if (container) {
        console.log('Container:', {
            width: container.offsetWidth,
            padding: getComputedStyle(container).padding,
            boxSizing: getComputedStyle(container).boxSizing
        });
    }
    
    if (grid) {
        console.log('Grid:', {
            width: grid.offsetWidth,
            columns: getComputedStyle(grid).gridTemplateColumns,
            gap: getComputedStyle(grid).gap
        });
    }
    
    console.log('Cards count:', cards.length);
    cards.forEach((card, i) => {
        console.log(`Card ${i+1}:`, {
            width: card.offsetWidth,
            maxHeight: getComputedStyle(card).maxHeight
        });
        
        const content = card.querySelector('.message-content');
        if (content) {
            console.log(`  Content ${i+1}:`, {
                height: content.offsetHeight,
                maxHeight: getComputedStyle(content).maxHeight,
                lineClamp: getComputedStyle(content).webkitLineClamp,
                overflow: getComputedStyle(content).overflow
            });
        }
    });
    
    // Crear indicador visual
    const debugDiv = document.createElement('div');
    debugDiv.style.cssText = 'position:fixed; top:0; left:0; background:red; color:white; padding:10px; z-index:10000;';
    debugDiv.innerHTML = `
        Width: ${window.innerWidth}px<br>
        Grid: ${grid ? grid.offsetWidth : 0}px<br>
        Cols: ${grid ? getComputedStyle(grid).gridTemplateColumns : 'N/A'}<br>
        Cards: ${cards.length}
    `;
    document.body.appendChild(debugDiv);
})();