#!/usr/bin/env python3
"""
Excel 파일에서 상품 데이터를 읽어와 데이터베이스를 업데이트하는 스크립트
"""

import pandas as pd
import psycopg2
import os
from datetime import datetime
import sys

def connect_to_db():
    """데이터베이스 연결"""
    try:
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL 환경변수가 설정되지 않았습니다.")
        
        conn = psycopg2.connect(database_url)
        return conn
    except Exception as e:
        print(f"데이터베이스 연결 오류: {e}")
        sys.exit(1)

def read_excel_file(file_path):
    """Excel 파일 읽기"""
    try:
        # Excel 파일 읽기 (첫 번째 시트)
        df = pd.read_excel(file_path)
        print(f"Excel 파일에서 {len(df)} 행을 읽었습니다.")
        print("컬럼:", df.columns.tolist())
        return df
    except Exception as e:
        print(f"Excel 파일 읽기 오류: {e}")
        sys.exit(1)

def clear_existing_products(conn):
    """기존 상품 데이터 삭제 (외래키 제약 조건 고려)"""
    try:
        cursor = conn.cursor()
        
        # 먼저 user_products 테이블의 데이터 삭제
        cursor.execute("DELETE FROM user_products")
        user_products_count = cursor.rowcount
        print(f"기존 사용자 상품 {user_products_count}개를 삭제했습니다.")
        
        # 그 다음 products 테이블의 데이터 삭제
        cursor.execute("DELETE FROM products")
        products_count = cursor.rowcount
        print(f"기존 상품 {products_count}개를 삭제했습니다.")
        
        conn.commit()
        cursor.close()
        
    except Exception as e:
        print(f"기존 데이터 삭제 오류: {e}")
        conn.rollback()
        sys.exit(1)

def insert_products(conn, df):
    """새 상품 데이터 삽입"""
    try:
        cursor = conn.cursor()
        
        # 컬럼 매핑 (Excel 컬럼명을 DB 컬럼명으로 매핑)
        column_mapping = {
            '제품명': 'name',
            '제품명_일본어': 'nameJapanese',
            '설명': 'description'
        }
        
        # 매핑된 컬럼 찾기
        mapped_columns = {}
        for excel_col in df.columns:
            if excel_col in column_mapping:
                mapped_columns[column_mapping[excel_col]] = excel_col
        
        print("매핑된 컬럼:", mapped_columns)
        
        # 필수 컬럼 확인 (name과 description만 필수)
        required_columns = ['name', 'description']
        missing_columns = [col for col in required_columns if col not in mapped_columns]
        
        if missing_columns:
            print(f"필수 컬럼이 누락되었습니다: {missing_columns}")
            print("사용 가능한 컬럼:", df.columns.tolist())
            sys.exit(1)
        
        # 카테고리별 가격 범위 설정
        category_prices = {
            'BEAUTY': (2000, 15000),
            'FOOD': (300, 3000),
            'IT': (5000, 50000),
            'FASHION': (1000, 8000),
            'HEALTH': (800, 5000),
            'LIFESTYLE': (500, 4000)
        }
        
        # 카테고리 키워드 매핑
        category_keywords = {
            'BEAUTY': ['화장품', '스킨케어', '메이크업', '뷰티', '크림', '에센스', '마스크', '립', '아이', '선크림'],
            'FOOD': ['과자', '음식', '간식', '음료', '차', '초콜릿', '사탕', '라면', '쿠키', '케이크'],
            'IT': ['전자기기', '게임', '컴퓨터', '스마트폰', '이어폰', '충전기', '케이블', '액세서리'],
            'FASHION': ['의류', '신발', '가방', '액세서리', '모자', '선글라스', '시계', '쥬얼리'],
            'HEALTH': ['건강', '의료', '약품', '비타민', '영양제', '마사지', '헬스케어'],
            'LIFESTYLE': ['생활용품', '문구', '인테리어', '주방', '욕실', '청소', '수납', '장난감']
        }
        
        # 상품 데이터 삽입
        inserted_count = 0
        for index, row in df.iterrows():
            try:
                # 기본값 설정
                name = str(row[mapped_columns['name']]).strip() if pd.notna(row[mapped_columns['name']]) else f"상품 {index + 1}"
                description = str(row[mapped_columns['description']]).strip() if pd.notna(row[mapped_columns['description']]) else "상품 설명"
                
                # 카테고리 결정 (상품명과 설명을 기반으로)
                category = "LIFESTYLE"  # 기본값
                text_to_check = (name + " " + description).lower()
                
                for cat, keywords in category_keywords.items():
                    if any(keyword in text_to_check for keyword in keywords):
                        category = cat
                        break
                
                # 카테고리별 가격 설정
                price_range = category_prices.get(category, (500, 3000))
                import random
                price = random.randint(price_range[0], price_range[1])
                
                # 선택적 컬럼 처리
                name_japanese = str(row[mapped_columns['nameJapanese']]).strip() if 'nameJapanese' in mapped_columns and pd.notna(row[mapped_columns['nameJapanese']]) else None
                
                # 이미지 URL 생성 (카테고리별)
                image_urls = {
                    'BEAUTY': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop',
                    'FOOD': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=300&fit=crop',
                    'IT': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=300&fit=crop',
                    'FASHION': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop',
                    'HEALTH': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=300&fit=crop',
                    'LIFESTYLE': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop'
                }
                image_url = image_urls.get(category, image_urls['LIFESTYLE'])
                
                # 해시태그 생성
                hashtags = [f"#{category.lower()}", "#일본쇼핑", "#여행필수템"]
                
                # 빈 이름이나 설명 스킵
                if not name or name.lower() in ['nan', 'null', '']:
                    continue
                
                # SQL 삽입
                insert_sql = """
                INSERT INTO products (
                    name, "nameJapanese", description, price, "imageUrl", 
                    "countryId", category, hashtags, location, featured,
                    "createdAt", "updatedAt"
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                values = (
                    name,
                    name_japanese,
                    description,
                    price,
                    image_url,
                    'japan',  # countryId
                    category,
                    hashtags,
                    None,  # location (removed as requested)
                    False,  # featured
                    datetime.now(),  # createdAt
                    datetime.now()   # updatedAt
                )
                
                cursor.execute(insert_sql, values)
                inserted_count += 1
                
            except Exception as e:
                print(f"행 {index + 1} 처리 중 오류: {e}")
                continue
        
        conn.commit()
        cursor.close()
        print(f"새 상품 {inserted_count}개를 성공적으로 삽입했습니다.")
        
    except Exception as e:
        print(f"상품 삽입 오류: {e}")
        conn.rollback()
        sys.exit(1)

def main():
    """메인 함수"""
    excel_file_path = "attached_assets/japanese_products_donki.xlsx"
    
    if not os.path.exists(excel_file_path):
        print(f"Excel 파일을 찾을 수 없습니다: {excel_file_path}")
        sys.exit(1)
    
    print("Excel 파일에서 상품 데이터를 읽어오는 중...")
    df = read_excel_file(excel_file_path)
    
    print("데이터베이스에 연결하는 중...")
    conn = connect_to_db()
    
    print("기존 상품 데이터를 삭제하는 중...")
    clear_existing_products(conn)
    
    print("새 상품 데이터를 삽입하는 중...")
    insert_products(conn, df)
    
    conn.close()
    print("상품 데이터 업데이트가 완료되었습니다!")

if __name__ == "__main__":
    main()