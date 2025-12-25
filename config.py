"""
Configuration module for Booking Planner.

Centralized configuration for database paths, application settings,
and other constants used throughout the application.
"""

import os

# Database configuration
DB_PATH = 'booking_planner.db'

# Legacy migration files (kept for reference, not used in production)
LEGACY_BOOKINGS_FILE = 'bookings_data.json'
LEGACY_EQUIPMENT_FILE = 'equipment.json'
LEGACY_PROJECTS_FILE = 'projects.json'

# Application settings
APP_HOST = '0.0.0.0'
APP_PORT = 5000
APP_DEBUG = True

# API response configuration
API_VERSION = '2.0.0'

# Validation limits
MAX_DESCRIPTION_LENGTH = 200
MAX_NOTE_LENGTH = 500

# TMA number pattern
TMA_REGEX_PATTERN = r"EU-SVA-\d{6}-\d{2}"

# Default values
DEFAULT_TEXT_COLOR = '#ffffff'
DEFAULT_EQUIPMENT_STATUS = 'active'
DEFAULT_MAX_TESTS = 1
DEFAULT_SIDES = 1
