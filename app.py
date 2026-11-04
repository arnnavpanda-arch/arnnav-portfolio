

import os
import mimetypes
import gridfs
from bson.objectid import ObjectId
from flask import Flask, request, jsonify, send_from_directory, session, redirect, make_response
from pymongo import MongoClient
from dotenv import load_dotenv
from flask_cors import CORS
from flask_socketio import SocketIO

mimetypes.add_type('audio/mp4', '.m4a')
load_dotenv()

app = Flask(__name__, static_folder='static', static_url_path='')
app.secret_key = 'super_secret_session_key' # For session management
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

MONGO_URI = os.getenv("MONGO_URI")
try:
    client = MongoClient(MONGO_URI)
    db = client.get_database("portfolioDB")
    fs = gridfs.GridFS(db)
    print("Connected to MongoDB & GridFS successfully!")
except Exception as e:
    print("Error connecting to MongoDB:", e)

ADMIN_PASSWORD = "Cutiki@123"

# --- Frontend Routes ---
@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/admin')
def admin_panel():
    return app.send_static_file('admin.html')

# --- Auth Routes ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if data.get('password') == ADMIN_PASSWORD:
        session['logged_in'] = True
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Invalid password"}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('logged_in', None)
    return jsonify({"success": True})

@app.route('/api/check_auth', methods=['GET'])
def check_auth():
    if session.get('logged_in'):
        return jsonify({"authenticated": True})
    return jsonify({"authenticated": False})

def is_auth():
    return session.get('logged_in', False)

# --- Dynamic Content API (Public) ---
@app.route('/api/data', methods=['GET'])
def get_data():
    from concurrent.futures import ThreadPoolExecutor
    
    def fetch_coll(name, query, projection, is_list=True):
        if is_list:
            return name, list(db[name].find(query, projection))
        else:
            return name, db[name].find_one(query, projection)

    queries = [
        ('about', {}, {'_id': 0}, False),
        ('skills', {}, {'_id': 1, 'category': 1, 'items': 1}, True),
        ('projects', {}, {'_id': 1, 'title': 1, 'description': 1, 'link': 1, 'emoji': 1, 'github_link': 1, 'deploy_link': 1}, True),
        ('experience', {}, {'_id': 1, 'title': 1, 'company': 1, 'date': 1, 'description': 1}, True),
        ('education', {}, {'_id': 1, 'degree': 1, 'institution': 1, 'date': 1, 'description': 1}, True),
        ('awards', {}, {'_id': 1, 'title': 1, 'description': 1}, True),
        ('certifications', {}, {'_id': 1, 'title': 1, 'description': 1}, True),
        ('gallery', {}, {'_id': 1, 'file_id': 1, 'caption': 1, 'is_featured': 1}, True),
        ('feedback', {}, {'_id': 1, 'name': 1, 'stars': 1}, True),
        ('resume', {}, {'_id': 0, 'file_id': 1}, False),
        ('profile_photo', {}, {'_id': 0, 'file_id': 1}, False),
        ('avatar_3d', {}, {'_id': 0, 'file_id': 1}, False),
        ('intro_audio', {}, {'_id': 0, 'file_id': 1}, False),
        ('avatar_video', {}, {'_id': 0, 'file_id': 1}, False),
        ('about_audio', {}, {'_id': 0, 'file_id': 1}, False),
        ('feedback_audio', {}, {'_id': 0, 'file_id': 1}, False)
    ]

    results = {}
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(fetch_coll, *q) for q in queries]
        for future in futures:
            name, data = future.result()
            results[name] = data

    # Convert ObjectIds to strings
    for coll in ['skills', 'projects', 'experience', 'education', 'awards', 'certifications', 'gallery', 'feedback']:
        for item in results[coll]:
            item['_id'] = str(item['_id'])
            
    return jsonify({
        "about": results['about'],
        "skills": results['skills'],
        "projects": results['projects'],
        "experience": results['experience'],
        "education": results['education'],
        "awards": results['awards'],
        "certifications": results['certifications'],
        "gallery": results['gallery'],
        "feedback": results['feedback'],
        "resume": results['resume'].get('file_id') if results['resume'] else None,
        "profile_photo": results['profile_photo'].get('file_id') if results['profile_photo'] else None,
        "avatar_3d": results['avatar_3d'].get('file_id') if results.get('avatar_3d') else None,
        "intro_audio": results['intro_audio'].get('file_id') if results.get('intro_audio') else None,
        "avatar_video": results['avatar_video'].get('file_id') if results.get('avatar_video') else None,
        "about_audio": results['about_audio'].get('file_id') if results.get('about_audio') else None,
        "feedback_audio": results['feedback_audio'].get('file_id') if results.get('feedback_audio') else None
    })

