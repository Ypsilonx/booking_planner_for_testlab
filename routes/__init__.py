"""
Routes module for Booking Planner API.

Contains Flask Blueprints for different API endpoints:
- bookings: CRUD operations for bookings
- equipment: CRUD operations for equipment
- projects: CRUD operations for projects
"""

from .bookings import bookings_bp
from .equipment import equipment_bp
from .projects import projects_bp

__all__ = ['bookings_bp', 'equipment_bp', 'projects_bp']
