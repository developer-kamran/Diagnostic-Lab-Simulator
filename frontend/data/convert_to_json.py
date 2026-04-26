import pandas as pd
import json

# 1. Load the specific sheet from your Excel file
# Replace the filename with your exact Excel file name
excel_file_name = "lab_front_desk_gg1_synthetic_dataset.xlsx"
sheet_name = "Processed_For_GG1"

print(f"Reading sheet '{sheet_name}' from {excel_file_name}...")
df = pd.read_excel(excel_file_name, sheet_name=sheet_name)

# 2. Process the data row by row
data_list = []
for index, row in df.iterrows():
    data_list.append({
        # Remove the "P" from P0001 (converting it to a clean string ID)
        "id": str(row['customer_id']).replace("P", ""),
        
        # Round the arrival minute to a whole number for the simulation ticks
        "arrivalTick": int(round(row['arrival_minute_from_open'])),
        
        # Round service duration, ensuring it takes at least 1 minute
        "serviceDuration": max(1, int(round(row['service_duration_min']))),
        
        # Keep the customer type for the logs
        "type": str(row['customer_type'])
    })

# 3. Save it directly to a JSON file
output_filename = "labData.json"
with open(output_filename, "w") as f:
    json.dump(data_list, f, indent=2)

print(f"✅ Successfully converted {len(df)} rows and saved to {output_filename}!")