def notify_clients():
    """Emit a socketio event when data changes to trigger frontend reload"""
    socketio.emit('data_updated', {"message": "refresh"})

# --- Admin Content API (Protected) ---
@app.route('/api/admin/<collection_name>', methods=['POST'])
def add_item(collection_name):
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    
    valid_collections = ['skills', 'projects', 'experience', 'education', 'awards', 'certifications']
    if collection_name not in valid_collections:
        return jsonify({"error": "Invalid collection"}), 400
        
    data = request.json
    result = db[collection_name].insert_one(data)
    data['_id'] = str(result.inserted_id)
    notify_clients()
    return jsonify({"success": True, "data": data})

@app.route('/api/admin/<collection_name>/<item_id>', methods=['DELETE'])
def delete_item(collection_name, item_id):
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    
    valid_collections = ['skills', 'projects', 'experience', 'education', 'awards', 'certifications', 'gallery']
    if collection_name not in valid_collections:
        return jsonify({"error": "Invalid collection"}), 400
        
    # If it's a gallery item, also delete the file from GridFS
    if collection_name == 'gallery':
        item = db.gallery.find_one({"_id": ObjectId(item_id)})
        if item and 'file_id' in item:
            try:
                fs.delete(ObjectId(item['file_id']))
            except:
                pass

    db[collection_name].delete_one({"_id": ObjectId(item_id)})
    notify_clients()
    return jsonify({"success": True})

@app.route('/api/admin/<collection_name>/<item_id>', methods=['PUT'])
def edit_item(collection_name, item_id):
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    
    valid_collections = ['skills', 'projects', 'experience', 'education', 'awards', 'certifications', 'gallery']
    if collection_name not in valid_collections:
        return jsonify({"error": "Invalid collection"}), 400
        
    data = request.json
    db[collection_name].update_one({"_id": ObjectId(item_id)}, {"$set": data})
    notify_clients()
    return jsonify({"success": True})

@app.route('/api/admin/featured_gallery/<item_id>', methods=['POST'])
def set_featured_gallery(item_id):
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    db.gallery.update_many({}, {"$set": {"is_featured": False}})
    db.gallery.update_one({"_id": ObjectId(item_id)}, {"$set": {"is_featured": True}})
    notify_clients()
    return jsonify({"success": True})

@app.route('/api/admin/about', methods=['POST'])
def update_about():
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    db.about.replace_one({}, request.json, upsert=True)
    notify_clients()
    return jsonify({"success": True})

# --- File Handling (GridFS) ---
@app.route('/api/upload_gallery', methods=['POST'])
def upload_gallery():
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    caption = request.form.get('caption', '')
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    # Save to GridFS
    file_id = fs.put(file, filename=file.filename, content_type=file.content_type)
    
    # Save reference in gallery collection
    doc = {
        "file_id": str(file_id),
        "caption": caption
    }
    result = db.gallery.insert_one(doc)
    doc['_id'] = str(result.inserted_id)
    
    notify_clients()
    return jsonify({"success": True, "data": doc})

