#!/usr/bin/env python3
import os
import sys
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor
import shutil
from pathlib import Path

def connect_to_db():
    """데이터베이스 연결"""
    try:
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL 환경변수가 설정되지 않았습니다.")
        
        conn = psycopg2.connect(database_url)
        return conn
    except Exception as e:
        print(f"데이터베이스 연결 실패: {e}")
        sys.exit(1)

def clear_all_tables(conn):
    """모든 테이블 데이터 삭제 및 시퀀스 리셋"""
    cursor = conn.cursor()
    try:
        print("기존 데이터 삭제 중...")
        
        # 의존성 순서에 따라 테이블 데이터 삭제
        tables_to_clear = [
            'product_reviews', 'user_products', 'travel_dates', 
            'products', 'purpose_categories', 'store_types', 'countries'
        ]
        
        for table in tables_to_clear:
            try:
                cursor.execute(f"DELETE FROM {table};")
                print(f"  {table} 테이블 클리어됨")
            except Exception as e:
                print(f"  {table} 테이블 삭제 중 오류: {e}")
        
        # 시퀀스 리셋 (권한이 있는 경우에만)
        sequences = [
            'products_id_seq', 'purpose_categories_id_seq', 
            'store_types_id_seq', 'product_reviews_id_seq'
        ]
        
        for seq in sequences:
            try:
                cursor.execute(f"ALTER SEQUENCE {seq} RESTART WITH 1;")
                print(f"  {seq} 시퀀스 리셋됨")
            except Exception as e:
                print(f"  {seq} 시퀀스 리셋 실패: {e}")
        
        conn.commit()
        print("데이터 삭제 완료")
        
    except Exception as e:
        conn.rollback()
        print(f"데이터 삭제 실패: {e}")
        raise

def insert_reference_data(conn):
    """국가, 판매처, 카테고리 데이터 삽입"""
    cursor = conn.cursor()
    
    try:
        # 국가 데이터
        print("국가 데이터 삽입 중...")
        cursor.execute("""
            INSERT INTO countries (id, name, code, currency, flag_url, created_at, updated_at) 
            VALUES ('japan', '일본', 'JP', 'JPY', 'https://flagcdn.com/w20/jp.png', NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                code = EXCLUDED.code,
                currency = EXCLUDED.currency,
                flag_url = EXCLUDED.flag_url,
                updated_at = NOW();
        """)
        
        # 판매처 (Store Types) 데이터
        print("판매처 데이터 삽입 중...")
        store_types = [
            ('donkihote', '돈키호테', 'Don Quijote', 'Primary discount chain store in Japan'),
            ('convenience', '편의점', 'Convenience Store', 'Japanese convenience stores')
        ]
        
        for store_id, name_ko, name_en, description in store_types:
            cursor.execute("""
                INSERT INTO store_types (id, name, name_english, description) 
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    name_english = EXCLUDED.name_english,
                    description = EXCLUDED.description;
            """, (store_id, name_ko, name_en, description))
        
        # 용도별 카테고리 (Purpose Categories) 데이터
        print("용도별 카테고리 데이터 삽입 중...")
        categories = [
            ('eat', '먹을거리', 'Food & Drinks', 'Food items and beverages'),
            ('apply', '바르는거', 'Topical Products', 'Cosmetics and skincare products to apply'),
            ('health', '몸에 좋은거', 'Health Products', 'Health supplements and wellness items'),
            ('stick', '붙이는거/붙여두는거', 'Adhesive Products', 'Stickers, patches, and adhesive items'),
            ('home', '집에서 쓰는거', 'Home Products', 'Household items and home goods'),
            ('wear', '입는거/쓰는거', 'Wearable Products', 'Clothing and accessories to wear'),
            ('gift', '기분내는거/선물용', 'Gift Items', 'Items for gifts and mood enhancement')
        ]
        
        for cat_id, name_ko, name_en, description in categories:
            cursor.execute("""
                INSERT INTO purpose_categories (id, name, name_english, description) 
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    name_english = EXCLUDED.name_english,
                    description = EXCLUDED.description;
            """, (cat_id, name_ko, name_en, description))
        
        conn.commit()
        print("참조 데이터 삽입 완료")
        
    except Exception as e:
        conn.rollback()
        print(f"참조 데이터 삽입 실패: {e}")
        raise

def copy_product_images(source_dir, target_dir):
    """상품 이미지를 client/public/images로 복사"""
    print("상품 이미지 복사 중...")
    
    # 대상 디렉토리 생성
    Path(target_dir).mkdir(parents=True, exist_ok=True)
    
    # 기존 이미지 삭제
    for existing_file in Path(target_dir).glob("*"):
        if existing_file.is_file():
            existing_file.unlink()
    
    image_count = 0
    source_path = Path(source_dir)
    
    if source_path.exists():
        for image_file in source_path.glob("*"):
            if image_file.is_file() and image_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                try:
                    # 파일명에서 PID 추출 (첫 번째 숫자 부분)
                    filename = image_file.name
                    if '_' in filename:
                        pid_part = filename.split('_')[0]
                        if pid_part.isdigit():
                            # 새 파일명: {pid}.{확장자}
                            new_filename = f"{pid_part}{image_file.suffix.lower()}"
                            target_path = Path(target_dir) / new_filename
                            shutil.copy2(image_file, target_path)
                            image_count += 1
                            print(f"  복사됨: {filename} -> {new_filename}")
                except Exception as e:
                    print(f"  이미지 복사 실패 {filename}: {e}")
    
    print(f"총 {image_count}개 이미지 복사 완료")
    return image_count

