from fastapi import APIRouter, Form
import os
import json
import re
from ai_engine import get_ai_response

router = APIRouter(
    prefix="/developer",
    tags=["In-App Developer"]
)

def get_module_files(module_path: str):
    valid_exts = ['.php', '.html', '.js', '.css']
    ignored_dirs = ['.git', 'node_modules', 'vendor', '__pycache__']
    file_map = {}
    
    for root, dirs, files in os.walk(module_path):
        dirs[:] = [d for d in dirs if d not in ignored_dirs]
        for f in files:
            if any(f.endswith(ext) for ext in valid_exts):
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, module_path)
                try:
                    with open(full_path, 'r', encoding='utf-8') as file:
                        file_map[rel_path] = file.read()
                except Exception:
                    pass
    return file_map

@router.post("/edit_module")
async def edit_module(
    prompt: str = Form(...),
    module_path: str = Form(...),
    module_name: str = Form(...)
):
    print(f"Received Edit Request for {module_name} at {module_path}: {prompt}")
    
    if not os.path.exists(module_path):
        return {"status": "error", "message": "Module path not found."}
        
    file_map = get_module_files(module_path)
    
    # We only send a summary of files to avoid huge token limits, or we send everything if it's small.
    # For TSVideo, it's small enough.
    code_context = ""
    for rel_path, content in file_map.items():
        # Truncate very large files if needed, but for now we send all
        code_context += f"\n--- FILE: {rel_path} ---\n{content}\n"
        
    system_prompt = """You are an expert AI Developer. The user wants to modify their codebase.
    Based on their prompt, identify which files need to change.
    Return ONLY a JSON array of objects with the following structure:
    [
      {
        "file": "path/to/file.ext",
        "search": "exact string to find and replace (must match perfectly, including spaces/newlines)",
        "replace": "new string to insert"
      }
    ]
    DO NOT output markdown block backticks around the JSON. Output raw JSON only."""
    
    user_message = f"User Request: {prompt}\n\nCodebase Context:\n{code_context}"
    
    try:
        ai_response = get_ai_response(user_message, [], system_prompt=system_prompt)
        
        # Clean markdown if AI accidentally included it
        ai_response = re.sub(r'^```[a-z]*\s*', '', ai_response.strip())
        ai_response = re.sub(r'\s*```$', '', ai_response.strip())
        
        try:
            print(f"--- AI RAW RESPONSE ---\n{ai_response}\n----------------------".encode('utf-8', 'replace').decode('utf-8'))
        except:
            pass
        
        edits = json.loads(ai_response)
        
        applied_edits = []
        for edit in edits:
            rel_path = edit.get('file')
            search_str = edit.get('search', '')
            replace_str = edit.get('replace', '')
            
            if rel_path in file_map and search_str:
                full_path = os.path.join(module_path, rel_path)
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if search_str in content:
                    content = content.replace(search_str, replace_str)
                    with open(full_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    applied_edits.append(rel_path)
                else:
                    print(f"Search string not found in {rel_path}")
        
        if applied_edits:
            unique_files = list(set(applied_edits))
            return {"status": "success", "message": f"Successfully edited {len(unique_files)} files: {', '.join(unique_files)}"}
        else:
            return {"status": "error", "message": "AI provided edits, but could not match the exact code lines."}
            
    except json.JSONDecodeError:
        return {"status": "error", "message": "Failed to parse AI response. It didn't return valid JSON."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
