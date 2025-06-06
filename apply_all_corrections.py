import csv
import psycopg2
import os

def apply_all_corrections():
    # Read corrected categories from CSV
    corrections = []
    with open('attached_assets/all_products_categories.csv', 'r', encoding='euc-kr') as f:
        reader = csv.DictReader(f)
        for row in reader:
            corrections.append(f"UPDATE products SET purpose_category = '{row['current_category']}' WHERE id = {row['id']};")
    
    # Execute all updates
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    # Execute as single transaction
    try:
        for sql in corrections:
            cur.execute(sql)
        conn.commit()
        print(f"Applied {len(corrections)} category corrections")
        
        # Get final distribution
        cur.execute("SELECT purpose_category, COUNT(*) FROM products GROUP BY purpose_category ORDER BY COUNT(*) DESC")
        results = cur.fetchall()
        
        print("\n최종 카테고리 분포:")
        korean_names = {'food': '먹을거', 'cosmetic': '바를거', 'etc': '기타', 'clothing': '입을거'}
        for category, count in results:
            korean_name = korean_names.get(category, category)
            print(f"{korean_name} ({category}): {count}개")
            
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    apply_all_corrections()