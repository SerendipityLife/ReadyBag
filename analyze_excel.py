#!/usr/bin/env python3
"""
Excel 파일 분석 스크립트
첨부된 japanese_products_donki.xlsx 파일의 내용을 분석합니다.
"""

import pandas as pd
import sys

def analyze_excel_file(file_path):
    """Excel 파일 분석"""
    try:
        # Excel 파일 읽기
        df = pd.read_excel(file_path)
        
        print("=== Excel 파일 분석 결과 ===")
        print(f"총 행 수: {len(df)}")
        print(f"총 열 수: {len(df.columns)}")
        print(f"컬럼명: {list(df.columns)}")
        
        print("\n=== 각 컬럼별 정보 ===")
        for col in df.columns:
            non_null_count = df[col].notna().sum()
            null_count = df[col].isna().sum()
            print(f"{col}:")
            print(f"  - 데이터 있는 행: {non_null_count}")
            print(f"  - 빈 행: {null_count}")
            if non_null_count > 0:
                # 샘플 데이터 표시 (처음 3개)
                sample_data = df[col].dropna().head(3).tolist()
                print(f"  - 샘플 데이터: {sample_data}")
        
        print("\n=== 데이터 미리보기 (처음 10행) ===")
        print(df.head(10).to_string(index=True))
        
        print("\n=== 데이터 유형 분석 ===")
        print(df.dtypes)
        
        print("\n=== 빈 값 통계 ===")
        print(df.isnull().sum())
        
        # 제품명 분석
        if '제품명' in df.columns:
            product_names = df['제품명'].dropna()
            print(f"\n=== 제품명 분석 ===")
            print(f"고유한 제품명 수: {product_names.nunique()}")
            print(f"전체 제품명 수: {len(product_names)}")
            
            # 중복 제품명 체크
            duplicates = product_names.value_counts()
            duplicate_names = duplicates[duplicates > 1]
            if len(duplicate_names) > 0:
                print(f"중복된 제품명: {len(duplicate_names)}개")
                print("중복 제품명 목록:")
                for name, count in duplicate_names.head(10).items():
                    print(f"  - '{name}': {count}회")
            else:
                print("중복된 제품명이 없습니다.")
        
        # 일본어 제품명 분석
        if '제품명_일본어' in df.columns:
            japanese_names = df['제품명_일본어'].dropna()
            print(f"\n=== 일본어 제품명 분석 ===")
            print(f"일본어 제품명이 있는 행: {len(japanese_names)}")
            print(f"일본어 제품명이 없는 행: {df['제품명_일본어'].isna().sum()}")
            
            if len(japanese_names) > 0:
                print("일본어 제품명 샘플:")
                for i, name in enumerate(japanese_names.head(5)):
                    print(f"  {i+1}. {name}")
        
        # 설명 분석
        if '설명' in df.columns:
            descriptions = df['설명'].dropna()
            print(f"\n=== 설명 분석 ===")
            print(f"설명이 있는 행: {len(descriptions)}")
            print(f"설명이 없는 행: {df['설명'].isna().sum()}")
            
            if len(descriptions) > 0:
                avg_length = descriptions.str.len().mean()
                print(f"평균 설명 길이: {avg_length:.1f}자")
                print("설명 샘플:")
                for i, desc in enumerate(descriptions.head(3)):
                    print(f"  {i+1}. {desc[:50]}{'...' if len(str(desc)) > 50 else ''}")
        
        return True
        
    except Exception as e:
        print(f"Excel 파일 분석 오류: {e}")
        return False

def main():
    file_path = "attached_assets/japanese_products_donki.xlsx"
    
    print("첨부된 Excel 파일을 분석하고 있습니다...")
    
    if analyze_excel_file(file_path):
        print("\n✅ Excel 파일 분석이 완료되었습니다.")
    else:
        print("\n❌ Excel 파일 분석에 실패했습니다.")
        sys.exit(1)

if __name__ == "__main__":
    main()