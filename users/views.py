from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib import messages
from .forms import UserRegisterForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User

#Signup formm
def signup(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        password1 = request.POST["password1"]
        password2 = request.POST["password2"]

        # Check if passwords match
        if password1 != password2:
            messages.error(request, "Passwords do not match!")
            return redirect("signup")

        # Check if username already exists
        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already taken!")
            return redirect("signup")

        # Create the user
        user = User.objects.create_user(username=username, email=email, password=password1)
        login(request, user)  # ✅ Log in the user immediately after signup
        return redirect("dashboard")  # ✅ Redirect to the dashboard

    return render(request, "users/signup.html")

#Login
from django.contrib.auth.forms import AuthenticationForm

def user_login(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect("dashboard")  # Redirect to the dashboard after login
        else:
            messages.error(request, "Invalid username or password")

    return render(request, "users/login.html")

@login_required
def dashboard(request):
    return render(request, "users/dashboard.html")

#Logout
def user_logout(request):
    logout(request)
    return redirect('home')

