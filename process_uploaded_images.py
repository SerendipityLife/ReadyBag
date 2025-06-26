
import os
import shutil
import re
from pathlib import Path

def process_uploaded_images():
    """업로드된 이미지들을 PID별로 처리하여 저장"""
    
    # 소스 디렉토리 (업로드된 이미지들이 있는 곳)
    source_dir = "attached_assets"
    
    # 대상 디렉토리 (웹앱에서 사용할 이미지 폴더)
    target_dir = "client/public/images"
    
    # 대상 디렉토리 생성
    Path(target_dir).mkdir(parents=True, exist_ok=True)
    
    processed_count = 0
    
    # attached_assets 폴더의 모든 파일 검사
    for filename in os.listdir(source_dir):
        file_path = os.path.join(source_dir, filename)
        
        # 파일인지 확인
        if not os.path.isfile(file_path):
            continue
            
        # 이미지 파일 확장자 확인
        if not filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
            continue
            
        # PID_제품명 패턴에서 PID 추출
        # 예: "10174_サントリー オールド_1750945584029.jpeg" -> "10174"
        pid_match = re.match(r'^(\d+)_', filename)
        
        if pid_match:
            pid = pid_match.group(1)
            
            # 원본 파일의 확장자 추출
            file_extension = os.path.splitext(filename)[1].lower()
            
            # 새 파일명: {PID}.{확장자}
            new_filename = f"{pid}{file_extension}"
            target_path = os.path.join(target_dir, new_filename)
            
            try:
                # 파일 복사
                shutil.copy2(file_path, target_path)
                print(f"✅ 복사 완료: {filename} -> {new_filename}")
                processed_count += 1
                
            except Exception as e:
                print(f"❌ 복사 실패: {filename} - {e}")
        else:
            print(f"⚠️  PID 추출 실패: {filename}")
    
    print(f"\n=== 처리 완료 ===")
    print(f"총 {processed_count}개 이미지 처리됨")
    
    return processed_count

if __name__ == "__main__":
    process_uploaded_images()
