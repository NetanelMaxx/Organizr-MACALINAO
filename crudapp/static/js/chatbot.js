let chatbotOpened = false;

// Toggle chatbot display and show welcome buttons
function toggleChatbot() {
    const chatbot = document.getElementById('chatbot-container');
    chatbot.classList.toggle('hidden');

    if (!chatbotOpened && !chatbot.classList.contains('hidden')) {
        chatbotOpened = true;

        const messagesContainer = document.getElementById('chatbot-messages');

        const welcomeMessage = document.createElement('div');
        welcomeMessage.classList.add('bot-message');
        welcomeMessage.textContent = "👋 Hi there! I'm Organizr AI. Ask me to add tasks, set reminders, or give you tips!";

        messagesContainer.appendChild(welcomeMessage);

        sendBotMessageWithButtons("What would you like to do?", [
            { label: "📋 View Tasks", url: "/tasks/", color: "primary" },
            { label: "✅ Create Task", url: "/tasks/create/", color: "success" },
        ]);

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Send user message to backend + local keyword checks
function sendMessage() {
    const inputField = document.getElementById('chatbot-input');
    const message = inputField.value.trim();
    if (!message) return;

    const messagesContainer = document.getElementById('chatbot-messages');

    // Show user message
    const userMessage = document.createElement('div');
    userMessage.classList.add('user-message');
    userMessage.textContent = 'You: ' + message;
    messagesContainer.appendChild(userMessage);

    inputField.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // 🔍 Run immediate local keyword responses (even before backend)
    processLocalKeywords(message);

    // 🌐 Send message to backend Django chatbot
    fetch('/chatbot/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ message: message })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            sendBotMessage(data.message);
        } else {
            console.warn('Backend fallback triggered:', data);
            processBotResponse(message); // Fallback AI
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        processBotResponse(message); // Fallback AI on error
    });
}

// 🟣 Local keyword triggers (instant help)
function processLocalKeywords(message) {
    const msg = message.toLowerCase();

    if (msg.includes('help')) {
        sendBotMessageWithButtons("Need help? Try one of these!", [
            { label: "✅ Create Task", url: "/create-task/", color: "success" },
            { label: "📋 View Tasks", url: "/task-list/", color: "primary" }
        ]);
    }

    if (msg.includes('add task') || msg.includes('create task')) {
        sendBotMessage("You can add a new task from the dashboard! Click below:");
        sendBotMessageWithButtons("", [
            { label: "✅ Create Task", url: "/create-task/", color: "success" }
        ]);
    }

    if (msg.includes('reminder') || msg.includes('deadline')) {
        sendBotMessage("You can set reminders by adding a due date to your tasks!");
    }

    if (msg.includes('tips') || msg.includes('productive')) {
        sendBotMessage("💡 Tip: Prioritize your most important tasks early in the day.");
    }
}

// 🔵 Local fallback if backend fails
function processBotResponse(message) {
    const msg = message.toLowerCase();

    if (msg.includes('hello') || msg.includes('hi')) {
        sendBotMessage("Hello there! 😊 Need help creating a task?");
    } else if (msg.includes('thanks') || msg.includes('thank you')) {
        sendBotMessage("You're welcome! Happy to help! 😊");
    } else {
        sendBotMessage("I'm here to help! Try asking me about adding a task or setting a reminder.");
    }
}

// Send text-only message from the bot
function sendBotMessage(text) {
    const messagesContainer = document.getElementById('chatbot-messages');

    const botMessage = document.createElement('div');
    botMessage.classList.add('bot-message');
    botMessage.textContent = 'Organizr AI: ' + text;

    messagesContainer.appendChild(botMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message with buttons (different colors)
function sendBotMessageWithButtons(text, buttons) {
    const messagesContainer = document.getElementById('chatbot-messages');

    const botMessage = document.createElement('div');
    botMessage.classList.add('bot-message');

    const buttonsHTML = buttons.map(btn => 
        `<button onclick="navigateTo('${btn.url}')" class="chatbot-button ${btn.color}">${btn.label}</button>`
    ).join('');

    botMessage.innerHTML = `
        Organizr AI: ${text}
        <div class="chatbot-buttons">
            ${buttonsHTML}
        </div>
    `;

    messagesContainer.appendChild(botMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Redirect on button click
function navigateTo(url) {
    window.location.href = url;
}

// Get CSRF token for Django
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Tip messages on form field focus
document.addEventListener('DOMContentLoaded', () => {
    const titleField = document.getElementById('id_title');
    const descriptionField = document.getElementById('id_description');
    const dueDateField = document.getElementById('id_due_date');

    if (titleField) {
        titleField.addEventListener('focus', () => {
            sendBotMessage("Tip: Give your task a clear and short title like 'Submit Report'.");
        });
    }

    if (descriptionField) {
        descriptionField.addEventListener('focus', () => {
            sendBotMessage("Tip: Include details or steps needed to complete this task.");
        });
    }

    if (dueDateField) {
        dueDateField.addEventListener('focus', () => {
            sendBotMessage("Tip: Choose a realistic due date to stay on track!");
        });
    }
});
