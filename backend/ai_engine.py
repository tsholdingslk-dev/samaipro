import os
from dotenv import load_dotenv

load_dotenv()

def get_ai_response(user_message: str, chat_history: list = None, system_prompt: str = None) -> str:
    """
    Send a message to SAM AI and get an ultra-fast response.
    """
    default_prompt = "You are SAM AI, a helpful, intelligent, and friendly assistant. You help students, creators, and developers with their tasks."
    messages = [
        {"role": "system", "content": system_prompt if system_prompt else default_prompt}
    ]
    
    if chat_history:
        for chat in chat_history:
            messages.append({"role": chat.role, "content": chat.content})
            
    messages.append({"role": "user", "content": user_message})
    
    try:
        from api_hub import api_hub
        import concurrent.futures

        def _call_hub():
            import asyncio
            return asyncio.run(api_hub.chat(messages))

        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(_call_hub)
            result = future.result(timeout=30.0)
            return result["content"]
    except Exception as e:
        print(f"API Hub Notice/Fallback: {e}")
        user_lower = user_message.lower().strip()
        if any(w in user_lower for w in ["hi", "hello", "vanakkam", "hey", "ayubowan"]):
            return "Hello! 👋 I am SAM AI. How can I assist you today?"
        elif any(w in user_lower for w in ["who are you", "name", "your name"]):
            return "I am SAM AI, your personal intelligent assistant powered by Google Gemini and multi-model AI engines."
        elif any(w in user_lower for w in ["help", "what can you do"]):
            return "I can help you with text translations, code generation, voice synthesis, image analysis, and smart learning!"
        else:
            return f"SAM AI Engine Response: I have received your message: '{user_message}'. I am ready to help you with coding, translation, and learning tasks!"
