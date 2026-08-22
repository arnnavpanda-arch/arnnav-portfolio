import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
client = MongoClient(os.getenv("MONGO_URI"))
db = client.get_database("portfolioDB")

# Find all awards that are actually certifications (the title contains 'Cert' or similar)
awards = list(db.awards.find())
for awd in awards:
    if "cert" in awd['title'].lower():
        # Move to certifications
        db.certifications.insert_one({
            "title": awd['title'],
            "description": awd['description']
        })
        # Remove from awards
        db.awards.delete_one({"_id": awd['_id']})

print("Migrated certifications successfully!")
