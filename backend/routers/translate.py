from fastapi import APIRouter, Depends, Request, HTTPException
from security import get_current_user
from api_hub import api_hub

router = APIRouter(
    prefix="/translate",
    tags=["Translation Module"]
)

@router.post("")
@router.post("/")
async def translate_text(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Translate text using AI. Supports JSON payload {"text": "...", "language": "..."}
    """
    try:
        body = await request.json()
        text = body.get("text")
        language = body.get("language")
        
        if not text or not language:
            raise HTTPException(status_code=400, detail="text and language fields are required")
            
        messages = [
            {"role": "system", "content": f"You are a professional translator. Translate the following text into {language}. Only output the translated text and nothing else."},
            {"role": "user", "content": text}
        ]
        
        result = await api_hub.chat(messages)
        
        return {
            "translated_text": result["content"],
            "status": "success",
            "provider": result.get("provider", "unknown")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
