
import os
import requests
import psycopg2
from datetime import datetime
import time
import json
from urllib.parse import urlparse
import shutil

# Google Search API 설정
GOOGLE_SEARCH_API_KEY = "AIzaSyBsGXF_aVsEiBNg52V_3yQVjjb0EvIcfFU"
GOOGLE_SEARCH_ENGINE_ID = "867d8d16349a9483e"

# 하루 최대 검색 한도
DAILY_SEARCH_LIMIT = 100
USAGE_FILE = "search_usage.json"

class ImageSearcher:
    def __init__(self):
        self.today = datetime.now().strftime("%Y-%m-%d")
        self.usage_count = self.load_usage_count()
        
    def load_usage_count(self):
        """오늘의 검색 사용량 로드"""
        if os.path.exists(USAGE_FILE):
            try:
                with open(USAGE_FILE, 'r') as f:
                    data = json.load(f)
                    if data.get('date') == self.today:
                        return data.get('count', 0)
            except:
                pass
        return 0
    
    def save_usage_count(self):
        """검색 사용량 저장"""
        data = {
            'date': self.today,
            'count': self.usage_count
        }
        with open(USAGE_FILE, 'w') as f:
            json.dump(data, f)
    
    def can_search(self):
        """검색 가능 여부 확인"""
        return self.usage_count < DAILY_SEARCH_LIMIT
    
    def search_image(self, query):
        """구글 이미지 검색"""
        if not self.can_search():
            print(f"일일 검색 한도 {DAILY_SEARCH_LIMIT}건 초과. 검색 중단.")
            return None
            
        try:
            url = "https://www.googleapis.com/customsearch/v1"
            params = {
                'key': GOOGLE_SEARCH_API_KEY,
                'cx': GOOGLE_SEARCH_ENGINE_ID,
                'q': query,
                'searchType': 'image',
                'num': 1,
                'imgSize': 'medium',
                'safe': 'active'
            }
            
            response = requests.get(url, params=params, timeout=10)
            self.usage_count += 1
            self.save_usage_count()
            
            print(f"검색 쿼리: '{query}' (사용량: {self.usage_count}/{DAILY_SEARCH_LIMIT})")
            
            if response.status_code == 200:
                data = response.json()
                if 'items' in data and len(data['items']) > 0:
                    return data['items'][0]['link']
            
        except Exception as e:
            print(f"검색 오류: {e}")
        
        return None
    
    def download_image(self, image_url, save_path):
        """이미지 다운로드"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(image_url, headers=headers, timeout=15, stream=True)
            
            if response.status_code == 200:
                with open(save_path, 'wb') as f:
                    shutil.copyfileobj(response.raw, f)
                return True
                
        except Exception as e:
            print(f"이미지 다운로드 실패: {e}")
        
        return False

def get_db_connection():
    """데이터베이스 연결"""
    import os
    # 환경변수에서 데이터베이스 URL 가져오기
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        return psycopg2.connect(database_url)
    else:
        # 기본 설정 (로컬 개발 환경)
        return psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'replit'),
            user=os.getenv('DB_USER', 'replit'),
            password=os.getenv('DB_PASSWORD', ''),
            port=os.getenv('DB_PORT', '5432')
        )

def get_products_without_images():
    """이미지가 없는 상품들 조회"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 모든 상품 조회
        cursor.execute("""
            SELECT id, name, name_japanese, name_english, image_url
            FROM products 
            ORDER BY id
        """)
        
        products = cursor.fetchall()
        products_without_images = []
        
        for product in products:
            product_id, name, name_japanese, name_english, image_url = product
            
            # 다양한 확장자로 이미지 파일 존재 여부 확인
            image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
            image_exists = False
            
            for ext in image_extensions:
                image_filename = f"{product_id}{ext}"
                local_image_path = f"client/public/images/{image_filename}"
                if os.path.exists(local_image_path):
                    image_exists = True
                    break
            
            if not image_exists:
                products_without_images.append({
                    'id': product_id,
                    'name': name,
                    'name_japanese': name_japanese,
                    'name_english': name_english,
                    'image_url': image_url
                })
        
        return products_without_images
        
    finally:
        cursor.close()
        conn.close()

