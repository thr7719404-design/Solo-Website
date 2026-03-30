import pandas as pd
import sys

try:
    # Read Excel file
    excel_path = r'C:\Users\thr49\Downloads\Data Sheet with UAE Prices 2025 2026  Sent to Aiment and Tarek 21.12.2025 (2).xlsx'
    
    # Get sheet names
    xl = pd.ExcelFile(excel_path)
    print("=" * 80)
    print("SHEET NAMES:")
    print("=" * 80)
    for i, sheet in enumerate(xl.sheet_names, 1):
        print(f"{i}. {sheet}")
    
    # Read first sheet
    df = pd.read_excel(excel_path, sheet_name=0)
    
    print("\n" + "=" * 80)
    print("COLUMNS IN FIRST SHEET:")
    print("=" * 80)
    for i, col in enumerate(df.columns, 1):
        print(f"{i}. {col}")
    
    print("\n" + "=" * 80)
    print("DATA TYPES:")
    print("=" * 80)
    print(df.dtypes)
    
    print("\n" + "=" * 80)
    print("SAMPLE DATA (First 3 rows):")
    print("=" * 80)
    print(df.head(3).to_string())
    
    print("\n" + "=" * 80)
    print("BASIC STATISTICS:")
    print("=" * 80)
    print(f"Total Rows: {len(df)}")
    print(f"Total Columns: {len(df.columns)}")
    print(f"\nMissing Values:")
    print(df.isnull().sum())
    
    # Check for unique values in category-related columns
    print("\n" + "=" * 80)
    print("UNIQUE VALUES IN KEY COLUMNS:")
    print("=" * 80)
    
    # Try to identify category columns
    category_keywords = ['category', 'class', 'type', 'group', 'department']
    for col in df.columns:
        col_lower = str(col).lower()
        if any(keyword in col_lower for keyword in category_keywords):
            unique_count = df[col].nunique()
            print(f"\n{col}: {unique_count} unique values")
            if unique_count < 20:
                print(f"  Values: {df[col].unique().tolist()}")

except Exception as e:
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()
