#!/usr/bin/env python3
"""
돈키호테 상품 데이터 처리 스크립트
- Excel 파일에서 412개 상품 데이터 읽기
- 중복 상품 감지 및 보고
- 일본어 제품명 생성
- 돈키호테 판매 장소 구분 추가
"""

import pandas as pd
import psycopg2
import os
import sys
from datetime import datetime
import json
import re
from collections import defaultdict

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
        df = pd.read_excel(file_path)
        print(f"Excel 파일에서 {len(df)} 행을 읽었습니다.")
        print("컬럼:", df.columns.tolist())
        return df
    except Exception as e:
        print(f"Excel 파일 읽기 오류: {e}")
        sys.exit(1)

def detect_duplicates(df):
    """중복 상품 감지"""
    duplicates = []
    seen_products = defaultdict(list)
    
    for index, row in df.iterrows():
        name = str(row['제품명']).strip().lower() if pd.notna(row['제품명']) else ""
        description = str(row['설명']).strip().lower() if pd.notna(row['설명']) else ""
        
        # 제품명 기준으로 중복 감지
        if name and name not in ['nan', 'null', '']:
            seen_products[name].append({
                '행번호': index + 2,  # Excel 행 번호 (헤더 포함)
                '제품명': str(row['제품명']).strip() if pd.notna(row['제품명']) else "",
                '일본어명': str(row['제품명_일본어']).strip() if pd.notna(row['제품명_일본어']) else "",
                '설명': str(row['설명']).strip() if pd.notna(row['설명']) else ""
            })
    
    # 중복된 항목만 추출
    for name, items in seen_products.items():
        if len(items) > 1:
            duplicates.extend(items)
    
    return duplicates

def generate_japanese_name(korean_name, description):
    """한국어 제품명을 기반으로 일본어 제품명 생성"""
    # 간단한 매핑 테이블 (실제로는 더 정교한 번역이 필요)
    translation_map = {
        # 뷰티 관련
        '화장품': 'コスメ',
        '스킨케어': 'スキンケア', 
        '에센스': 'エッセンス',
        '크림': 'クリーム',
        '로션': 'ローション',
        '마스크': 'マスク',
        '선크림': '日焼け止め',
        '립크림': 'リップクリーム',
        '아이섀도우': 'アイシャドウ',
        
        # 음식 관련
        '과자': 'お菓子',
        '초콜릿': 'チョコレート',
        '사탕': 'キャンディー',
        '쿠키': 'クッキー',
        '케이크': 'ケーキ',
        '음료': '飲み物',
        '차': 'お茶',
        '라면': 'ラーメン',
        
        # IT 관련
        '게임': 'ゲーム',
        '이어폰': 'イヤホン',
        '충전기': '充電器',
        '케이블': 'ケーブル',
        '액세서리': 'アクセサリー',
        
        # 패션 관련
        '의류': '衣類',
        '신발': '靴',
        '가방': 'バッグ',
        '모자': '帽子',
        '시계': '時計',
        
        # 건강 관련
        '비타민': 'ビタミン',
        '영양제': 'サプリメント',
        '마사지': 'マッサージ',
        '안약': '目薬',
        
        # 생활용품
        '문구': '文房具',
        '수건': 'タオル',
        '도시락': '弁当',
        '주방용품': 'キッチン用品'
    }
    
    japanese_name = korean_name
    for korean, japanese in translation_map.items():
        japanese_name = japanese_name.replace(korean, japanese)
    
    return japanese_name

def categorize_product(name, description):
    """상품명과 설명을 기반으로 카테고리 결정"""
    text = (name + " " + description).lower()
    
    category_keywords = {
        'BEAUTY': ['화장품', '스킨케어', '메이크업', '뷰티', '크림', '에센스', '마스크', '립', '아이', '선크림', '로션'],
        'FOOD': ['과자', '음식', '간식', '음료', '차', '초콜릿', '사탕', '라면', '쿠키', '케이크', '빵', '우유'],
        'IT': ['전자기기', '게임', '컴퓨터', '스마트폰', '이어폰', '충전기', '케이블', '액세서리', '카메라'],
        'FASHION': ['의류', '신발', '가방', '액세서리', '모자', '선글라스', '시계', '쥬얼리', '옷'],
        'HEALTH': ['건강', '의료', '약품', '비타민', '영양제', '마사지', '헬스케어', '안약', '파스'],
        'LIFESTYLE': ['생활용품', '문구', '인테리어', '주방', '욕실', '청소', '수납', '장난감', '도구']
    }
    
    for category, keywords in category_keywords.items():
        if any(keyword in text for keyword in keywords):
            return category
    
    return 'LIFESTYLE'

def get_category_price_range(category):
    """카테고리별 가격 범위"""
    price_ranges = {
        'BEAUTY': (1000, 15000),
        'FOOD': (200, 3000),
        'IT': (3000, 50000),
        'FASHION': (800, 12000),
        'HEALTH': (500, 8000),
        'LIFESTYLE': (300, 5000)
    }
    return price_ranges.get(category, (500, 3000))

