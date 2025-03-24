# MACALINAO - ORGANIZR
Nathaniel B. Macalinao / 22011497410

- The system I developed is made to deploy on a web service. It's a task manager app to provide better productivity for users by allowing them to organize their tasks.

To run the project on the webservice:
- https://organizr-2zt0.onrender.com

To run the project locally:
1. Create a Virtual Environment
2. Install dependencies / requirements.txt
3. For this project I used PostgreSQL 16 for the DB so that it may run on the webervice.

But, to run locally: (With XAMPP)
Edit DB in Settings.py 

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'your_database_name',   # XAMPP DB name
        'USER': 'root',                 # XAMPP default user
        'PASSWORD': '',                 # Usually blank unless you set one in phpMyAdmin
        'HOST': '127.0.0.1',
        'PORT': '3306',

Then:
1. Start Apache (Port 80, 443)
2. Start MySQL (Port: 3306)
3. Apply Migrations
4. Runserver
