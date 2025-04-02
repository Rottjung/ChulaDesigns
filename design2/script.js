document.addEventListener('DOMContentLoaded', function () {
    // Get all menu items
    const menuItems = document.querySelectorAll('.menu-item');
    const backButtons = document.querySelectorAll('.back-button');
    const mainMenu = document.getElementById('mainMenu');

    // Store menu item settings with the correct values from your sliders
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

    // Function to calculate dynamic offsetX based on screen resolution
    function calculateDynamicOffset() {
        const screenWidth = window.innerWidth;
        const screenCenter = screenWidth / 2;

        return (screenCenter/* - 50*/); // 50px is the assumed half-width of the menu item container
    }

    // Function to create circular text
    function createCircularText() {
        const dynamicOffsetX = calculateDynamicOffset(); // Get dynamic offsetX

        menuItems.forEach(item => {
            const text = item.getAttribute('data-text');
            const itemClass = item.classList[1]; // e.g., 'item-about'

            // Clear existing content
            item.innerHTML = '';

            // Get settings for this item
            const settings = menuSettings[itemClass];

            // Create each letter element
            for (let i = 0; i < text.length; i++) {
                if (text[i] === ' ') continue; // Skip spaces

                const angle = settings.angle + (settings.direction * i * letterSpacing);
                const letterSpan = document.createElement('span');
                letterSpan.innerText = text[i];

                // Position based on angle and radius, including the dynamic offset
                const rad = angle * Math.PI / 180;
                const x = settings.radius * Math.cos(rad);// - dynamicOffsetX;  // Apply dynamic offsetX
                const y = settings.radius * Math.sin(rad);  // No offsetY

                letterSpan.style.position = 'absolute';
                letterSpan.style.transformOrigin = 'center';
                letterSpan.style.left = `calc(50% + ${x}px)`;
                letterSpan.style.top = `calc(50% + ${y}px)`;
                letterSpan.style.transform = `translate(-50%, -50%) rotate(${angle + 90 * settings.direction}deg)`;

                item.appendChild(letterSpan);
            }
        });
    }

    // Call the circular text function initially
    createCircularText();

    // Recalculate offsets when the window is resized
    window.addEventListener('resize', function () {
        createCircularText();
    });

    // Add click event listeners to menu items for submenu activation
    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            item.circularMenu.classList.add('submenu-view');
            // Additional logic to display the corresponding submenu content
        });
    });

    // Add click event listeners to back buttons to return to main menu
    backButtons.forEach(button => {
        button.addEventListener('click', function () {
            item.circularMenu.classList.remove('submenu-view');
            // Additional logic to hide the submenu content
        });
    });
});

    // Slider code commented out
    // Set up slider events
    //function setupSliders() {
    //    // Create a mapping between item classes and slider IDs
    //    const mappings = {
    //        'item-about': 'about',
    //        'item-submissions': 'submissions',
    //        'item-publication-ethics': 'ethics',
    //        'item-editorial-team': 'team',
    //        'item-announcements': 'announcements',
    //        'item-archives': 'archives',
    //        'item-current': 'current'
    //    };

    //    // For each menu item
    //    Object.keys(menuSettings).forEach(itemClass => {
    //        const sliderId = mappings[itemClass];

    //        // Angle slider
    //        const angleSlider = document.getElementById(`${sliderId}-angle`);
    //        const angleValueSpan = document.getElementById(`${sliderId}-angle-value`);

    //        if (angleSlider && angleValueSpan) {
    //            angleSlider.addEventListener('input', function () {
    //                const value = parseInt(this.value);
    //                menuSettings[itemClass].angle = value;
    //                angleValueSpan.textContent = value;
    //                createCircularText();
    //            });
    //        } else {
    //            console.error(`Could not find angle slider for ${itemClass} (looking for #${sliderId}-angle)`);
    //        }

    //        // Radius slider
    //        const radiusSlider = document.getElementById(`${sliderId}-radius`);
    //        const radiusValueSpan = document.getElementById(`${sliderId}-radius-value`);

    //        if (radiusSlider && radiusValueSpan) {
    //            radiusSlider.addEventListener('input', function () {
    //                const value = parseInt(this.value);
    //                menuSettings[itemClass].radius = value;
    //                radiusValueSpan.textContent = value;
    //                createCircularText();
    //            });
    //        } else {
    //            console.error(`Could not find radius slider for ${itemClass} (looking for #${sliderId}-radius)`);
    //        }
    //    });

    //    // Letter spacing slider
    //    const spacingSlider = document.getElementById('spacing');
    //    const spacingValueSpan = document.getElementById('spacing-value');

    //    if (spacingSlider && spacingValueSpan) {
    //        spacingSlider.addEventListener('input', function () {
    //            letterSpacing = parseInt(this.value);
    //            spacingValueSpan.textContent = letterSpacing;
    //            createCircularText();
    //        });
    //    }
    //}

    //setupSliders();
    

    //// Add click event to menu items
    //menuItems.forEach(item => {
    //    item.addEventListener('click', function () {
    //        const submenuId = this.getAttribute('data-submenu');

    //        // Add the submenu view class to trigger animations
    //        mainMenu.classList.add('submenu-view');

    //        // Wait for animation to complete before showing submenu
    //        setTimeout(() => {
    //            // Hide all submenus
    //            document.querySelectorAll('.submenu-container').forEach(submenu => {
    //                submenu.classList.remove('active');
    //            });

    //            // Show the selected submenu
    //            document.getElementById(submenuId + '-submenu').classList.add('active');
    //        }, 500);
    //    });
    //});

    //// Add click event to back buttons
    //backButtons.forEach(button => {
    //    button.addEventListener('click', function () {
    //        // Hide all submenus
    //        document.querySelectorAll('.submenu-container').forEach(submenu => {
    //            submenu.classList.remove('active');
    //        });

    //        // Remove submenu view class to reverse animation
    //        setTimeout(() => {
    //            mainMenu.classList.remove('submenu-view');
    //        }, 100);
    //    });
    //});