/**
 * Booking Planner - Simplified Frontend with Native HTML5 Drag & Drop
 * 
 * @version 3.0.0
 * @description Clean, simple implementation without external libraries
 * 
 * Features:
 * - Native HTML5 Drag & Drop API
 * - Immediate DB synchronization
 * - Simple, predictable behavior
 * - No complex snap logic - just clean grid alignment
 */

// ============================================================================
// CONFIGURATION & STATE
// ============================================================================

const CONFIG = {
    DAY_WIDTH: 140,
    HEADER_HEIGHT: 60,
    BASE_ROW_HEIGHT: 60,
    LANE_HEIGHT: 40
};

let state = {
    equipment: [],
    bookings: [],
    projects: [],
    yearDates: [],
    rowHeights: [],
    draggedBooking: null,
    dragStartDay: null
};

// ============================================================================
// DATA LOADING
// ============================================================================

async function loadData() {
    try {
        const response = await fetch('/api/data');
        if (!response.ok) throw new Error('Failed to load data');
        
        const data = await response.json();
        state.equipment = data.equipment || [];
        state.bookings = data.bookings || [];
        state.projects = data.projects || [];
        
        console.log(`Loaded: ${state.bookings.length} bookings, ${state.equipment.length} equipment`);
        
        renderCalendar();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Chyba při načítání dat z databáze');
    }
}

// ============================================================================
// CALENDAR RENDERING
// ============================================================================

function renderCalendar() {
    const year = new Date().getFullYear();
    state.yearDates = getDatesForYear(year);
    
    const grid = document.getElementById('timeline-grid');
    const sidebar = document.getElementById('equipment-sidebar');
    
    if (!grid || !sidebar) return;
    
    // Calculate row heights
    state.rowHeights = state.equipment.map(equip => CONFIG.BASE_ROW_HEIGHT);
    
    // Render equipment sidebar
    renderEquipmentSidebar(sidebar);
    
    // Set up grid
    grid.style.gridTemplateColumns = `repeat(${state.yearDates.length}, ${CONFIG.DAY_WIDTH}px)`;
    grid.style.gridTemplateRows = `${CONFIG.HEADER_HEIGHT}px ${state.rowHeights.map(h => `${h}px`).join(' ')}`;
    
    // Render grid
    grid.innerHTML = '';
    renderDateHeaders(grid);
    renderGridCells(grid);
    renderBookings(grid);
}

function renderEquipmentSidebar(sidebar) {
    sidebar.innerHTML = '';
    
    // Header
    const header = document.createElement('div');
    header.className = 'sidebar-header';
    header.textContent = 'Zařízení';
    sidebar.appendChild(header);
    
    // Equipment items
    state.equipment.forEach((equip, index) => {
        const item = document.createElement('div');
        item.className = 'equipment-item';
        item.style.height = `${state.rowHeights[index]}px`;
        
        const name = document.createElement('div');
        name.className = 'equipment-name';
        name.textContent = equip.name;
        
        const details = document.createElement('div');
        details.className = 'equipment-details';
        details.textContent = `${equip.category || ''} (${equip.max_tests})`;
        
        item.appendChild(name);
        item.appendChild(details);
        sidebar.appendChild(item);
    });
}

function renderDateHeaders(grid) {
    const today = normalizeDate(new Date());
    const todayTime = today.getTime();
    
    state.yearDates.forEach(date => {
        const header = document.createElement('div');
        header.className = 'date-header';
        
        const normalized = normalizeDate(date);
        const dayOfWeek = date.toLocaleDateString('cs-CZ', { weekday: 'short' });
        
        if (['so', 'ne'].includes(dayOfWeek)) {
            header.classList.add('weekend');
        }
        
        if (normalized.getTime() === todayTime) {
            header.classList.add('today');
        }
        
        header.innerHTML = `
            <span class="date-main">${date.getDate()}.${date.getMonth() + 1}.</span>
            <span class="day-name">${dayOfWeek}</span>
        `;
        
        grid.appendChild(header);
    });
}

