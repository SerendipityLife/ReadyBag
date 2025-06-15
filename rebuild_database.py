#!/usr/bin/env python3
import pandas as pd
import psycopg2
import os
from psycopg2.extras import execute_values
import sys

def connect_to_db():
    """데이터베이스 연결"""
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        return conn
    except Exception as e:
        print(f"데이터베이스 연결 실패: {e}")
        return None

def clear_all_tables(conn):
    """모든 테이블 데이터 삭제"""
    cursor = conn.cursor()
    
    try:
        # 외래키 제약조건 일시 비활성화
        cursor.execute("SET session_replication_role = replica;")
        
        # 모든 테이블 삭제 (순서 중요)
        tables_to_clear = [
            'user_products',
            'products', 
            'countries'
        ]
        
        for table in tables_to_clear:
            cursor.execute(f"DELETE FROM {table};")
            print(f"테이블 {table} 데이터 삭제 완료")
        
        # 외래키 제약조건 재활성화
        cursor.execute("SET session_replication_role = DEFAULT;")
        
        conn.commit()
        print("모든 테이블 데이터 삭제 완료")
        
    except Exception as e:
        print(f"테이블 삭제 중 오류: {e}")
        conn.rollback()
        return False
    
    return True

def insert_countries(conn):
    """국가 데이터 삽입"""
    cursor = conn.cursor()
    
    # 일본 국가 데이터
    country_data = [
        ('japan', '일본', 'JP', 'JPY', 'https://flagcdn.com/jp.svg')
    ]
    
    try:
        cursor.execute("""
            INSERT INTO countries (id, name, code, currency, "flagUrl", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
        """, country_data[0])
        
        conn.commit()
        print("국가 데이터 삽입 완료")
        return True
        
    except Exception as e:
        print(f"국가 데이터 삽입 중 오류: {e}")
        conn.rollback()
        return False

def read_excel_and_insert_products(conn, excel_path):
    """엑셀 파일을 읽고 상품 데이터 삽입"""
    try:
        # 엑셀 파일 읽기
        df = pd.read_excel(excel_path)
        print(f"엑셀 파일 읽기 완료. 총 {len(df)}개 행")
        
        # 컬럼명 출력 (디버깅용)
        print("컬럼명:", df.columns.tolist())
        
        # 처음 몇 행 출력 (디버깅용)
        print("처음 5행:")
        print(df.head())
        
        cursor = conn.cursor()
        
        # 데이터 변환 및 삽입 준비
        products_data = []
        
        for index, row in df.iterrows():
            try:
                # 엑셀 컬럼 구조에 따라 데이터 매핑
                name = str(row.iloc[0]) if pd.notna(row.iloc[0]) else f"상품_{index+1}"
                name_japanese = str(row.iloc[1]) if len(row) > 1 and pd.notna(row.iloc[1]) else name
                description = str(row.iloc[2]) if len(row) > 2 and pd.notna(row.iloc[2]) else "상품 설명"
                price = float(row.iloc[3]) if len(row) > 3 and pd.notna(row.iloc[3]) else 1000.0
                store_type = str(row.iloc[4]) if len(row) > 4 and pd.notna(row.iloc[4]) else "donkihote"
                category = str(row.iloc[5]) if len(row) > 5 and pd.notna(row.iloc[5]) else "etc"
                
                # 해시태그 생성
                hashtags = [f"#{name.replace(' ', '')}", f"#{store_type}", "#일본쇼핑", "#여행필수템"]
                
                product_data = (
                    name,
                    name_japanese,
                    description,
                    price,
                    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=300&fit=crop",  # 기본 이미지
                    "japan",
                    store_type,
                    category,
                    hashtags,
                    None,  # location
                    False  # featured
                )
                
                products_data.append(product_data)
                
            except Exception as e:
                print(f"행 {index+1} 처리 중 오류: {e}")
                continue
        
        # 배치 삽입
        if products_data:
            insert_query = """
                INSERT INTO products (
                    name, "nameJapanese", description, price, "imageUrl", 
                    "countryId", "storeType", "purposeCategory", hashtags, 
                    location, featured, "createdAt", "updatedAt"
                ) VALUES %s
            """
            
            execute_values(
                cursor,
                insert_query,
                [(
                    data[0], data[1], data[2], data[3], data[4], 
                    data[5], data[6], data[7], data[8], 
                    data[9], data[10], 'NOW()', 'NOW()'
                ) for data in products_data],
                template=None,
                page_size=100
            )
            
            conn.commit()
            print(f"{len(products_data)}개 상품 데이터 삽입 완료")
            return True
        else:
            print("삽입할 데이터가 없습니다")
            return False
            
    except Exception as e:
        print(f"엑셀 파일 처리 중 오류: {e}")
        conn.rollback()
        return False

def main():
    """메인 실행 함수"""
    excel_path = "attached_assets/Donki_Products_full_1749953179234.xlsx"
    
    if not os.path.exists(excel_path):
        print(f"엑셀 파일을 찾을 수 없습니다: {excel_path}")
        return False
    
    # 데이터베이스 연결
    conn = connect_to_db()
    if not conn:
        return False
    
    try:
        # 1. 모든 테이블 데이터 삭제
        print("=== 기존 데이터 삭제 중 ===")
        if not clear_all_tables(conn):
            return False
        
        # 2. 국가 데이터 삽입
        print("=== 국가 데이터 삽입 중 ===")
        if not insert_countries(conn):
            return False
        
        # 3. 엑셀에서 상품 데이터 읽고 삽입
        print("=== 상품 데이터 삽입 중 ===")
        if not read_excel_and_insert_products(conn, excel_path):
            return False
        
        print("=== 데이터베이스 재구축 완료 ===")
        return True
        
    finally:
        conn.close()

if __name__ == "__main__":
    success = main()
    if success:
        print("데이터베이스 재구축이 성공적으로 완료되었습니다!")
        sys.exit(0)
    else:
        print("데이터베이스 재구축 중 오류가 발생했습니다.")
        sys.exit(1)