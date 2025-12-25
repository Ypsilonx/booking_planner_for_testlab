/**
 * Frontend Code Structure Guide
 * 
 * This file documents the organization of script.js
 * to help with navigation and maintenance.
 * 
 * Total Lines: ~1760
 */

// ============================================================================
// FILE STRUCTURE OVERVIEW
// ============================================================================

/*
Lines 1-50:    Header documentation & global state initialization
Lines 51-200:  API Communication Layer (CRUD operations)
Lines 201-400: Data Loading & Initialization
Lines 401-800: UI Rendering Functions
Lines 801-1200: Event Handlers & User Interactions
Lines 1201-1500: Booking Management (create, update, delete)
Lines 1501-1760: Utility Functions & Helpers
*/

// ============================================================================
// KEY FUNCTIONS INDEX
// ============================================================================

/**
 * API LAYER
 * --------------------------------
 * loadProjectsFromServer()          - GET /api/projects
 * createProjectOnServer()           - POST /api/projects
 * updateProjectOnServer()           - PUT /api/projects/:name
 * deleteProjectOnServer()           - DELETE /api/projects/:name
 * 
 * loadEquipmentFromServer()         - GET /api/equipment
 * createEquipmentOnServer()         - POST /api/equipment
 * updateEquipmentOnServer()         - PUT /api/equipment/:name
 * deleteEquipmentOnServer()         - DELETE /api/equipment/:name
 * 
 * loadBookingsFromServer()          - GET /api/bookings
 * createBookingOnServer()           - POST /api/bookings
 * updateBookingOnServer()           - PUT /api/bookings/:id
 * deleteBookingOnServer()           - DELETE /api/bookings/:id
 * 
 * loadAllData()                     - GET /api/data (combined)
 */

/**
 * DATA PROCESSING
 * --------------------------------
 * processEquipmentData()            - Transform raw equipment data for display
 * processBookingData()              - Transform raw booking data
 * extractTMANumber()                - Extract TMA from description
 * calculateRowHeights()             - Calculate equipment row heights
 * generateYearDates()               - Generate calendar dates
 */

/**
 * RENDERING
 * --------------------------------
 * renderEquipmentSidebar()          - Render equipment list
 * renderTimelineGrid()              - Render calendar grid
 * renderBookings()                  - Render booking bars on calendar
 * renderMonthHeaders()              - Render month labels
 * updateCalendar()                  - Full calendar refresh
 */

/**
 * EVENT HANDLERS
 * --------------------------------
 * handleEquipmentClick()            - Equipment row click
 * handleBookingClick()              - Booking bar click
 * handleBookingDragStart()          - Drag & drop start
 * handleBookingDragEnd()            - Drag & drop end
 * handleModalSubmit()               - Booking form submit
 * handleEquipmentDoubleClick()      - Equipment inline edit
 */

/**
 * UTILITY FUNCTIONS
 * --------------------------------
 * formatDate()                      - Format date for display
 * parseDate()                       - Parse date string
 * calculateDuration()               - Calculate date range duration
 * checkCollision()                  - Check booking overlaps
 * getProjectColor()                 - Get project color
 * saveToLocalStorage()              - Save user preferences
 * loadFromLocalStorage()            - Load user preferences
 */

// ============================================================================
// GLOBAL STATE VARIABLES
// ============================================================================

/**
 * allEquipmentData: Array<Object>
 * - Source of truth for equipment
 * - Loaded from /api/data or /api/equipment
 * 
 * allBookings: Array<Object>
 * - Source of truth for bookings
 * - Loaded from /api/data or /api/bookings
 * 
 * allProjects: Array<Object>
 * - Source of truth for projects
 * - Loaded from /api/projects
 * 
 * customCapacities: Map<string, number>
 * - User-customized equipment capacities
 * - Persisted in localStorage
 * 
 * customProjects: Map<string, Object>
 * - Legacy project color preferences
 * - Migrated to server-side projects
 */

// ============================================================================
// DATA FLOW
// ============================================================================

/**
 * 1. INITIALIZATION
 *    DOMContentLoaded → loadAllData() → processData() → renderUI()
 * 
 * 2. CREATING BOOKING
 *    userClick → openModal → fillForm → submit → createBookingOnServer() → refresh
 * 
 * 3. EDITING BOOKING
 *    doubleClick → openModal → prefillForm → submit → updateBookingOnServer() → refresh
 * 
 * 4. DELETING BOOKING
 *    click → confirmDelete → deleteBookingOnServer() → refresh
 * 
 * 5. DRAG & DROP
 *    dragStart → drag → drop → calculateNewDates → updateBookingOnServer() → refresh
 */