function renderGridCells(grid) {
    const today = normalizeDate(new Date());
    const todayTime = today.getTime();
    
    state.equipment.forEach(() => {
        state.yearDates.forEach(date => {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            
            const normalized = normalizeDate(date);
            const dayOfWeek = date.toLocaleDateString('cs-CZ', { weekday: 'short' });
            
            if (['so', 'ne'].includes(dayOfWeek)) {
                cell.classList.add('weekend');
            }
            
            if (normalized.getTime() === todayTime) {
                cell.classList.add('today');
            }
            
            grid.appendChild(cell);
        });
    });
}

function renderBookings(grid) {
    // Remove existing bookings
    grid.querySelectorAll('.booking-bar').forEach(el => el.remove());
    
    if (state.yearDates.length === 0) return;
    
    const firstDate = state.yearDates[0];
    let cumulativeTop = CONFIG.HEADER_HEIGHT;
    
    state.equipment.forEach((equip, equipIndex) => {
        const equipBookings = state.bookings.filter(b => b.equipment_id === equip.id);
        
        equipBookings.forEach(booking => {
            const bookingEl = createBookingElement(booking, firstDate, cumulativeTop);
            if (bookingEl) {
                grid.appendChild(bookingEl);
            }
        });
        
        cumulativeTop += state.rowHeights[equipIndex];
    });
}

function createBookingElement(booking, firstDate, equipmentTop) {
    const bookingStart = normalizeDate(new Date(booking.start_date));
    const bookingEnd = normalizeDate(new Date(booking.end_date));
    
    const startIndex = diffInDays(firstDate, bookingStart);
    const durationDays = diffInDays(bookingStart, bookingEnd) + 1;
    
    if (startIndex < -durationDays || startIndex >= state.yearDates.length) {
        return null;
    }
    
    const bookingBar = document.createElement('div');
    bookingBar.className = 'booking-bar';
    bookingBar.draggable = true;
    bookingBar.dataset.bookingId = booking.id;
    bookingBar.title = booking.description;
    
    // Position and size
    bookingBar.style.left = `${startIndex * CONFIG.DAY_WIDTH}px`;
    bookingBar.style.width = `${durationDays * CONFIG.DAY_WIDTH}px`;
    bookingBar.style.top = `${equipmentTop + CONFIG.LANE_HEIGHT * 0.1}px`;
    bookingBar.style.height = `${CONFIG.LANE_HEIGHT * 0.8}px`;
    
    // Background color
    bookingBar.style.backgroundColor = booking.project_color || '#4a90e2';
    
    // Content
    const mainLine = document.createElement('div');
    mainLine.className = 'booking-main';
    
    let mainText = '';
    if (booking.tma_number) {
        mainText = `EU-SVA-${booking.tma_number}-${new Date(booking.start_date).getFullYear().toString().slice(-2)}`;
    }
    if (booking.project_name) {
        mainText += (mainText ? ' ' : '') + booking.project_name;
    }
    if (!mainText) {
        mainText = booking.description || 'Rezervace';
    }
    
    mainLine.textContent = mainText;
    bookingBar.appendChild(mainLine);
    
    if (booking.note) {
        const noteLine = document.createElement('div');
        noteLine.className = 'booking-note';
        noteLine.textContent = booking.note;
        bookingBar.appendChild(noteLine);
    }
    
    // Setup drag & drop
    setupBookingDragDrop(bookingBar, booking);
    
    return bookingBar;
}

// ============================================================================
// NATIVE HTML5 DRAG & DROP
// ============================================================================

function setupBookingDragDrop(element, booking) {
    element.addEventListener('dragstart', (e) => {
        state.draggedBooking = booking;
        element.style.opacity = '0.5';
        
        // Store start position
        const left = parseFloat(element.style.left) || 0;
        state.dragStartDay = Math.floor(left / CONFIG.DAY_WIDTH);
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', booking.id);
    });
    
    element.addEventListener('dragend', (e) => {
        element.style.opacity = '1';
        state.draggedBooking = null;
        state.dragStartDay = null;
    });
    
    element.addEventListener('dblclick', () => {
        console.log('Double click - open modal for editing:', booking);
        // TODO: Open modal for editing
    });
}

