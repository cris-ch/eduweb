from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, auth, firestore
import os
from datetime import datetime

app = Flask(__name__)
# Configure CORS to allow requests from your development server
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://127.0.0.1:5500", "http://localhost:5500"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Authorization", "Content-Type"]
    }
})

# Initialize Firebase Admin
cred = credentials.Certificate(os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json'))
firebase_admin.initialize_app(cred)

# Initialize Firestore
db = firestore.client()

@app.route('/api/user/role', methods=['GET', 'OPTIONS'])
def get_user_role():
    if request.method == 'OPTIONS':
        # Respond to preflight request
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Authorization, Content-Type')
        return response

    # Get the token from the Authorization header
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    token = token.split('Bearer ')[1]
    
    try:
        # Verify the token and get user data
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        
        # Get user's custom claims
        user = auth.get_user(uid)
        role = user.custom_claims.get('role') if user.custom_claims else 'student'
        
        return jsonify({'role': role})
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/api/user/role', methods=['POST', 'OPTIONS'])
def set_user_role():
    if request.method == 'OPTIONS':
        # Respond to preflight request
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Authorization, Content-Type')
        return response

    # This endpoint should be protected and only accessible by admins
    data = request.json
    uid = data.get('uid')
    role = data.get('role')
    
    if not uid or not role:
        return jsonify({'error': 'Missing uid or role'}), 400
        
    try:
        # Set custom claims
        auth.set_custom_user_claims(uid, {'role': role})
        return jsonify({'message': f'Role {role} set for user {uid}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/user/profile', methods=['GET', 'OPTIONS'])
def get_user_profile():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Authorization, Content-Type')
        return response

    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    token = token.split('Bearer ')[1]
    
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        
        # Get user profile from Firestore
        profile_ref = db.collection('user_profiles').document(uid)
        profile = profile_ref.get()
        
        if profile.exists:
            return jsonify(profile.to_dict())
        else:
            return jsonify({'error': 'Profile not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/api/user/profile', methods=['POST', 'OPTIONS'])
def create_user_profile():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Authorization, Content-Type')
        return response

    token = request.headers.get('Authorization')
    print("Received token:", token)  # Debug print
    
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    token = token.split('Bearer ')[1]
    print("Parsed token:", token)  # Debug print
    
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        print("Decoded UID:", uid)  # Debug print
        
        profile_data = request.json
        print("Profile data:", profile_data)  # Debug print
        
        profile_data['created_at'] = datetime.utcnow().isoformat()
        profile_data['updated_at'] = datetime.utcnow().isoformat()
        
        # Save profile to Firestore
        db.collection('user_profiles').document(uid).set(profile_data)
        
        return jsonify({'message': 'Profile created successfully'})
            
    except Exception as e:
        print("Error:", str(e))  # Debug print
        return jsonify({'error': str(e)}), 401

if __name__ == '__main__':
    app.run(port=5000, debug=True)
