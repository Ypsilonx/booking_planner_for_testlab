"""Projects API routes.

Handles CRUD operations for projects:
- GET /api/projects - Get all projects
- POST /api/projects - Create new project
- PUT /api/projects/<name> - Update existing project
- DELETE /api/projects/<name> - Delete project
"""

from flask import Blueprint, request, jsonify
from typing import Tuple
from db import db_connect, load_projects_db
from config import DEFAULT_TEXT_COLOR

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/api/projects', methods=['GET'])
def get_projects() -> Tuple[dict, int]:
    """
    Get all projects.
    
    Returns:
        JSON response with projects list
    """
    try:
        projects = load_projects_db()
        return jsonify({"projects": projects})
    except Exception as e:
        return jsonify({"error": f"Chyba při načítání projektů: {str(e)}"}), 500

@projects_bp.route('/api/projects', methods=['POST'])
def create_project() -> Tuple[dict, int]:
    """
    Create new project.
    
    Expected JSON body:
        - name: str (required)
        - color: str (required)
        - textColor: str (optional, default from config)
        - active: bool (optional, default True)
    
    Returns:
        JSON response with created project data and 201 status
        or error message with appropriate error status
    """
    try:
        new_project = request.json
        if not new_project:
            return jsonify({"error": "Chybí data projektu"}), 400
            
        if not new_project.get('name') or not new_project.get('color'):
            return jsonify({"error": "Chybí název nebo barva projektu"}), 400
            
        conn = db_connect()
        c = conn.cursor()
        c.execute('SELECT name FROM projects WHERE name=?', (new_project['name'],))
        if c.fetchone():
            conn.close()
            return jsonify({"error": "Projekt s tímto názvem již existuje"}), 409
            
        c.execute('''INSERT INTO projects (name, color, textColor, active) VALUES (?, ?, ?, ?)''', (
            new_project['name'],
            new_project['color'],
            new_project.get('textColor', DEFAULT_TEXT_COLOR),
            int(new_project.get('active', True))
        ))
        conn.commit()
        conn.close()
        return jsonify(new_project), 201
    except Exception as e:
        return jsonify({"error": f"Chyba při vytváření projektu: {str(e)}"}), 500

@projects_bp.route('/api/projects/<project_name>', methods=['PUT'])
def update_project(project_name: str) -> Tuple[dict, int]:
    """
    Update existing project.
    
    Args:
        project_name: Name of the project to update
    
    Returns:
        JSON response with updated project data
        or error message if update fails
    """
    try:
        updated_project = request.json
        if not updated_project:
            return jsonify({"error": "Chybí data projektu"}), 400
            
        conn = db_connect()
        c = conn.cursor()
        name = updated_project.get('name', project_name)
        c.execute('''UPDATE projects SET color=?, textColor=?, active=? WHERE name=?''', (
            updated_project.get('color'),
            updated_project.get('textColor', DEFAULT_TEXT_COLOR),
            int(updated_project.get('active', True)),
            name
        ))
        conn.commit()
        conn.close()
        return jsonify(updated_project)
    except Exception as e:
        return jsonify({"error": f"Chyba při aktualizaci projektu: {str(e)}"}), 500

@projects_bp.route('/api/projects/<project_name>', methods=['DELETE'])
def delete_project(project_name: str) -> Tuple[dict, int]:
    """
    Delete project by name.
    
    Args:
        project_name: Name of the project to delete
    
    Returns:
        JSON response with success status
        or error message if deletion fails
    """
    try:
        conn = db_connect()
        c = conn.cursor()
        c.execute('DELETE FROM projects WHERE name=?', (project_name,))
        conn.commit()
        conn.close()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": f"Chyba při mazání projektu: {str(e)}"}), 500
