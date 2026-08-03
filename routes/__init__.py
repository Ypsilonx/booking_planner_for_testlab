"""
Routes module for Booking Planner API.

Contains Flask Blueprints for different API endpoints:
- bookings: CRUD operations for bookings
- equipment: read-only listing of equipment (GET)
- equipment_mgmt: CRUD operations for equipment + capacity overrides
- projects: CRUD operations for projects
"""

from .bookings import bookings_bp
from .equipment import equipment_bp
from .equipment_mgmt import equipment_mgmt_bp
from .projects import projects_bp

__all__ = ['bookings_bp', 'equipment_bp', 'equipment_mgmt_bp', 'projects_bp']
