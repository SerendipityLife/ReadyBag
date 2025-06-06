import csv
import psycopg2
import os

def update_categories():
    print("Reading corrected categories from CSV...")
    
    # Read the corrected CSV file
    updates = []
    with open('attached_assets/all_products_categories.csv', 'r', encoding='euc-kr') as f:
        reader = csv.DictReader(f)
        for row in reader:
            updates.append((row['current_category'], int(row['id'])))
    
    print(f"Found {len(updates)} category updates")
    
    # Connect to database and update
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    # Batch update
    cur.executemany(
        "UPDATE products SET purpose_category = %s WHERE id = %s",
        updates
    )
    
    updated_count = cur.rowcount
    conn.commit()
    
    # Check final distribution
    cur.execute("""
        SELECT purpose_category, COUNT(*) as count 
        FROM products 
        GROUP BY purpose_category 
        ORDER BY count DESC
    """)
    
    results = cur.fetchall()
    
    cur.close()
    conn.close()
    
    print(f"Successfully updated {updated_count} products")
    print("\n최종 카테고리 분포:")
    
    korean_names = {
        'food': '먹을거',
        'cosmetic': '바를거',
        'etc': '기타', 
        'clothing': '입을거'
    }
    
    for category, count in results:
        korean_name = korean_names.get(category, category)
        print(f"{korean_name} ({category}): {count}개")

if __name__ == "__main__":
    update_categories()