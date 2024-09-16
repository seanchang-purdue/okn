import pandas as pd
# import numpy as np
# from scipy import stats
import glob
import os
import matplotlib.pyplot as plt
import seaborn as sns

def get_data():
    script_dir = os.path.dirname(__file__)
    data_path = os.path.join(script_dir, '..', 'data', 'phil_shootings.csv')
    shooting_data = pd.read_csv(data_path)
    script_dir = os.path.dirname(__file__)
    data_dir = os.path.join(script_dir, '..', 'data')
    crime_files = glob.glob(os.path.join(data_dir, 'phil_crime_*.csv'))
    crime_data = pd.concat((pd.read_csv(file) for file in crime_files), ignore_index=True)
    
    return crime_data, shooting_data

def prepare_hourly_distribution(df, category_column, datetime_column):
    df['hour'] = df[datetime_column].dt.hour
    hourly_dist = df.groupby([category_column, 'hour']).size().unstack(fill_value=0)
    hourly_dist_pct = hourly_dist.div(hourly_dist.sum(axis=1), axis=0) * 100
    return hourly_dist_pct

# Get the data
crime_df, shooting_df = get_data()

# Prepare datetime columns
shooting_df['date_time'] = pd.to_datetime(shooting_df['date_'] + ' ' + shooting_df['time'], errors='coerce')
crime_df['dispatch_date_time'] = pd.to_datetime(crime_df['dispatch_date_time'], errors='coerce')

# Race comparison in shootings
race_counts = shooting_df['race'].value_counts(normalize=True) * 100
print("\nRace distribution in shootings:")
print(race_counts)

# Find all text_general_code for crime data
crime_types = crime_df['text_general_code'].unique()
print("\nCrime types:")
print(crime_types)

# Prepare hourly distribution for shootings
shooting_hourly = prepare_hourly_distribution(shooting_df, 'race', 'date_time')

# Prepare hourly distribution for crimes
crime_hourly = prepare_hourly_distribution(crime_df, 'text_general_code', 'dispatch_date_time')

# Combine shootings and crimes
shooting_hourly['Category'] = 'Shooting'
crime_hourly['Category'] = 'Crime'
combined_hourly = pd.concat([shooting_hourly, crime_hourly])

# Create the heatmap
plt.figure(figsize=(20, 12))
sns.heatmap(combined_hourly, cmap="YlOrRd", annot=True, fmt=".1f", cbar_kws={'label': 'Percentage'})
plt.title('Hourly Distribution of Shootings and Crimes')
plt.xlabel('Hour of Day')
plt.ylabel('Category')
plt.tight_layout()
plt.savefig('hourly_distribution_heatmap.png')
plt.close()

# Create separate line plots for better readability
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(20, 16))

# Shootings by race
shooting_hourly.drop('Category', axis=1).T.plot(ax=ax1)
ax1.set_title('Hourly Distribution of Shootings by Race')
ax1.set_xlabel('Hour of Day')
ax1.set_ylabel('Percentage')
ax1.legend(title='Race')

# Crimes by type
crime_hourly.drop('Category', axis=1).T.plot(ax=ax2)
ax2.set_title('Hourly Distribution of Crimes by Type')
ax2.set_xlabel('Hour of Day')
ax2.set_ylabel('Percentage')
ax2.legend(title='Crime Type', bbox_to_anchor=(1.05, 1), loc='upper left')

plt.tight_layout()
plt.savefig('hourly_distribution_lineplot.png')
plt.close()

print("Analysis complete. Check the generated 'hourly_distribution_heatmap.png' and 'hourly_distribution_lineplot.png' files.")

# Additional analysis: Peak hours for each category
peak_hours = combined_hourly.idxmax(axis=1)
print("\nPeak hours for each category:")
print(peak_hours)

# Calculate overall distribution
overall_dist = combined_hourly.groupby('Category').mean()
print("\nOverall hourly distribution:")
print(overall_dist)

# Find categories with unusual patterns (high standard deviation across hours)
hourly_std = combined_hourly.groupby('Category').std().mean(axis=1).sort_values(ascending=False)
print("\nCategories with most variable hourly patterns:")
print(hourly_std.head())

# if __name__ == "__main__":
#     crime_df, shooting_df = get_data()
#     shooting_df['date_time'] = pd.to_datetime(shooting_df['date_'] + ' ' + shooting_df['time'], errors='coerce')
#     crime_df['dispatch_date_time'] = pd.to_datetime(crime_df['dispatch_date_time'], errors='coerce')


#     # Race comparison in shootings
#     race_counts = shooting_df['race'].value_counts(normalize=True) * 100
#     print("\nRace distribution in shootings:")
#     print(race_counts)

#     # Find all text_general_code for crime data
#     crime_types = crime_df['text_general_code'].unique()
#     print("\nCrime types:")
#     print(crime_types)
