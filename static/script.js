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

    const DAY_WIDTH = 100;
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

    async function fetchData() {
        try {
            const response = await fetch('/api/data');
            if (!response.ok) throw new Error(`Chyba při načítání dat: ${response.statusText}`);
            const data = await response.json();
            
            allEquipmentData = data.equipment || [];
            allBookings = data.bookings || [];
            allEquipmentRows = [];

            allEquipmentData.forEach(parentEquip => {
                const sideCount = parentEquip.sides || 1;
                if (parentEquip.name.includes('TisNg Hybrid') && sideCount > 1) {
                    allEquipmentRows.push({ id: `${parentEquip.name} - Prostor 1`, name: `${parentEquip.name} - Prostor 1`, status: parentEquip.status, max_tests: parentEquip.max_tests, base_name: parentEquip.name });
                    allEquipmentRows.push({ id: `${parentEquip.name} - PNEUMATIKA`, name: `${parentEquip.name} - PNEUMATIKA`, status: parentEquip.status, max_tests: parentEquip.max_tests, base_name: parentEquip.name });
                } else if (sideCount > 1) {
                    for (let i = 1; i <= sideCount; i++) {
                        allEquipmentRows.push({ id: `${parentEquip.name} - Prostor ${i}`, name: `${parentEquip.name} - Prostor ${i}`, status: parentEquip.status, max_tests: parentEquip.max_tests, base_name: parentEquip.name });
                    }
                } else {
                    allEquipmentRows.push({ id: parentEquip.name, name: parentEquip.name, status: parentEquip.status, max_tests: parentEquip.max_tests, base_name: parentEquip.name });
                }
            });
        } catch (error) { console.error("Nepodařilo se načíst data:", error); alert("Chyba při komunikaci se serverem."); }
    }

    async function updateBookingOnServer(bookingData) { const response = await fetch(`/api/bookings/${bookingData.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bookingData), }); if (!response.ok) { alert('Chyba: Rezervace se překrývá s jinou, byla překročena kapacita, nebo nastala jiná chyba.'); return false; } return true; }
    async function createBookingOnServer(bookingData) { const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bookingData), }); if (!response.ok) { return null; } return await response.json(); }
    async function deleteBookingOnServer(bookingId) { const response = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' }); if (!response.ok) { alert('Chyba při mazání rezervace.'); return false; } return true; }

    function render() {
        const bookingLayout = calculateBookingLayout(allBookings, allEquipmentRows);
        rowHeights = allEquipmentRows.map(equip => {
            const layoutInfo = bookingLayout.get(equip.id);
            const maxLanes = layoutInfo ? layoutInfo.maxLanes : 0;
            return Math.max(BASE_ROW_HEIGHT, maxLanes * LANE_HEIGHT);
        });

        equipmentSidebar.innerHTML = '';
        gridElement.innerHTML = '';
        const sidebarHeader = document.createElement('div');
        sidebarHeader.className = 'sidebar-header';
        sidebarHeader.style.height = `${HEADER_HEIGHT}px`;
        equipmentSidebar.appendChild(sidebarHeader);

        allEquipmentRows.forEach((equipRow, index) => {
            const item = document.createElement('div');
            item.className = 'equipment-item';
            item.style.height = `${rowHeights[index]}px`;
            const statusDot = document.createElement('div');
            statusDot.className = `status-dot status-${(equipRow.status || 'active').toLowerCase()}`;
            const nameSpan = document.createElement('span');
            nameSpan.textContent = equipRow.name;
            item.appendChild(statusDot);
            item.appendChild(nameSpan);

            if (equipRow.max_tests) {
                const maxTestsSpan = document.createElement('span');
                maxTestsSpan.className = 'max-tests-info';
                maxTestsSpan.textContent = `(max ${equipRow.max_tests})`;
                item.appendChild(maxTestsSpan);
            }
            equipmentSidebar.appendChild(item);
        });

        gridElement.style.gridTemplateColumns = `repeat(${yearDates.length}, ${DAY_WIDTH}px)`;
        gridElement.style.gridTemplateRows = `${HEADER_HEIGHT}px ${rowHeights.map(h => `${h}px`).join(' ')}`;
        
        const fragment = document.createDocumentFragment();
        const today = normalizeDate(new Date());
        yearDates.forEach(date => {
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            if (['So', 'Ne'].includes(date.toLocaleDateString('cs-CZ', { weekday: 'short' }))) dateHeader.classList.add('weekend');
            if (date.getTime() === today.getTime()) dateHeader.classList.add('today');
            dateHeader.innerHTML = `<span>${date.getUTCDate()}.${date.getUTCMonth() + 1}.</span><span class="day-name">${date.toLocaleDateString('cs-CZ', { weekday: 'short' })}</span>`;
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
            // --- Logika pro vyplnění formuláře při editaci ---
            document.getElementById('modal-title').textContent = 'Detail rezervace';
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

            // Zneaktivníme pole a tlačítko pro uložení, povolíme jen mazání
            [euSvaInput, projectInput, equipSelect, bothSpacesCheckbox, startDateInput, endDateInput].forEach(el => el.disabled = true);
            submitButton.style.display = 'none';

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
        
        // Zabráníme odeslání, pokud je otevřený detail (editace)
        if (document.getElementById('booking-id').value) {
            alert("Pro úpravu prosím smažte původní záznam a vytvořte nový. Tento formulář je pouze pro zobrazení detailů.");
            return;
        }

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

        let bookingsToCreate = [];
        const selectedEquipData = allEquipmentData.find(e => e.name === baseEquipName);
        
        if (selectedEquipData.sides > 1 && takeBothSpaces) {
            const space1_id = allEquipmentRows.find(r => r.base_name === baseEquipName && (r.id.includes('Prostor 1'))).id;
            const space2_id = allEquipmentRows.find(r => r.base_name === baseEquipName && (r.id.includes('Prostor 2') || r.id.includes('PNEUMATIKA'))).id;
            bookingsToCreate.push({ ...bookingBase, equipment_id: space1_id });
            bookingsToCreate.push({ ...bookingBase, equipment_id: space2_id });
        } else {
            const equipRow = allEquipmentRows.find(r => r.base_name === baseEquipName);
            bookingsToCreate.push({ ...bookingBase, equipment_id: equipRow.id });
        }
        
        const promises = bookingsToCreate.map(b => createBookingOnServer(b));
        const results = await Promise.all(promises);

        if (results.some(r => r === null)) {
            alert('Chyba: Jedna nebo více rezervací se překrývá s jinou, byla překročena kapacita, nebo nastala jiná chyba. Zkontrolujte prosím kalendář.');
        }

        await fetchData();
        render();
        hideModal();
    });

    addTestButton.addEventListener('click', () => showModal());
    document.getElementById('cancel-button').addEventListener('click', hideModal);
    document.getElementById('delete-button').addEventListener('click', async () => {
        if (!confirm('Opravdu chcete smazat tuto rezervaci? Poznámka: Pokud rezervace zabírá oba prostory, je nutné smazat každou zvlášť.')) return;
        const id = parseInt(document.getElementById('booking-id').value, 10);
        if (await deleteBookingOnServer(id)) {
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
        const success = await updateBookingOnServer(updatedBooking);
        if (success) { await fetchData(); }
        render();
    }

    async function handleDragEnd(event) {
        const target = event.target;
        const bookingId = parseInt(target.dataset.bookingId, 10);
        const originalBooking = allBookings.find(b => b.id === bookingId);
        if (!originalBooking) { render(); return; }

        const offsetX = parseFloat(target.getAttribute('data-offset-x')) || 0;
        const gridRect = gridWrapper.getBoundingClientRect();
        const elementX = event.pageX - gridRect.left + gridWrapper.scrollLeft - offsetX;
        const y = event.pageY - gridRect.top + gridWrapper.scrollTop;

        const dayIndex = Math.max(0, Math.round(elementX / DAY_WIDTH));
        if (dayIndex >= yearDates.length) { render(); return; }

        let equipIndex = -1;
        let cumulativeHeight = HEADER_HEIGHT;
        for(let i = 0; i < rowHeights.length; i++) {
            if (y >= cumulativeHeight && y < cumulativeHeight + rowHeights[i]) {
                equipIndex = i;
                break;
            }
            cumulativeHeight += rowHeights[i];
        }
        if (equipIndex === -1) { render(); return; }
        
        const newEquipmentId = allEquipmentRows[equipIndex].id;
        const newStartDate = yearDates[dayIndex];
        const duration = diffInDays(normalizeDate(new Date(originalBooking.start_date)), normalizeDate(new Date(originalBooking.end_date)));
        const newEndDate = addDays(newStartDate, duration);
        const updatedBooking = { ...originalBooking, equipment_id: newEquipmentId, start_date: newStartDate.toISOString().split('T')[0], end_date: newEndDate.toISOString().split('T')[0] };
        
        await handleInteractionEnd(updatedBooking);
    }
    
    async function handleResizeEnd(event) {
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
            if (newStartDate > originalEndDate) { render(); return; }
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
    }
    
    function normalizeDate(date) { const d = new Date(date); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); }
    function getDatesForYear(year) { const dates = []; let day = new Date(Date.UTC(year, 0, 1)); const isLeap = new Date(year, 1, 29).getMonth() === 1; const daysInYear = isLeap ? 366 : 365; for (let i = 0; i < daysInYear; i++) { dates.push(new Date(day)); day.setUTCDate(day.getUTCDate() + 1); } return dates; }
    function addDays(date, days) { const r = new Date(date.valueOf()); r.setUTCDate(r.getUTCDate() + days); return r; }
    function diffInDays(d1, d2) { return Math.round((d2.valueOf() - d1.valueOf()) / (24 * 3600 * 1000)); }
    function stringToColor(str) { let hash = 0; for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); } let color = '#'; for (let i = 0; i < 3; i++) { const value = (hash >> (i * 8)) & 0xFF; color += ('00' + (Math.floor(value * 0.6) + 70).toString(16)).substr(-2); } return color; }

    async function init() {
        gridWrapper.addEventListener('scroll', () => { equipmentSidebar.scrollTop = gridWrapper.scrollTop; });
        await fetchData();
        const currentYear = new Date().getFullYear();
        yearDates = getDatesForYear(currentYear);
        render();
        setTimeout(() => {
            const today = normalizeDate(new Date());
            const todayIndex = diffInDays(yearDates[0], today);
            if (todayIndex >= 0) {
                const viewport = document.querySelector('.timeline-viewport');
                const scrollLeft = todayIndex * DAY_WIDTH - (viewport.clientWidth / 2) + (DAY_WIDTH / 2);
                viewport.scrollLeft = Math.max(0, scrollLeft);
            }
        }, 0);
    }
    init();
});