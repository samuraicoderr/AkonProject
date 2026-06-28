install:
	pip install -r requirements.txt


runserver:
	python manage.py runserver


# comes with auto-reload for development
dev:
	uvicorn src.akonproject_backend.asgi:app --reload --host 0.0.0.0 --port 8000


prod:
	uvicorn src.akonproject_backend.asgi:app --host 0.0.0.0 --port 8000 --workers 4

render:
	uvicorn src.akonproject_backend.asgi:app --host 0.0.0.0 --port $PORT