// ============================================================================
// API ENDPOINTS USED
// ============================================================================

/**
 * GET    /api/data                  - Load all data (equipment, bookings, projects)
 * 
 * GET    /api/bookings              - Load all bookings
 * POST   /api/bookings              - Create new booking
 * PUT    /api/bookings/:id          - Update existing booking
 * DELETE /api/bookings/:id          - Delete booking
 * 
 * GET    /api/equipment             - Load all equipment
 * POST   /api/equipment             - Create new equipment
 * PUT    /api/equipment/:name       - Update equipment
 * DELETE /api/equipment/:name       - Delete equipment
 * 
 * GET    /api/projects              - Load all projects
 * POST   /api/projects              - Create new project
 * PUT    /api/projects/:name        - Update project
 * DELETE /api/projects/:name        - Delete project
 */

// ============================================================================
// PERFORMANCE CONSIDERATIONS
// ============================================================================

/**
 * OPTIMIZATION STRATEGIES:
 * 
 * 1. Use Map instead of Array for O(1) lookups
 *    - customCapacities, customEquipmentNames, etc.
 * 
 * 2. Debounce user inputs
 *    - Search, filter operations
 * 
 * 3. Virtual scrolling for large datasets
 *    - Not yet implemented (future enhancement)
 * 
 * 4. Minimize DOM manipulations
 *    - Batch updates, use DocumentFragment
 * 
 * 5. Cache calculated values
 *    - rowHeights, yearDates
 */

// ============================================================================
// BROWSER COMPATIBILITY
// ============================================================================

/**
 * REQUIRED FEATURES:
 * - ES6+ (const, let, arrow functions, template literals)
 * - Fetch API
 * - Promises & async/await
 * - Map and Set
 * - LocalStorage
 * - Drag & Drop API
 * 
 * SUPPORTED BROWSERS:
 * - Chrome 60+
 * - Firefox 55+
 * - Safari 12+
 * - Edge 79+
 * 
 * NOT SUPPORTED:
 * - Internet Explorer (any version)
 */

// ============================================================================
// FUTURE ENHANCEMENTS
// ============================================================================

/**
 * TODO:
 * [ ] Implement virtual scrolling for large equipment lists
 * [ ] Add keyboard shortcuts (Ctrl+S save, Esc cancel, etc.)
 * [ ] Implement undo/redo functionality
 * [ ] Add real-time updates (WebSocket)
 * [ ] Offline mode support (Service Worker)
 * [ ] Export to CSV/Excel
 * [ ] Print-friendly view
 * [ ] Dark mode support
 * [ ] Touch gestures for mobile
 * [ ] Advanced filtering and search
 * [ ] Recurring bookings
 * [ ] Email notifications
 * [ ] Calendar sync (iCal, Google Calendar)
 */

// ============================================================================
// DEBUGGING TIPS
// ============================================================================

/**
 * COMMON ISSUES:
 * 
 * 1. Bookings not appearing
 *    - Check browser console for API errors
 *    - Verify data format matches expected structure
 *    - Check if dates are valid ISO strings
 * 
 * 2. Drag & drop not working
 *    - Ensure draggable="true" on booking elements
 *    - Check event handlers are attached
 *    - Verify dropzone event.preventDefault() is called
 * 
 * 3. Colors not displaying
 *    - Check project exists in allProjects
 *    - Verify color is valid hex code
 *    - Check CSS color property syntax
 * 
 * 4. API calls failing
 *    - Check network tab in DevTools
 *    - Verify server is running on correct port
 *    - Check CORS settings if applicable
 * 
 * 5. LocalStorage issues
 *    - Check browser storage quota
 *    - Verify JSON serialization is valid
 *    - Clear localStorage if corrupted
 */

// ============================================================================
// TESTING CHECKLIST
// ============================================================================

/**
 * Before committing changes, test:
 * 
 * [ ] Create new booking
 * [ ] Edit existing booking
 * [ ] Delete booking
 * [ ] Drag & drop booking
 * [ ] Create equipment
 * [ ] Edit equipment capacity
 * [ ] Create project with custom color
 * [ ] TMA number extraction
 * [ ] Collision detection
 * [ ] Modal open/close
 * [ ] Form validation
 * [ ] Calendar navigation
 * [ ] Responsive layout (mobile, tablet, desktop)
 * [ ] Browser console has no errors
 * [ ] LocalStorage persistence works
 */