// Setup drop zones on grid
function setupGridDropZones() {
    const grid = document.getElementById('timeline-grid');
    if (!grid) return;
    
    grid.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    
    grid.addEventListener('drop', async (e) => {
        e.preventDefault();
        
        if (!state.draggedBooking) return;
        
        const gridRect = grid.getBoundingClientRect();
        const x = e.clientX - gridRect.left + grid.parentElement.scrollLeft;
        const y = e.clientY - gridRect.top + grid.parentElement.scrollTop;
        
        // Calculate target day and equipment
        const targetDay = Math.floor(x / CONFIG.DAY_WIDTH);
        const targetEquipmentIndex = findEquipmentIndex(y);
        
        if (targetDay < 0 || targetDay >= state.yearDates.length || targetEquipmentIndex === -1) {
            console.log('Invalid drop position');
            renderCalendar(); // Reset
            return;
        }
        
        // Calculate new dates
        const newStartDate = state.yearDates[targetDay];
        const duration = diffInDays(
            normalizeDate(new Date(state.draggedBooking.start_date)),
            normalizeDate(new Date(state.draggedBooking.end_date))
        );
        const newEndDate = addDays(newStartDate, duration);
        
        // Update booking
        const updatedBooking = {
            ...state.draggedBooking,
            equipment_id: state.equipment[targetEquipmentIndex].id,
            start_date: formatDate(newStartDate),
            end_date: formatDate(newEndDate)
        };
        
        console.log('Updating booking:', updatedBooking);
        await updateBookingInDB(updatedBooking);
    });
}

function findEquipmentIndex(y) {
    let cumulativeHeight = CONFIG.HEADER_HEIGHT;
    
    for (let i = 0; i < state.rowHeights.length; i++) {
        if (y >= cumulativeHeight && y < cumulativeHeight + state.rowHeights[i]) {
            return i;
        }
        cumulativeHeight += state.rowHeights[i];
    }
    
    return -1;
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

async function updateBookingInDB(booking) {
    try {
        const response = await fetch(`/api/bookings/${booking.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Update failed');
        }
        
        // Reload data and re-render
        await loadData();
        
    } catch (error) {
        console.error('Failed to update booking:', error);
        alert(`Chyba při aktualizaci: ${error.message}`);
        // Reload to reset state
        await loadData();
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getDatesForYear(year) {
    const dates = [];
    let day = new Date(year, 0, 1);
    const isLeap = new Date(year, 1, 29).getMonth() === 1;
    const daysInYear = isLeap ? 366 : 365;
    
    for (let i = 0; i < daysInYear; i++) {
        dates.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    
    return dates;
}

function normalizeDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
    const result = new Date(date.valueOf());
    result.setDate(result.getDate() + days);
    return result;
}

function diffInDays(d1, d2) {
    return Math.round((d2.valueOf() - d1.valueOf()) / (24 * 3600 * 1000));
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Booking Planner v3.0 - Initializing...');
    
    setupGridDropZones();
    loadData();
    
    // Setup navigation buttons (if they exist)
    const todayBtn = document.getElementById('today-btn');
    if (todayBtn) {
        todayBtn.addEventListener('click', scrollToToday);
    }
});

function scrollToToday() {
    const today = normalizeDate(new Date());
    const todayTime = today.getTime();
    const todayIndex = state.yearDates.findIndex(date => {
        return normalizeDate(date).getTime() === todayTime;
    });
    
    if (todayIndex !== -1) {
        const viewport = document.querySelector('.timeline-viewport');
        if (viewport) {
            const scrollLeft = todayIndex * CONFIG.DAY_WIDTH - (viewport.clientWidth / 2) + (CONFIG.DAY_WIDTH / 2);
            viewport.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
        }
    }
}