def get_category_image(category):
    """카테고리별 이미지 URL"""
    image_urls = {
        'BEAUTY': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop',
        'FOOD': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=300&fit=crop',
        'IT': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=300&fit=crop',
        'FASHION': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop',
        'HEALTH': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=300&fit=crop',
        'LIFESTYLE': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop'
    }
    return image_urls.get(category, image_urls['LIFESTYLE'])

def clear_existing_data(conn):
    """기존 데이터 삭제"""
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM user_products")
        user_products_count = cursor.rowcount
        cursor.execute("DELETE FROM products")
        products_count = cursor.rowcount
        conn.commit()
        cursor.close()
        print(f"기존 사용자 상품 {user_products_count}개, 상품 {products_count}개를 삭제했습니다.")
    except Exception as e:
        print(f"기존 데이터 삭제 오류: {e}")
        conn.rollback()
        sys.exit(1)

def insert_products(conn, products_data):
    """상품 데이터 삽입"""
    try:
        cursor = conn.cursor()
        
        insert_sql = """
        INSERT INTO products (
            name, name_japanese, description, price, image_url, 
            country_id, category, hashtags, location, featured,
            store_type, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        inserted_count = 0
        for product in products_data:
            try:
                values = (
                    product['name'],
                    product['name_japanese'],
                    product['description'],
                    product['price'],
                    product['image_url'],
                    'japan',
                    product['category'],
                    json.dumps(product['hashtags']),
                    None,  # location 제거됨
                    False,  # featured
                    'donkihote',  # store_type 추가
                    datetime.now(),
                    datetime.now()
                )
                
                cursor.execute(insert_sql, values)
                inserted_count += 1
                
            except Exception as e:
                print(f"상품 '{product['name']}' 삽입 중 오류: {e}")
                continue
        
        conn.commit()
        cursor.close()
        print(f"총 {inserted_count}개 상품을 성공적으로 삽입했습니다.")
        
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
    
    print("=== 돈키호테 상품 데이터 처리 시작 ===")
    
    # Excel 파일 읽기
    df = read_excel_file(excel_file_path)
    
    # 중복 상품 감지
    print("\n=== 중복 상품 감지 중 ===")
    duplicates = detect_duplicates(df)
    
    if duplicates:
        print(f"\n⚠️  중복으로 감지된 상품들 ({len(duplicates)}개):")
        print("=" * 80)
        print(f"{'행번호':<8} {'제품명':<30} {'일본어명':<25} {'설명':<15}")
        print("=" * 80)
        for dup in duplicates:
            print(f"{dup['행번호']:<8} {dup['제품명'][:28]:<30} {dup['일본어명'][:23]:<25} {dup['설명'][:13]:<15}")
        print("=" * 80)
    else:
        print("✅ 중복 상품이 발견되지 않았습니다.")
    
    # 데이터베이스 연결
    print("\n=== 데이터베이스 작업 시작 ===")
    conn = connect_to_db()
    
    # 기존 데이터 삭제
    clear_existing_data(conn)
    
    # 상품 데이터 처리 및 삽입
    print("\n=== 상품 데이터 처리 중 ===")
    products_data = []
    
    import random
    
    for index, row in df.iterrows():
        try:
            name = str(row['제품명']).strip() if pd.notna(row['제품명']) else f"상품 {index + 1}"
            description = str(row['설명']).strip() if pd.notna(row['설명']) else "돈키호테 상품"
            
            # 빈 데이터 스킵
            if not name or name.lower() in ['nan', 'null', '']:
                continue
            
            # 일본어 제품명 생성
            existing_japanese = str(row['제품명_일본어']).strip() if pd.notna(row['제품명_일본어']) else ""
            if not existing_japanese or existing_japanese.lower() in ['nan', 'null', '']:
                name_japanese = generate_japanese_name(name, description)
            else:
                name_japanese = existing_japanese
            
            # 카테고리 결정
            category = categorize_product(name, description)
            
            # 가격 설정
            price_range = get_category_price_range(category)
            price = random.randint(price_range[0], price_range[1])
            
            # 이미지 URL
            image_url = get_category_image(category)
            
            # 해시태그
            hashtags = [f"#{category.lower()}", "#돈키호테", "#일본쇼핑", "#여행필수템"]
            
            products_data.append({
                'name': name,
                'name_japanese': name_japanese,
                'description': description,
                'category': category,
                'price': price,
                'image_url': image_url,
                'hashtags': hashtags
            })
            
        except Exception as e:
            print(f"행 {index + 1} 처리 중 오류: {e}")
            continue
    
    # 데이터베이스에 삽입
    insert_products(conn, products_data)
    
    conn.close()
    print("\n✅ 돈키호테 상품 데이터 처리가 완료되었습니다!")

if __name__ == "__main__":
    main()