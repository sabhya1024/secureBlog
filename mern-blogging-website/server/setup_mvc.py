import os
structure = {
    "config": "Stores configuration files like Database connection (MongoDB) and Cloudinary setup.",
    "controllers": "Contains the logic for your routes (e.g., auth logic, blog logic).",
    "middleware": "Stores functions that run before controllers, like JWT verification and Multer.",
    "models": "Contains your Mongoose Schemas (User.js, Blog.js).",
    "routes": "Defines your API endpoints and links them to the correct controllers.",
}

def create_mvc_structure():
    print("Starting MVC folder setup ")
    
    for folder, comment in structure.items():
        if not os.path.exists(folder):
            os.makedirs(folder)
            print(f"Created {folder}")
        else:
            print(f"Already Exists ${folder}")
            

        info_file_path = os.path.join(folder, "info.txt")
        with open(info_file_path, 'w') as info_file:
            info_file.write(f"# Purpose: {comment}\n")
       
            
        print(f"Added info.txt to {folder}/")
        
        
if __name__ =="__main__":
    create_mvc_structure()