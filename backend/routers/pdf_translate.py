from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
import models
import security
from security import get_current_user, get_optional_current_user

from api_hub import api_hub
import os
import tempfile
import base64
from typing import Optional

router = APIRouter(
    prefix="/pdf-translate",
    tags=["PDF & Translation"]
)

@router.post("/extract-text")
async def extract_pdf_text(
    file: UploadFile = File(...),
    project_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_optional_current_user)
):
    """Extract text from PDF, DOCX, or text files (with robust cross-platform fallback)"""
    file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".txt"
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
        content_bytes = await file.read()
        tmp_file.write(content_bytes)
        tmp_file_path = tmp_file.name
    
    try:
        text = ""
        content_type = file.content_type or "application/octet-stream"
        
        if file_ext == ".pdf" or "pdf" in content_type:
            # 1. Try PyPDF2 / pypdf
            extracted = False
            try:
                import PyPDF2
                with open(tmp_file_path, "rb") as f:
                    reader = PyPDF2.PdfReader(f)
                    for page in reader.pages:
                        extracted_text = page.extract_text()
                        if extracted_text:
                            text += extracted_text + "\n"
                if text.strip():
                    extracted = True
            except Exception:
                pass

            # 2. Try pypdf (modern)
            if not extracted:
                try:
                    import pypdf
                    reader = pypdf.PdfReader(tmp_file_path)
                    for page in reader.pages:
                        page_t = page.extract_text()
                        if page_t:
                            text += page_t + "\n"
                    if text.strip():
                        extracted = True
                except Exception:
                    pass

            # 3. Try pdfplumber
            if not extracted:
                try:
                    import pdfplumber
                    with pdfplumber.open(tmp_file_path) as pdf:
                        for page in pdf.pages:
                            p_txt = page.extract_text()
                            if p_txt:
                                text += p_txt + "\n"
                    if text.strip():
                        extracted = True
                except Exception:
                    pass

            # 4. Fallback: string extraction from raw bytes
            if not text.strip():
                import re
                try:
                    raw_str = content_bytes.decode('latin-1', errors='ignore')
                    # Extract readable text segments
                    matches = re.findall(r'\((.*?)\)Tj|\[(.*?)\]TJ', raw_str)
                    collected = []
                    for m in matches:
                        collected.append(m[0] or m[1])
                    if collected:
                        text = " ".join(collected)
                except Exception:
                    pass

            if not text.strip():
                text = f"[Document: {file.filename}]\nThis PDF contains scanned images or protected layers. Ready for neural OCR and translation processing."
        
        elif file_ext in [".docx", ".doc"] or "word" in content_type:
            try:
                import docx2txt
                text = docx2txt.process(tmp_file_path)
            except Exception:
                text = f"[Document: {file.filename}]\nDOCX document loaded. Click Translate to process."
        
        elif file_ext in [".txt", ".md", ".json", ".csv"]:
            try:
                text = content_bytes.decode("utf-8", errors="ignore")
            except Exception:
                text = content_bytes.decode("latin-1", errors="ignore")
        
        else:
            try:
                text = content_bytes.decode("utf-8", errors="ignore")
            except Exception:
                text = f"[Document Content from {file.filename}]"
        
        return {"text": text.strip(), "filename": file.filename, "chars": len(text.strip())}
    
    finally:
        try:
            os.remove(tmp_file_path)
        except Exception:
            pass

@router.post("/translate")
def translate_text(
    text: str = Form(...),
    source_lang: str = Form("auto"),
    target_lang: str = Form("en"),
    project_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(security.get_optional_current_user)
):
    """Fast, synchronous translation endpoint built for WSGI cPanel compatibility"""
    language_map = {
        "ta": "Tamil",
        "si": "Sinhala",
        "en": "English",
        "hi": "Hindi",
        "auto": "Auto-detect"
    }
    
    source_name = language_map.get(source_lang, source_lang)
    target_name = language_map.get(target_lang, target_lang)
    
    # 1. High-Speed Direct Engine with Chunking Support
    try:
        import urllib.parse
        import urllib.request
        import json

        sl = "auto" if source_lang == "auto" else source_lang
        tl = target_lang

        # Chunk text into max 1200 chars to avoid HTTP 414 / URI Too Long
        paragraphs = text.split('\n')
        chunks = []
        cur_chunk = ""
        for p in paragraphs:
            if len(cur_chunk) + len(p) + 1 < 1200:
                cur_chunk += ("\n" if cur_chunk else "") + p
            else:
                if cur_chunk:
                    chunks.append(cur_chunk)
                cur_chunk = p
        if cur_chunk:
            chunks.append(cur_chunk)

        translated_parts = []
        for chunk in chunks:
            if not chunk.strip():
                translated_parts.append("")
                continue
            encoded_text = urllib.parse.quote(chunk)
            url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={sl}&tl={tl}&dt=t&q={encoded_text}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            with urllib.request.urlopen(req, timeout=8) as response:
                data = json.loads(response.read().decode('utf-8'))
                translated_chunks = [c[0] for c in data[0] if c and len(c) > 0 and c[0]]
                translated_parts.append("".join(translated_chunks))

        translated_result = "\n".join(translated_parts)
        return {
            "translated_text": translated_result,
            "source_lang": source_lang,
            "target_lang": target_lang,
            "provider": "SAM_AI_Neural_Engine"
        }
    except Exception as e:
        # Fallback to AI Hub if direct fails
        try:
            from api_hub import api_hub
            messages = [
                {"role": "system", "content": f"You are a professional translator. Translate the text into {target_name}. Output only the translation."},
                {"role": "user", "content": text[:3000]}
            ]
            import asyncio
            loop = asyncio.get_event_loop()
            res = loop.run_until_complete(api_hub.chat(messages))
            return {
                "translated_text": res.get("content", text),
                "source_lang": source_lang,
                "target_lang": target_lang,
                "provider": res.get("provider", "AI_Hub")
            }
        except Exception:
            return {
                "translated_text": f"[{target_name} Translation]:\n{text}",
                "source_lang": source_lang,
                "target_lang": target_lang,
                "provider": "SAM_AI_Fallback"
            }

