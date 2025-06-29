
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

def check_table_data():
    """주요 테이블 데이터 확인"""
    conn = connect_to_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        print("=== ReadyBag 데이터베이스 현황 ===\n")
        
        # 1. 국가 데이터
        cursor.execute("SELECT COUNT(*) as count FROM countries")
        countries_count = cursor.fetchone()['count']
        print(f"🌍 국가 수: {countries_count}")
        
        cursor.execute("SELECT id, name FROM countries LIMIT 5")
        countries = cursor.fetchall()
        print("국가 목록 (처음 5개):")
        for country in countries:
            print(f"  - {country['id']}: {country['name']}")
        
        print()
        
        # 2. 상품 데이터
        cursor.execute("SELECT COUNT(*) as count FROM products")
        products_count = cursor.fetchone()['count']
        print(f"🛍️ 상품 수: {products_count}")
        
        cursor.execute("""
            SELECT name, price, store_type, purpose_category 
            FROM products 
            ORDER BY id 
            LIMIT 5
        """)
        products = cursor.fetchall()
        print("상품 목록 (처음 5개):")
        for product in products:
            print(f"  - {product['name']} ({product['price']}엔, {product['store_type']}, {product['purpose_category']})")
        
        print()
        
        # 3. 사용자 상품 데이터
        cursor.execute("SELECT COUNT(*) as count FROM user_products")
        user_products_count = cursor.fetchone()['count']
        print(f"👤 사용자 상품 수: {user_products_count}")
        
        if user_products_count > 0:
            cursor.execute("""
                SELECT up.status, COUNT(*) as count 
                FROM user_products up 
                GROUP BY up.status
            """)
            status_counts = cursor.fetchall()
            print("상태별 분포:")
            for status in status_counts:
                print(f"  - {status['status']}: {status['count']}개")
        
        print()
        
        # 4. 리뷰 데이터
        cursor.execute("SELECT COUNT(*) as count FROM product_reviews")
        reviews_count = cursor.fetchone()['count']
        print(f"⭐ 리뷰 수: {reviews_count}")
        
        # 5. 사용자 데이터
        cursor.execute("SELECT COUNT(*) as count FROM users")
        users_count = cursor.fetchone()['count']
        print(f"👥 사용자 수: {users_count}")
        
        print()
        
        # 6. 가격 범위 확인
        cursor.execute("""
            SELECT 
                MIN(price) as min_price, 
                MAX(price) as max_price, 
                AVG(price)::integer as avg_price
            FROM products
        """)
        price_stats = cursor.fetchone()
        print(f"💰 가격 통계:")
        print(f"  - 최저가: {price_stats['min_price']}엔")
        print(f"  - 최고가: {price_stats['max_price']}엔")
        print(f"  - 평균가: {price_stats['avg_price']}엔")
        
        print()
        
        # 7. 카테고리별 상품 수
        cursor.execute("""
            SELECT purpose_category, COUNT(*) as count 
            FROM products 
            GROUP BY purpose_category 
            ORDER BY count DESC
        """)
        categories = cursor.fetchall()
        print("카테고리별 상품 수:")
        for category in categories:
            print(f"  - {category['purpose_category']}: {category['count']}개")
        
    except Exception as e:
        print(f"데이터 조회 중 오류 발생: {e}")
    
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    check_table_data()
