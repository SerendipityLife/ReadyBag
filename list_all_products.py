
#!/usr/bin/env python3
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def connect_to_db():
    """데이터베이스 연결"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL 환경변수가 설정되지 않았습니다.")
    
    return psycopg2.connect(database_url)

def list_all_products():
    """모든 상품의 PID와 상품명 출력"""
    conn = connect_to_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        print("=== 전체 상품 목록 (PID + 상품명) ===\n")
        
        # 모든 상품 조회 (ID 순서대로 정렬)
        cursor.execute("""
            SELECT id, name 
            FROM products 
            ORDER BY id
        """)
        
        products = cursor.fetchall()
        
        print(f"총 {len(products)}개의 상품이 있습니다.\n")
        
        # PID와 상품명 출력
        for product in products:
            print(f"PID: {product['id']} | 상품명: {product['name']}")
        
        print(f"\n=== 출력 완료: 총 {len(products)}개 상품 ===")
        
    except Exception as e:
        print(f"데이터 조회 중 오류 발생: {e}")
    
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    list_all_products()