def insert_products(conn, excel_path, image_count):
    """엑셀 파일에서 상품 데이터 읽어서 삽입"""
    print(f"엑셀 파일에서 상품 데이터 읽는 중: {excel_path}")
    
    try:
        df = pd.read_excel(excel_path)
        print(f"총 {len(df)}개 상품 데이터 발견")
        
        cursor = conn.cursor()
        
        # 판매처 매핑
        store_mapping = {
            'donki': 'donkihote',
            'conve': 'convenience'
        }
        
        # 가격 범위 설정 (카테고리별 다른 가격대)
        price_ranges = {
            'eat': (100, 1500),       # 먹을거리: 100-1500엔
            'apply': (300, 3000),     # 바르는거: 300-3000엔
            'health': (500, 5000),    # 몸에 좋은거: 500-5000엔
            'stick': (200, 1000),     # 붙이는거: 200-1000엔
            'home': (500, 3000),      # 집에서 쓰는거: 500-3000엔
            'wear': (1000, 10000),    # 입는거: 1000-10000엔
            'gift': (300, 2000)       # 선물용: 300-2000엔
        }
        
        inserted_count = 0
        
        for index, row in df.iterrows():
            try:
                pid = int(row['pid'])
                sales_channel = store_mapping.get(row['sales_channel'], 'donkihote')
                category = row['category']
                
                # 가격 계산 (카테고리별 범위 내에서 PID 기반)
                min_price, max_price = price_ranges.get(category, (200, 2000))
                price = min_price + (pid % (max_price - min_price))
                
                # 이미지 URL 생성
                image_url = f"/images/{pid}.jpg"  # 기본적으로 jpg 확장자 사용
                
                # 상품 데이터 삽입
                cursor.execute("""
                    INSERT INTO products (
                        id, name, name_japanese, name_english, brand, description, 
                        price, country_id, store_type, purpose_category, 
                        image_url, tags, info, created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                    ) ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        name_japanese = EXCLUDED.name_japanese,
                        name_english = EXCLUDED.name_english,
                        brand = EXCLUDED.brand,
                        description = EXCLUDED.description,
                        price = EXCLUDED.price,
                        store_type = EXCLUDED.store_type,
                        purpose_category = EXCLUDED.purpose_category,
                        image_url = EXCLUDED.image_url,
                        tags = EXCLUDED.tags,
                        info = EXCLUDED.info,
                        updated_at = NOW();
                """, (
                    pid,                                    # id
                    str(row['pnm_kr'])[:255],              # name (한글명)
                    str(row['pnm_jp'])[:255],              # name_japanese
                    str(row['pnm_en'])[:255],              # name_english
                    str(row.get('brand', ''))[:100],       # brand
                    str(row.get('description', ''))[:500], # description
                    price,                                  # price
                    'japan',                               # country_id
                    sales_channel,                         # store_type
                    category,                              # purpose_category
                    image_url,                             # image_url
                    None,                                  # tags
                    str(row.get('info', ''))[:1000],       # info
                ))
                
                inserted_count += 1
                
                if inserted_count % 100 == 0:
                    print(f"  {inserted_count}개 상품 처리됨...")
                    
            except Exception as e:
                print(f"상품 {index} 삽입 실패: {e}")
                continue
        
        conn.commit()
        print(f"총 {inserted_count}개 상품 삽입 완료")
        return inserted_count
        
    except Exception as e:
        conn.rollback()
        print(f"상품 데이터 삽입 실패: {e}")
        raise

def main():
    """메인 실행 함수"""
    print("=== ReadyBag 데이터베이스 재구축 시작 ===")
    
    # 데이터베이스 연결
    conn = connect_to_db()
    
    try:
        # 1. 기존 데이터 삭제
        clear_all_tables(conn)
        
        # 2. 참조 데이터 삽입
        insert_reference_data(conn)
        
        # 3. 상품 이미지 복사
        image_count = copy_product_images(
            'attached_assets/donki_images',
            'client/public/images'
        )
        
        # 4. 상품 데이터 삽입
        product_count = insert_products(
            conn, 
            'attached_assets/Products_full_1750772133167.xlsx',
            image_count
        )
        
        print(f"\n=== 데이터베이스 재구축 완료 ===")
        print(f"- 이미지: {image_count}개")
        print(f"- 상품: {product_count}개")
        print(f"- 카테고리: 7개")
        print(f"- 판매처: 2개")
        
    except Exception as e:
        print(f"데이터베이스 재구축 실패: {e}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    main()