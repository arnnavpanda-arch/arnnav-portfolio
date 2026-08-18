import os
from flask import Flask, request, jsonify, send_from_directory
from pymongo import MongoClient
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

# MongoDB Setup
MONGO_URI = os.getenv("MONGO_URI")
try:
    client = MongoClient(MONGO_URI)
    db = client.get_database("portfolioDB")
    contacts_collection = db.get_collection("contacts")
    print("Connected to MongoDB successfully!")
except Exception as e:
    print("Error connecting to MongoDB:", e)

# Serve the main index.html file
@app.route('/')
def index():
    return app.send_static_file('index.html')

# Health Check Route
@app.route('/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "Backend server is running smoothly!"
    }), 200

# API Route to handle contact form submissions
@app.route('/api/contact', methods=['POST'])
def submit_contact():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    message = data.get('message')

    if not name or not email or not message:
        return jsonify({"error": "All fields are required"}), 400

    try:
        contact_doc = {
            "name": name,
            "email": email,
            "message": message
        }
        contacts_collection.insert_one(contact_doc)
        return jsonify({"success": True, "message": "Message sent successfully!"}), 201
    except Exception as e:
        print("Error saving contact:", e)
        return jsonify({"error": "Failed to send message. Please try again later."}), 500

if __name__ == '__main__':
    # Run the server on port 8080 to match previous setup
    app.run(host='0.0.0.0', port=8080, debug=True)
