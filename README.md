# TaskFlow – React + Django REST Framework + SQLite

## Run the backend (terminal 1)
    cd backend
    python -m venv .venv
    .venv\Scripts\activate          (Windows)   |   source .venv/bin/activate   (macOS/Linux)
    pip install -r requirements.txt
    python manage.py makemigrations tasks
    python manage.py migrate
    python manage.py runserver

## Run the frontend (terminal 2)
    cd frontend
    npm install
    npm run dev

Open http://localhost:5173
