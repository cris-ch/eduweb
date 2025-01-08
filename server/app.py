from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, auth
import os

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

if __name__ == '__main__':
    app.run(port=5000, debug=True)
