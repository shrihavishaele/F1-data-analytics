from vercel_wsgi import serverless_wsgi
from app import app

def handler(event, context):
	# Delegate to WSGI adapter
	return serverless_wsgi.handle_request(app, event, context)
