import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import app

def handler(event, context):
    from werkzeug.wrappers import Request, Response
    
    # Simple WSGI adapter for Vercel
    environ = {
        'REQUEST_METHOD': event.get('httpMethod', 'GET'),
        'PATH_INFO': event.get('path', '/'),
        'QUERY_STRING': event.get('queryStringParameters', ''),
        'CONTENT_TYPE': event.get('headers', {}).get('content-type', ''),
        'CONTENT_LENGTH': event.get('headers', {}).get('content-length', '0'),
        'SERVER_NAME': 'vercel',
        'SERVER_PORT': '443',
        'wsgi.url_scheme': 'https',
    }
    
    response = Response.from_app(app, environ)
    return {
        'statusCode': response.status_code,
        'headers': dict(response.headers),
        'body': response.get_data(as_text=True)
    }
