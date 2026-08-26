from ai_engine import get_ai_response

def post_process_language(user_message: str, ai_response: str) -> str:
    """
    A post-processing layer that acts as a Naturalness & Grammar Checker.
    It takes the raw AI response and rewrites it to ensure it sounds like a native Sri Lankan speaker.
    """
    # If the response is very short, or contains a tool call, we might skip processing, but let's process all final text.
    if "[TOOL:" in ai_response:
        return ai_response

    system_prompt = """You are a strict Linguistic Post-Processor for a Sri Lankan AI Assistant.
Your ONLY job is to analyze the provided AI Response and fix its naturalness, grammar, and tone.

PIPELINE RULES:
1. Detect the language of the AI Response.
2. If it is in Sinhala:
   - Ensure it sounds like NATURAL MODERN SRI LANKAN SPOKEN SINHALA (Katha Karana Sinhala).
   - Completely remove any robotic, overly formal, or literal word-by-word translated phrasing.
3. If it is in Tamil:
   - Ensure it sounds like natural, friendly Tamil used in Sri Lanka.
4. If it is in English, Tanglish, or Singlish:
   - Ensure the grammar is correct and the tone is friendly.
5. If the AI Response is already perfect, output it exactly as is.
6. DO NOT add any extra conversational filler like "Here is the corrected text".
7. DO NOT answer the user's message yourself. Just rewrite the AI's response.

OUTPUT FORMAT:
Output ONLY the final corrected text. Do not include quotes or explanations."""

    prompt = f"[User's Original Message for Context]\n{user_message}\n\n[AI's Raw Response to be Corrected]\n{ai_response}"
    
    try:
        corrected_text = get_ai_response(user_message=prompt, system_prompt=system_prompt)
        if corrected_text and len(corrected_text.strip()) > 0:
            return corrected_text.strip()
    except Exception as e:
        print(f"Language Post-Processor Error: {e}")
        
    return ai_response
