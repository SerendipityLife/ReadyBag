#!/usr/bin/env python3
"""
제품 ID를 PID로 수정하는 스크립트
"""

import os
import psycopg2
from pathlib import Path
import re

def connect_to_db():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise Exception("DATABASE_URL 환경변수가 설정되지 않았습니다.")
    return psycopg2.connect(database_url)

def get_image_pids():
    """이미지 파일들의 PID 목록을 가져옴"""
    image_dir = Path("client/public/images")
    image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
    
    pids = []
    for image_file in image_dir.iterdir():
        if image_file.is_file() and image_file.suffix.lower() in image_extensions:
            match = re.match(r'^(\d+)', image_file.name)
            if match:
                pid = int(match.group(1))
                pids.append((pid, image_file.name))
    
    return sorted(pids, key=lambda x: x[0])

def fix_product_ids():
    """제품 ID를 PID로 수정하고 이미지 URL 업데이트"""
    conn = connect_to_db()
    cursor = conn.cursor()
    
    try:
        # 현재 제품들 가져오기
        cursor.execute("SELECT id, name, name_japanese, description, price, store_type, purpose_category, hashtags, location, featured FROM products ORDER BY id")
        products = cursor.fetchall()
        
        # 이미지 PID들 가져오기
        image_pids = get_image_pids()
        
        print(f"제품 수: {len(products)}")
        print(f"이미지 PID 수: {len(image_pids)}")
        
        if len(products) == 0:
            print("제품이 없습니다.")
            return
            
        # 기존 제품 삭제
        cursor.execute("DELETE FROM products")
        
        # 새로운 제품들을 올바른 PID로 삽입
        for i, product in enumerate(products):
            if i < len(image_pids):
                pid, image_filename = image_pids[i]
                image_url = f"/images/{image_filename}"
            else:
                # 이미지가 부족한 경우 첫 번째 이미지 사용
                pid = 10000 + i  # 기본 PID
                image_url = f"/images/{image_pids[0][1]}" if image_pids else "/images/default.jpg"
            
            # 제품 데이터 언팩
            old_id, name, name_japanese, description, price, store_type, purpose_category, hashtags, location, featured = product
            
            cursor.execute("""
                INSERT INTO products (
                    id, name, name_japanese, description, price, image_url,
                    country_id, store_type, purpose_category, hashtags,
                    location, featured, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                )
            """, (
                pid, name, name_japanese, description, price, image_url,
                'japan', store_type, purpose_category, hashtags,
                location, featured
            ))
            
            print(f"제품 ID {old_id} → {pid}: {name} (이미지: {image_url})")
        
        conn.commit()
        print(f"\n제품 ID 수정 완료: {len(products)}개 제품")
        
        # 결과 확인
        cursor.execute("SELECT id, name, image_url FROM products ORDER BY id LIMIT 10")
        updated_products = cursor.fetchall()
        
        print("\n=== 수정된 제품들 ===")
        for pid, name, image_url in updated_products:
            # 이미지 파일 존재 확인
            if image_url.startswith('/images/'):
                file_path = Path(f"client/public{image_url}")
                exists = "✓" if file_path.exists() else "✗"
                print(f"{exists} PID {pid}: {name} → {image_url}")
        
    except Exception as e:
        conn.rollback()
        print(f"오류 발생: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    fix_product_ids()