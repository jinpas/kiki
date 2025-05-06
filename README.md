### the-app

a mobile app to explore, log, and reflect on your surroundings using maps, camera, notifications, and ai-generated captions.

### built with

- react native + expo sdk 53  
- supabase for backend and database  
- openai api for image caption generation  
- expo-camera, expo-file-system, expo-image-manipulator  
- expo-notifications for local alerts  

### features

| feature      | description                                                                              |
| ------------ | ---------------------------------------------------------------------------------------- |
| notify       | send and test custom notifications locally and log them                                  |
| pin drop     | tap anywhere on the map to drop a pin by category (restaurant, store, park, home, etc.)  |
| smart camera | take a photo, get a caption via gpt-4o, and save it to the feed                          |
| dashboard    | view your full activity: pins, camera posts, and notifications                           |

### required environment variables

create a `.env` file (or use `app.config.js`) and include:
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key



### supabase schema

this app uses supabase to store user-generated data across three tables:

- `notifications`: logs custom alerts with a message and timestamp  
- `pins`: stores dropped pins with location and category type  
- `camera_posts`: saves compressed images and their ai-generated captions  

each table uses a uuid primary key and timestamps for tracking.


