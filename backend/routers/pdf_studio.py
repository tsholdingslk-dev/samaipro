from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from typing import Optional
from database import get_db
import security
from ai_engine import get_ai_response
import tempfile
import os

router = APIRouter(
    prefix="/pdf-studio",
    tags=["PDFX Pro AI"]
)

def extract_pdf_text(file_bytes: bytes) -> str:
    text = ""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        tmp_file.write(file_bytes)
        tmp_file_path = tmp_file.name
    try:
        import PyPDF2
        with open(tmp_file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() or ""
        return text
    except Exception as e:
        print("PDF extract error:", e)
        return ""
    finally:
        os.remove(tmp_file_path)

@router.post("/chat")
async def pdf_chat(
    file: UploadFile = File(...),
    prompt: str = Form(...),
    db = Depends(get_db),
    current_user: dict = Depends(security.get_optional_current_user)
):
    """Answers a user's question based strictly on the provided PDF text."""
    file_bytes = await file.read()
    document_text = extract_pdf_text(file_bytes)
    
    system_prompt = (
        "You are an advanced AI Document Assistant for PDFX Pro AI. "
        "Your task is to analyze the following document text and answer the user's question accurately. "
        "Do not invent information. If the answer is not in the text, say you cannot find it.\n\n"
        f"--- DOCUMENT CONTENT ---\n{document_text[:30000]}\n--- END CONTENT ---"
    )
    
    try:
        response = get_ai_response(user_message=prompt, system_prompt=system_prompt)
        return {"status": "success", "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Chat failed: {str(e)}")

@router.post("/summary")
async def pdf_summary(
    file: UploadFile = File(...),
    db = Depends(get_db),
    current_user: dict = Depends(security.get_optional_current_user)
):
    """Generates an executive summary of the document."""
    file_bytes = await file.read()
    document_text = extract_pdf_text(file_bytes)

    system_prompt = (
        "You are an advanced AI Document Analyst for PDFX Pro AI. "
        "Please generate a comprehensive Executive Summary of the following document. "
        "Include 3-5 Key Points, Important Entities (Dates/Names/Amounts), and Action Items if applicable. "
        "Format cleanly with markdown."
    )
    
    user_prompt = f"Please summarize this document:\n\n{document_text[:30000]}"
    
    try:
        response = get_ai_response(user_message=user_prompt, system_prompt=system_prompt)
        return {"status": "success", "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Summary failed: {str(e)}")

@router.post("/rewrite")
def pdf_rewrite(
    selected_text: str = Form(...),
    style: str = Form("Professional"),
    db = Depends(get_db),
    current_user: dict = Depends(security.get_optional_current_user)
):
    """Rewrites a specific block of text based on the desired style."""
    system_prompt = (
        f"You are an expert AI copywriter for PDFX Pro AI. "
        f"Your task is to rewrite the user's text to make it {style}. "
        f"Provide only the rewritten text in your response, with no conversational filler."
    )
    
    try:
        response = get_ai_response(user_message=selected_text, system_prompt=system_prompt)
        return {"status": "success", "response": response.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Rewrite failed: {str(e)}")
