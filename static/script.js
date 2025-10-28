document.addEventListener('DOMContentLoaded', function() {
    const equipmentSidebar = document.getElementById('equipment-sidebar');
    const gridWrapper = document.getElementById('timeline-grid-wrapper');
    const gridElement = document.getElementById('timeline-grid');
    const modal = document.getElementById('booking-modal');
    const modalForm = document.getElementById('booking-form');
    const addTestButton = document.getElementById('add-test-button');

    let allEquipmentData = [];
    let allEquipmentRows = [];
    let allBookings = [];
    let allProjects = [];
    let yearDates = [];
    let rowHeights = [];
    
    // Systém pro uchování vlastních kapacit, názvů, statusů a kategorií
    let customCapacities = new Map(); // Map<equipment_id, custom_capacity>
    let customEquipmentNames = new Map(); // Map<equipment_id, custom_name>
    let customEquipmentStatuses = new Map(); // Map<equipment_id, custom_status>
    let customEquipmentCategories = new Map(); // Map<equipment_id, custom_category>

    // Systém pro projekty - nyní se načítá ze serveru
    let customProjects = new Map(); // Map<project_name, {color, textStyle}>
    
    function getProjectColor(projectName) {
        // Najdi projekt v allProjects (ze serveru)
        const serverProject = allProjects.find(p => p.name === projectName && p.active);
        if (serverProject) {
            return serverProject.color;
        }
        
        // Fallback na custom projects (localStorage)
        if (customProjects.has(projectName)) {
            return customProjects.get(projectName).color;
        }
        
        return '#4a90e2'; // Default barva
    }
    
    async function loadProjectsFromServer() {
        try {
            const response = await fetch('/api/projects');
            if (response.ok) {
                const data = await response.json();
                allProjects = data.projects || [];
            }
        } catch (error) {
            console.warn('Chyba při načítání projektů ze serveru:', error);
            allProjects = [];
        }
    }
    
    async function createProjectOnServer(projectData) {
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData)
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                const error = await response.json();
                alert(`Chyba při vytváření projektu: ${error.error}`);
                return null;
            }
        } catch (error) {
            console.error('Chyba sítě při vytváření projektu:', error);
            alert('Chyba síťového připojení');
            return null;
        }
    }
    
    async function updateProjectOnServer(projectName, projectData) {
        try {
            const response = await fetch(`/api/projects/${encodeURIComponent(projectName)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData)
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                const error = await response.json();
                alert(`Chyba při aktualizaci projektu: ${error.error}`);
                return null;
            }
        } catch (error) {
            console.error('Chyba sítě při aktualizaci projektu:', error);
            alert('Chyba síťového připojení');
            return null;
        }
    }
    
    async function deleteProjectOnServer(projectName) {
        try {
            const response = await fetch(`/api/projects/${encodeURIComponent(projectName)}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                return true;
            } else {
                const error = await response.json();
                alert(`Chyba při mazání projektu: ${error.error}`);
                return false;
            }
        } catch (error) {
            console.error('Chyba sítě při mazání projektu:', error);
            alert('Chyba síťového připojení');
            return false;
        }
    }

    // Funkce pro ukládání a načítání custom nastavení
    function saveCustomSettings() {
        const settings = {
            capacities: Array.from(customCapacities.entries()),
            names: Array.from(customEquipmentNames.entries()),
            statuses: Array.from(customEquipmentStatuses.entries()),
            categories: Array.from(customEquipmentCategories.entries())
        };
        localStorage.setItem('equipment_custom_settings', JSON.stringify(settings));
    }

    function loadCustomSettings() {
        try {
            const saved = localStorage.getItem('equipment_custom_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                customCapacities = new Map(settings.capacities || []);
                customEquipmentNames = new Map(settings.names || []);
                customEquipmentStatuses = new Map(settings.statuses || []);
                customEquipmentCategories = new Map(settings.categories || []);
            }
        } catch (error) {
            console.error('Chyba při načítání custom nastavení:', error);
            customCapacities = new Map();
            customEquipmentNames = new Map();
            customEquipmentStatuses = new Map();
            customEquipmentCategories = new Map();
        }
    } 

    const DAY_WIDTH = 140; // Zvětšeno z 100 na 140 pro lepší zobrazení booking čísel
    const HEADER_HEIGHT = 60;
    const BASE_ROW_HEIGHT = 60;
    const LANE_HEIGHT = 40;

    function calculateBookingLayout(bookings, equipmentRows) {
        const layout = new Map();
        equipmentRows.forEach(equip => {
            const equipmentBookings = bookings.filter(b => b.equipment_id === equip.id).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
            const lanes = [];
            let maxLanes = 0;
            equipmentBookings.forEach(booking => {
                const bookingStart = normalizeDate(new Date(booking.start_date));
                let assignedLane = -1;
                for (let i = 0; i < lanes.length; i++) {
                    if (lanes[i] < bookingStart) {
                        lanes[i] = normalizeDate(new Date(booking.end_date));
                        assignedLane = i;
                        break;
                    }
                }
                if (assignedLane === -1) {
                    lanes.push(normalizeDate(new Date(booking.end_date)));
                    assignedLane = lanes.length - 1;
                }
                booking.lane = assignedLane;
                maxLanes = Math.max(maxLanes, lanes.length);
            });
            layout.set(equip.id, { maxLanes: maxLanes });
        });
        return layout;
    }

    function hideModal() { modal.classList.remove('visible'); }
    
    function showEquipmentModal(equipRow) {
        const equipmentModal = document.getElementById('equipment-modal');
        const equipmentForm = document.getElementById('equipment-form');
        
        document.getElementById('equipment-modal-title').textContent = 'Upravit zařízení';
        document.getElementById('equipment-id').value = equipRow.id;
        document.getElementById('equipment-name').value = customEquipmentNames.get(equipRow.id) || equipRow.name;
        document.getElementById('equipment-category').value = customEquipmentCategories.get(equipRow.id) || equipRow.category || '';
        document.getElementById('equipment-status').value = customEquipmentStatuses.get(equipRow.id) || equipRow.status || 'active';
        document.getElementById('equipment-capacity').value = customCapacities.get(equipRow.id) ?? equipRow.max_tests;
        
        // Zobraz sides section jen pro editaci existujícího
        document.getElementById('sides-section').style.display = 'block';
        document.getElementById('delete-equipment-button').style.display = 'block';
        
        // Naplň seznam všech stran/prostorů pro dané základní zařízení
        const sidesContainer = document.getElementById('sides-management');
        sidesContainer.innerHTML = '';
        
        const relatedEquipment = allEquipmentRows.filter(r => r.base_name === equipRow.base_name);
        relatedEquipment.forEach(related => {
            const sideItem = document.createElement('div');
            sideItem.className = 'side-item';
            
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = related.name;
            nameInput.dataset.equipId = related.id;
            
            const capacityInput = document.createElement('input');
            capacityInput.type = 'number';
            capacityInput.min = '0';
            capacityInput.max = '10';
            capacityInput.value = related.max_tests;
            capacityInput.style.width = '80px';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.textContent = 'Smazat';
            deleteBtn.onclick = () => {
                if (confirm(`Opravdu chcete smazat "${related.name}"?`)) {
                    // Zde by byla logika pro smazání strany
                    sideItem.remove();
                }
            };
            
            sideItem.appendChild(nameInput);
            sideItem.appendChild(capacityInput);
            sideItem.appendChild(deleteBtn);
            sidesContainer.appendChild(sideItem);
        });
        
        equipmentModal.classList.add('visible');
    }
    
    function showNewEquipmentModal() {
        const newEquipmentModal = document.getElementById('new-equipment-modal');
        document.getElementById('new-equipment-form').reset();
        newEquipmentModal.classList.add('visible');
    }
    
    function hideEquipmentModal() {
        document.getElementById('equipment-modal').classList.remove('visible');
    }
    
    function hideNewEquipmentModal() {
        document.getElementById('new-equipment-modal').classList.remove('visible');
    }
    
    function createNewEquipment() {
        const name = document.getElementById('new-equipment-name').value;
        const category = document.getElementById('new-equipment-category').value;
        const status = document.getElementById('new-equipment-status').value;
        const capacity = parseInt(document.getElementById('new-equipment-capacity').value);
        const sides = parseInt(document.getElementById('new-equipment-sides').value);
        
        // Vytvoř nové zařízení v allEquipmentData
        const newEquipment = {
            name: name,
            status: status,
            sides: sides,
            max_tests: capacity,
            category: category
        };
        
        allEquipmentData.push(newEquipment);
        
        // Přidej do custom nastavení
        if (sides > 1) {
            const spaceLabel = name.toLowerCase().includes('climatic') ? 'Prostor' : 'Strana';
            for (let i = 1; i <= sides; i++) {
                const equipId = `${name} - ${spaceLabel} ${i}`;
                customCapacities.set(equipId, capacity);
                customEquipmentNames.set(equipId, equipId);
            }
        } else {
            customCapacities.set(name, capacity);
            customEquipmentNames.set(name, name);
        }
        
        saveCustomSettings();
        
        // Znovu načti a vykresli
        fetchData().then(() => render());
        hideNewEquipmentModal();
    }
    
    function saveEquipmentChanges() {
        const equipId = document.getElementById('equipment-id').value;
        const newName = document.getElementById('equipment-name').value;
        const newCategory = document.getElementById('equipment-category').value;
        const newStatus = document.getElementById('equipment-status').value;
        const newCapacity = parseInt(document.getElementById('equipment-capacity').value);
        
        // Ulož změny do custom nastavení
        customEquipmentNames.set(equipId, newName);
        customCapacities.set(equipId, newCapacity);
        customEquipmentCategories.set(equipId, newCategory);
        customEquipmentStatuses.set(equipId, newStatus);
        
        // Ulož všechny změny ze sides-management
        const sideItems = document.querySelectorAll('.side-item');
        sideItems.forEach(item => {
            const nameInput = item.querySelector('input[type="text"]');
            const capacityInput = item.querySelector('input[type="number"]');
            const equipId = nameInput.dataset.equipId;
            
            customEquipmentNames.set(equipId, nameInput.value);
            customCapacities.set(equipId, parseInt(capacityInput.value));
        });
        
        saveCustomSettings();
        
        // Znovu načti a vykresli
        fetchData().then(() => render());
        hideEquipmentModal();
    }

    async function fetchData() {
        try {
            const response = await fetch('/api/data');
            if (!response.ok) throw new Error(`Chyba při načítání dat: ${response.statusText}`);
            const data = await response.json();
            
            allEquipmentData = data.equipment || [];
            allBookings = data.bookings || [];
            allProjects = data.projects || [];
            allEquipmentRows = [];

            // Načti custom nastavení
            loadCustomSettings();

            allEquipmentData.forEach(parentEquip => {
                const sideCount = parentEquip.sides || 1;
                if (parentEquip.name.includes('TisNg Hybrid') && sideCount > 1) {
                    const side1Id = `${parentEquip.name} - Strana 1`;
                    const pneumatikaId = `${parentEquip.name} - PNEUMATIKA`;
                    
                    allEquipmentRows.push({ 
                        id: side1Id, 
                        name: customEquipmentNames.get(side1Id) || side1Id, 
                        status: parentEquip.status, 
                        max_tests: customCapacities.get(side1Id) || parentEquip.max_tests, 
                        base_name: parentEquip.name 
                    });
                    allEquipmentRows.push({ 
                        id: pneumatikaId, 
                        name: customEquipmentNames.get(pneumatikaId) || pneumatikaId, 
                        status: parentEquip.status, 
                        max_tests: customCapacities.get(pneumatikaId) || parentEquip.max_tests, 
                        base_name: parentEquip.name 
                    });
                } else if (sideCount > 1) {
                    // Rozlišení mezi klimakomorami a ostatními zařízeními
                    const spaceLabel = parentEquip.name.toLowerCase().includes('climatic') ? 'Prostor' : 'Strana';
                    for (let i = 1; i <= sideCount; i++) {
                        const equipId = `${parentEquip.name} - ${spaceLabel} ${i}`;
                        allEquipmentRows.push({ 
                            id: equipId, 
                            name: customEquipmentNames.get(equipId) || equipId, 
                            status: parentEquip.status, 
                            max_tests: customCapacities.get(equipId) || parentEquip.max_tests, 
                            base_name: parentEquip.name 
                        });
                    }
                } else {
                    allEquipmentRows.push({ 
                        id: parentEquip.name, 
                        name: customEquipmentNames.get(parentEquip.name) || parentEquip.name, 
                        status: parentEquip.status, 
                        max_tests: customCapacities.get(parentEquip.name) || parentEquip.max_tests, 
                        base_name: parentEquip.name 
                    });
                }
            });
        } catch (error) { 
            console.error("Nepodařilo se načíst data:", error); 
            alert("Chyba při komunikaci se serverem."); 
        }
    }

        async function updateBookingOnServer(bookingData) { 
        try {
            // Přidej custom kapacity do požadavku
            const dataWithCapacities = {
                ...bookingData,
                custom_capacities: Object.fromEntries(customCapacities)
            };
            
            const response = await fetch(`/api/bookings/${bookingData.id}`, { 
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(dataWithCapacities), 
            }); 
            if (!response.ok) { 
                const errorData = await response.json();
                alert(`Chyba při aktualizaci: ${errorData.error || 'Neznámá chyba'}`); 
                return false; 
            } 
            return true; 
        } catch (error) {
            alert('Chyba síťového připojení při aktualizaci rezervace.');
            console.error('Update error:', error);
            return false;
        }
    }
        async function createBookingOnServer(bookingData) { 
        try {
            // Přidej custom kapacity do požadavku
            const dataWithCapacities = {
                ...bookingData,
                custom_capacities: Object.fromEntries(customCapacities)
            };
            
            const response = await fetch('/api/bookings', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(dataWithCapacities), 
            }); 
            if (!response.ok) { 
                const errorData = await response.json();
                console.error('Create booking error:', errorData.error);
                return null; 
            } 
            return await response.json(); 
        } catch (error) {
            console.error('Network error:', error);
            return null;
        }
    }
    async function deleteBookingOnServer(bookingId) { const response = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' }); if (!response.ok) { alert('Chyba při mazání rezervace.'); return false; } return true; }

    // Debounce pro render funkci
    let renderTimeout = null;
    
    function render(force = false) {
        if (renderTimeout && !force) {
            clearTimeout(renderTimeout);
        }
        
        renderTimeout = setTimeout(() => {
            performRender();
            renderTimeout = null;
        }, force ? 0 : 16); // 60 FPS při rychlém pohybu, okamžitě při force
    }
    
    // Cache pro booking layout
    let cachedBookingLayout = null;
    let lastBookingsHash = null;
    
    function getBookingLayoutHash(bookings) {
        return bookings.map(b => `${b.id}-${b.equipment_id}-${b.start_date}-${b.end_date}`).join('|');
    }
    
    function performRender() {
        const currentHash = getBookingLayoutHash(allBookings);
        let bookingLayout;
        
        if (cachedBookingLayout && lastBookingsHash === currentHash) {
            bookingLayout = cachedBookingLayout;
        } else {
            bookingLayout = calculateBookingLayout(allBookings, allEquipmentRows);
            cachedBookingLayout = bookingLayout;
            lastBookingsHash = currentHash;
        }
        rowHeights = allEquipmentRows.map(equip => {
            const layoutInfo = bookingLayout.get(equip.id);
            const maxLanes = layoutInfo ? layoutInfo.maxLanes : 0;
            return Math.max(BASE_ROW_HEIGHT, maxLanes * LANE_HEIGHT);
        });

        equipmentSidebar.innerHTML = '';
        gridElement.innerHTML = '';
        
        // Sidebar header - sticky header
        const sidebarHeader = document.createElement('div');
        sidebarHeader.className = 'sidebar-header';
        sidebarHeader.textContent = 'Zařízení';
        equipmentSidebar.appendChild(sidebarHeader);

        allEquipmentRows.forEach((equipRow, index) => {
            const item = document.createElement('div');
            item.className = 'equipment-item';
            // DŮLEŽITÉ: Nastavit stejnou výšku jako má grid row
            item.style.height = `${rowHeights[index]}px`;
            item.style.minHeight = `${rowHeights[index]}px`;
            item.style.maxHeight = `${rowHeights[index]}px`;
            item.style.boxSizing = 'border-box';
            
            // Status indikátor
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'equipment-status';
            
            // Určení statusu: out-of-order, in-use (dnes), available
            let statusClass = 'available';
            const currentStatus = customEquipmentStatuses.get(equipRow.id) || equipRow.status;
            
            if (currentStatus === 'out-of-order') {
                statusClass = 'out-of-order';
            } else {
                // Zkontroluj jestli běží dnes nějaký booking
                const today = new Date().toISOString().split('T')[0];
                const hasBookingToday = allBookings.some(booking => 
                    booking.equipment_id === equipRow.id &&
                    booking.start_date <= today &&
                    booking.end_date >= today
                );
                if (hasBookingToday) {
                    statusClass = 'in-use';
                }
            }
            statusIndicator.classList.add(statusClass);
            
            // Obsah
            const content = document.createElement('div');
            content.className = 'equipment-content';
            
            // Název
            const nameSpan = document.createElement('div');
            nameSpan.className = 'equipment-name';
            nameSpan.textContent = customEquipmentNames.get(equipRow.id) || equipRow.name;
            nameSpan.title = 'Dvojklik pro editaci názvu nebo pokročilé nastavení';
            
            // Details řádek
            const details = document.createElement('div');
            details.className = 'equipment-details';
            
            // Kategorie
            const categorySpan = document.createElement('span');
            const currentCategory = customEquipmentCategories.get(equipRow.id) || equipRow.category;
            categorySpan.textContent = currentCategory || '';
            categorySpan.style.fontStyle = 'italic';
            categorySpan.style.color = 'var(--text-secondary-color)';
            
            // Kapacita
            const maxTestsSpan = document.createElement('span');
            maxTestsSpan.className = 'equipment-capacity';
            const currentCapacity = customCapacities.get(equipRow.id) ?? equipRow.max_tests;
            maxTestsSpan.textContent = `${currentCapacity}`;
            maxTestsSpan.title = 'Klikni pro změnu kapacity';
            
            // Přidej double-click editaci názvu
            nameSpan.ondblclick = function(e) {
                e.stopPropagation();
                showEquipmentModal(equipRow);
            };

            // Přidej inline editaci kapacity
            maxTestsSpan.onclick = function(e) {
                e.stopPropagation();
                const input = document.createElement('input');
                input.className = 'max-tests-input';
                input.type = 'number';
                input.min = '0';
                input.max = '10';
                input.value = currentCapacity;
                input.style.width = '40px';
                input.style.padding = '2px 4px';
                input.style.border = '1px solid var(--border-color)';
                input.style.borderRadius = '4px';
                input.style.background = 'white';
                input.style.color = 'black';
                
                input.onblur = function() {
                    const newValue = Math.max(0, Math.min(10, parseInt(input.value) || 0));
                    customCapacities.set(equipRow.id, newValue);
                    saveCustomSettings();
                    maxTestsSpan.textContent = `${newValue}`;
                    details.replaceChild(maxTestsSpan, input);
                };
                
                input.onkeydown = function(e) {
                    if (e.key === 'Enter') input.blur();
                    if (e.key === 'Escape') {
                        maxTestsSpan.textContent = `${currentCapacity}`;
                        details.replaceChild(maxTestsSpan, input);
                    }
                };
                
                details.replaceChild(input, maxTestsSpan);
                input.focus();
                input.select();
            };
            
            // Sestavit strukturu
            details.appendChild(categorySpan);
            details.appendChild(maxTestsSpan);
            content.appendChild(nameSpan);
            content.appendChild(details);
            item.appendChild(statusIndicator);
            item.appendChild(content);
            equipmentSidebar.appendChild(item);
        });

        gridElement.style.gridTemplateColumns = `repeat(${yearDates.length}, ${DAY_WIDTH}px)`;
        gridElement.style.gridTemplateRows = `${HEADER_HEIGHT}px ${rowHeights.map(h => `${h}px`).join(' ')}`;
        
        const fragment = document.createDocumentFragment();
        const today = normalizeDate(new Date());
        yearDates.forEach(date => {
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            const dayOfWeek = date.toLocaleDateString('cs-CZ', { weekday: 'short' });
            const isWeekend = ['So', 'Ne'].includes(dayOfWeek);
            
            if (isWeekend) dateHeader.classList.add('weekend');
            if (date.getTime() === today.getTime()) dateHeader.classList.add('today');
            
            // Přidej číslo týdne pro pondělky
            const isMonday = date.getUTCDay() === 1;
            const weekNumber = isMonday ? `T${getWeekNumber(date)}` : '';
            
            dateHeader.innerHTML = `
                <span class="date-main">${date.getUTCDate()}.${date.getUTCMonth() + 1}.</span>
                <span class="day-name">${dayOfWeek}</span>
                ${weekNumber ? `<span class="week-number">${weekNumber}</span>` : ''}
            `;
            fragment.appendChild(dateHeader);
        });
        let totalCells = 0;
        allEquipmentRows.forEach(() => totalCells += yearDates.length);
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            const date = yearDates[i % yearDates.length];
            if (['So', 'Ne'].includes(date.toLocaleDateString('cs-CZ', { weekday: 'short' }))) cell.classList.add('weekend');
            if (date.getTime() === today.getTime()) cell.classList.add('today');
            fragment.appendChild(cell);
        }
        gridElement.appendChild(fragment);
        renderBookings();
    }

    function renderBookings() {
        gridElement.querySelectorAll('.booking-bar').forEach(el => el.remove());
        if (yearDates.length === 0) return;
        const firstDate = yearDates[0];
        let cumulativeTop = HEADER_HEIGHT;
        allEquipmentRows.forEach((equip, equipIndex) => {
            const equipmentBookings = allBookings.filter(b => b.equipment_id === equip.id);
            equipmentBookings.forEach(booking => {
                const laneIndex = booking.lane !== undefined ? booking.lane : 0;
                const bookingTopOffset = laneIndex * LANE_HEIGHT + (LANE_HEIGHT * 0.1);
                const bookingStart = normalizeDate(new Date(booking.start_date));
                const bookingEnd = normalizeDate(new Date(booking.end_date));
                const startIndex = diffInDays(firstDate, bookingStart);
                const durationDays = diffInDays(bookingStart, bookingEnd) + 1;
                if (startIndex < -durationDays || startIndex >= yearDates.length) return;
                
                const bookingBar = document.createElement('div');
                bookingBar.className = 'booking-bar';
                
                // Přidej CSS třídu pro blocker
                if (booking.is_blocker) {
                    bookingBar.classList.add('is-blocker');
                }
                
                bookingBar.textContent = booking.description;
                bookingBar.title = booking.description;
                bookingBar.dataset.bookingId = booking.id;
                bookingBar.style.top = `${cumulativeTop + bookingTopOffset}px`;
                bookingBar.style.height = `${LANE_HEIGHT * 0.8}px`;
                bookingBar.style.left = `${startIndex * DAY_WIDTH}px`;
                bookingBar.style.width = `${durationDays * DAY_WIDTH}px`;
                
                // Použij barvu projektu nebo defaultní
                if (booking.project_color) {
                    bookingBar.style.backgroundColor = booking.project_color;
                } else if (booking.project_name) {
                    bookingBar.style.backgroundColor = getProjectColor(booking.project_name);
                } else {
                    bookingBar.style.backgroundColor = stringToColor(booking.description);
                }
                
                // Aplikuj styly textu
                let textStyle = booking.text_style;
                // Pokud je text_style string, parsuj ho
                if (typeof textStyle === 'string') {
                    try {
                        textStyle = JSON.parse(textStyle);
                    } catch(e) {
                        textStyle = {};
                    }
                }
                
                if (textStyle && typeof textStyle === 'object') {
                    bookingBar.style.color = textStyle.color || '#ffffff';
                    bookingBar.style.fontSize = textStyle.fontSize || '14px';
                    bookingBar.style.fontWeight = textStyle.bold ? 'bold' : 'normal';
                    bookingBar.style.fontStyle = textStyle.italic ? 'italic' : 'normal';
                } else {
                    // Defaultní styly textu
                    bookingBar.style.color = '#ffffff';
                    bookingBar.style.fontSize = '14px';
                    bookingBar.style.fontWeight = 'normal';
                    bookingBar.style.fontStyle = 'normal';
                }
                
                gridElement.appendChild(bookingBar);
            });
            cumulativeTop += rowHeights[equipIndex];
        });
    }

    // --- ZMĚNA ZDE: Nová logika pro zobrazení formuláře ---
    function showModal(booking = null) {
        modalForm.reset();
        const equipSelect = document.getElementById('booking-equip');
        const yearSpan = document.getElementById('eusuva-year');
        const currentYear = new Date().getFullYear().toString().slice(-2);
        yearSpan.textContent = `-${currentYear}`;

        const euSvaInput = document.getElementById('booking-eusuva');
        const projectInput = document.getElementById('booking-project');
        const startDateInput = document.getElementById('booking-start');
        const endDateInput = document.getElementById('booking-end');
        const submitButton = modalForm.querySelector('button[type="submit"]');

        equipSelect.innerHTML = '<option value="">Vyberte zařízení</option>' + 
            allEquipmentRows.map(row => `<option value="${row.id}">${row.name}</option>`).join('');

        // Naplň projekt dropdown s aktivními projekty
        const activeProjects = allProjects.filter(p => p.active);
        projectInput.innerHTML = '<option value="">Vyberte projekt</option>' + 
            activeProjects.map(p => `<option value="${p.name}">${p.name}</option>`).join('');

        if (booking) {
            // --- Logika pro editaci existující rezervace ---
            document.getElementById('modal-title').textContent = 'Upravit rezervaci';
            document.getElementById('delete-button').style.display = 'block';
            document.getElementById('copy-button').style.display = 'block';
            document.getElementById('booking-id').value = booking.id;

            // Nastavení projektu - použij booking.project_name pokud existuje
            let projectToSet = '';
            
            if (booking.project_name) {
                // Zkontroluj, zda projekt existuje v aktivních projektech
                const projectExists = activeProjects.some(p => p.name === booking.project_name);
                if (projectExists) {
                    projectToSet = booking.project_name;
                }
            }
            
            // Pokud se nepodařilo najít projekt v project_name, zkus parsovat z description
            if (!projectToSet) {
                const descRegex = /EU-SVA-(\d{6})-(\d{2})\s([^-]+)(?:\s-\s(.*))?/;
                const match = booking.description.match(descRegex);
                if (match) {
                    const projectFromDesc = match[3].trim();
                    const projectExists = activeProjects.some(p => p.name === projectFromDesc);
                    if (projectExists) {
                        projectToSet = projectFromDesc;
                    }
                }
            }
            
            // Nastavíme hodnoty do formuláře
            const descRegex = /EU-SVA-(\d{6})-(\d{2})\s([^-]+)(?:\s-\s(.*))?/;
            const match = booking.description.match(descRegex);
            if (match) {
                euSvaInput.value = match[1];
                
                if (match[4]) {
                    document.getElementById('booking-note').value = match[4];
                }
            }
            
            // Nastavíme projekt až na konci
            projectInput.value = projectToSet;
            
            // Načti poznámku z booking objektu pokud existuje
            if (booking.note) {
                document.getElementById('booking-note').value = booking.note;
            }
            
            // Už nepotrebujeme načítať barvu do color pickeru, používame project settings
            
            if (booking.text_style) {
                document.getElementById('booking-font-size').value = booking.text_style.fontSize || '14px';
                document.getElementById('booking-text-bold').checked = booking.text_style.bold || false;
                document.getElementById('booking-text-italic').checked = booking.text_style.italic || false;
            }
            
            // Načti custom text pokud existuje
            if (booking.description !== `EU-SVA-${euSvaInput.value}-${new Date().getFullYear().toString().slice(-2)} ${projectInput.value}`) {
                document.getElementById('booking-display-text').value = booking.description;
            }
            
            // Najdeme konkrétní zařízení/stranu
            equipSelect.value = booking.equipment_id;

            startDateInput.value = booking.start_date;
            endDateInput.value = booking.end_date;

            // Nastavení blocker checkboxu
            const isBlockerCheckbox = document.getElementById('booking-is-blocker');
            const isBookingBlocker = booking.is_blocker || false;
            isBlockerCheckbox.checked = isBookingBlocker;
            
            // Pokud je blocker, nastav EU-SVA pole na XXXXXX a disabled
            if (isBookingBlocker) {
                euSvaInput.value = 'XXXXXX';
                euSvaInput.disabled = true;
                euSvaInput.style.opacity = '0.6';
            } else {
                euSvaInput.disabled = false;
                euSvaInput.style.opacity = '1';
            }

            // Povolíme editaci všech polí
            [euSvaInput, projectInput, equipSelect, startDateInput, endDateInput].forEach(el => el.disabled = false);
            submitButton.style.display = 'inline-flex';
            submitButton.textContent = 'Aktualizovat';
            
            // DÔLEŽITÉ: Inicializuj formulár až po nastavení hodnôt
            initializeFormElements();
            
            // Aktualizuj náhľad formátu po načítaní dat
            updateFormatPreview();

        } else {
            // Nová rezervace
            document.getElementById('modal-title').textContent = 'Nová rezervace';
            document.getElementById('delete-button').style.display = 'none';
            document.getElementById('copy-button').style.display = 'none';
            document.getElementById('booking-id').value = '';
            
            // Reset blocker checkboxu pro novou rezervaci
            const isBlockerCheckbox = document.getElementById('booking-is-blocker');
            isBlockerCheckbox.checked = false;
            euSvaInput.disabled = false;
            euSvaInput.style.opacity = '1';
            
            const today = new Date().toISOString().split('T')[0];
            startDateInput.value = today;
            endDateInput.value = today;
            
            // Povolíme všechna pole a tlačítko Uložit
            [euSvaInput, projectInput, equipSelect, startDateInput, endDateInput].forEach(el => el.disabled = false);
            submitButton.style.display = 'inline-flex';
            
            // Inicializuj formulár pre novú rezerváciu
            initializeFormElements();
        }
        
        modal.classList.add('visible');
    }

    function initializeFormElements() {
        // Event listeners pro aktualizaci náhľadu
        document.getElementById('booking-project').addEventListener('change', updateFormatPreview);
        document.getElementById('booking-project').addEventListener('input', updateDisplayText);
        document.getElementById('booking-note').addEventListener('input', updateFormatPreview);
        document.getElementById('booking-note').addEventListener('input', updateDisplayText);
        document.getElementById('booking-eusuva').addEventListener('input', updateDisplayText);
        document.getElementById('booking-text-bold').addEventListener('change', updateFormatPreview);
        document.getElementById('booking-text-italic').addEventListener('change', updateFormatPreview);
        document.getElementById('booking-font-size').addEventListener('change', updateFormatPreview);
        
        // Event listener pro blocker checkbox
        document.getElementById('booking-is-blocker').addEventListener('change', function() {
            const euSvaInput = document.getElementById('booking-eusuva');
            const isBlocker = this.checked;
            
            if (isBlocker) {
                euSvaInput.value = 'XXXXXX';
                euSvaInput.disabled = true;
                euSvaInput.style.opacity = '0.6';
            } else {
                euSvaInput.value = '';
                euSvaInput.disabled = false;
                euSvaInput.style.opacity = '1';
            }
            
            updateDisplayText();
            updateFormatPreview();
        });
        
        // Inicializuj defaultní hodnoty  
        document.getElementById('booking-font-size').value = '14px';
        
        updateDisplayText();
        updateFormatPreview();
    }
    
    function updateFormatPreview() {
        const formatPreview = document.getElementById('format-preview');
        if (!formatPreview) return;
        
        const projectName = document.getElementById('booking-project').value;
        const note = document.getElementById('booking-note').value;
        
        if (!projectName) {
            formatPreview.textContent = 'Vyberte projekt pre náhľad';
            formatPreview.style.background = '#f8f9fa';
            formatPreview.style.color = '#666';
            return;
        }
        
        // Najdi projekt
        const project = allProjects.find(p => p.name === projectName);
        if (!project) {
            formatPreview.textContent = projectName + (note ? ` - ${note}` : '');
            formatPreview.style.background = '#4a90e2';
            formatPreview.style.color = '#ffffff';
        } else {
            formatPreview.textContent = projectName + (note ? ` - ${note}` : '');
            formatPreview.style.background = project.color;
            formatPreview.style.color = project.textColor || '#ffffff';
        }
        
        // Aplikuj štýl textu
        const isBold = document.getElementById('booking-text-bold')?.checked;
        const isItalic = document.getElementById('booking-text-italic')?.checked;
        const fontSize = document.getElementById('booking-font-size')?.value || '14px';
        
        let fontWeight = isBold ? 'bold' : 'normal';
        let fontStyle = isItalic ? 'italic' : 'normal';
        
        formatPreview.style.fontWeight = fontWeight;
        formatPreview.style.fontStyle = fontStyle;
        formatPreview.style.fontSize = fontSize;
    }
    
    function updateDisplayText() {
        const euSvaNum = document.getElementById('booking-eusuva').value;
        const projectName = document.getElementById('booking-project').value;
        const note = document.getElementById('booking-note').value;
        const isBlocker = document.getElementById('booking-is-blocker').checked;
        const currentYear = new Date().getFullYear().toString().slice(-2);
        
        let displayText = '';
        if (projectName) {
            if (isBlocker) {
                displayText = `EU-SVA-XXXXXX-${currentYear} ${projectName}`;
            } else if (euSvaNum) {
                displayText = `EU-SVA-${euSvaNum}-${currentYear} ${projectName}`;
            } else {
                displayText = `EU-SVA-[číslo]-${currentYear} ${projectName}`;
            }
            
            if (note) {
                displayText += ` - ${note}`;
            }
        } else {
            displayText = 'Automaticky se vygeneruje z výše uvedených údajů';
        }
            
        document.getElementById('booking-display-text').placeholder = displayText;
    }

    modalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const bookingId = document.getElementById('booking-id').value;
        const euSvaNum = document.getElementById('booking-eusuva').value;
        const projectName = document.getElementById('booking-project').value;
        const isBlocker = document.getElementById('booking-is-blocker').checked;
        
        // Získaj farbu a textColor z projektu
        const project = allProjects.find(p => p.name === projectName);
        const projectColor = project ? project.color : '#4a90e2';
        const projectTextColor = project ? project.textColor || '#ffffff' : '#ffffff';
        
        const note = document.getElementById('booking-note').value;
        const selectedEquipmentId = document.getElementById('booking-equip').value;
        const customDisplayText = document.getElementById('booking-display-text').value;
        const fontSize = document.getElementById('booking-font-size').value;
        const textBold = document.getElementById('booking-text-bold').checked;
        const textItalic = document.getElementById('booking-text-italic').checked;
        const currentYear = new Date().getFullYear().toString().slice(-2);

        // Validace EU-SVA čísla pro ne-blockery
        if (!isBlocker && (!euSvaNum || euSvaNum === 'XXXXXX')) {
            alert('Pro regulérní test je nutné zadat platné 6-místné číslo testu.');
            document.getElementById('booking-eusuva').focus();
            return;
        }

        // Uložíme nebo aktualizujeme projekt v custom projects (pro localStorage cache)
        customProjects.set(projectName, {
            color: projectColor,
            textStyle: {
                color: projectTextColor,
                fontSize: fontSize,
                bold: textBold,
                italic: textItalic
            }
        });

        // Generování popisu podle toho zda je blocker nebo ne
        let defaultDescription;
        if (isBlocker) {
            defaultDescription = note ? 
                `EU-SVA-XXXXXX-${currentYear} ${projectName} - ${note}` :
                `EU-SVA-XXXXXX-${currentYear} ${projectName}`;
        } else {
            defaultDescription = note ? 
                `EU-SVA-${euSvaNum}-${currentYear} ${projectName} - ${note}` :
                `EU-SVA-${euSvaNum}-${currentYear} ${projectName}`;
        }
        
        const description = customDisplayText || defaultDescription;
        
        const bookingBase = {
            description: description,
            start_date: document.getElementById('booking-start').value,
            end_date: document.getElementById('booking-end').value,
            project_name: projectName,
            project_color: projectColor,
            note: note,
            is_blocker: isBlocker,
            text_style: {
                color: projectTextColor,
                fontSize: fontSize,
                bold: textBold,
                italic: textItalic
            }
        };

        if (normalizeDate(new Date(bookingBase.end_date)) < normalizeDate(new Date(bookingBase.start_date))) {
            alert("Datum 'do' nemůže být dříve než datum 'od'.");
            return;
        }

        if (bookingId) {
            // EDITACE existující rezervace
            const originalBooking = allBookings.find(b => b.id == bookingId);
            if (!originalBooking) {
                alert("Chyba: Rezervace nebyla nalezena.");
                return;
            }

            if (!selectedEquipmentId) {
                alert('Prosím vyberte zařízení.');
                return;
            }

            const updatedBooking = {
                ...bookingBase,
                id: parseInt(bookingId),
                equipment_id: selectedEquipmentId // Použijeme nově vybrané zařízení
            };

            const success = await updateBookingOnServer(updatedBooking);
            if (success) {
                await fetchData();
                render();
                hideModal();
            }
        } else {
            // VYTVOŘENÍ nové rezervace
            if (!selectedEquipmentId) {
                alert('Prosím vyberte zařízení.');
                return;
            }
            
            const newBooking = { ...bookingBase, equipment_id: selectedEquipmentId };
            const result = await createBookingOnServer(newBooking);

            if (result === null) {
                alert('Chyba: Rezervace se překrývá s jinou, byla překročena kapacita, nebo nastala jiná chyba. Zkontrolujte prosím kalendář.');
            } else {
                await fetchData();
                render();
                hideModal();
            }
        }
    });

    addTestButton.addEventListener('click', () => showModal());
    document.getElementById('cancel-button').addEventListener('click', hideModal);
    document.getElementById('delete-button').addEventListener('click', async () => {
        const bookingId = parseInt(document.getElementById('booking-id').value, 10);
        const booking = allBookings.find(b => b.id === bookingId);
        
        if (!booking) {
            alert('Chyba: Rezervace nebyla nalezena.');
            return;
        }

        // Zkontroluj, zda existují související rezervace (pro oba prostory)
        const baseEquipName = booking.equipment_id.split(' - ')[0].trim();
        const relatedBookings = allBookings.filter(b => 
            b.description === booking.description && 
            b.start_date === booking.start_date && 
            b.end_date === booking.end_date &&
            b.equipment_id.startsWith(baseEquipName)
        );

        let confirmMessage = `Opravdu chcete smazat tuto rezervaci?\n\n${booking.description}\n${booking.equipment_id}`;
        
        if (relatedBookings.length > 1) {
            confirmMessage += `\n\nUPOZORNĚNÍ: Nalezeny ${relatedBookings.length} související rezervace pro stejný projekt. Mažete pouze tuto jednu rezervaci.`;
        }

        if (!confirm(confirmMessage)) return;
        
        if (await deleteBookingOnServer(bookingId)) {
            await fetchData();
            render();
            hideModal();
        }
    });
    
    // Funkce pro kopírování testů
    function showCopyModal(booking) {
        const copyModal = document.getElementById('copy-booking-modal');
        const copyForm = document.getElementById('copy-booking-form');
        
        // Nastav původní data
        document.getElementById('copy-original-id').value = booking.id;
        
        // Rozparsonuj číslo testu z description
        const descRegex = /EU-SVA-(\d{6})-(\d{2})/;
        const match = booking.description.match(descRegex);
        const testNumber = match ? `EU-SVA-${match[1]}-${match[2]}` : booking.description;
        
        document.getElementById('copy-original-number').textContent = testNumber;
        document.getElementById('copy-original-project').textContent = booking.project_name || 'Neuvedeno';
        document.getElementById('copy-original-equipment').textContent = booking.equipment_id;
        document.getElementById('copy-original-note').textContent = booking.note || '';
        
        // Naplň dropdown s dostupnými zařízeními (vyloučíme současné)
        const equipSelect = document.getElementById('copy-new-equipment');
        equipSelect.innerHTML = '<option value="">Vyberte zařízení pro kopii</option>' + 
            allEquipmentRows
                .filter(row => row.id !== booking.equipment_id)
                .map(row => `<option value="${row.id}">${row.name}</option>`)
                .join('');
        
        // Nastav defaultní data (stejná jako původní)
        document.getElementById('copy-start-date').value = booking.start_date;
        document.getElementById('copy-end-date').value = booking.end_date;
        document.getElementById('copy-note-suffix').value = '';
        
        copyModal.classList.add('visible');
    }
    
    function hideCopyModal() {
        document.getElementById('copy-booking-modal').classList.remove('visible');
    }
    
    async function handleCopyBooking() {
        const originalId = parseInt(document.getElementById('copy-original-id').value, 10);
        const originalBooking = allBookings.find(b => b.id === originalId);
        
        if (!originalBooking) {
            alert('Chyba: Původní rezervace nebyla nalezena.');
            return;
        }
        
        const newEquipmentId = document.getElementById('copy-new-equipment').value;
        const newStartDate = document.getElementById('copy-start-date').value;
        const newEndDate = document.getElementById('copy-end-date').value;
        const noteSuffix = document.getElementById('copy-note-suffix').value.trim();
        
        if (!newEquipmentId) {
            alert('Prosím vyberte cílové zařízení.');
            return;
        }
        
        if (!newStartDate || !newEndDate) {
            alert('Prosím zadejte platná data.');
            return;
        }
        
        if (new Date(newEndDate) < new Date(newStartDate)) {
            alert('Datum konce nemůže být dříve než datum začátku.');
            return;
        }
        
        // Sestavení nové poznámky
        let newNote = originalBooking.note || '';
        if (noteSuffix) {
            newNote = newNote ? `${newNote} + ${noteSuffix}` : noteSuffix;
        }
        
        // Sestavení nového popisu
        let newDescription = originalBooking.description;
        if (noteSuffix && originalBooking.note) {
            // Nahradíme původní poznámku novou
            const baseDesc = originalBooking.description.replace(` - ${originalBooking.note}`, '');
            newDescription = `${baseDesc} - ${newNote}`;
        } else if (noteSuffix && !originalBooking.note) {
            // Přidáme poznámku pokud původně nebyla
            newDescription = `${originalBooking.description} - ${noteSuffix}`;
        }
        
        // Vytvoření kopie rezervace
        const copiedBooking = {
            description: newDescription,
            start_date: newStartDate,
            end_date: newEndDate,
            project_name: originalBooking.project_name,
            project_color: originalBooking.project_color,
            note: newNote,
            text_style: { ...originalBooking.text_style },
            equipment_id: newEquipmentId
        };
        
        try {
            const result = await createBookingOnServer(copiedBooking);
            
            if (result === null) {
                alert('Chyba: Kopie se překrývá s jinou rezervací, byla překročena kapacita, nebo nastala jiná chyba. Zkontrolujte prosím kalendář a zkuste jiné datum nebo zařízení.');
            } else {
                await fetchData();
                render();
                hideCopyModal();
                hideModal(); // Zavři i původní modal
                alert('Test byl úspěšně zkopírován!');
            }
        } catch (error) {
            console.error('Chyba při kopírování testu:', error);
            alert('Nastala chyba při kopírování testu. Zkuste to prosím znovu.');
        }
    }
    
    // Event listenery pro kopírování testů
    document.getElementById('copy-button').addEventListener('click', () => {
        const bookingId = parseInt(document.getElementById('booking-id').value, 10);
        const booking = allBookings.find(b => b.id === bookingId);
        
        if (!booking) {
            alert('Chyba: Rezervace nebyla nalezena.');
            return;
        }
        
        showCopyModal(booking);
    });
    
    document.getElementById('cancel-copy-button').addEventListener('click', hideCopyModal);
    
    document.getElementById('copy-booking-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleCopyBooking();
    });
    
    interact('.booking-bar')
    .draggable({
        listeners: {
            start(event) {
                const target = event.target;
                const rect = target.getBoundingClientRect();
                const offsetX = event.clientX - rect.left;
                target.setAttribute('data-offset-x', offsetX);
            },
            move(event) {
                const target = event.target;
                const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                target.style.transform = `translate(${x}px, ${y}px)`;
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
            },
            end: handleDragEnd
        },
        modifiers: [
            interact.modifiers.snap({
                targets: interact.snappers.grid({ x: DAY_WIDTH, y: 1 }),
                range: Infinity,
                relativePoints: [{ x: 0, y: 0.5 }]
            })
        ]
    })
    .resizable({
        edges: { left: true, right: true },
        listeners: {
            move(event) {
                const target = event.target;
                let x = (parseFloat(target.getAttribute('data-x')) || 0);
                target.style.width = `${event.rect.width}px`;
                if (event.deltaRect.left) {
                    x += event.deltaRect.left;
                    target.style.transform = `translate(${x}px, 0px)`;
                    target.setAttribute('data-x', x);
                }
            },
            end: handleResizeEnd
        },
        modifiers: [interact.modifiers.restrictSize({ min: { width: DAY_WIDTH } })]
    })
    .on('doubletap', function (event) {
        const bookingId = parseInt(event.currentTarget.dataset.bookingId, 10);
        const booking = allBookings.find(b => b.id === bookingId);
        if (booking) showModal(booking);
    });

    async function handleInteractionEnd(updatedBooking) {
        // Zobraz loading indikátor
        const target = document.querySelector(`[data-booking-id="${updatedBooking.id}"]`);
        if (target) {
            target.style.opacity = '0.7';
            target.style.pointerEvents = 'none';
        }
        
        const success = await updateBookingOnServer(updatedBooking);
        if (success) { 
            // Pouze aktualizuj lokální data místo full fetch
            const existingIndex = allBookings.findIndex(b => b.id === updatedBooking.id);
            if (existingIndex !== -1) {
                allBookings[existingIndex] = { ...updatedBooking };
            }
        }
        
        // Obnov UI rychleji bez plného re-fetchu
        render(true); // force render
    }

    async function handleDragEnd(event) {
        const target = event.target;
        const bookingId = parseInt(target.dataset.bookingId, 10);
        const originalBooking = allBookings.find(b => b.id === bookingId);
        if (!originalBooking) { render(true); return; }

        // Optimalizace: použij requestAnimationFrame pro plynulejší animace
        requestAnimationFrame(() => {
            const offsetX = parseFloat(target.getAttribute('data-offset-x')) || 0;
            const gridRect = gridWrapper.getBoundingClientRect();
            const elementX = event.pageX - gridRect.left + gridWrapper.scrollLeft - offsetX;
            const y = event.pageY - gridRect.top + gridWrapper.scrollTop;

            const dayIndex = Math.max(0, Math.round(elementX / DAY_WIDTH));
            if (dayIndex >= yearDates.length) { render(true); return; }

            let equipIndex = -1;
            let cumulativeHeight = HEADER_HEIGHT;
            for(let i = 0; i < rowHeights.length; i++) {
                if (y >= cumulativeHeight && y < cumulativeHeight + rowHeights[i]) {
                    equipIndex = i;
                    break;
                }
                cumulativeHeight += rowHeights[i];
            }
            if (equipIndex === -1) { render(true); return; }
            
            const newEquipmentId = allEquipmentRows[equipIndex].id;
            const newStartDate = yearDates[dayIndex];
            const duration = diffInDays(normalizeDate(new Date(originalBooking.start_date)), normalizeDate(new Date(originalBooking.end_date)));
            const newEndDate = addDays(newStartDate, duration);
            const updatedBooking = { ...originalBooking, equipment_id: newEquipmentId, start_date: newStartDate.toISOString().split('T')[0], end_date: newEndDate.toISOString().split('T')[0] };
            
            handleInteractionEnd(updatedBooking);
        });
    }
    
    async function handleResizeEnd(event) {
        // Optimalizace: použij requestAnimationFrame
        requestAnimationFrame(async () => {
            const target = event.target;
            const bookingId = parseInt(target.dataset.bookingId, 10);
            const originalBooking = allBookings.find(b => b.id === bookingId);
            if (!originalBooking) return;

            let updatedBooking;

            if (event.edges.left) {
                const x_translation = parseFloat(target.getAttribute('data-x')) || 0;
                const daysShifted = Math.round(x_translation / DAY_WIDTH);
                const originalStartDate = normalizeDate(new Date(originalBooking.start_date));
                const newStartDate = addDays(originalStartDate, daysShifted);
                const originalEndDate = normalizeDate(new Date(originalBooking.end_date));
                if (newStartDate > originalEndDate) { render(true); return; }
                updatedBooking = { ...originalBooking, start_date: newStartDate.toISOString().split('T')[0] };
            } else {
                const newWidth = event.rect.width;
                const durationDays = Math.max(1, Math.round(newWidth / DAY_WIDTH));
                const originalStartDate = normalizeDate(new Date(originalBooking.start_date));
                const newEndDate = addDays(originalStartDate, durationDays - 1);
                updatedBooking = { ...originalBooking, end_date: newEndDate.toISOString().split('T')[0] };
            }

            target.removeAttribute('data-x');
            target.removeAttribute('data-y');
            target.removeAttribute('data-offset-x');

            await handleInteractionEnd(updatedBooking);
        });
    }
    
    function normalizeDate(date) { const d = new Date(date); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); }
    function getDatesForYear(year) { const dates = []; let day = new Date(Date.UTC(year, 0, 1)); const isLeap = new Date(year, 1, 29).getMonth() === 1; const daysInYear = isLeap ? 366 : 365; for (let i = 0; i < daysInYear; i++) { dates.push(new Date(day)); day.setUTCDate(day.getUTCDate() + 1); } return dates; }
    function addDays(date, days) { const r = new Date(date.valueOf()); r.setUTCDate(r.getUTCDate() + days); return r; }
    function diffInDays(d1, d2) { return Math.round((d2.valueOf() - d1.valueOf()) / (24 * 3600 * 1000)); }
    function stringToColor(str) { let hash = 0; for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); } let color = '#'; for (let i = 0; i < 3; i++) { const value = (hash >> (i * 8)) & 0xFF; color += ('00' + (Math.floor(value * 0.6) + 70).toString(16)).substr(-2); } return color; }

    // Navigační funkce pro kalendář
    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
    
    function scrollToToday() {
        const today = normalizeDate(new Date());
        const todayIndex = yearDates.findIndex(date => date.getTime() === today.getTime());
        if (todayIndex !== -1) {
            const viewport = document.getElementById('timeline-viewport') || document.querySelector('.timeline-viewport');
            const scrollLeft = todayIndex * DAY_WIDTH - (viewport.clientWidth / 2) + (DAY_WIDTH / 2);
            viewport.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
        }
    }
    
    function navigateCalendar(days) {
        const viewport = document.getElementById('timeline-viewport') || document.querySelector('.timeline-viewport');
        const currentScroll = viewport.scrollLeft;
        const newScroll = currentScroll + (days * DAY_WIDTH);
        viewport.scrollTo({ left: Math.max(0, newScroll), behavior: 'smooth' });
    }

    // Funkce pro správu projektů
    function showProjectsModal() {
        const modal = document.getElementById('projects-modal');
        renderProjectsList();
        modal.classList.add('visible');
    }
    
    function hideProjectsModal() {
        document.getElementById('projects-modal').classList.remove('visible');
    }
    
    function renderProjectsList() {
        const container = document.getElementById('projects-container');
        container.innerHTML = '';
        
        allProjects.forEach(project => {
            const item = document.createElement('div');
            item.className = 'project-item';
            item.style.display = 'grid';
            item.style.gridTemplateColumns = '2fr 80px 140px 80px 100px';
            item.style.gap = '1rem';
            item.style.alignItems = 'center';
            item.style.padding = '0.5rem';
            item.style.borderBottom = '1px solid #eee';
            
            // Název projektu
            const nameDiv = document.createElement('div');
            nameDiv.className = 'project-name';
            nameDiv.textContent = project.name;
            nameDiv.style.fontWeight = 'bold';
            
            // Barva pozadí projektu
            const colorDiv = document.createElement('div');
            colorDiv.className = 'project-color';
            colorDiv.style.backgroundColor = project.color;
            colorDiv.style.width = '40px';
            colorDiv.style.height = '40px';
            colorDiv.style.borderRadius = '4px';
            colorDiv.style.border = '2px solid #ddd';
            colorDiv.style.cursor = 'pointer';
            colorDiv.title = 'Klik pro změnu barvy pozadí';
            colorDiv.addEventListener('click', () => editProjectColor(project.name, colorDiv));
            
            // Barva textu projektu
            const textColorDiv = document.createElement('div');
            textColorDiv.className = 'text-color-options';
            textColorDiv.style.display = 'flex';
            textColorDiv.style.gap = '0.5rem';
            textColorDiv.style.alignItems = 'center';
            
            // Radio button pre biely text
            const whiteRadio = document.createElement('input');
            whiteRadio.type = 'radio';
            whiteRadio.name = `textColor_${project.name}`;
            whiteRadio.value = '#ffffff';
            whiteRadio.checked = (project.textColor === '#ffffff' || !project.textColor);
            whiteRadio.addEventListener('change', () => updateProjectTextColor(project.name, '#ffffff'));
            
            const whiteLabel = document.createElement('label');
            whiteLabel.style.display = 'flex';
            whiteLabel.style.alignItems = 'center';
            whiteLabel.style.gap = '0.3rem';
            whiteLabel.style.cursor = 'pointer';
            
            const whitePreview = document.createElement('span');
            whitePreview.className = 'text-color-preview';
            whitePreview.style.background = '#ffffff';
            whitePreview.style.border = '2px solid #000';
            
            whiteLabel.appendChild(whiteRadio);
            whiteLabel.appendChild(whitePreview);
            whiteLabel.appendChild(document.createTextNode('Bílá'));
            
            // Radio button pre čierny text
            const blackRadio = document.createElement('input');
            blackRadio.type = 'radio';
            blackRadio.name = `textColor_${project.name}`;
            blackRadio.value = '#000000';
            blackRadio.checked = (project.textColor === '#000000');
            blackRadio.addEventListener('change', () => updateProjectTextColor(project.name, '#000000'));
            
            const blackLabel = document.createElement('label');
            blackLabel.style.display = 'flex';
            blackLabel.style.alignItems = 'center';
            blackLabel.style.gap = '0.3rem';
            blackLabel.style.cursor = 'pointer';
            
            const blackPreview = document.createElement('span');
            blackPreview.className = 'text-color-preview';
            blackPreview.style.background = '#000000';
            blackPreview.style.border = '2px solid #ddd';
            
            blackLabel.appendChild(blackRadio);
            blackLabel.appendChild(blackPreview);
            blackLabel.appendChild(document.createTextNode('Černá'));
            
            textColorDiv.appendChild(whiteLabel);
            textColorDiv.appendChild(blackLabel);
            
            // Aktivní status projektu
            const statusDiv = document.createElement('div');
            statusDiv.style.display = 'flex';
            statusDiv.style.justifyContent = 'center';
            
            const statusCheckbox = document.createElement('input');
            statusCheckbox.type = 'checkbox';
            statusCheckbox.checked = project.active;
            statusCheckbox.addEventListener('change', () => toggleProjectStatus(project.name));
            
            statusDiv.appendChild(statusCheckbox);
            
            // Akce - smazat
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'project-actions';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.textContent = 'Smazat';
            deleteBtn.style.fontSize = '12px';
            deleteBtn.style.padding = '4px 8px';
            deleteBtn.addEventListener('click', () => deleteProject(project.name));
            
            actionsDiv.appendChild(deleteBtn);
            
            // Sestavení item
            item.appendChild(nameDiv);
            item.appendChild(colorDiv);
            item.appendChild(textColorDiv);
            item.appendChild(statusDiv);
            item.appendChild(actionsDiv);
            
            container.appendChild(item);
        });
    }
    
    async function editProjectColor(projectName, colorElement) {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = colorElement.style.backgroundColor || '#4a90e2';
        
        // Převedeme RGB na hex pokud je potřeba
        const currentColor = colorElement.style.backgroundColor;
        if (currentColor.startsWith('rgb')) {
            const rgbMatch = currentColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (rgbMatch) {
                const hex = '#' + [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
                    .map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
                input.value = hex;
            }
        }
        
        input.onchange = async function() {
            const success = await updateProjectOnServer(projectName, { color: input.value });
            if (success) {
                colorElement.style.backgroundColor = input.value;
                
                // Aktualizuj všechny existující rezervace s tímto projektem
                await updateExistingBookingsColor(projectName, input.value);
                
                await fetchData(); // Načti nová data včetně projektů
                render(); // Znovu vykresli kalendář s novými barvami
                renderProjectsList(); // Aktualizuj seznam projektů
            }
        };
        
        input.click();
    }
    
    async function updateExistingBookingsColor(projectName, newColor) {
        const bookingsToUpdate = allBookings.filter(booking => 
            booking.project_name === projectName || 
            (booking.description && booking.description.includes(projectName))
        );
        
        const updatePromises = bookingsToUpdate.map(async (booking) => {
            const updatedBooking = {
                ...booking,
                project_color: newColor
            };
            return await updateBookingOnServer(updatedBooking);
        });
        
        await Promise.all(updatePromises);
    }
    
    async function updateProjectTextColor(projectName, textColor) {
        const success = await updateProjectOnServer(projectName, { textColor: textColor });
        if (success) {
            await loadProjectsFromServer();
            renderProjectsList();
            initializeFormElements(); // Refresh náhľadu
            updateFormatPreview(); // Aktualizuj náhľad formátu
        }
    }
    
    async function toggleProjectStatus(projectName) {
        const project = allProjects.find(p => p.name === projectName);
        if (project) {
            const success = await updateProjectOnServer(projectName, { active: !project.active });
            if (success) {
                await loadProjectsFromServer();
                renderProjectsList();
            }
        }
    }
    
    async function deleteProject(projectName) {
        if (confirm(`Opravdu chcete smazat projekt "${projectName}"?`)) {
            const success = await deleteProjectOnServer(projectName);
            if (success) {
                await loadProjectsFromServer();
                renderProjectsList();
            }
        }
    }

    async function init() {
        // Synchronizace scrollování: pouze grid -> sidebar
        // Sidebar NEMÁ vlastní scroll, ale má scrollTop pro synchronizaci
        gridWrapper.addEventListener('scroll', () => { 
            equipmentSidebar.scrollTop = gridWrapper.scrollTop; 
        });
        
        // Zablokování wheel eventu na equipment sidebar
        equipmentSidebar.addEventListener('wheel', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        // Equipment modal event listeners
        document.getElementById('equipment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            saveEquipmentChanges();
        });
        
        document.getElementById('cancel-equipment-button').addEventListener('click', hideEquipmentModal);
        
        // New equipment modal event listeners
        document.getElementById('add-equipment-button').addEventListener('click', showNewEquipmentModal);
        document.getElementById('cancel-new-equipment-button').addEventListener('click', hideNewEquipmentModal);
        
        document.getElementById('new-equipment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            createNewEquipment();
        });
        
        document.getElementById('add-side-button').addEventListener('click', () => {
            const sidesContainer = document.getElementById('sides-management');
            const equipId = document.getElementById('equipment-id').value;
            const equipRow = allEquipmentRows.find(r => r.id === equipId);
            
            if (equipRow) {
                const baseName = equipRow.base_name;
                const isClimatic = baseName.toLowerCase().includes('climatic');
                const spaceLabel = isClimatic ? 'Prostor' : 'Strana';
                
                // Najdi nejvyšší číslo strany/prostoru
                const existingSides = allEquipmentRows.filter(r => r.base_name === baseName);
                let maxNumber = 0;
                existingSides.forEach(side => {
                    const match = side.id.match(new RegExp(`${spaceLabel} (\\d+)`));
                    if (match) {
                        maxNumber = Math.max(maxNumber, parseInt(match[1]));
                    }
                });
                
                const newNumber = maxNumber + 1;
                const newSideId = `${baseName} - ${spaceLabel} ${newNumber}`;
                const newSideName = newSideId;
                
                // Přidej do allEquipmentRows
                allEquipmentRows.push({
                    id: newSideId,
                    name: newSideName,
                    status: equipRow.status,
                    max_tests: 1,
                    base_name: baseName
                });
                
                // Aktualizuj zobrazení
                showEquipmentModal(equipRow);
            }
        });
        
        // Navigační tlačítka pro kalendář
        document.getElementById('today-btn').addEventListener('click', scrollToToday);
        document.getElementById('prev-3days-btn').addEventListener('click', () => navigateCalendar(-3));
        document.getElementById('next-3days-btn').addEventListener('click', () => navigateCalendar(3));
        document.getElementById('prev-week-btn').addEventListener('click', () => navigateCalendar(-7));
        document.getElementById('next-week-btn').addEventListener('click', () => navigateCalendar(7));
        
        // Projects modal event listeners
        document.getElementById('manage-projects-button').addEventListener('click', showProjectsModal);
        document.getElementById('close-projects-modal').addEventListener('click', hideProjectsModal);
        
        document.getElementById('add-project-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('new-project-name').value.trim();
            const color = document.getElementById('new-project-color').value;
            const textColorRadios = document.getElementsByName('new-project-text-color');
            const active = document.getElementById('new-project-active').checked;
            
            let textColor = '#ffffff'; // default
            for (const radio of textColorRadios) {
                if (radio.checked) {
                    textColor = radio.value;
                    break;
                }
            }
            
            if (!name) {
                alert('Zadejte název projektu');
                return;
            }
            
            const success = await createProjectOnServer({ 
                name, 
                color, 
                textColor, 
                active 
            });
            if (success) {
                document.getElementById('new-project-name').value = '';
                document.getElementById('new-project-color').value = '#4a90e2';
                document.getElementById('new-project-active').checked = true;
                // Reset radio buttons na bílou
                document.querySelector('input[name="new-project-text-color"][value="#ffffff"]').checked = true;
                await loadProjectsFromServer();
                renderProjectsList();
                initializeFormElements(); // Refresh formuláře
            }
        });
        
        await fetchData();
        const currentYear = new Date().getFullYear();
        yearDates = getDatesForYear(currentYear);
        render(true); // Force okamžité vykreslení při inicializaci
        
        // Automaticky skroluj na dnešní datum při načtení
        setTimeout(scrollToToday, 100);
    }
    init();
});