@app.route('/api/upload_resume', methods=['POST'])
def upload_resume():
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    # Delete old resume from GridFS if it exists
    old_resume = db.resume.find_one({})
    if old_resume and 'file_id' in old_resume:
        try:
            fs.delete(ObjectId(old_resume['file_id']))
        except:
            pass
            
    # Save new to GridFS
    file_id = fs.put(file, filename=file.filename, content_type=file.content_type)
    db.resume.replace_one({}, {"file_id": str(file_id), "filename": file.filename}, upsert=True)
    
    notify_clients()
    return jsonify({"success": True})

@app.route('/api/admin/resume', methods=['DELETE'])
def delete_resume():
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    
    old_resume = db.resume.find_one({})
    if old_resume and 'file_id' in old_resume:
        try:
            fs.delete(ObjectId(old_resume['file_id']))
        except:
            pass
        db.resume.delete_one({})
        
    notify_clients()
    return jsonify({"success": True})

@app.route('/api/upload_profile_photo', methods=['POST'])
def upload_profile_photo():
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    if 'file' not in request.files: return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({"error": "No selected file"}), 400
    
    old_photo = db.profile_photo.find_one({})
    if old_photo and 'file_id' in old_photo:
        try: fs.delete(ObjectId(old_photo['file_id']))
        except: pass
            
    file_id = fs.put(file, filename=file.filename, content_type=file.content_type)
    db.profile_photo.replace_one({}, {"file_id": str(file_id), "filename": file.filename}, upsert=True)
    notify_clients()
    return jsonify({"success": True})

@app.route('/api/upload_avatar_3d', methods=['POST'])
def upload_avatar_3d():
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    if 'file' not in request.files: return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({"error": "No selected file"}), 400
    
    old_avatar = db.avatar_3d.find_one({})
    if old_avatar and 'file_id' in old_avatar:
        try: fs.delete(ObjectId(old_avatar['file_id']))
        except: pass
            
    file_id = fs.put(file, filename=file.filename, content_type=file.content_type)
    db.avatar_3d.replace_one({}, {"file_id": str(file_id), "filename": file.filename}, upsert=True)
    notify_clients()
    return jsonify({"success": True})

@app.route('/api/admin/avatar_3d', methods=['DELETE'])
def delete_avatar_3d():
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    old_avatar = db.avatar_3d.find_one({})
    if old_avatar and 'file_id' in old_avatar:
        try: fs.delete(ObjectId(old_avatar['file_id']))
        except: pass
        db.avatar_3d.delete_one({})
    notify_clients()
    return jsonify({"success": True})

@app.route('/api/upload_intro_audio', methods=['POST'])
def upload_intro_audio():
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    if 'file' not in request.files: return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({"error": "No selected file"}), 400
    
    old_audio = db.intro_audio.find_one({})
    if old_audio and 'file_id' in old_audio:
        try: fs.delete(ObjectId(old_audio['file_id']))
        except: pass
            
    file_id = fs.put(file, filename=file.filename, content_type=file.content_type)
    db.intro_audio.replace_one({}, {"file_id": str(file_id), "filename": file.filename}, upsert=True)
    notify_clients()
    return jsonify({"success": True})

@app.route('/api/admin/intro_audio', methods=['DELETE'])
def delete_intro_audio():
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    old_audio = db.intro_audio.find_one({})
    if old_audio and 'file_id' in old_audio:
        try: fs.delete(ObjectId(old_audio['file_id']))
        except: pass
        db.intro_audio.delete_one({})
    notify_clients()
    return jsonify({"success": True})

@app.route('/api/upload_avatar_video', methods=['POST'])
def upload_avatar_video():
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    if 'file' not in request.files: return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({"error": "No selected file"}), 400
    
    old_video = db.avatar_video.find_one({})
    if old_video and 'file_id' in old_video:
        try: fs.delete(ObjectId(old_video['file_id']))
        except: pass
            
    file_id = fs.put(file, filename=file.filename, content_type=file.content_type)
    db.avatar_video.replace_one({}, {"file_id": str(file_id), "filename": file.filename}, upsert=True)
    notify_clients()
    return jsonify({"success": True})

