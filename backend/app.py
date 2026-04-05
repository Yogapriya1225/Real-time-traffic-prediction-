import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from database.db import get_db_connection, init_db
import traceback

frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')
app = Flask(__name__, static_folder=frontend_dir, static_url_path='')
# Allow CORS for all domains to ease frontend integration
CORS(app)

# Initialize database on startup
with app.app_context():
    init_db()

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return "Not found", 404


@app.route('/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400
        
    hashed_password = generate_password_hash(password)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                       (username, email, hashed_password))
        conn.commit()
    except Exception as e:
        return jsonify({"error": "Username or email already exists"}), 400
    finally:
        conn.close()
        
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Missing required fields"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    user = cursor.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    
    if user and check_password_hash(user['password'], password):
        return jsonify({
            "message": "Login successful", 
            "user_id": user['id'], 
            "username": user['username']
        }), 200
    
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/traffic/predict', methods=['POST'])
def predict_traffic():
    data = request.json
    car_count = data.get('car_count', 0)
    bus_count = data.get('bus_count', 0)
    bike_count = data.get('bike_count', 0)
    truck_count = data.get('truck_count', 0)
    lat = data.get('lat')
    lng = data.get('lng')
    speed = data.get('speed', 0)
    user_id = data.get('user_id') # Optional
    
    try:
        car_count = float(car_count)
        bus_count = float(bus_count)
        bike_count = float(bike_count)
        truck_count = float(truck_count)
        vehicle_count = car_count + bus_count + bike_count + truck_count
        if speed:
            speed = float(speed)
    except ValueError:
        return jsonify({"error": "Invalid numerical inputs"}), 400

    # Logic based on typical thresholds
    # e.g., low speed implies accident/jam
    if speed and speed <= 15 and vehicle_count >= 10:
        traffic_level = "High Traffic"  # Severe slowdown indicates accident
    elif vehicle_count > 100:
        if speed and speed > 40:
            traffic_level = "Medium Traffic"
        else:
            traffic_level = "High Traffic"
    elif vehicle_count > 50:
        if speed and speed < 30:
            traffic_level = "High Traffic"
        elif speed and speed > 50:
            traffic_level = "Low Traffic"
        else:
            traffic_level = "Medium Traffic"
    elif vehicle_count > 20:
        if speed and speed < 25:
            traffic_level = "Medium Traffic"
        else:
            traffic_level = "Low Traffic"
    else:
        traffic_level = "Low Traffic"
        
    # Save history if user_id is provided
    if user_id:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO history (user_id, vehicle_count, car_count, bus_count, bike_count, truck_count, lat, lng, speed, result) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, vehicle_count, car_count, bus_count, bike_count, truck_count, lat, lng, speed, traffic_level))
            conn.commit()
        except Exception as e:
            print("Error saving history:", e)
        finally:
            if 'conn' in locals():
                conn.close()
                
    return jsonify({"prediction": traffic_level}), 200

@app.route('/nlp/analyze', methods=['POST'])
def analyze_nlp():
    data = request.json
    text_input = data.get('text_input', '').lower()
    user_id = data.get('user_id') # Optional
    
    if not text_input:
        return jsonify({"error": "No text provided"}), 400
        
    high_keywords = ['jam', 'heavy', 'crowded', 'stuck', 'accident']
    medium_keywords = ['normal', 'moderate', 'busy', 'okay']
    
    traffic_level = "Low Traffic"
    for kw in high_keywords:
        if kw in text_input:
            traffic_level = "High Traffic"
            break
    
    if traffic_level == "Low Traffic":
        for kw in medium_keywords:
            if kw in text_input:
                traffic_level = "Medium Traffic"
                break
                
    if user_id:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO history (user_id, text_input, result) 
                VALUES (?, ?, ?)
            ''', (user_id, text_input, traffic_level))
            conn.commit()
        except Exception as e:
            print("Error saving NLP history:", e)
        finally:
            if 'conn' in locals():
                conn.close()
                
    return jsonify({"prediction": traffic_level}), 200

@app.route('/history/<int:user_id>', methods=['GET'])
def get_history(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    history_records = cursor.execute('''
        SELECT id, vehicle_count, car_count, bus_count, bike_count, truck_count, lat, lng, speed, text_input, result, created_at 
        FROM history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
    ''', (user_id,)).fetchall()
    conn.close()
    
    data = []
    for rec in history_records:
        data.append({
            "id": rec['id'],
            "vehicle_count": rec['vehicle_count'],
            "car_count": rec['car_count'],
            "bus_count": rec['bus_count'],
            "bike_count": rec['bike_count'],
            "truck_count": rec['truck_count'],
            "lat": rec['lat'],
            "lng": rec['lng'],
            "speed": rec['speed'],
            "text_input": rec['text_input'],
            "result": rec['result'],
            "created_at": rec['created_at']
        })
    return jsonify(data), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
