from django.shortcuts import render, redirect, get_object_or_404
from .models import Task
from .forms import TaskForm 
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from decouple import config
import json
from groq import Groq
from crudapp.models import Task
from django.utils.dateparse import parse_datetime

GROQ_API_KEY = config('GROQ_API_KEY')
client = Groq(api_key=GROQ_API_KEY)

@csrf_exempt
def chatbot(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user_input = data.get('message')

        # Default fallback message
        fallback_message = "Sorry, I couldn't reach Organizr AI. Try again or ask me something simple!"

        try:
            # === GROQ API CALL ===
            response = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are Organizr AI, a helpful but concise productivity assistant. "
                            "Keep your answers short and to the point (1-3 sentences). "
                            "If the user wants to create a task, add a task, edit a task. Tell them to head to the dashboard"
                            "The details that the user can enter to create a task are the title, description, and due date"
                            "Do not be repetitive"
                        )
                    },
                    {"role": "user", "content": user_input}
                ]
            )

            # === GET AI REPLY ===
            ai_reply = response.choices[0].message.content
            print("AI Reply:", ai_reply)  # Optional for debugging

            try:
                # Try to parse the reply as JSON (handles single quotes too)
                ai_data = json.loads(ai_reply.replace("'", '"'))

                if ai_data.get('action') == 'create_task':
                    task_info = ai_data['task']
                    title = task_info.get('title')
                    deadline_str = task_info.get('deadline')

                    if not title or not deadline_str:
                        raise ValueError("Missing title or deadline in AI response.")

                    deadline = parse_datetime(deadline_str)

                    # 🔥 Assign task to user if authenticated
                    user = request.user if request.user.is_authenticated else None

                    Task.objects.create(
                        task=title,
                        deadline=deadline,
                        assigned_to=user  # ✅ Assign the user here!
                    )

                    print(f"Created task: {title}, deadline: {deadline}, assigned_to: {user}")

                    message = f"Task '{title}' created with deadline {deadline}!"
                else:
                    # Not an action - send plain AI reply
                    message = ai_reply

            except (json.JSONDecodeError, ValueError) as parse_err:
                print("JSON Parse Error:", parse_err)
                message = ai_reply  # Fallback to raw reply if JSON parsing fails

            # === SUCCESS RESPONSE ===
            return JsonResponse({
                'message': message,
                'status': 'success'
            })

        except Exception as e:
            print("Groq API Error:", e)

            return JsonResponse({
                'message': fallback_message,
                'status': 'fallback'
            })

    return JsonResponse({'message': 'Invalid request method.'}, status=405)

def home(request):
    return render(request, 'crudapp/home.html')

@login_required
def task_list(request):
    tasks = Task.objects.filter(assigned_to=request.user)
    return render(request, 'crudapp/task_list.html', {'tasks': tasks})

@login_required
def create_task(request):
    if request.method == 'POST':
        form = TaskForm(request.POST)
        if form.is_valid():
            print("FORM IS VALID!")
            task = form.save(commit=False)
            task.assigned_to = request.user  # should be assigned_to, not user
            task.save()
            return redirect('task_list')
        else:
            print("FORM ERRORS:", form.errors)
    else:
        form = TaskForm()
    return render(request, 'crudapp/task_form.html', {'form': form})


@login_required
def update_task(request, pk):
    task = get_object_or_404(Task, pk=pk, assigned_to=request.user)
    if request.method == 'POST':
        form = TaskForm(request.POST, instance=task)
        if form.is_valid():
            form.save()
            return redirect('task_list')
    else:
        form = TaskForm(instance=task)
    return render(request, 'crudapp/task_form.html', {'form': form})

@login_required
def delete_task(request, pk):
    task = get_object_or_404(Task, pk=pk, assigned_to=request.user)
    if request.method == 'POST':
        task.delete()
        return redirect('task_list')
    return render(request, 'crudapp/task_confirm_delete.html', {'task': task})
