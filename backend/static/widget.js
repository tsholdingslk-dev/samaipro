// Centralized SAM AI Developer Chat Widget
document.addEventListener('DOMContentLoaded', () => {
    // Prevent multiple injections
    if(document.getElementById('sam-dev-widget')) return;

    // Detect Module Name & Path dynamically
    const currentUrl = window.location.pathname; // e.g., /samai/super_app_projects/sampro/dashboard.php or /tsvideo/dashboard.php
    const pathParts = currentUrl.split('/').filter(p => p.length > 0 && !p.includes('.php') && !p.includes('.html'));
    
    // We assume the last valid directory is the module name
    const moduleName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "unknown";
    
    // Construct local path based on XAMPP default
    // E.g. /samai/super_app_projects/sampro -> C:/Users/ASUS/Desktop/xampp/htdocs/samai/super_app_projects/sampro
    const modulePath = "C:/Users/ASUS/Desktop/xampp/htdocs/" + pathParts.join('/');

    const widgetHTML = `
    <div id="sam-dev-widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 999999; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <!-- Chat Box -->
        <div id="sam-dev-chatbox" style="display: none; width: 350px; height: 500px; background: #0f172a; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; flex-direction: column; overflow: hidden; margin-bottom: 15px;">
            <div style="background: #1e293b; padding: 15px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 10px; height: 10px; background: #10b981; border-radius: 50%; box-shadow: 0 0 5px #10b981;"></div>
                    <strong style="color: #f8fafc; font-size: 14px;">SAM AI - ${moduleName}</strong>
                </div>
                <button id="sam-dev-close" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 16px;">&times;</button>
            </div>
            
            <div id="sam-dev-messages" style="flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background: #0f172a;">
                <div style="background: #1e293b; color: #e2e8f0; padding: 10px 14px; border-radius: 12px; border-top-left-radius: 2px; font-size: 13px; max-width: 85%; align-self: flex-start; border: 1px solid #334155;">
                    Hi Admin! I'm your embedded SAM AI Developer for <b>${moduleName}</b>. What code changes do you need today? 🚀
                </div>
            </div>
            
            <div style="padding: 12px; background: #1e293b; border-top: 1px solid #334155; display: flex; gap: 8px;">
                <input type="text" id="sam-dev-input" placeholder="Type a command to edit code..." style="flex: 1; padding: 10px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: white; outline: none; font-size: 13px;">
                <button id="sam-dev-send" style="background: #3b82f6; color: white; border: none; border-radius: 6px; padding: 0 15px; cursor: pointer; font-weight: bold;">Send</button>
            </div>
        </div>
        
        <!-- Toggle Button -->
        <button id="sam-dev-toggle" style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border: none; color: white; font-size: 24px; cursor: pointer; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.5); display: flex; align-items: center; justify-content: center; float: right; transition: transform 0.2s;">
            👨‍💻
        </button>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    const toggleBtn = document.getElementById('sam-dev-toggle');
    const chatbox = document.getElementById('sam-dev-chatbox');
    const closeBtn = document.getElementById('sam-dev-close');
    const sendBtn = document.getElementById('sam-dev-send');
    const inputField = document.getElementById('sam-dev-input');
    const messages = document.getElementById('sam-dev-messages');

    function toggleChat() {
        if (chatbox.style.display === 'none') {
            chatbox.style.display = 'flex';
            toggleBtn.style.transform = 'scale(0)';
            setTimeout(() => toggleBtn.style.display = 'none', 200);
        } else {
            chatbox.style.display = 'none';
            toggleBtn.style.display = 'flex';
            setTimeout(() => toggleBtn.style.transform = 'scale(1)', 10);
        }
    }

    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    function addMessage(text, isUser = false) {
        const msgDiv = document.createElement('div');
        msgDiv.style.padding = '10px 14px';
        msgDiv.style.borderRadius = '12px';
        msgDiv.style.fontSize = '13px';
        msgDiv.style.maxWidth = '85%';
        msgDiv.style.lineHeight = '1.4';
        
        if (isUser) {
            msgDiv.style.background = '#3b82f6';
            msgDiv.style.color = 'white';
            msgDiv.style.alignSelf = 'flex-end';
            msgDiv.style.borderTopRightRadius = '2px';
        } else {
            msgDiv.style.background = '#1e293b';
            msgDiv.style.color = '#e2e8f0';
            msgDiv.style.alignSelf = 'flex-start';
            msgDiv.style.borderTopLeftRadius = '2px';
            msgDiv.style.border = '1px solid #334155';
        }
        
        msgDiv.innerHTML = text;
        messages.appendChild(msgDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    async function handleSend() {
        const text = inputField.value.trim();
        if (!text) return;

        addMessage(text, true);
        inputField.value = '';
        
        const typingId = 'typing-' + Date.now();
        const typingHTML = `<div id="${typingId}" style="color: #94a3b8; font-size: 12px; align-self: flex-start; padding: 0 10px;">SAM AI is editing your code... ⚙️</div>`;
        messages.insertAdjacentHTML('beforeend', typingHTML);
        messages.scrollTop = messages.scrollHeight;

        try {
            const formData = new FormData();
            formData.append('prompt', text);
            formData.append('module_path', modulePath);
            formData.append('module_name', moduleName);
            
            // Note: Since Railway deployment might run this remotely, we should use a relative URL or configured URL.
            // But since local testing is on localhost:8000, we hardcode for now.
            const apiUrl = 'http://localhost:8000/developer/edit_module';
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            document.getElementById(typingId).remove();
            
            if (data.status === 'success') {
                addMessage('✅ ' + data.message + '<br><br><small><i>Refresh the page to see changes!</i></small>');
            } else {
                addMessage('❌ Error: ' + data.message);
            }
        } catch (err) {
            document.getElementById(typingId).remove();
            addMessage('⚠️ Connection to SAM AI Backend failed. Make sure the backend is running on port 8000.');
        }
    }

    sendBtn.addEventListener('click', handleSend);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
});
