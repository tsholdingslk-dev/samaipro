import os
import shutil
import tempfile
import subprocess
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
import zipfile

router = APIRouter(prefix="/flutter-build", tags=["flutter-build"])

@router.post("/")
async def build_flutter_apk(zip_file: UploadFile = File(...)):
    """
    Receives a zipped Flutter project, builds an APK using the local Flutter SDK,
    and returns the compiled APK.
    """
    try:
        # Create a temporary directory
        temp_dir = tempfile.mkdtemp(prefix="samai_flutter_build_")
        
        # Save the uploaded zip file
        zip_path = os.path.join(temp_dir, "project.zip")
        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(zip_file.file, buffer)
            
        # Extract the zip file
        extract_dir = os.path.join(temp_dir, "workspace")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
            
        # Find the actual project root (where pubspec.yaml is)
        project_root = None
        for root, dirs, files in os.walk(extract_dir):
            if "pubspec.yaml" in files:
                project_root = root
                break
                
        if not project_root:
            shutil.rmtree(temp_dir)
            raise HTTPException(status_code=400, detail="Not a valid Flutter project. Missing pubspec.yaml anywhere in the archive.")
            
        # Run flutter build apk
        # Use shell=True for Windows, and redirect stdout/stderr
        build_command = "flutter build apk --debug"
        process = subprocess.run(
            build_command,
            shell=True,
            cwd=project_root,
            capture_output=True,
            text=True
        )
        
        if process.returncode != 0:
            shutil.rmtree(temp_dir)
            print("Flutter Build Failed:", process.stderr)
            raise HTTPException(status_code=500, detail=f"Build failed:\n{process.stderr}\n{process.stdout}")
            
        # Find the generated APK
        apk_path = os.path.join(project_root, "build", "app", "outputs", "flutter-apk", "app-debug.apk")
        
        if not os.path.exists(apk_path):
            shutil.rmtree(temp_dir)
            raise HTTPException(status_code=500, detail="Build succeeded but APK file not found at expected path.")
            
        # We need to return the file and then clean up. 
        output_apk = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "temp_apk_output.apk")
        shutil.copy(apk_path, output_apk)
        
        # Clean up temp dir
        shutil.rmtree(temp_dir, ignore_errors=True)
        
        return FileResponse(
            path=output_apk, 
            filename="app-debug.apk", 
            media_type="application/vnd.android.package-archive"
        )
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
