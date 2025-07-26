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
    let yearDates = [];
    let rowHeights = [];
    
    // Systém pro uchování vlastních kapacit, názvů, statusů a kategorií
    let customCapacities = new Map(); // Map<equipment_id, custom_capacity>
    let customEquipmentNames = new Map(); // Map<equipment_id, custom_name>
    let customEquipmentStatuses = new Map(); // Map<equipment_id, custom_status>
    let customEquipmentCategories = new Map(); // Map<equipment_id, custom_category>

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
        } catch (error) { console.error("Nepodařilo se načíst data:", error); alert("Chyba při komunikaci se serverem."); }
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
                bookingBar.textContent = booking.description;
                bookingBar.title = booking.description;
                bookingBar.dataset.bookingId = booking.id;
                bookingBar.style.top = `${cumulativeTop + bookingTopOffset}px`;
                bookingBar.style.height = `${LANE_HEIGHT * 0.8}px`;
                bookingBar.style.left = `${startIndex * DAY_WIDTH}px`;
                bookingBar.style.width = `${durationDays * DAY_WIDTH}px`;
                bookingBar.style.backgroundColor = stringToColor(booking.description);
                gridElement.appendChild(bookingBar);
            });
            cumulativeTop += rowHeights[equipIndex];
        });
    }

    // --- ZMĚNA ZDE: Nová logika pro zobrazení formuláře ---
    function showModal(booking = null) {
        modalForm.reset();
        const equipSelect = document.getElementById('booking-equip');
        const bothSpacesContainer = document.getElementById('both-spaces-container');
        const yearSpan = document.getElementById('eusuva-year');
        const currentYear = new Date().getFullYear().toString().slice(-2);
        yearSpan.textContent = `-${currentYear}`;

        const euSvaInput = document.getElementById('booking-eusuva');
        const projectInput = document.getElementById('booking-project');
        const startDateInput = document.getElementById('booking-start');
        const endDateInput = document.getElementById('booking-end');
        const bothSpacesCheckbox = document.getElementById('booking-both-spaces');
        const submitButton = modalForm.querySelector('button[type="submit"]');

        equipSelect.innerHTML = allEquipmentData.map(e => `<option value="${e.name}">${e.name}</option>`).join('');

        const handleEquipChange = () => {
            const selectedEquipName = equipSelect.value;
            const selectedEquipData = allEquipmentData.find(e => e.name === selectedEquipName);
            if (selectedEquipData && selectedEquipData.sides > 1) {
                bothSpacesContainer.style.display = 'flex';
            } else {
                bothSpacesContainer.style.display = 'none';
                bothSpacesCheckbox.checked = false;
            }
        };
        
        equipSelect.removeEventListener('change', handleEquipChange);
        equipSelect.addEventListener('change', handleEquipChange);

        if (booking) {
            // --- Logika pro editaci existující rezervace ---
            document.getElementById('modal-title').textContent = 'Upravit rezervaci';
            document.getElementById('delete-button').style.display = 'block';
            document.getElementById('booking-id').value = booking.id;

            // Rozparsujeme popis
            const descRegex = /EU-SVA-(\d{6})-(\d{2})\s(.*)/;
            const match = booking.description.match(descRegex);
            if (match) {
                euSvaInput.value = match[1];
                projectInput.value = match[3];
            } else {
                projectInput.value = booking.description; // Fallback
            }
            
            // Najdeme základní zařízení
            const equipRow = allEquipmentRows.find(r => r.id === booking.equipment_id);
            if (equipRow) {
                equipSelect.value = equipRow.base_name;
            }

            startDateInput.value = booking.start_date;
            endDateInput.value = booking.end_date;

            // Povolíme editaci všech polí
            [euSvaInput, projectInput, equipSelect, bothSpacesCheckbox, startDateInput, endDateInput].forEach(el => el.disabled = false);
            submitButton.style.display = 'inline-flex';
            submitButton.textContent = 'Aktualizovat';

        } else {
            // Nová rezervace
            document.getElementById('modal-title').textContent = 'Nová rezervace';
            document.getElementById('delete-button').style.display = 'none';
            document.getElementById('booking-id').value = '';
            
            const today = new Date().toISOString().split('T')[0];
            startDateInput.value = today;
            endDateInput.value = today;
            
            // Povolíme všechna pole a tlačítko Uložit
            [euSvaInput, projectInput, equipSelect, bothSpacesCheckbox, startDateInput, endDateInput].forEach(el => el.disabled = false);
            submitButton.style.display = 'inline-flex';
        }
        
        handleEquipChange();
        modal.classList.add('visible');
    }

    modalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const bookingId = document.getElementById('booking-id').value;
        const euSvaNum = document.getElementById('booking-eusuva').value;
        const projectName = document.getElementById('booking-project').value;
        const baseEquipName = document.getElementById('booking-equip').value;
        const takeBothSpaces = document.getElementById('booking-both-spaces').checked;
        const currentYear = new Date().getFullYear().toString().slice(-2);

        const description = `EU-SVA-${euSvaNum}-${currentYear} ${projectName}`;
        
        const bookingBase = {
            description: description,
            start_date: document.getElementById('booking-start').value,
            end_date: document.getElementById('booking-end').value,
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

            const updatedBooking = {
                ...bookingBase,
                id: parseInt(bookingId),
                equipment_id: originalBooking.equipment_id // Zachováme původní equipment_id
            };

            const success = await updateBookingOnServer(updatedBooking);
            if (success) {
                await fetchData();
                render();
                hideModal();
            }
        } else {
            // VYTVOŘENÍ nové rezervace
            let bookingsToCreate = [];
            const selectedEquipData = allEquipmentData.find(e => e.name === baseEquipName);
            
            if (selectedEquipData.sides > 1 && takeBothSpaces) {
                // Hledání prvního a druhého prostoru/strany
                let space1_id, space2_id;
                
                if (selectedEquipData.name.includes('TisNg Hybrid')) {
                    space1_id = allEquipmentRows.find(r => r.base_name === baseEquipName && r.id.includes('Strana 1'))?.id;
                    space2_id = allEquipmentRows.find(r => r.base_name === baseEquipName && r.id.includes('PNEUMATIKA'))?.id;
                } else {
                    const spaceLabel = selectedEquipData.name.toLowerCase().includes('climatic') ? 'Prostor' : 'Strana';
                    space1_id = allEquipmentRows.find(r => r.base_name === baseEquipName && r.id.includes(`${spaceLabel} 1`))?.id;
                    space2_id = allEquipmentRows.find(r => r.base_name === baseEquipName && r.id.includes(`${spaceLabel} 2`))?.id;
                }
                
                if (space1_id && space2_id) {
                    bookingsToCreate.push({ ...bookingBase, equipment_id: space1_id });
                    bookingsToCreate.push({ ...bookingBase, equipment_id: space2_id });
                } else {
                    alert('Chyba: Nenalezeny oba prostory/strany pro vybrané zařízení.');
                    return;
                }
            } else {
                const equipRow = allEquipmentRows.find(r => r.base_name === baseEquipName);
                bookingsToCreate.push({ ...bookingBase, equipment_id: equipRow.id });
            }
            
            const promises = bookingsToCreate.map(b => createBookingOnServer(b));
            const results = await Promise.all(promises);

            if (results.some(r => r === null)) {
                alert('Chyba: Jedna nebo více rezervací se překrývá s jinou, byla překročena kapacita, nebo nastala jiná chyba. Zkontrolujte prosím kalendář.');
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
        
        await fetchData();
        const currentYear = new Date().getFullYear();
        yearDates = getDatesForYear(currentYear);
        render();
        
        // Automaticky skroluj na dnešní datum při načtení
        setTimeout(scrollToToday, 100);
    }
    init();
});