document.addEventListener('DOMContentLoaded', function () {
    const menuItems = document.querySelectorAll('.menu-item');
    const backButtons = document.querySelectorAll('.back-button');
    const submenuContainers = document.querySelectorAll('.submenu-container');
    const circularMenu = document.querySelector('.circular-menu');

    if (!circularMenu) {
        console.error('Circular menu not found!');
        return;
    }

    const menuSettings = {
        'item-about': { angle: 6, radius: 575, direction: -1 },
        'item-submissions': { angle: 200, radius: 575, direction: -1 },
        'item-publication-ethics': { angle: 30, radius: 475, direction: -1 },
        'item-editorial-team': { angle: 205, radius: 475, direction: -1 },
        'item-announcements': { angle: 20, radius: 375, direction: -1 },
        'item-archives': { angle: 194, radius: 375, direction: -1 },
        'item-current': { angle: 11, radius: 275, direction: -1 }
    };

    let letterSpacing = 4;

    function calculateDynamicOffset() {
        return window.innerWidth / 2;
    }

    function createCircularText() {
        const dynamicOffsetX = calculateDynamicOffset();

        menuItems.forEach(item => {
            const text = item.getAttribute('data-text');
            const itemClass = item.classList[1];

            item.innerHTML = '';
            const settings = menuSettings[itemClass];

            for (let i = 0; i < text.length; i++) {
                if (text[i] === ' ') continue;

                const angle = settings.angle + (settings.direction * i * letterSpacing);
                const letterSpan = document.createElement('span');
                letterSpan.innerText = text[i];

                const rad = angle * Math.PI / 180;
                const x = settings.radius * Math.cos(rad);
                const y = settings.radius * Math.sin(rad);

                letterSpan.style.position = 'absolute';
                letterSpan.style.left = `calc(50% + ${x}px)`;
                letterSpan.style.top = `calc(50% + ${y}px)`;
                letterSpan.style.transform = `translate(-50%, -50%) rotate(${angle + 90 * settings.direction}deg)`;

                item.appendChild(letterSpan);
            }
        });
    }

    createCircularText();
    window.addEventListener('resize', createCircularText);

    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            const submenuId = this.getAttribute('data-submenu');
            const targetSubmenu = document.getElementById(submenuId + '-submenu');

            // Add active class to circular menu
            circularMenu.classList.add('submenu-view');
            circularMenu.classList.add('submenu-active');

            // Active the clicked submenu
            if (targetSubmenu) {
                // Hide all submenus first
                submenuContainers.forEach(submenu => {
                    submenu.classList.remove('active');
                });

                // Show targeted submenu
                targetSubmenu.classList.add('active');
            }

            // Get the clicked layer's index
            const itemClass = this.classList[1];
            let layerIndex = 0;

            if (itemClass === 'item-about') layerIndex = 1;
            else if (itemClass === 'item-submissions') layerIndex = 2;
            else if (itemClass === 'item-publication-ethics') layerIndex = 3;
            else if (itemClass === 'item-editorial-team') layerIndex = 4;
            else if (itemClass === 'item-announcements') layerIndex = 5;
            else if (itemClass === 'item-archives') layerIndex = 6;
            else if (itemClass === 'item-current') layerIndex = 7;

            // Center the clicked layer and arrange others
            const layers = document.querySelectorAll('.circle-layer');

            layers.forEach((layer, index) => {
                const layerNum = index + 1;

                // Reset any previous transforms
                layer.style.transform = '';

                if (layerNum === layerIndex) {
                    // Center and bring forward the clicked layer
                    layer.style.zIndex = 30;
                    layer.style.transform = 'translate(-50%, -50%) scale(1.2)';
                    layer.style.top = '50%';
                    layer.style.left = '50%';
                    layer.style.position = 'absolute';
                } else {
                    // Arrange other layers behind
                    layer.style.zIndex = 20 - Math.abs(layerNum - layerIndex);

                    // Calculate position based on distance from active layer /*${0.95 - Math.abs(distance) * 0.05}*/
                    const distance = layerNum - layerIndex;
                    const offset = layerIndex % 2 ? 50: -50;// distance * 30; // pixels offset for each layer

                    layer.style.transform = `translate(${offset}px, ${offset}px) scale(2)`;
                }
            });
        });
    });

    // Handle back button click
    backButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Reset menu view
            circularMenu.classList.remove('submenu-view');
            circularMenu.classList.remove('submenu-active');

            // Hide all submenus
            submenuContainers.forEach(submenu => {
                submenu.classList.remove('active');
            });

            // Reset layers to original positions
            const layers = document.querySelectorAll('.circle-layer');
            layers.forEach((layer, index) => {
                layer.style.zIndex = index + 1; // Reset to default z-index
                layer.style.transform = ''; // Clear transforms
                layer.style.top = ''; // Reset positioning
                layer.style.left = '';
                layer.style.position = '';
            });
        });
    });
});