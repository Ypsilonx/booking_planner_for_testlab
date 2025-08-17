from flask import Flask, render_template
from routes.bookings import bookings_bp
from routes.projects import projects_bp
from routes.equipment import equipment_bp

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

@app.route('/')
def index():
    return render_template('index.html')

app.register_blueprint(bookings_bp)
app.register_blueprint(projects_bp)
app.register_blueprint(equipment_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)