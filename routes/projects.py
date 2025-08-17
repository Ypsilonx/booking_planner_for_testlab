from flask import Blueprint, request, jsonify
from db import db_connect, load_projects_db

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/api/projects', methods=['GET'])
def get_projects():
    projects = load_projects_db()
    return jsonify({"projects": projects})

@projects_bp.route('/api/projects', methods=['POST'])
def create_project():
    new_project = request.json
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
        new_project.get('textColor', '#ffffff'),
        int(new_project.get('active', True))
    ))
    conn.commit()
    conn.close()
    return jsonify(new_project), 201

@projects_bp.route('/api/projects/<project_name>', methods=['PUT'])
def update_project(project_name):
    updated_project = request.json
    conn = db_connect()
    c = conn.cursor()
    name = updated_project.get('name', project_name)
    c.execute('''UPDATE projects SET color=?, textColor=?, active=? WHERE name=?''', (
        updated_project.get('color'),
        updated_project.get('textColor', '#ffffff'),
        int(updated_project.get('active', True)),
        name
    ))
    conn.commit()
    conn.close()
    return jsonify(updated_project)

@projects_bp.route('/api/projects/<project_name>', methods=['DELETE'])
def delete_project(project_name):
    conn = db_connect()
    c = conn.cursor()
    c.execute('DELETE FROM projects WHERE name=?', (project_name,))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 200
