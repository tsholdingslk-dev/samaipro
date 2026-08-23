import sys, os, glob
import asyncio

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from project_brain import get_project_brain

async def main():
    print("Starting Astrology Knowledge Ingestion...")
    project_id = "default"
    
    # Let's see if we can get the project ID dynamically or just use "main"
    project_id = "main" 
    brain = get_project_brain(project_id)
    
    # Base paths to search for txt files
    base_dirs = [
        r"../../astrology_data/base",
        r"../../astrology_data/jyothish",
        r"../../astrology_data/lagnaya/decompiled/assets"
    ]
    
    txt_files = []
    for bd in base_dirs:
        bd = os.path.join(os.path.dirname(__file__), bd)
        for root, dirs, files in os.walk(bd):
            for f in files:
                if f.endswith('.txt'):
                    txt_files.append(os.path.join(root, f))
    
    print(f"Found {len(txt_files)} text files to ingest.")
    if len(txt_files) > 1000:
        print("Limiting to 1000 files to save API quota...")
        txt_files = txt_files[:1000]
        
    count = 0
    for f in txt_files:
        try:
            with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
                content = fp.read().strip()
                if not content: continue
                # Basic chunking (if file is too large)
                chunks = [content[i:i+2000] for i in range(0, len(content), 2000)]
                for i, chunk in enumerate(chunks):
                    doc_id = f"{os.path.basename(f)}_{i}"
                    brain.add_document(chunk, {"source": f, "type": "astrology_rule"}, doc_id)
                    count += 1
        except Exception as e:
            print(f"Error reading {f}: {e}")
            
    print(f"Added {count} document chunks to database. Now generating embeddings...")
    await brain.index_documents()
    print("Ingestion complete!")

if __name__ == "__main__":
    asyncio.run(main())
