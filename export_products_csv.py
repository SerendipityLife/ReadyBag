
#!/usr/bin/env python3
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import csv

def connect_to_db():
    """데이터베이스 연결"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL 환경변수가 설정되지 않았습니다.")
    
    return psycopg2.connect(database_url)

def export_products_to_csv():
    """모든 상품의 PID와 상품명을 CSV 형식으로 출력"""
    conn = connect_to_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # 모든 상품 조회 (ID 순서대로 정렬)
        cursor.execute("""
            SELECT id, name 
            FROM products 
            ORDER BY id
        """)
        
        products = cursor.fetchall()
        
        # CSV 헤더 출력
        print("pid,상품명")
        
        # 상품 데이터 출력
        for product in products:
            # CSV 형식에 맞게 쉼표가 포함된 상품명은 따옴표로 감싸기
            product_name = product['name'].replace('"', '""')  # 따옴표 이스케이프
            if ',' in product_name or '"' in product_name:
                product_name = f'"{product_name}"'
            
            print(f"{product['id']},{product_name}")
        
    except Exception as e:
        print(f"데이터 조회 중 오류 발생: {e}")
    
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    export_products_to_csv()
