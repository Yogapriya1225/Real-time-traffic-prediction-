import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'traffic_flow.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create History table (optional, for storing user's queries)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            vehicle_count INTEGER,
            car_count INTEGER DEFAULT 0,
            bus_count INTEGER DEFAULT 0,
            bike_count INTEGER DEFAULT 0,
            truck_count INTEGER DEFAULT 0,
            lat REAL,
            lng REAL,
            speed REAL,
            text_input TEXT,
            result TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Safely try adding new columns in case the table already exists
    new_columns = [
        ("car_count", "INTEGER DEFAULT 0"),
        ("bus_count", "INTEGER DEFAULT 0"),
        ("bike_count", "INTEGER DEFAULT 0"),
        ("truck_count", "INTEGER DEFAULT 0"),
        ("lat", "REAL"),
        ("lng", "REAL")
    ]
    for col_name, col_type in new_columns:
        try:
            cursor.execute(f'ALTER TABLE history ADD COLUMN {col_name} {col_type}')
        except sqlite3.OperationalError:
            pass # Column exists
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    print("Initializing Database...")
    init_db()
    print("Database Initialized successfully.")
