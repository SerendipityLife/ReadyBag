#!/usr/bin/env python3
import os
import psycopg2
import pandas as pd
from pathlib import Path
import json
import random

def connect_to_db():
    database_url = os.getenv("DATABASE_URL")
    return psycopg2.connect(database_url)

def load_products_from_excel():
    """엑셀에서 제품 데이터 로드하고 PID를 제품 ID로 사용"""
    df = pd.read_excel('attached_assets/Products_full_1750775431953.xlsx')
    
    # 이미지 파일 목록 가져오기
    image_dir = Path("client/public/images")
    available_images = {}
    
    for img_file in image_dir.glob("*"):
        if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
            pid = int(img_file.stem)
            available_images[pid] = f"/images/{img_file.name}"
    
    conn = connect_to_db()
    cursor = conn.cursor()
    
    try:
        # 기존 제품 데이터 삭제
        cursor.execute("DELETE FROM products")
        
        inserted_count = 0
        
        for _, row in df.iterrows():
            pid = int(row['pid'])
            
            # 이미지 URL 결정
            if pid in available_images:
                image_url = available_images[pid]
            else:
                # 이미지가 없으면 첫 번째 이미지 사용
                image_url = list(available_images.values())[0] if available_images else "/images/default.jpg"
            
            # 카테고리 매핑
            category_map = {
                'eat': 'eat',
                'apply': 'apply', 
                'health': 'health',
                'stick': 'stick',
                'home': 'home',
                'wear': 'wear',
                'gift': 'gift'
            }
            
            store_map = {
                'donki': 'donkihote',
                'conve': 'convenience'
            }
            
            # 가격 계산 (카테고리별 범위)
            price_ranges = {
                'eat': (100, 1500),
                'apply': (300, 3000),
                'health': (500, 5000),
                'stick': (200, 1000),
                'home': (500, 3000),
                'wear': (1000, 10000),
                'gift': (300, 2000)
            }
            
            category = category_map.get(row['category'], 'eat')
            store_type = store_map.get(row['sales_channel'], 'donkihote')
            
            min_price, max_price = price_ranges.get(category, (200, 2000))
            price = min_price + (pid % (max_price - min_price))
            
            # 해시태그 생성
            hashtags = []
            if pd.notna(row['brand']):
                hashtags.append(row['brand'])
            if pd.notna(row['pnm_kr']):
                hashtags.extend(row['pnm_kr'].split()[:2])
            
            cursor.execute("""
                INSERT INTO products (
                    id, name, name_japanese, description, price, image_url,
                    country_id, store_type, purpose_category, hashtags,
                    location, featured, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                )
            """, (
                pid,
                str(row['pnm_kr']) if pd.notna(row['pnm_kr']) else f"제품 {pid}",
                str(row['pnm_jp']) if pd.notna(row['pnm_jp']) else "",
                str(row['description']) if pd.notna(row['description']) else f"일본 {category} 제품",
                price,
                image_url,
                'japan', 
                store_type,
                category,
                json.dumps(hashtags),
                "일본 현지 매장",
                random.choice([True, False]),
            ))
            
            inserted_count += 1
            if inserted_count % 50 == 0:
                print(f"처리됨: {inserted_count}개")
        
        conn.commit()
        print(f"총 {inserted_count}개 제품 삽입 완료")
        
        # 결과 확인
        cursor.execute("SELECT id, name, image_url FROM products WHERE id IN (10003, 10005, 10011) ORDER BY id")
        test_products = cursor.fetchall()
        
        print("\n=== 이미지 매칭 확인 ===")
        for pid, name, img_url in test_products:
            file_path = Path(f"client/public{img_url}")
            status = "✓" if file_path.exists() else "✗"
            print(f"{status} PID {pid}: {name} → {img_url}")
            
    except Exception as e:
        conn.rollback()
        print(f"오류: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    load_products_from_excel()