def update_product_image_url(product_id, new_image_url):
    """상품의 이미지 URL 업데이트"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE products 
            SET image_url = %s, updated_at = NOW()
            WHERE id = %s
        """, (new_image_url, product_id))
        
        conn.commit()
        print(f"상품 ID {product_id} 이미지 URL 업데이트 완료")
        
    except Exception as e:
        print(f"DB 업데이트 실패: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

def log_result(result_type, product_id, product_name, query, success, message, log_dir):
    """결과를 텍스트 파일에 로깅"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_filename = f"{result_type}_log.txt"
    log_path = os.path.join(log_dir, log_filename)
    
    with open(log_path, 'a', encoding='utf-8') as f:
        status = "성공" if success else "실패"
        f.write(f"[{timestamp}] 상품ID: {product_id}, 상품명: {product_name}\n")
        f.write(f"검색어: {query}, 상태: {status}, 메시지: {message}\n\n")

def main():
    print("=== 상품 이미지 자동 검색 및 다운로드 시작 ===")
    
    # 이미지 저장 디렉토리 생성
    image_dir = "client/public/images"
    os.makedirs(image_dir, exist_ok=True)
    
    # 로그 파일 초기화
    log_files = ['success_log.txt', 'failed_log.txt', 'summary_log.txt']
    for log_file in log_files:
        log_path = os.path.join(image_dir, log_file)
        with open(log_path, 'w', encoding='utf-8') as f:
            f.write(f"=== 이미지 검색 로그 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===\n\n")
    
    # 이미지 검색기 초기화
    searcher = ImageSearcher()
    print(f"오늘 검색 사용량: {searcher.usage_count}/{DAILY_SEARCH_LIMIT}")
    
    try:
        # 이미지가 없는 상품들 조회
        products = get_products_without_images()
        print(f"이미지가 필요한 상품 수: {len(products)}개")
        
        if not products:
            print("모든 상품에 이미지가 있습니다.")
            return
        
        processed_count = 0
        success_count = 0
        failed_count = 0
        
        for product in products:
            if not searcher.can_search():
                print(f"일일 검색 한도 초과. {processed_count}개 처리 후 중단.")
                break
                
            product_id = product['id']
            name = product['name']
            name_japanese = product['name_japanese']
            name_english = product['name_english']
            
            print(f"\n[{processed_count + 1}/{len(products)}] 상품 ID: {product_id}")
            print(f"한국어명: {name}")
            print(f"일본어명: {name_japanese}")
            print(f"영어명: {name_english}")
            
            # 검색 순서: 일본어 → 영어 → 한국어
            search_queries = []
            if name_japanese and name_japanese.strip():
                search_queries.append(("일본어", name_japanese.strip()))
            if name_english and name_english.strip():
                search_queries.append(("영어", name_english.strip()))
            if name and name.strip():
                search_queries.append(("한국어", name.strip()))
            
            image_url = None
            used_query = None
            used_language = None
            
            # 우선순위에 따라 검색
            for language, query in search_queries:
                if not searcher.can_search():
                    break
                    
                image_url = searcher.search_image(query)
                if image_url:
                    used_query = query
                    used_language = language
                    print(f"이미지 발견: {query} ({language})")
                    break
                else:
                    print(f"이미지 없음: {query} ({language})")
                
                time.sleep(1)  # API 호출 간격
            
            if image_url:
                # 이미지 다운로드
                image_filename = f"{product_id}.jpg"
                local_image_path = os.path.join(image_dir, image_filename)
                
                if searcher.download_image(image_url, local_image_path):
                    # DB에서 이미지 URL 업데이트
                    new_image_url = f"/images/{image_filename}"
                    update_product_image_url(product_id, new_image_url)
                    success_count += 1
                    print(f"✅ 이미지 저장 완료: {local_image_path}")
                    
                    # 성공 로그 기록
                    log_result("success", product_id, name, f"{used_query} ({used_language})", 
                             True, f"이미지 다운로드 및 저장 완료: {image_filename}", image_dir)
                else:
                    failed_count += 1
                    print(f"❌ 이미지 다운로드 실패")
                    
                    # 실패 로그 기록
                    log_result("failed", product_id, name, f"{used_query} ({used_language})", 
                             False, "이미지 URL은 찾았으나 다운로드 실패", image_dir)
            else:
                failed_count += 1
                print(f"❌ 이미지를 찾을 수 없음")
                
                # 실패 로그 기록
                tried_queries = ", ".join([f"{q} ({l})" for l, q in search_queries])
                log_result("failed", product_id, name, tried_queries, 
                         False, "모든 검색어로 이미지를 찾을 수 없음", image_dir)
            
            processed_count += 1
            
            # 요청 간격 (API 한도 보호)
            time.sleep(2)
        
        # 최종 요약 로그 작성
        summary_log_path = os.path.join(image_dir, "summary_log.txt")
        with open(summary_log_path, 'a', encoding='utf-8') as f:
            f.write(f"=== 처리 완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===\n")
            f.write(f"처리된 상품: {processed_count}개\n")
            f.write(f"성공한 이미지: {success_count}개\n")
            f.write(f"실패한 이미지: {failed_count}개\n")
            f.write(f"오늘 총 검색 사용량: {searcher.usage_count}/{DAILY_SEARCH_LIMIT}\n\n")
        
        print(f"\n=== 처리 완료 ===")
        print(f"처리된 상품: {processed_count}개")
        print(f"성공한 이미지: {success_count}개")
        print(f"실패한 이미지: {failed_count}개")
        print(f"오늘 총 검색 사용량: {searcher.usage_count}/{DAILY_SEARCH_LIMIT}")
        print(f"로그 파일이 {image_dir} 폴더에 저장되었습니다.")
        
    except Exception as e:
        print(f"데이터베이스 연결 오류: {e}")
        print("데이터베이스 서버가 실행 중인지 확인해주세요.")
        
        # 오류 로그 기록
        error_log_path = os.path.join(image_dir, "error_log.txt")
        with open(error_log_path, 'a', encoding='utf-8') as f:
            f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 데이터베이스 연결 오류: {e}\n")

if __name__ == "__main__":
    main()