@app.route('/api/admin/avatar_video', methods=['DELETE'])
def delete_avatar_video():
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    old_video = db.avatar_video.find_one({})
    if old_video and 'file_id' in old_video:
        try: fs.delete(ObjectId(old_video['file_id']))
        except: pass
        db.avatar_video.delete_one({})
    notify_clients()
    return jsonify({"success": True})

VALID_AUDIO_SECTIONS = ['about', 'feedback']

@app.route('/api/upload_section_audio/<section>', methods=['POST'])
def upload_section_audio(section):
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    if section not in VALID_AUDIO_SECTIONS: return jsonify({"error": "Invalid section"}), 400
    if 'file' not in request.files: return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({"error": "No selected file"}), 400
    
    coll_name = f"{section}_audio"
    old_audio = db[coll_name].find_one({})
    if old_audio and 'file_id' in old_audio:
        try: fs.delete(ObjectId(old_audio['file_id']))
        except: pass
            
    file_id = fs.put(file, filename=file.filename, content_type=file.content_type)
    db[coll_name].replace_one({}, {"file_id": str(file_id), "filename": file.filename}, upsert=True)
    notify_clients()
    return jsonify({"success": True})

@app.route('/api/admin/section_audio/<section>', methods=['DELETE'])
def delete_section_audio(section):
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    if section not in VALID_AUDIO_SECTIONS: return jsonify({"error": "Invalid section"}), 400
    
    coll_name = f"{section}_audio"
    old_audio = db[coll_name].find_one({})
    if old_audio and 'file_id' in old_audio:
        try: fs.delete(ObjectId(old_audio['file_id']))
        except: pass
        db[coll_name].delete_one({})
    notify_clients()
    return jsonify({"success": True})

@app.route('/api/admin/profile_photo', methods=['DELETE'])
def delete_profile_photo():
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    old_photo = db.profile_photo.find_one({})
    if old_photo and 'file_id' in old_photo:
        try: fs.delete(ObjectId(old_photo['file_id']))
        except: pass
        db.profile_photo.delete_one({})
    notify_clients()
    return jsonify({"success": True})

@app.route('/api/file/<file_id>')
def serve_file(file_id):
    try:
        grid_out = fs.get(ObjectId(file_id))
        response = make_response(grid_out.read())
        response.headers['Content-Type'] = grid_out.content_type
        if 'pdf' in grid_out.content_type or 'word' in grid_out.content_type or 'officedocument' in grid_out.content_type:
            if request.args.get('download') == '1':
                response.headers['Content-Disposition'] = f'attachment; filename="{grid_out.filename}"'
            else:
                response.headers['Content-Disposition'] = f'inline; filename="{grid_out.filename}"'
        return response
    except Exception as e:
        return jsonify({"error": "File not found"}), 404

@app.route('/health')
def health():
    return jsonify({"status": "ok"})

@app.route('/api/feedback', methods=['POST'])
def add_feedback():
    data = request.json
    if not data or not data.get('name') or not data.get('stars'):
        return jsonify({"error": "Invalid data"}), 400
    
    db.feedback.insert_one({"name": data.get('name'), "stars": data.get('stars')})
    notify_clients()
    return jsonify({"success": True})

@app.route('/api/admin/feedback/<id>', methods=['DELETE'])
def delete_feedback(id):
    if not is_auth(): return jsonify({"error": "Unauthorized"}), 401
    result = db.feedback.delete_one({"_id": ObjectId(id)})
    if result.deleted_count:
        notify_clients()
        return jsonify({"success": True})
    return jsonify({"error": "Not found"}), 404

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8080, debug=True, allow_unsafe_werkzeug=True)
