#!/usr/bin/env python3
"""
업데이트된 Excel 파일 분석 스크립트
변경된 헤더명과 내용을 분석합니다.
"""

import pandas as pd
import sys
import os

def analyze_excel_file(file_path):
    """Excel 파일 분석"""
    try:
        # Excel 파일 읽기
        df = pd.read_excel(file_path)
        
        print("=== 업데이트된 Excel 파일 분석 결과 ===")
        print(f"총 행 수: {len(df)}")
        print(f"총 열 수: {len(df.columns)}")
        print(f"새로운 컬럼명: {list(df.columns)}")
        
        print("\n=== 각 컬럼별 상세 정보 ===")
        for i, col in enumerate(df.columns):
            non_null_count = df[col].notna().sum()
            null_count = df[col].isna().sum()
            print(f"\n컬럼 {i+1}: '{col}'")
            print(f"  - 데이터 있는 행: {non_null_count}")
            print(f"  - 빈 행: {null_count}")
            
            if non_null_count > 0:
                # 샘플 데이터 표시 (처음 5개)
                sample_data = df[col].dropna().head(5).tolist()
                print(f"  - 샘플 데이터:")
                for j, sample in enumerate(sample_data):
                    sample_str = str(sample)[:60] + "..." if len(str(sample)) > 60 else str(sample)
                    print(f"    {j+1}. {sample_str}")
                
                # 데이터 유형
                print(f"  - 데이터 타입: {df[col].dtype}")
                
                # 고유값 수
                unique_count = df[col].nunique()
                print(f"  - 고유값 수: {unique_count}")
        
        print("\n=== 전체 데이터 미리보기 (처음 10행) ===")
        pd.set_option('display.max_columns', None)
        pd.set_option('display.width', None)
        pd.set_option('display.max_colwidth', 50)
        print(df.head(10).to_string(index=True))
        
        print("\n=== 데이터 통계 ===")
        print("빈 값 통계:")
        null_stats = df.isnull().sum()
        for col, null_count in null_stats.items():
            print(f"  {col}: {null_count}개 빈 값")
        
        # 중복 검사
        print("\n=== 중복 데이터 검사 ===")
        total_duplicates = df.duplicated().sum()
        print(f"완전히 중복된 행: {total_duplicates}개")
        
        # 각 컬럼별 중복 검사
        for col in df.columns:
            if df[col].dtype == 'object':  # 텍스트 컬럼만
                duplicates_in_col = df[col].duplicated().sum()
                if duplicates_in_col > 0:
                    print(f"'{col}' 컬럼 중복값: {duplicates_in_col}개")
                    # 중복 값들 보여주기
                    duplicate_values = df[df[col].duplicated(keep=False)][col].value_counts()
                    print("  중복된 값들:")
                    for value, count in duplicate_values.head(5).items():
                        value_str = str(value)[:30] + "..." if len(str(value)) > 30 else str(value)
                        print(f"    '{value_str}': {count}회")
        
        return True
        
    except Exception as e:
        print(f"Excel 파일 분석 오류: {e}")
        import traceback
        print(traceback.format_exc())
        return False

def main():
    file_path = "attached_assets/japanese_products_donki.xlsx"
    
    if not os.path.exists(file_path):
        print(f"파일을 찾을 수 없습니다: {file_path}")
        sys.exit(1)
    
    print("업데이트된 Excel 파일을 분석하고 있습니다...")
    
    if analyze_excel_file(file_path):
        print("\n✅ Excel 파일 분석이 완료되었습니다.")
    else:
        print("\n❌ Excel 파일 분석에 실패했습니다.")
        sys.exit(1)

if __name__ == "__main__":
    main()