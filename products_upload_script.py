#!/usr/bin/env python3
"""
ReadyBag 상품 데이터 업로드 스크립트

엑셀 파일에서 상품 데이터를 읽어와 데이터베이스에 업로드합니다.
사용법: python products_upload_script.py <엑셀파일경로>
"""

import sys
import os
import pandas as pd
import json
import psycopg2
from datetime import datetime

# 환경 변수에서 DATABASE_URL 가져오기
DATABASE_URL = os.environ.get("DATABASE_URL")

def validate_product(product):
    """상품 데이터 유효성 검사"""
    # 필수 필드 검사
    required_fields = ['name', 'description', 'price', 'image_url', 'country_id', 'category']
    for field in required_fields:
        if not product.get(field):
            return False, f"필수 필드 누락: {field}"
    
    # 가격 검사 (숫자인지)
    try:
        int(product['price'])
    except (ValueError, TypeError):
        return False, "가격은 숫자여야 합니다"
    
    # 해시태그 검사 (JSON 형식인지)
    if product.get('hashtags'):
        try:
            # 문자열이면 JSON으로 파싱 시도
            if isinstance(product['hashtags'], str):
                json.loads(product['hashtags'])
            # 이미 리스트면 통과
            elif not isinstance(product['hashtags'], list):
                return False, "해시태그 형식 오류: JSON 배열이어야 합니다"
        except json.JSONDecodeError:
            return False, "해시태그 형식 오류: 유효한 JSON이 아닙니다"
    
    # 카테고리 검사
    valid_categories = ['BEAUTY', 'FOOD', 'ELECTRONICS', 'FASHION', 'HEALTH', 'TOYS', 'LIQUOR']
    if product['category'] not in valid_categories:
        return False, f"유효하지 않은 카테고리: {product['category']}"
    
    return True, "유효성 검사 통과"

def load_products_from_excel(file_path):
    """엑셀 파일에서 상품 데이터 로드"""
    try:
        df = pd.read_excel(file_path)
        
        # 기본값 설정 및 데이터 정리
        products = []
        for _, row in df.iterrows():
            product = row.to_dict()
            
            # 결측값 처리
            if pd.isna(product.get('name_japanese')):
                product['name_japanese'] = None
                
            if pd.isna(product.get('location')):
                product['location'] = None
                
            if pd.isna(product.get('featured')):
                product['featured'] = False
                
            # 해시태그 처리
            if pd.isna(product.get('hashtags')):
                product['hashtags'] = json.dumps([])
            elif isinstance(product['hashtags'], str) and not product['hashtags'].startswith('['):
                # 문자열이지만 JSON 형식이 아닌 경우 (쉼표로 구분된 문자열 등)
                try:
                    tags = [tag.strip() for tag in product['hashtags'].split(',')]
                    product['hashtags'] = json.dumps(tags)
                except:
                    product['hashtags'] = json.dumps([])
            
            # 유효성 검사
            is_valid, message = validate_product(product)
            if is_valid:
                products.append(product)
            else:
                print(f"상품 '{product.get('name')}' 건너뜀: {message}")
        
        return products
    except Exception as e:
        print(f"엑셀 파일 로드 오류: {e}")
        return []

def insert_products(products):
    """데이터베이스에 상품 데이터 삽입"""
    if not products:
        print("업로드할 상품이 없습니다.")
        return
    
    conn = None
    try:
        # 데이터베이스 연결
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # 현재 시간
        now = datetime.now()
        
        # 상품 삽입
        inserted_count = 0
        for product in products:
            try:
                query = """
                INSERT INTO products 
                (name, name_japanese, description, price, image_url, country_id, category, hashtags, location, featured, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
                """
                
                hashtags = product['hashtags']
                if isinstance(hashtags, str):
                    hashtags_json = hashtags
                else:
                    hashtags_json = json.dumps(hashtags)
                
                values = (
                    product['name'],
                    product.get('name_japanese'),
                    product['description'],
                    int(product['price']),
                    product['image_url'],
                    product['country_id'],
                    product['category'],
                    hashtags_json,
                    product.get('location'),
                    bool(product.get('featured', False)),
                    now,
                    now
                )
                
                cursor.execute(query, values)
                product_id = cursor.fetchone()[0]
                print(f"상품 등록 완료 (ID: {product_id}): {product['name']}")
                inserted_count += 1
                
            except Exception as e:
                print(f"상품 '{product.get('name')}' 등록 실패: {e}")
        
        # 변경사항 커밋
        conn.commit()
        print(f"\n총 {inserted_count}개 상품이 등록되었습니다.")
        
    except Exception as e:
        print(f"데이터베이스 오류: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

def main():
    """메인 함수"""
    if len(sys.argv) < 2:
        print("사용법: python products_upload_script.py <엑셀파일경로>")
        return
    
    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"파일을 찾을 수 없습니다: {file_path}")
        return
    
    print(f"파일 로드 중: {file_path}")
    products = load_products_from_excel(file_path)
    print(f"{len(products)}개 상품이 로드되었습니다.")
    
    if products:
        confirmation = input("이 상품들을 데이터베이스에 등록하시겠습니까? (y/n): ")
        if confirmation.lower() == 'y':
            insert_products(products)
        else:
            print("업로드가 취소되었습니다.")

if __name__ == "__main__":
    main()
